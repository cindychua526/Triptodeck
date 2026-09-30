-- Trip Deck · migration 4 (run once in the Supabase SQL Editor, after migration_3.sql)
-- 1) 美食票属于一趟旅行：同一种美食在第二趟旅行里是一张新的票，不会再带过去
alter table wallet_items drop constraint if exists wallet_items_pkey;
alter table wallet_items add column if not exists id uuid not null default gen_random_uuid();
do $$ begin alter table wallet_items add primary key (id); exception when others then null; end $$;
create unique index if not exists wallet_items_user_trip_spot on wallet_items (user_id, trip_id, spot_id) nulls not distinct;

-- 2) 私人清单：private = true 的项目只有写它的人看得到、改得到
alter table checklist_items add column if not exists private boolean not null default false;
update checklist_items set private = true where category ~ '私人|私密|个人' and private = false;
drop policy if exists "checklist crud" on checklist_items;
drop policy if exists "checklist read" on checklist_items;
drop policy if exists "checklist write" on checklist_items;
drop policy if exists "checklist update" on checklist_items;
drop policy if exists "checklist delete" on checklist_items;
create policy "checklist read" on checklist_items for select to authenticated using (is_member(trip_id) and (not private or created_by = auth.uid()));
create policy "checklist write" on checklist_items for insert to authenticated with check (is_member(trip_id) and (not private or created_by = auth.uid()));
create policy "checklist update" on checklist_items for update to authenticated using (is_member(trip_id) and (not private or created_by = auth.uid())) with check (is_member(trip_id) and (not private or created_by = auth.uid()));
create policy "checklist delete" on checklist_items for delete to authenticated using (is_member(trip_id) and (not private or created_by = auth.uid()));

-- 3) 牌组：新的一张 5 · 雪女 · 落雪；K 镜界 和 X 无常 也可以复制它
create or replace function draw_card(t uuid, d date)
returns skill_draws language plpgsql security definer set search_path = public as $$
declare r skill_draws; c text;
begin
  if not is_member(t) then raise exception 'NOT_MEMBER'; end if;
  select * into r from skill_draws where trip_id = t and date = d and user_id = auth.uid();
  if found then return r; end if;
  perform pg_advisory_xact_lock(hashtext(t::text || d::text));
  select x into c from unnest(array['K','Q','J','10','9','8','7','6','5','4','X']) x
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
  if p_copied is not null and (r.card not in ('K','X') or p_copied not in ('Q','J','10','9','8','7','6','5','4')) then raise exception 'BAD_COPY'; end if;
  update skill_draws set status = 'activated', activated_at = now(), activation = p_activation, copied = p_copied where id = p_id returning * into r;
  return r;
end $$;
