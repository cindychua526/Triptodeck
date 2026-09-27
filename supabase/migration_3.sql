-- Trip Deck · migration 3 (run once). One person = one identity.
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

-- 4) realtime for card draws (was added to migration_2 later; safe to repeat)
do $$ begin
  alter publication supabase_realtime add table skill_draws; exception when others then null; end $$;
-- 5) push subscriptions (for notifications when the app is closed)
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

-- 8) delete a book: the person who created the trip can delete it for everyone (everything inside goes with it)
drop policy if exists "trips delete" on trips;
create policy "trips delete" on trips for delete to authenticated using (created_by = auth.uid());

-- 9) 拍立得: a line of writing under every photo (check-in photos, food photos, shared photos)
alter table stamps add column if not exists caption text;
alter table food_photos add column if not exists caption text;
drop policy if exists "food photos edit" on food_photos; create policy "food photos edit" on food_photos for update to authenticated using (user_id = auth.uid());
drop policy if exists "shared edit" on shared_photos; create policy "shared edit" on shared_photos for update to authenticated using (user_id = auth.uid());
