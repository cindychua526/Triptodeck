-- =====================================================================
-- Trip Deck · Supabase schema
-- Run this whole file once in Supabase → SQL Editor.
-- Then: Authentication → Sign In / Providers → enable "Anonymous sign-ins".
-- =====================================================================
create extension if not exists pgcrypto;

-- ---------- people & trips ----------
create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text not null default '旅伴',
  created_at timestamptz not null default now()
);
create table if not exists trips (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text unique not null default upper(substr(md5(gen_random_uuid()::text), 1, 6)),
  start_date date, end_date date,
  kind text not null default 'group',              -- group (a room you share) | solo (only you)
  cities text[] not null default '{}', template text,
  total_budget numeric not null default 3000, budget_mode text not null default 'strict', cny_rate numeric not null default 0.6,
  created_by uuid references auth.users default auth.uid(),
  created_at timestamptz not null default now()
);
create table if not exists trip_members (
  trip_id uuid references trips on delete cascade,
  user_id uuid references auth.users on delete cascade,
  total_budget numeric not null default 4000,
  budget_mode text not null default 'strict',
  currency text not null default 'MYR',
  cny_rate numeric not null default 0.6,
  joined_at timestamptz not null default now(),
  primary key (trip_id, user_id)
);
create or replace function is_member(t uuid) returns boolean
language sql stable security definer set search_path = public as
$$ select exists(select 1 from trip_members where trip_id = t and user_id = auth.uid()) $$;

-- ---------- shared trip data ----------
create table if not exists activities (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips on delete cascade,
  date date not null, time text not null,
  title text not null, city text, kind text not null default 'sight',
  dur int not null default 60, note text, spots text[] not null default '{}',
  is_main boolean not null default false,
  status text not null default 'planned',          -- planned | done | skipped | removed
  extra_min int not null default 0, was_time text, was_title text,
  source text not null default 'plan',             -- plan | added | special
  lat double precision, lng double precision,
  done_by uuid references auth.users, done_at timestamptz,
  created_by uuid references auth.users default auth.uid(),
  created_at timestamptz not null default now()
);
create index if not exists activities_trip_date on activities (trip_id, date);
create table if not exists checklist_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips on delete cascade,
  category text not null, label text not null, sort int not null default 0,
  done boolean not null default false, done_by uuid references auth.users, done_at timestamptz,
  created_by uuid references auth.users default auth.uid(),
  created_at timestamptz not null default now()
);
create table if not exists decisions (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips on delete cascade,
  date date not null, user_id uuid not null references auth.users default auth.uid(),
  question text not null, mode text not null default 'yesno',
  result text not null,                             -- heads | tails
  reversed boolean not null default false, rewritten jsonb,
  created_at timestamptz not null default now()
);

create table if not exists custom_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips on delete cascade,
  city text not null, kind text not null,            -- spot | food
  name text not null, note text,
  created_by uuid references auth.users default auth.uid(),
  created_at timestamptz not null default now()
);

create table if not exists departures (
  trip_id uuid not null references trips on delete cascade,
  user_id uuid not null references auth.users default auth.uid(),
  origin text not null, note text, photo_path text,
  created_at timestamptz not null default now(),
  primary key (trip_id, user_id)
);

-- check-ins wait for any one travel buddy to approve them (a solo trip approves itself)
create table if not exists checkins (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips on delete cascade,
  user_id uuid not null references auth.users default auth.uid(),
  kind text not null default 'place', name text not null, city text, date date not null,
  mission text, photo_path text, activity_id uuid,
  status text not null default 'pending',          -- pending | approved | rejected
  reviewed_by uuid references auth.users, reviewed_at timestamptz, note text,
  created_at timestamptz not null default now()
);

