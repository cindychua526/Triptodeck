-- Trip Deck v3 · 新界面用的两张状态表 + 一个公开的媒体桶
-- 在 Supabase SQL Editor 里按顺序跑：schema.sql → migration_2 … migration_5 → 这一份（老项目只要跑这一份）

-- 房间共享的状态：相册、评论、账本、旅行书、动态
create table if not exists trip_state (
  trip_id uuid primary key references trips on delete cascade,
  state jsonb not null default '{}'::jsonb,
  updated_by uuid references auth.users default auth.uid(),
  updated_at timestamptz not null default now()
);
alter table trip_state enable row level security;
drop policy if exists "trip_state read" on trip_state;
drop policy if exists "trip_state insert" on trip_state;
drop policy if exists "trip_state update" on trip_state;
create policy "trip_state read"   on trip_state for select to authenticated using (is_member(trip_id));
create policy "trip_state insert" on trip_state for insert to authenticated with check (is_member(trip_id));
create policy "trip_state update" on trip_state for update to authenticated using (is_member(trip_id)) with check (is_member(trip_id));

-- 每个人自己的状态：行李清单、票根、美食票、日记、点赞、设置、技能牌、语音
create table if not exists member_state (
  trip_id uuid references trips on delete cascade,
  user_id uuid references auth.users on delete cascade default auth.uid(),
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (trip_id, user_id)
);
alter table member_state enable row level security;
drop policy if exists "member_state own" on member_state;
create policy "member_state own" on member_state for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid() and is_member(trip_id));

-- 实时：别人改了共享状态，你这边马上刷新
do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'trip_state') then
    alter publication supabase_realtime add table trip_state;
  end if;
end $$;

-- 照片、语音、票根图：公开可读，只有房间成员能往自己的目录里传
insert into storage.buckets (id, name, public) values ('media', 'media', true) on conflict do nothing;
drop policy if exists "media upload" on storage.objects;
drop policy if exists "media read" on storage.objects;
drop policy if exists "media delete" on storage.objects;
create policy "media upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and is_member(((storage.foldername(name))[1])::uuid) and (storage.foldername(name))[2] = auth.uid()::text);
create policy "media read"   on storage.objects for select using (bucket_id = 'media');
create policy "media delete" on storage.objects for delete to authenticated using (bucket_id = 'media' and (storage.foldername(name))[2] = auth.uid()::text);

-- 匿名登录的人也要有 profile（如果 schema.sql 里已经有触发器，这一段不会冲突）
insert into profiles (id) select id from auth.users where id not in (select id from profiles) on conflict do nothing;
