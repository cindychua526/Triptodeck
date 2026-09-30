-- migration_5 · 点赞和评论单独存一张表（以前混在技能记录 skill_log 里，多了会把技能记录挤掉）
-- 在 Supabase → SQL Editor 里整段运行一次就好。运行前 App 也能用（会暂时继续用旧的方式）。

create table if not exists photo_social (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  photo_id text not null,                 -- shared_photos.id 或 food_photos.id
  owner_id uuid,                          -- 照片是谁的（用来发提醒）
  user_id uuid not null default auth.uid(),
  kind text not null check (kind in ('like', 'comment')),
  body text,
  created_at timestamptz not null default now()
);
create unique index if not exists photo_social_one_like on photo_social (photo_id, user_id) where kind = 'like';
create index if not exists photo_social_trip on photo_social (trip_id, created_at desc);

alter table photo_social enable row level security;
drop policy if exists "social read" on photo_social;   create policy "social read" on photo_social for select to authenticated using (is_member(trip_id));
drop policy if exists "social add" on photo_social;    create policy "social add" on photo_social for insert to authenticated with check (is_member(trip_id) and user_id = auth.uid());
drop policy if exists "social remove" on photo_social; create policy "social remove" on photo_social for delete to authenticated using (user_id = auth.uid());

do $$ begin alter publication supabase_realtime add table photo_social; exception when others then null; end $$;

-- 把以前存在 skill_log 里的点赞和评论搬过来（可以重复运行，不会搬两次）
insert into photo_social (trip_id, photo_id, owner_id, user_id, kind, body, created_at)
select l.trip_id, l.meta->>'photo', nullif(l.meta->>'owner','')::uuid, l.user_id, 'comment', l.effect, l.created_at
from skill_log l where l.action = 'COMMENT' and l.meta ? 'photo'
  and not exists (select 1 from photo_social p where p.photo_id = l.meta->>'photo' and p.user_id = l.user_id and p.kind = 'comment' and p.created_at = l.created_at);
insert into photo_social (trip_id, photo_id, owner_id, user_id, kind, created_at)
select distinct on (l.meta->>'photo', l.user_id) l.trip_id, l.meta->>'photo', nullif(l.meta->>'owner','')::uuid, l.user_id, 'like', l.created_at
from skill_log l where l.action in ('LIKE','UNLIKE') and l.meta ? 'photo'
  and (select l2.action from skill_log l2 where l2.meta->>'photo' = l.meta->>'photo' and l2.user_id = l.user_id and l2.action in ('LIKE','UNLIKE') order by l2.created_at desc limit 1) = 'LIKE'
on conflict do nothing;
delete from skill_log where action in ('LIKE','UNLIKE','COMMENT');