-- one travel creature per person per trip (the room can see everyone's; only you can change yours)
create table if not exists pets (
  trip_id uuid not null references trips on delete cascade,
  user_id uuid not null references auth.users default auth.uid(),
  species text not null, name text, data jsonb not null default '{}',
  updated_at timestamptz not null default now(),
  primary key (trip_id, user_id)
);

-- food photos: anyone in the room can add one, everyone sees them
create table if not exists food_photos (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips on delete cascade,
  user_id uuid not null references auth.users default auth.uid(),
  food text not null, city text, date date not null default current_date,
  photo_path text not null, note text,
  created_at timestamptz not null default now()
);
alter table food_photos enable row level security;
create policy "food photos read" on food_photos for select to authenticated using (is_member(trip_id));
create policy "food photos add" on food_photos for insert to authenticated with check (user_id = auth.uid() and is_member(trip_id));
create policy "food photos remove" on food_photos for delete to authenticated using (user_id = auth.uid());

-- ---------- private (only the owner can see) ----------
create table if not exists journals (
  user_id uuid not null references auth.users default auth.uid(),
  trip_id uuid not null references trips on delete cascade,
  content text not null default '', mood text,
  updated_at timestamptz not null default now(),
  primary key (user_id, trip_id)
);
create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips on delete cascade,
  user_id uuid not null references auth.users default auth.uid(),
  date date not null, amount numeric not null, currency text not null default 'MYR',
  amount_base numeric not null, category text not null, note text,
  prepaid boolean not null default false, split int not null default 1,
  shared boolean not null default true,            -- shared = split evenly between participants; false = personal (only you)
  paid_from text not null default 'me',            -- 'me' = paid out of pocket · 'pool' = paid from the common pool (category 'Pool' = money put into the pool, shared=true so everyone sees it)
  payer_id uuid references auth.users,             -- who actually paid (defaults to the person who logged it)
  split_n integer,                                 -- split among this many people (when set, overrides the member count)
  participants uuid[],                              -- null = everyone in the trip
  created_at timestamptz not null default now()
);
create table if not exists wallet_items (
  user_id uuid not null references auth.users default auth.uid(),
  spot_id text not null, date date not null, serial text not null,
  trip_id uuid references trips on delete set null, city text, rating text, note text,
  created_at timestamptz not null default now(),
  primary key (user_id, spot_id)
);
create table if not exists stamps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users default auth.uid(),
  trip_id uuid references trips on delete set null,
  kind text not null,                               -- city | place | special | experience
  key text not null, name text not null, city text,
  date date not null, mission text, photo_path text,
  verified boolean not null default false, verify_note text,
  created_at timestamptz not null default now()
);
create table if not exists fortunes (
  user_id uuid not null references auth.users default auth.uid(),
  date date not null, data jsonb not null,
  primary key (user_id, date)
);

-- ---------- the deck (one random card per person per day) ----------
create table if not exists skill_draws (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips on delete cascade,
  date date not null, user_id uuid not null references auth.users,
  card text not null,                               -- K Q J 10 9 8
  status text not null default 'drawn',             -- drawn | activated
  drawn_at timestamptz not null default now(), activated_at timestamptz,
  activation jsonb, copied text,
  unique (trip_id, date, card),
  unique (trip_id, date, user_id)
);
create table if not exists skill_log (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips on delete cascade,
  date date not null, user_id uuid not null references auth.users default auth.uid(),
  card text, action text not null, effect text, meta jsonb,
  created_at timestamptz not null default now()
);
create table if not exists skill_effects (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips on delete cascade,
  target_date date not null, card text not null,
  source text not null,                             -- unexecuted
  description text not null, detail text, resolved boolean not null default false,
  created_by uuid references auth.users default auth.uid(),
  created_at timestamptz not null default now(),
  unique (trip_id, target_date, card, source)
);

-- ---------- row level security ----------
alter table profiles enable row level security;
alter table trips enable row level security;
alter table trip_members enable row level security;
alter table activities enable row level security;
alter table checklist_items enable row level security;
alter table custom_items enable row level security;
alter table departures enable row level security;
alter table checkins enable row level security;
alter table journals enable row level security;
alter table pets enable row level security;
alter table decisions enable row level security;
alter table expenses enable row level security;
alter table wallet_items enable row level security;
alter table stamps enable row level security;
alter table fortunes enable row level security;
alter table skill_draws enable row level security;
alter table skill_log enable row level security;
alter table skill_effects enable row level security;

