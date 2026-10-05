-- ============================================================================
-- 旅行手账 · Trip Deck — 数据库第一版 (schema v1)
-- 在 Supabase → SQL Editor 里整份运行一次就好。
--   · 全新项目：只要这一份。
--   · 已经在用的项目：也直接跑这一份，它只会补上缺的东西。
--   · 想把以前的旅行全部清掉重新开始：先跑 reset_all.sql，再跑这一份。
-- 可以重复运行，不会出错。
-- 另外要在 Authentication → Providers 打开 Anonymous sign-ins。
-- ============================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- 1. 表
-- ---------------------------------------------------------------------------

-- 每个人（匿名登录也是一个人）
create table if not exists profiles (
  id            uuid primary key references auth.users on delete cascade,
  display_name  text not null default '旅伴',
  recovery_code text unique,                 -- 8 位身份码，换手机时找回自己
  created_at    timestamptz not null default now()
);
alter table profiles add column if not exists recovery_code text;

-- 每一趟旅行 = 一个房间（App 里的一本书）
create table if not exists trips (
  id           uuid primary key default gen_random_uuid(),
  code         text unique not null default upper(substr(md5(gen_random_uuid()::text), 1, 6)),  -- 6 位房间号
  name         text not null default '旅行',
  start_date   date,
  end_date     date,
  kind         text not null default 'group',          -- group：可以邀请；solo：个人
  cities       text[] not null default '{}',
  template     text,
  total_budget numeric not null default 3000,
  created_by   uuid references auth.users on delete set null default auth.uid(),  -- 房主
  created_at   timestamptz not null default now()
);
alter table trips add column if not exists created_by uuid references auth.users on delete set null;

-- 谁在哪个房间
create table if not exists trip_members (
  trip_id      uuid not null references trips on delete cascade,
  user_id      uuid not null references auth.users on delete cascade,
  joined_at    timestamptz not null default now(),
  currency     text default 'MYR',
  cny_rate     numeric default 0.6,
  total_budget numeric default 3000,
  primary key (trip_id, user_id)
);

-- 房间里大家共享的内容：行程、照片、打卡、账、游戏……（App 会合并，不会互相覆盖）
create table if not exists trip_state (
  trip_id    uuid primary key references trips on delete cascade,
  state      jsonb not null default '{}'::jsonb,
  updated_by uuid,
  updated_at timestamptz not null default now()
);

-- 每个人自己在这个房间的私人内容：行李清单、美食票、日记、今日旅运……（别人看不到）
create table if not exists member_state (
  trip_id    uuid not null references trips on delete cascade,
  user_id    uuid not null references auth.users on delete cascade,
  state      jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (trip_id, user_id)
);

-- 每台手机的通知地址（App 关着也能收到旅伴的消息）。一台手机一行。
create table if not exists push_subs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users on delete cascade default auth.uid(),
  trip_id    uuid references trips on delete cascade,
  endpoint   text not null unique,
  p256dh     text not null,
  auth       text not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 2. 函数（App 只通过这些函数建房间、加入、移出、找回自己）
-- ---------------------------------------------------------------------------

create or replace function is_member(t uuid) returns boolean
language sql stable security definer set search_path = public as
$$ select exists(select 1 from trip_members where trip_id = t and user_id = auth.uid()) $$;

-- 开一个新房间，自己是房主
create or replace function create_trip(p_name text, p_start date, p_end date, p_budget numeric,
  p_kind text default 'group', p_cities text[] default '{}', p_template text default null)
returns trips language plpgsql security definer set search_path = public as $$
declare r trips; c text; tries int := 0;
begin
  if auth.uid() is null then raise exception 'NOT_SIGNED_IN'; end if;
  loop
    c := upper(substr(md5(gen_random_uuid()::text), 1, 6)); tries := tries + 1;
    exit when not exists (select 1 from trips where code = c) or tries > 20;
  end loop;
  insert into trips(code, name, start_date, end_date, kind, cities, template, total_budget, created_by)
  values (c, coalesce(p_name, '旅行'), p_start, p_end, coalesce(p_kind, 'group'), coalesce(p_cities, '{}'), p_template, coalesce(p_budget, 3000), auth.uid())
  returning * into r;
  insert into trip_members(trip_id, user_id, total_budget) values (r.id, auth.uid(), coalesce(p_budget, 3000));
  return r;
end $$;

-- 用 6 位房间号加入
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

