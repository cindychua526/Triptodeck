-- Trip Deck · migration 2  (run once in the Supabase SQL Editor, after schema.sql)
-- 1) 记账: who paid, split among how many, pool money visible to everyone
alter table expenses add column if not exists payer_id uuid references auth.users;
alter table expenses add column if not exists split_n integer;
update expenses set payer_id = user_id where payer_id is null;
update expenses set shared = true where category = 'Pool';
drop policy if exists "expenses update" on expenses;
create policy "expenses update" on expenses for update to authenticated using (is_member(trip_id) and (user_id = auth.uid() or shared = true));

-- 2) 牌组: four new cards (7 后羿, 6 雷公, 4 土地公, X 无常); K and X can copy
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
  insert into skill_draws(trip_id, date, user_id, card) values (t, d, auth.uid(), c) returning * into r;
  insert into skill_log(trip_id, date, user_id, card, action, effect) values (t, d, auth.uid(), null, 'DRAWN', '抽了一张牌');
  return r;
end $$;
create or replace function activate_card(p_id uuid, p_activation jsonb, p_copied text)
returns skill_draws language plpgsql security definer set search_path = public as $$
declare r skill_draws;
begin
  select * into r from skill_draws where id = p_id for update;
  if not found or r.user_id <> auth.uid() then raise exception 'NOT_YOURS'; end if;
  if r.status = 'activated' then raise exception 'ALREADY_ACTIVATED'; end if;
  if p_copied is not null and (r.card not in ('K','X') or p_copied not in ('Q','J','10','9','8','7','6','4')) then raise exception 'BAD_COPY'; end if;
  update skill_draws set status = 'activated', activated_at = now(), activation = p_activation, copied = p_copied where id = p_id returning * into r;
  return r;
end $$;

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