create policy "profiles read" on profiles for select to authenticated using (true);
create policy "profiles own" on profiles for all to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy "trips read" on trips for select to authenticated using (is_member(id));
create policy "trips update" on trips for update to authenticated using (is_member(id));
create policy "members read" on trip_members for select to authenticated using (is_member(trip_id));
create policy "members own" on trip_members for update to authenticated using (user_id = auth.uid());
create policy "members leave" on trip_members for delete to authenticated using (user_id = auth.uid());

create policy "activities crud" on activities for all to authenticated using (is_member(trip_id)) with check (is_member(trip_id));
create policy "custom crud" on custom_items for all to authenticated using (is_member(trip_id)) with check (is_member(trip_id));
create policy "checklist crud" on checklist_items for all to authenticated using (is_member(trip_id)) with check (is_member(trip_id));
create policy "decisions read" on decisions for select to authenticated using (is_member(trip_id));
create policy "decisions add" on decisions for insert to authenticated with check (is_member(trip_id) and user_id = auth.uid());
create policy "decisions edit" on decisions for update to authenticated using (is_member(trip_id));

-- the budget of a trip is shared: everyone in the room can see and edit it (a solo trip only has you)
-- shared spending is visible/editable by everyone in the room; personal spending (shared = false) only by you
create policy "expenses read" on expenses for select to authenticated using (is_member(trip_id) and (shared or user_id = auth.uid()));
create policy "expenses add" on expenses for insert to authenticated with check (is_member(trip_id) and (shared or user_id = auth.uid()));
create policy "expenses edit" on expenses for update to authenticated using (is_member(trip_id) and (shared or user_id = auth.uid()));
create policy "expenses remove" on expenses for delete to authenticated using (is_member(trip_id) and (shared or user_id = auth.uid()));
create policy "checkins read" on checkins for select to authenticated using (is_member(trip_id));
create policy "checkins add" on checkins for insert to authenticated with check (user_id = auth.uid() and is_member(trip_id));
create policy "checkins withdraw" on checkins for delete to authenticated using (user_id = auth.uid() and status = 'pending');
create policy "pets read" on pets for select to authenticated using (is_member(trip_id));
create policy "pets own" on pets for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid() and is_member(trip_id));
create policy "journals own" on journals for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "departures read" on departures for select to authenticated using (is_member(trip_id));
create policy "departures own" on departures for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid() and is_member(trip_id));
create policy "wallet own" on wallet_items for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "stamps own" on stamps for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "fortunes own" on fortunes for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- draws: you can read only your own row; everyone else goes through deck_table()
create policy "draws own read" on skill_draws for select to authenticated using (user_id = auth.uid());
create policy "log read" on skill_log for select to authenticated using (is_member(trip_id));
create policy "log add" on skill_log for insert to authenticated with check (is_member(trip_id) and user_id = auth.uid());
create policy "effects read" on skill_effects for select to authenticated using (is_member(trip_id));
create policy "effects edit" on skill_effects for update to authenticated using (is_member(trip_id));

-- ---------- functions (the server is the referee) ----------
create or replace function create_trip(p_name text, p_start date, p_end date, p_budget numeric, p_kind text default 'group', p_cities text[] default '{}', p_template text default null)
returns trips language plpgsql security definer set search_path = public as $$
declare r trips;
begin
  if auth.uid() is null then raise exception 'NOT_SIGNED_IN'; end if;
  insert into trips(name, start_date, end_date, kind, cities, template, total_budget, created_by)
  values (p_name, p_start, p_end, coalesce(p_kind, 'group'), coalesce(p_cities, '{}'), p_template, coalesce(p_budget, 3000), auth.uid()) returning * into r;
  insert into trip_members(trip_id, user_id, total_budget) values (r.id, auth.uid(), coalesce(p_budget, 3000));
  return r;
end $$;