-- 房主把人移出房间
create or replace function kick_member(p_trip uuid, p_user uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'NOT_SIGNED_IN'; end if;
  if not exists (select 1 from trips where id = p_trip and created_by = auth.uid()) then raise exception 'NOT_OWNER'; end if;
  if p_user = auth.uid() then raise exception 'CANNOT_KICK_SELF'; end if;
  delete from trip_members where trip_id = p_trip and user_id = p_user;
  delete from member_state where trip_id = p_trip and user_id = p_user;
end $$;

-- 拿到（或第一次生成）自己的 8 位身份码
create or replace function ensure_recovery_code() returns text
language plpgsql security definer set search_path = public as $$
declare c text;
begin
  if auth.uid() is null then raise exception 'NOT_SIGNED_IN'; end if;
  insert into profiles(id) values (auth.uid()) on conflict do nothing;
  select recovery_code into c from profiles where id = auth.uid();
  if c is null then
    loop
      c := upper(substr(md5(gen_random_uuid()::text || auth.uid()::text), 1, 8));
      exit when not exists (select 1 from profiles where recovery_code = c);
    end loop;
    update profiles set recovery_code = c where id = auth.uid();
  end if;
  return c;
end $$;

-- 换手机：用身份码把旧的自己（房间、私人内容、房主身份、旧版资料）全部搬到这台手机的新身份
create or replace function reclaim_identity(p_code text) returns integer
language plpgsql security definer set search_path = public as $$
declare old uuid; nw uuid := auth.uid(); n integer := 0; r record; k integer;
begin
  if nw is null then raise exception 'NOT_SIGNED_IN'; end if;
  select id into old from profiles where recovery_code = upper(trim(p_code));
  if old is null then raise exception 'BAD_CODE'; end if;
  if old = nw then return 0; end if;
  -- 新身份是空的：同一个房间如果两边都有，保留旧的那份
  delete from trip_members where user_id = nw and trip_id in (select trip_id from trip_members where user_id = old);
  delete from member_state where user_id = nw and trip_id in (select trip_id from member_state where user_id = old);
  -- 每一张表里指向「人」的栏位都搬过来（包括旧版的表）
  for r in select table_name, column_name from information_schema.columns
           where table_schema = 'public' and column_name in ('user_id', 'created_by', 'payer_id', 'updated_by') and table_name <> 'profiles' loop
    begin
      execute format('update public.%I set %I = $1 where %I = $2', r.table_name, r.column_name, r.column_name) using nw, old;
      get diagnostics k = row_count; n := n + k;
    exception when unique_violation then
      execute format('delete from public.%I where %I = $1', r.table_name, r.column_name) using old;
    end;
  end loop;
  insert into profiles(id) values (nw) on conflict do nothing;
  update profiles p set display_name = o.display_name from profiles o where p.id = nw and o.id = old;
  update profiles set recovery_code = null where id = old;
  update profiles set recovery_code = upper(trim(p_code)) where id = nw;
  return n;
end $$;

grant execute on function is_member(uuid), create_trip(text, date, date, numeric, text, text[], text), join_trip(text),
  kick_member(uuid, uuid), ensure_recovery_code(), reclaim_identity(text) to authenticated;

-- ---------------------------------------------------------------------------
-- 3. 权限（Row Level Security）：只看得到自己房间的东西
-- ---------------------------------------------------------------------------
alter table profiles     enable row level security;
alter table trips        enable row level security;
alter table trip_members enable row level security;
alter table trip_state   enable row level security;
alter table member_state enable row level security;
alter table push_subs    enable row level security;

drop policy if exists "v1 profiles read"   on profiles;
drop policy if exists "v1 profiles insert" on profiles;
drop policy if exists "v1 profiles update" on profiles;
create policy "v1 profiles read"   on profiles for select to authenticated using (true);              -- 旅伴的名字
create policy "v1 profiles insert" on profiles for insert to authenticated with check (id = auth.uid());
create policy "v1 profiles update" on profiles for update to authenticated using (id = auth.uid());

drop policy if exists "v1 trips read"   on trips;
drop policy if exists "v1 trips update" on trips;
create policy "v1 trips read"   on trips for select to authenticated using (is_member(id));
create policy "v1 trips update" on trips for update to authenticated using (created_by = auth.uid());

drop policy if exists "v1 members read"  on trip_members;
drop policy if exists "v1 members leave" on trip_members;
drop policy if exists "v1 members self"  on trip_members;
create policy "v1 members read"  on trip_members for select to authenticated using (is_member(trip_id));
create policy "v1 members leave" on trip_members for delete to authenticated using (user_id = auth.uid());
create policy "v1 members self"  on trip_members for update to authenticated using (user_id = auth.uid());

drop policy if exists "v1 state read"  on trip_state;
drop policy if exists "v1 state write" on trip_state;
drop policy if exists "v1 state edit"  on trip_state;
create policy "v1 state read"  on trip_state for select to authenticated using (is_member(trip_id));
create policy "v1 state write" on trip_state for insert to authenticated with check (is_member(trip_id));
create policy "v1 state edit"  on trip_state for update to authenticated using (is_member(trip_id));

drop policy if exists "v1 push own" on push_subs;
create policy "v1 push own" on push_subs for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "v1 mine" on member_state;
create policy "v1 mine" on member_state for all to authenticated
  using (user_id = auth.uid() and is_member(trip_id)) with check (user_id = auth.uid() and is_member(trip_id));

-- ---------------------------------------------------------------------------
-- 4. 照片存储：media 桶，路径 = 房间id/上传的人id/文件
--    私密：只有这个房间的人看得到（App 会拿 7 天有效的临时链接来显示）
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public) values ('media', 'media', false) on conflict (id) do update set public = false;
-- 旧版留下的「任何人都能看照片」规则要拿掉，不然新的私密规则会被它盖过去
drop policy if exists "media read"   on storage.objects;
drop policy if exists "media upload" on storage.objects;
drop policy if exists "v1 media upload" on storage.objects;
drop policy if exists "v1 media read"   on storage.objects;
create policy "v1 media upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and is_member(((storage.foldername(name))[1])::uuid) and (storage.foldername(name))[2] = auth.uid()::text);
create policy "v1 media read" on storage.objects for select to authenticated
  using (bucket_id = 'media' and is_member(((storage.foldername(name))[1])::uuid));

-- ---------------------------------------------------------------------------
-- 5. 实时同步：旅伴一改，其他手机马上收到
-- ---------------------------------------------------------------------------
do $$ begin
  begin alter publication supabase_realtime add table trip_state; exception when duplicate_object then null; when undefined_object then null; end;
end $$;
