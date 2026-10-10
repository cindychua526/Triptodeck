-- ============================================================================
-- 旅行手账 · 全部清空，重新开始
-- 会删掉：所有旅行（房间）、旅伴名单、行程、账、打卡、相册、通知登记，
--         还有旧版专用的所有表（activities、expenses、checkins……）。
-- 会保留：每个人的名字和 8 位身份码（profiles）。
-- 删了就回不来。跑完这份，再跑一次 schema_v1.sql。全新、空白的项目跑也没问题。
-- 照片文件要另外在 Supabase → Storage 里删（下面有说明）。
-- ============================================================================

-- 1. 新版的房间和里面的内容全部清掉（成员、共享内容、私人内容会跟着一起删）
do $$ begin
  if to_regclass('public.push_subs') is not null then delete from public.push_subs where true; end if;
  if to_regclass('public.trips')     is not null then delete from public.trips     where true; end if;
end $$;

-- 2. 旧版专用的表全部拿掉：public 里除了新版用的这 6 张，其他都删
do $$
declare t record;
begin
  for t in select tablename from pg_tables
           where schemaname = 'public'
             and tablename not in ('profiles', 'trips', 'trip_members', 'trip_state', 'member_state', 'push_subs') loop
    execute format('drop table if exists public.%I cascade', t.tablename);
  end loop;
end $$;

-- 3. 旧版专用的函数也拿掉（新版用的这几个保留）
do $$
declare f record;
begin
  for f in select p.oid::regprocedure as sig from pg_proc p join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public' and p.prokind = 'f'
             and p.proname not in ('is_member', 'create_trip', 'join_trip', 'kick_member', 'ensure_recovery_code', 'reclaim_identity')
             and not exists (select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e') loop
    execute format('drop function if exists %s cascade', f.sig);
  end loop;
end $$;

-- 4. 照片存储里旧版的规则拿掉（新版的在 schema_v1.sql 里会重新建好）
drop policy if exists "trip photo upload" on storage.objects;
drop policy if exists "trip photo read"   on storage.objects;
drop policy if exists "checkin upload"    on storage.objects;
drop policy if exists "checkin read"      on storage.objects;
drop policy if exists "checkin delete"    on storage.objects;
drop policy if exists "media read"        on storage.objects;
drop policy if exists "media upload"      on storage.objects;

-- 5. 照片文件：Supabase 不让用 SQL 直接删文件，请到 Storage 页面：
--    · checkins、trip-photos 这两个桶：点进去 → 右上角「…」→ Delete bucket
--    · media 这个桶：点进去 → 全选 → Delete（桶本身留着，新版要用）