create or replace function join_trip(p_code text)
returns trips language plpgsql security definer set search_path = public as $$
declare r trips;
begin
  if auth.uid() is null then raise exception 'NOT_SIGNED_IN'; end if;
  select * into r from trips where code = upper(trim(p_code));
  if not found then raise exception 'TRIP_NOT_FOUND'; end if;
  if r.kind = 'solo' then raise exception 'TRIP_IS_PRIVATE'; end if;
  insert into trip_members(trip_id, user_id) values (r.id, auth.uid()) on conflict do nothing;
  return r;
end $$;

-- the deck as everyone sees it: other people's cards stay face-down until they are activated (or the day is over).
create or replace function deck_table(t uuid, d date)
returns table (user_id uuid, card text, status text, drawn_at timestamptz, activated_at timestamptz, activation jsonb, copied text, revealed boolean)
language sql stable security definer set search_path = public as $$
  select s.user_id,
         case when s.user_id = auth.uid() or s.status = 'activated' or d < (now() at time zone 'Asia/Shanghai')::date then s.card end,
         s.status, s.drawn_at, s.activated_at,
         case when s.user_id = auth.uid() or s.status = 'activated' then s.activation end,
         case when s.user_id = auth.uid() or s.status = 'activated' then s.copied end,
         (s.user_id = auth.uid() or s.status = 'activated' or d < (now() at time zone 'Asia/Shanghai')::date)
  from skill_draws s where s.trip_id = t and s.date = d and is_member(t)
$$;

-- random, atomic draw. Two people drawing at the same moment can never get the same card.
create or replace function draw_card(t uuid, d date)
returns skill_draws language plpgsql security definer set search_path = public as $$
declare r skill_draws; c text;
begin
  if not is_member(t) then raise exception 'NOT_MEMBER'; end if;
  select * into r from skill_draws where trip_id = t and date = d and user_id = auth.uid();
  if found then return r; end if;
  perform pg_advisory_xact_lock(hashtext(t::text || d::text));
  select x into c from unnest(array['K','Q','J','10','9','8','7','6','4','X']) x
   where x not in (select card from skill_draws where trip_id = t and date = d)
   order by random() limit 1;
  if c is null then raise exception 'DECK_EMPTY'; end if;
  insert into skill_draws(trip_id, date, user_id, card)
  values (t, d, auth.uid(), c)
  returning * into r;
  insert into skill_log(trip_id, date, user_id, card, action, effect) values (t, d, auth.uid(), null, 'DRAWN', '抽了一张牌');
  return r;
end $$;

-- activate your own card (K copies are validated here too)
create or replace function activate_card(p_id uuid, p_activation jsonb, p_copied text)
returns skill_draws language plpgsql security definer set search_path = public as $$
declare r skill_draws;
begin
  select * into r from skill_draws where id = p_id for update;
  if not found or r.user_id <> auth.uid() then raise exception 'NOT_YOURS'; end if;
  if r.status = 'activated' then raise exception 'ALREADY_ACTIVATED'; end if;
  if p_copied is not null and (r.card not in ('K','X') or p_copied not in ('Q','J','10','9','8','7','6','4')) then raise exception 'BAD_COPY'; end if;
  update skill_draws set status = 'activated', activated_at = now(), activation = p_activation, copied = p_copied
   where id = p_id returning * into r;
  return r;
end $$;

-- a card drawn but never used turns 失控 the next day. Idempotent: anyone can call it.
create or replace function settle_day(t uuid, d date)
returns int language plpgsql security definer set search_path = public as $$
declare s record; n int := 0; lastc text; who text;
begin
  if not is_member(t) then raise exception 'NOT_MEMBER'; end if;
  for s in select * from skill_draws where trip_id = t and date = d and status = 'drawn' loop
    if s.card = 'K' then
      select coalesce(copied, card) into lastc from skill_draws where trip_id = t and date = d and status = 'activated' and card <> 'K' order by activated_at desc limit 1;
      who := case when lastc is null then '今天没有人发动技能，镜界没有可以复制的' else '明天自动生效：' || lastc end;
    elsif s.card = '10' then
      select p.display_name into who from trip_members m join profiles p on p.id = m.user_id where m.trip_id = t order by random() limit 1;
      who := '第一站由 ' || coalesce(who, '（还没有旅伴）') || ' 决定';
    else who := null; end if;
    insert into skill_effects(trip_id, target_date, card, source, description, detail)
    values (t, d + 1, s.card, 'unexecuted',
      case s.card when 'K' then '复制今天最后一个发动的技能，明天自动生效' when 'Q' then '明天必须比原计划晚出门30分钟'
        when 'J' then '明天第一个决定，自动反转' when '10' then '明天随机指定一个人，拥有第一站决定权'
        when '9' then '明天必须新增一个，原本没计划的地点' when '8' then '明天必须删掉一个，原本计划的地点'
        else '昨天抽到的牌没有发动，今天要补做一次' end, who)
    on conflict do nothing;
    if found then n := n + 1; end if;
  end loop;
  return n;
