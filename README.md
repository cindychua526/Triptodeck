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

### 1. Supabase
1. 新建项目（或者用现有的）。
2. **Authentication → Providers → Anonymous sign-ins** 打开。
3. **SQL Editor** 里按顺序运行：
   - 新项目：`schema.sql` → `migration_2.sql` → `migration_3.sql` → `migration_4.sql` → `migration_5.sql` → `migration_6.sql`
   - 老项目（已经跑过前面的）：只跑 `migration_6.sql`
4. **Settings → API** 复制 `Project URL` 和 `anon public` key。

### 2. 填配置
打开 `config.js`：
```js
supabaseUrl: "https://xxxx.supabase.co",
supabaseAnonKey: "eyJ……",
```
留空的话 App 也能用，只是所有东西只存在这台手机里。

### 3. Netlify
- 把这个文件夹拖进 Netlify（Sites → Add new site → Deploy manually），或者连上 Git 仓库。
- 不需要 build 命令，`netlify.toml` 已经写好：发布目录是根目录，函数在 `netlify/functions`。
- 部署完打开网址，Safari 用「添加到主屏幕」，安卓用「安装应用」。

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
