# 旅行手账 · Trip Deck

一群人一起写的旅行手账。一本书 = 一个房间：行程、账本、打卡、照片、游戏大家一起写；行李清单、美食票、日记只有自己看得到。

## 第一次部署（全新）

**1. Supabase（数据库）**
1. SQL Editor → New query → 贴上 `supabase/reset_all.sql` → Run（全新的项目也可以跑，会把旧东西清干净）。跑完把这个 query 删掉。
2. New query → 贴上 `supabase/schema_v1.sql` → Run。可以重复跑，不会删资料。
3. Authentication → Sign In / Providers → 打开 **Anonymous sign-ins**。
4. Storage：确认有一个叫 `media` 的桶（schema 会建好，私密）。其他旧的桶可以删掉。

**2. GitHub**
新建一个 Private 仓库，把这个文件夹**里面的东西**全部上传到仓库最外层（看得到 `index.html`、`netlify.toml` 才对）。

**3. Netlify（网站）**
1. 连到这个 GitHub 仓库。Build command、Publish directory 都留空（`netlify.toml` 会处理）。
2. Site configuration → Environment variables 加：
   - `VITE_SUPABASE_URL`、`VITE_SUPABASE_ANON_KEY`：Supabase → Project Settings → API
   - `SUPABASE_SERVICE_ROLE_KEY`：同一页的 service_role（保密，通知要用）
   - `VAPID_PUBLIC_KEY`、`VAPID_PRIVATE_KEY`：通知钥匙（见「通知钥匙.txt」；不要放进网站文件里）
3. Deploy，看到绿色 Published 就好了。

**4. 手机**
用 Safari 打开网站 → 分享 →「添加到主屏幕」（确认「作为网页 App 打开」是开的）→ 从主屏幕打开，最上面看不到网址栏才对。设置 → 通知 → 打开。

## 文件
- `index.html`：整个 App（打包好的成品）
- `sync.js`：和 Supabase 同步、照片私密存储、通知
- `sw.js`：离线也能打开、更新后自动换新版本
- `netlify/functions/`：`config`（把数据库地址交给 App）、`weather`（天气）、`notify`（发通知）
- `supabase/`：`schema_v1.sql`（建好数据库）、`reset_all.sql`（全部清空）
- `templates/trip-template.xlsx`：开始页「下载空白模板」用的 Excel
- `source/`：整理好的源代码（`tripdeck.js`、`tripdeck.css`、`shell.html`），以后改功能只改这里

## 数据怎么存
- 共享（同一个房间的人都看得到）：行程、账、打卡、相册和留言、游戏、技能、天气惊喜以外的动态。
- 私人（只有自己）：行李清单、美食票、日记、今日旅运、秘密任务、明信片、行李箱贴纸。
- 照片在私密的 `media` 桶，只有同一个房间的人拿得到（7 天有效的临时链接，会自动更新）。
- 每台手机也存一份，没网时照样能用，有网后自动同步。

## 通知
旅伴发动技能、打卡等你确认、你的打卡被确认、有人开猜价格时，App 关着也会收到。需要上面的 `SUPABASE_SERVICE_ROLE_KEY` 和两把通知钥匙；iPhone 要先「添加到主屏幕」并从主屏幕打开（iOS 16.4 以上）。