end $$;

-- any one other member approves (or rejects) a check-in; approval writes the stamp into the owner's book
create or replace function review_checkin(p_id uuid, p_ok boolean, p_note text default null)
returns checkins language plpgsql security definer set search_path = public as $$
declare r checkins; n int; who text;
begin
  select * into r from checkins where id = p_id for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  if not is_member(r.trip_id) then raise exception 'NOT_MEMBER'; end if;
  if r.status <> 'pending' then raise exception 'ALREADY_REVIEWED'; end if;
  select count(*) into n from trip_members where trip_id = r.trip_id;
  if r.user_id = auth.uid() and n > 1 then raise exception 'ASK_A_BUDDY'; end if;
  select display_name into who from profiles where id = auth.uid();
  update checkins set status = case when p_ok then 'approved' else 'rejected' end, reviewed_by = auth.uid(), reviewed_at = now(), note = p_note
   where id = p_id returning * into r;
  if p_ok then
    insert into stamps(user_id, trip_id, kind, key, name, city, date, mission, photo_path, verified, verify_note)
    values (r.user_id, r.trip_id, r.kind, r.name, r.name, r.city, r.date, r.mission, r.photo_path, true,
            case when r.user_id = auth.uid() then '自己确认' else '由 ' || coalesce(who, '旅伴') || ' 确认' end);
    if r.activity_id is not null then update activities set status = 'done', done_by = r.user_id, done_at = now() where id = r.activity_id; end if;
  end if;
  return r;
end $$;

grant execute on function review_checkin, create_trip, join_trip, deck_table, draw_card, activate_card, settle_day, is_member to authenticated;

-- ---------- realtime (so everyone sees changes live) ----------
alter publication supabase_realtime add table activities, checklist_items, decisions, skill_log, skill_effects, trip_members, custom_items, expenses, departures, checkins, food_photos;

