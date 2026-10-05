# 旅行手账 · Trip Deck v3

一群人一起写的旅行手账。这一版是全新界面，数据层用 Supabase，前端静态部署在 Netlify。

## 文件

| 文件 | 作用 |
|---|---|
| `index.html` | 整个 App（已经打包成一个文件） |
| `config.js` | 填 Supabase 地址和 key 的地方 |
| `sync.js` | 同步层：先存手机，再同步到 Supabase |
| `sw.js` · `manifest.webmanifest` · `icons/` | 装成 App、离线打开 |
| `netlify.toml` · `_headers` | Netlify 配置 |
| `netlify/functions/weather.mjs` | 真实天气（中国气象局 / MET Malaysia 等） |
| `supabase/` | 数据库脚本 |

## 第一次打开
App 没有任何预设行程。开始页可以：
- **导入 Excel 行程表**（推荐）——用文件夹里的 `旅行手账-福建PlanA-示例.xlsx` 试一下，或者拿 `旅行手账-空白模板.xlsx` 填你自己的。
- **从 47 个城市的资料生成**、**空白的一本**，或者输入旅伴的邀请码加入。

Excel 五张表：`旅行`（名称、日期、城市、预算、你的货币、汇率）、`行程`（日期 + 地点必填，其余可选）、`预付`、`清单`、`说明`。
城市写中文（厦门、潮汕、吉隆坡……），有资料的城市会自动带上景点、美食、坐标、宾果任务和城市印章。

## 部署 · 三步
1. **数据库**：Supabase → SQL Editor，把 `supabase/schema_v1.sql` 整份贴进去运行一次。
   - 要把以前的旅行全部清掉、重新开始：先跑 `supabase/reset_all.sql`，再跑 `schema_v1.sql`。
   - Authentication → Providers 打开 **Anonymous sign-ins**。
   - `supabase/old/` 里是以前一层一层的旧文件，只留作记录，不用再跑。
2. **网站**：把整个文件夹拖进 Netlify（或连 Git）。原来设好的 `VITE_SUPABASE_URL`、`VITE_SUPABASE_ANON_KEY` 环境变量不用动，新版会自动读。
3. **手机**：打开网站，加到主屏幕。


## 数据怎么存
- **共享（房间里所有人）**：相册、评论、账本、旅行书、动态 → `trip_state`，实时同步。
- **私人（只有自己）**：行李清单、票根、美食票、日记、点赞、设置、技能牌、语音 → `member_state`。
- **照片、语音**：Supabase Storage 的 `media` 桶（公开读、成员写）。没连数据库时存在手机的 IndexedDB。
- **身份码**：`profiles.recovery_code`，换手机时在设置里输入旧码找回（`reclaim_identity`）。
- **邀请码**：`trips.code`，旅伴在「旅伴」页输入就能加入（`join_trip`）。

## 本地预览
```
npx serve .        # 或 python3 -m http.server 8000
```
用手机连同一个 Wi-Fi 打开电脑的 IP 就能测（麦克风、传感器需要 https，Netlify 上默认就是）。

## 注意
- 货币：设置 → 货币与汇率，可以换成你自己的货币（MYR / SGD / USD…）和目的地货币，「用今天的」会联网拿实时汇率。
- 下拉首页可以刷新，拿到旅伴刚记的账和照片。
- 计步用手机的运动传感器，只在 App 打开时计数；做成原生壳（Capacitor）以后可以读健康数据。
- Push 推送（原版的 `push.mjs`）这一版没接，需要的话把原来的函数和 `push_subs` 表接回来即可。

## 源代码
`source/` 里是这个版本整理后的源代码，以后改功能只改这里：
- `tripdeck.js` —— 全部 App 逻辑（一份文件，不再是一层盖一层）
- `tripdeck.css` —— 全部样式
- `shell.html` —— 页面外壳
`index.html` 是用这三份加上图片数据打包出来的成品，部署用它就好。

## 通知（App 关着也能收到旅伴的消息）
在 Netlify → Site configuration → Environment variables 加这几个（加完重新部署一次）：
- `SUPABASE_SERVICE_ROLE_KEY`：Supabase → Project Settings → API → `service_role`（保密，不要放进网站文件里）
- `VAPID_PUBLIC_KEY`、`VAPID_PRIVATE_KEY`：通知钥匙。如果旧版已经设过 `VITE_VAPID_PUBLIC_KEY` 和 `VAPID_PRIVATE_KEY`，直接沿用，不用换。没有的话用另外给你的「通知钥匙.txt」。
- `VAPID_SUBJECT`（可不填）：`mailto:你的邮箱`

手机上：设置 → 通知 → 打开。iPhone 要先把 App「加到主屏幕」，再从主屏幕打开，才能开通知（iOS 16.4 以上）。
会通知的事：旅伴发动技能 / 射掉行程 / 催雨落雪、有人打卡等你确认、你的打卡被确认、有人开了一局猜价格。

## 照片隐私
照片存在私密的 `media` 桶里，只有同一个房间的人拿得到（App 用 7 天有效的临时链接显示，会自动更新）。旧版上传过的公开照片，新版打开时会自动改用私密链接。