-- ---------- photo storage ----------
-- trip-photos: shared inside a trip (departure photos), path = <trip_id>/<user_id>/<file>
insert into storage.buckets (id, name, public) values ('trip-photos', 'trip-photos', false) on conflict do nothing;
create policy "trip photo upload" on storage.objects for insert to authenticated with check (bucket_id = 'trip-photos' and is_member(((storage.foldername(name))[1])::uuid) and (storage.foldername(name))[2] = auth.uid()::text);
create policy "trip photo read" on storage.objects for select to authenticated using (bucket_id = 'trip-photos' and is_member(((storage.foldername(name))[1])::uuid));
-- checkins: private, one folder per person
insert into storage.buckets (id, name, public) values ('checkins', 'checkins', false) on conflict do nothing;
create policy "checkin upload" on storage.objects for insert to authenticated with check (bucket_id = 'checkins' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "checkin read" on storage.objects for select to authenticated using (bucket_id = 'checkins' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "checkin delete" on storage.objects for delete to authenticated using (bucket_id = 'checkins' and (storage.foldername(name))[1] = auth.uid()::text);

-- 3) 土地公: approve your own check-in when you activated card 4 today
create or replace function guarantee_checkin(p_id uuid)
returns checkins language plpgsql security definer set search_path = public as $$
declare r checkins;
begin
  select * into r from checkins where id = p_id for update;
  if not found or r.user_id <> auth.uid() then raise exception 'NOT_YOURS'; end if;
  if r.status <> 'pending' then raise exception 'ALREADY_REVIEWED'; end if;
  if not exists (select 1 from skill_draws where trip_id = r.trip_id and user_id = auth.uid() and date = r.date and card = '4' and status = 'activated') then raise exception 'NO_TUDI'; end if;
  update checkins set status = 'approved', reviewed_by = auth.uid(), reviewed_at = now(), note = '土地公担保' where id = p_id returning * into r;
  insert into stamps(user_id, trip_id, kind, key, name, city, date, mission, photo_path, verified, verify_note)
  values (r.user_id, r.trip_id, r.kind, r.name, r.name, r.city, r.date, r.mission, r.photo_path, true, '土地公担保');
  if r.activity_id is not null then update activities set status = 'done', done_by = r.user_id, done_at = now() where id = r.activity_id; end if;
  return r;
end $$;

-- 4) 每天一句（旅伴第二天能看到）· 同一时刻 · 最后一夜的信
create table if not exists day_lines (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips on delete cascade,
  user_id uuid not null references auth.users default auth.uid(),
  date date not null, text text, mood text,
  updated_at timestamptz not null default now(),
  unique (trip_id, user_id, date)
);
alter table day_lines enable row level security;
drop policy if exists "day_lines read" on day_lines; create policy "day_lines read" on day_lines for select to authenticated using (is_member(trip_id));
drop policy if exists "day_lines write" on day_lines; create policy "day_lines write" on day_lines for insert to authenticated with check (is_member(trip_id) and user_id = auth.uid());
drop policy if exists "day_lines update" on day_lines; create policy "day_lines update" on day_lines for update to authenticated using (user_id = auth.uid());
create table if not exists moments (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips on delete cascade,
  user_id uuid not null references auth.users default auth.uid(),
  date date not null, note text, lat double precision, lng double precision,
  created_at timestamptz not null default now()
);
alter table moments enable row level security;
drop policy if exists "moments read" on moments; create policy "moments read" on moments for select to authenticated using (is_member(trip_id));
drop policy if exists "moments write" on moments; create policy "moments write" on moments for insert to authenticated with check (is_member(trip_id) and user_id = auth.uid());
create table if not exists letters (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips on delete cascade,
  from_id uuid not null references auth.users default auth.uid(),
  to_id uuid not null references auth.users,
  body text not null, open_at date not null,
  created_at timestamptz not null default now()
);
alter table letters enable row level security;
drop policy if exists "letters read" on letters; create policy "letters read" on letters for select to authenticated using (to_id = auth.uid() and open_at <= current_date or from_id = auth.uid());
drop policy if exists "letters write" on letters; create policy "letters write" on letters for insert to authenticated with check (is_member(trip_id) and from_id = auth.uid());
do $$ begin
  alter publication supabase_realtime add table day_lines; exception when others then null; end $$;
do $$ begin
  alter publication supabase_realtime add table moments; exception when others then null; end $$;
do $$ begin
  alter publication supabase_realtime add table letters; exception when others then null; end $$;

do $$ begin
  alter publication supabase_realtime add table skill_draws; exception when others then null; end $$;

-- 1) a recovery code on every profile
alter table profiles add column if not exists recovery_code text unique;
update profiles set recovery_code = upper(substr(md5(gen_random_uuid()::text || id::text), 1, 8)) where recovery_code is null;
create or replace function ensure_recovery_code() returns text language plpgsql security definer set search_path = public as $$
declare c text;
begin
  select recovery_code into c from profiles where id = auth.uid();
  if c is null then c := upper(substr(md5(gen_random_uuid()::text || auth.uid()::text), 1, 8)); update profiles set recovery_code = c where id = auth.uid(); end if;
  return c;
end $$;

-- 2) reclaim: move everything that belonged to the old identity (found by code) to the current login
create or replace function reclaim_identity(p_code text) returns integer language plpgsql security definer set search_path = public as $$
declare old uuid; nw uuid := auth.uid(); n integer := 0; r record;
begin
  select id into old from profiles where recovery_code = upper(trim(p_code));
  if old is null then raise exception 'BAD_CODE'; end if;
  if old = nw then return 0; end if;
  -- rows that are unique per person: if the new (empty) identity already has one where the old one does too, keep the old one
  for r in select * from (values ('trip_members', 'trip_id'), ('journals', 'trip_id'), ('departures', 'trip_id'), ('pets', 'trip_id'), ('fortunes', 'date'), ('wallet_items', 'spot_id'), ('skill_draws', 'trip_id, date'), ('day_lines', 'trip_id, date')) v(t, k) loop
    if to_regclass('public.' || r.t) is not null then
      execute format('delete from public.%I where user_id = $1 and (%s) in (select %s from public.%I where user_id = $2)', r.t, r.k, r.k, r.t) using nw, old;
    end if;
  end loop;
  -- move every column that points at a person, in every table, whatever the schema looks like
  for r in select c.table_name, c.column_name from information_schema.columns c
           where c.table_schema = 'public' and c.data_type = 'uuid' and c.table_name <> 'profiles'
             and c.column_name in ('user_id', 'done_by', 'created_by', 'reviewed_by', 'payer_id', 'from_id', 'to_id') loop
    execute format('update public.%I set %I = $1 where %I = $2', r.table_name, r.column_name, r.column_name) using nw, old;
    if r.table_name = 'trip_members' then get diagnostics n = row_count; end if;
  end loop;
  -- the name and the code follow the person; the old shell is removed
  update profiles p set display_name = o.display_name from profiles o where p.id = nw and o.id = old;
  update profiles set recovery_code = null where id = old;
  update profiles set recovery_code = upper(trim(p_code)) where id = nw;
  delete from profiles where id = old;
  return n;
end $$;

-- 3) the person who created the trip can remove a member (a duplicate, or someone who left)
create or replace function remove_member(t uuid, u uuid) returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from trips where id = t and created_by = auth.uid()) and u <> auth.uid() then raise exception 'NOT_OWNER'; end if;
  delete from trip_members where trip_id = t and user_id = u;
end $$;

-- push subscriptions
create table if not exists push_subs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade default auth.uid(),
  trip_id uuid references trips on delete cascade,
  endpoint text not null unique, p256dh text not null, auth text not null,
  created_at timestamptz not null default now()
);
alter table push_subs enable row level security;
drop policy if exists "push own" on push_subs; create policy "push own" on push_subs for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- 6) food tickets: travel buddies can see each other's torn tickets (to take one if they ate it too)
drop policy if exists "wallet read trip" on wallet_items;
create policy "wallet read trip" on wallet_items for select to authenticated using (user_id = auth.uid() or (trip_id is not null and is_member(trip_id)));
do $$ begin
  alter publication supabase_realtime add table wallet_items; exception when others then null; end $$;

-- 7) 大家的相册: photos everyone in the trip can see
create table if not exists shared_photos (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips on delete cascade,
  user_id uuid not null references auth.users default auth.uid(),
  photo_path text not null, caption text, date date not null default current_date,
  created_at timestamptz not null default now()
);
alter table shared_photos enable row level security;
drop policy if exists "shared read" on shared_photos; create policy "shared read" on shared_photos for select to authenticated using (is_member(trip_id));
drop policy if exists "shared add" on shared_photos; create policy "shared add" on shared_photos for insert to authenticated with check (is_member(trip_id) and user_id = auth.uid());
drop policy if exists "shared del" on shared_photos; create policy "shared del" on shared_photos for delete to authenticated using (user_id = auth.uid());
do $$ begin
  alter publication supabase_realtime add table shared_photos; exception when others then null; end $$;

drop policy if exists "trips delete" on trips;
create policy "trips delete" on trips for delete to authenticated using (created_by = auth.uid());

-- 9) 拍立得: a line of writing under every photo (check-in photos, food photos, shared photos)
alter table stamps add column if not exists caption text;
alter table food_photos add column if not exists caption text;
drop policy if exists "food photos edit" on food_photos; create policy "food photos edit" on food_photos for update to authenticated using (user_id = auth.uid());
drop policy if exists "shared edit" on shared_photos; create policy "shared edit" on shared_photos for update to authenticated using (user_id = auth.uid());
