/* Language: 中文 or English — never mixed. Chinese mode removes the decorative English labels;
   English mode translates the interface, place / food / skill names. Switching reloads the app. */
export const lang = (() => { try { return localStorage.getItem("td-lang") || "zh"; } catch (e) { return "zh"; } })();
export const t = (zh, en) => lang === "en" ? en : zh;
export function setLang(l) { try { localStorage.setItem("td-lang", l); } catch (e) {} location.reload(); }
document.documentElement.lang = lang === "en" ? "en" : "zh-CN"; document.documentElement.dataset.lang = lang;

/* ---- Chinese mode: English decorations → Chinese (or removed) ---- */
const E2Z = {
  "← Back": "← 返回", "Back": "返回", "The Trip Deck": "旅行牌组", "THE TRIP DECK": "旅行牌组", "DRAW →": "抽牌 →", "FLIP →": "抛一下 →", "TEAR →": "撕一张 →",
  "PASSPORT": "护照", "ALBUM": "相册", "Stamp Archive": "邮票集", "RECEIPT": "发票", "Travel Receipt": "旅行发票", "THE TRIP DECK / TRAVEL ARCHIVE": "旅行牌组 · 旅行档案",
  "TRIP": "旅行", "DATE": "日期", "TRAVELLER": "旅人", "FROM": "出发地", "ITEM GROUPS": "项目", "TOTAL ENTRIES": "条目", "TODAY'S MOOD": "今日心情", "THANK YOU · 下次再出发": "谢谢光临 · 下次再出发",
  "Food Ticket": "美食票", "Mini Archive": "迷你档案", "The Journey": "旅程", "ACTIVATE": "发动", "DONE": "完成", "Lv": "等级",
  "Your trip. Your rules.": "你的旅行，你定规则。", "ROOM": "房间", "SOLO": "个人", "R.I.P.": "安息", "Passport of Good Days": "好日子护照"
};
const KEEP = /^(RM|CNY|MYR|THB|HK\$|S\$|XP|KLCC|IFS|TRX|LRT|KTM|PEN|KUL|SIN|JHB|IPH|BKK|HKG|PVG|OSM|MRT|No\.|[A-Z]{1,2}\d?|[\d\s.,:+\-–—×%/#°]+)$/;
let EN2ZH = null;

/* ---- English mode: interface Chinese → English ---- */
const Z2E = {
  "今日": "Today", "行程": "Plan", "玩法": "Play", "手账": "Book", "账本": "Money",
  "日程": "Schedule", "地图": "Map", "攻略": "Guide", "清单": "Checklist", "必去": "Must-see", "必吃": "Must-eat", "特色体验 · 完成拿印记": "Experiences · earn a seal",
  "早上好,": "Good morning,", "中午好,": "Good afternoon,", "下午好,": "Good afternoon,", "晚上好,": "Good evening,", "今天想去哪儿走走？": "Where to today?",
  "今日打卡任务": "Today's mission", "去完成": "Go", "去完成": "Go", "每个旅伴今天拿到的任务都不一样": "Every buddy gets a different mission today",
  "轻触绳结，拆开今日旅运": "Tap the knot to open today's fortune", "每天只能抽一次哦": "One draw per day", "今天只有一个任务，完成就能盖章": "One mission today — finish it to get a stamp",
  "加一个地点": "Add a place", "＋ 加一个地点": "＋ Add a place", "✦ 临时打卡（计划外）": "✦ Unplanned check-in", "这一天还没有安排": "Nothing planned for this day",
  "各自出发": "Departures", "✈ 我从哪里出发": "✈ Where I'm leaving from", "✈ 改我的出发": "✈ Edit my departure", "还没出发": "Not yet",
  "等你确认": "Waiting for you", "全部路线": "All routes", "高德": "Amap", "☾ 夜色": "☾ Night", "☀ 原色": "☀ Day", "📍 我在哪": "📍 Where am I", "拖动调整位置": "Drag to fix pins", "完成调整": "Done",
  "玩法": "Play", "让行程慢下来，多一点记忆点。": "Slow down, make more memories.", "旅行技能牌": "Skill Cards", "旅途通宝": "Coin of the Road", "撕美食票": "Food Tickets",
  "六位神话守护者，每人每天随机一张。发动的时候，旅伴们都会收到提醒。": "Six mythic guardians, one random draw per person per day. Your buddies get notified when you activate one.",
  "拿不定主意就抛一下。有字的一面是左、吃、进。": "Can't decide? Flip it. The inscribed side means left / eat / go in.",
  "吃到当地的好东西，就撕下它的票，收进票夹。": "Ate something local and good? Tear its ticket for your wallet.",
  "今天的牌桌": "Today's table", "技能日志": "Skill log", "还没抽": "Not drawn", "（你）": " (you)", "发动技能 · ACTIVATE": "Activate", "牌堆里还剩": "Cards left",
  "按住牌堆，心里想着今天的旅程……": "Hold the deck and think about today's journey…", "别松手……星图在转动": "Keep holding… the stars are turning", "再专注一点，按住不放": "Focus — keep holding",
  "拿不定主意，就交给这枚老铜钱。": "Can't decide? Let the old coin choose.", "要不要": "Yes/No", "左还是右": "Left/Right", "吃不吃": "Eat?", "进不进": "Go in?",
  "点一下铜钱，或者按住往上一甩": "Tap the coin, or flick it upward", "再抛一次": "Flip again", "就这么定了": "Decide", "大家最近的决定": "Recent decisions",
  "撕一张美食票": "Tear a food ticket", "吃到当地的好东西，就把它的票撕下来收进票夹": "Ate something local? Tear its ticket for your wallet", "吃到了别的": "Something else", "自己加一种": "Add your own",
  "放回去": "Put back", "收进票夹": "Keep it", "是什么": "What", "去哪吃": "Where", "出处": "Origin", "好吃！": "Loved it", "还行": "OK", "不爱": "Not for me", "尝过了": "Tasted",
  "印章护照": "Passport", "相册": "Album", "邮票集": "Stamps", "美食票夹": "Food wallet", "日记": "Diary", "旅行日记": "Diary", "旅行发票": "Receipt", "海报": "Poster",
  "点一样东西打开它。每一趟旅行都有自己的一格书架。": "Tap a keepsake to open it. Every trip has its own shelf.", "可以打印了": "Ready",
  "记一笔": "Add expense", "＋ 记一笔": "＋ Add", "共同 · 平分": "Shared · split", "个人（只有我）": "Personal", "谁一起分": "Split between", "记下": "Save", "¥ 人民币": "¥ CNY", "RM 马币": "RM MYR",
  "严格：每天重置": "Strict: resets daily", "弹性：省下的留到明天": "Flexible: savings roll over", "每人预算": "Budget / person", "整趟预算": "Trip budget", "你的花费": "You spent", "剩下": "Left",
  "结算": "Settle up", "预付 · 机票住宿": "Prepaid · flights & stays", "每天": "Daily", "你的钱花在哪里": "Where your money went", "记录": "History", "个人": "Personal",
  "住宿": "Stay", "机票": "Flight", "餐饮": "Food", "交通": "Transport", "门票": "Tickets", "特色体验": "Experiences", "购物": "Shopping", "咖啡茶饮": "Drinks", "其他": "Other",
  "设置": "Settings", "完成": "Done", "好的": "OK", "取消": "Cancel", "保存": "Save", "关闭": "Close", "分享": "Share", "保存图片": "Save image", "重新打印": "Reprint", "保存 / 分享": "Save / Share",
  "拍照打卡": "Check in", "稍后再说": "Later", "重拍": "Retake", "交给旅伴确认": "Send to a buddy", "盖章": "Stamp it", "✓ 通过，盖章": "✓ Approve", "再拍一张吧": "Try again",
  "已经交给旅伴": "Sent to your buddies", "✓ 打卡成功": "✓ Checked in", "印章已经盖进手账": "Stamp added to your book",
  "旅伴精灵": "Travel buddy", "我的旅行书架": "My travel library", "每一趟旅行是一本书。选一本继续。": "Every trip is a book. Pick one to continue.", "开一本新的": "Start a new one", "再点一下打开": "Tap again to open",
  "选一本继续，或者开一本新的。": "Pick a book to continue, or start a new one.", "加入房间": "Join room", "开一本新的旅行手账": "Start a new travel book", "和朋友一起（房间）": "With friends (room)", "个人旅行": "Solo trip",
  "开始这本手账": "Start this book", "名字": "Name", "去哪里 · 可以多选": "Where to · pick any", "出发": "Depart", "回来": "Return", "预算（RM）": "Budget (RM)", "旅行房间": "Room",
  "中国": "China", "马来西亚": "Malaysia", "新加坡": "Singapore", "泰国": "Thailand", "景点": "Sight", "美食": "Food", "小景点": "Spot", "自己加的": "Added by you",
  "✦ 我体验了": "✦ I did this", "✓ 已拿到印记": "✓ Seal earned", "✓ 已在行程里": "✓ In plan", "＋ 自己加一个地方或美食": "＋ Add a place or dish", "＋ 其他城市": "＋ Other city",
  "攻略内容是出发前整理的资料，开放时间和价格以现场为准。": "Guide notes were collected before the trip — check opening hours and prices on site.",
  "入境章": "Entry seal", "体验印记": "Experience seal", "计划外": "Unplanned", "盖章": "Stamp", "收进手账": "Keep"
};
let NAMES = null;
async function names() {
  if (NAMES) return NAMES;
  const [{ GUIDES }, sk] = await Promise.all([import("../data/guides.js"), import("../data/skills.js")]);
  NAMES = {}; EN2ZH = {};
  GUIDES.forEach(g => { NAMES[g.name] = g.en; EN2ZH[g.en] = g.name; g.spots.forEach(s => { if (s.e) NAMES[s.n] = s.e; }); g.foods.forEach(f => { if (f.e) NAMES[f.n] = f.e; }); });
  [...sk.SKILLS, ...sk.MINORS].forEach(c => { NAMES[c.name] = titleCase(c.en); if (c.effectEn) NAMES[c.effect] = c.effectEn; });
  return NAMES;
}
const titleCase = s => s.toLowerCase().replace(/\b\w/g, m => m.toUpperCase());
const HAN = /[\u3400-\u9fff]/;
const WD = { 一: "Mon", 二: "Tue", 三: "Wed", 四: "Thu", 五: "Fri", 六: "Sat", 日: "Sun" };
const nm = a => (NAMES && NAMES[a]) || Z2E[a] || a;
const RULES_EN = [
  [/^旅行房间 · (\d+) 人 ⇄$/, "Room · $1 people ⇄"], [/^个人旅行 ⇄$/, "Solo trip ⇄"], [/^清单 (\d+)\/(\d+)$/, "Checklist $1/$2"], [/^今天$/, "Today"],
  [/^✦ 盖(.+)入境章$/, (m, a) => `✦ Stamp the ${nm(a)} entry seal`], [/^✦ 抵达(.+) · 盖入境章$/, (m, a) => `✦ Arrived in ${nm(a)} · stamp your entry seal`],
  [/^(早餐|午餐|晚餐)$/, (m, a) => ({ 早餐: "Breakfast", 午餐: "Lunch", 晚餐: "Dinner" })[a]], [/^回酒店$/, "Back to hotel"], [/^含(早餐|午餐|晚餐)$/, (m, a) => "Incl. " + ({ 早餐: "breakfast", 午餐: "lunch", 晚餐: "dinner" })[a]],
  [/^今日可用 (RM [\d,]+) · 你已花 (RM [\d,]+)$/, "Today $1 · spent $2"], [/^(今天|Day 1) · ([\d.]+) 你还可以花$/, (m, a, b) => `${a === "今天" ? "Today" : a} · ${b} you can still spend`],
  [/^每日可用 = （预算 − 你的预付 (RM [\d,]+)）÷ (\d+) 天 = (RM [\d,]+)$/, "Daily = (budget − your prepaid $1) ÷ $2 days = $3"], [/^你的份额 (RM [\d,]+)$/, "Your share $1"],
  [/^(\d+) 枚入境章 · (\d+) 枚印章 · (\d+) 个体验印记 · (\d+) 张照片$/, "$1 entry seals · $2 stamps · $3 experience seals · $4 photos"], [/^我的旅行手账 · 只有你看得到 ⇄$/, "My travel book · private ⇄"],
  [/^建议 (.+)$/, (m, a) => "Suggested " + a.replace("小时", "h").replace("分钟", "min").replace("半天", "half a day").replace("一天", "a full day").replace("晚上", "evening")],
  [/^＋ 加入 Day (\d+)$/, "＋ Add to Day $1"], [/^Lv (\d+) 进化 ·.*$/, "Evolves at Lv $1 · check-in +30, food ticket +15, skill +20, care +2"],

  [/^Day (\d+)$/, "Day $1"], [/^第(\d+)阶段$/, "Stage $1"], [/^(\d+) 人$/, "$1 people"], [/^收集了 (\d+) 张美食票，只有你看得到$/, "$1 food tickets · only you can see them"],
  [/^这趟旅行有 (\d+) 种当地美食等你尝$/, "$1 local dishes to try on this trip"], [/^撕下「(.+)」$/, (m, a) => `Tear "${NAMES[a] || a}"`], [/^已完成 (\d+) \/ (\d+)$/, "Done $1 / $2"],
  [/^周([一二三四五六日])$/, (m, a) => ({ 一: "Mon", 二: "Tue", 三: "Wed", 四: "Thu", 五: "Fri", 六: "Sat", 日: "Sun" })[a]], [/^(\d\d\.\d\d) 周([一二三四五六日])$/, (m, d, a) => d + " " + ({ 一: "Mon", 二: "Tue", 三: "Wed", 四: "Thu", 五: "Fri", 六: "Sat", 日: "Sun" })[a]]
];
function toZh(s) {
  const tr = s.trim(); if (!tr) return null;
  if (E2Z[tr] != null) return s.replace(tr, E2Z[tr]);
  let m;
  if ((m = tr.match(/^Taste of (.+)$/))) return (EN2ZH && EN2ZH[m[1]] || m[1]) + "的味道";
  if ((m = tr.match(/^Day (\d+)$/))) return `第${m[1]}天`;
  if ((m = tr.match(/^D(\d+)$/))) return `第${m[1]}天`;
  if (HAN.test(tr)) { // mixed: drop pure-English segments like "SKILL ACTIVATION · 11.01"
    if (!/[A-Za-z]{3,}/.test(tr)) return null;
    const parts = tr.split(/\s*·\s*/).map(p => p.replace(/^DAY (\d+)$/, "第$1天")), keep = parts.filter(p => !(/^[A-Z][A-Z' &\-]{2,}$/.test(p)));
    let out = keep.join(" · ");
    out = out.replace(/\s+[A-Z][A-Z' ]{2,}$/, "").replace(/^[A-Z][A-Z' ]{2,}\s+(?=[\u3400-\u9fff])/, "");
    return out !== tr ? s.replace(tr, out) : null;
  }
  if (KEEP.test(tr)) return null;
  if (/^[A-Z0-9][A-Z0-9 ·.,'&:/+#\-—→←!?()]*$/.test(tr) && /[A-Z]{3,}/.test(tr)) return ""; // decorative ALL-CAPS English → removed
  return null;
}
function toEn(s) {
  const tr = s.trim(); if (!tr || !HAN.test(tr)) return null;
  const hit = Z2E[tr] ?? (NAMES && NAMES[tr]); if (hit != null) return s.replace(tr, hit);
  for (const [re, rep] of RULES_EN) if (re.test(tr)) return s.replace(tr, tr.replace(re, rep));
  // "厦门 · 鼓浪屿" style: translate each part if all parts are known
  const parts = tr.split(/\s*·\s*/); if (parts.length > 1 && parts.every(p => Z2E[p] || (NAMES && NAMES[p]) || !HAN.test(p))) return s.replace(tr, parts.map(p => Z2E[p] || (NAMES && NAMES[p]) || p).join(" · "));
  return null;
}
const fix = lang === "en" ? toEn : toZh;
const SKIP = new Set(["SCRIPT", "STYLE", "TEXTAREA", "INPUT", "svg", "text", "tspan", "textPath"]);
function walk(root) {
  if (root.nodeType === 3) { const p = root.parentNode; if (!p || SKIP.has(p.nodeName) || p.closest && p.closest("svg,[data-noi18n]")) return; const r = fix(root.nodeValue); if (r != null && r !== root.nodeValue) root.nodeValue = r; return; }
  if (root.nodeType !== 1 || SKIP.has(root.nodeName) || root.closest && root.closest("svg,[data-noi18n]")) return;
  ["placeholder", "aria-label", "title"].forEach(a => { const v = root.getAttribute && root.getAttribute(a); if (v) { const r = fix(v); if (r != null && r !== v) root.setAttribute(a, r); } });
  for (const c of root.childNodes) walk(c);
}
let started = false;
export async function startI18n() {
  if (started) return; started = true;
  await names();
  walk(document.body);
  new MutationObserver(ms => { for (const m of ms) { if (m.type === "characterData") walk(m.target); else m.addedNodes.forEach(walk); } }).observe(document.body, { childList: true, subtree: true, characterData: true });
}

export const tr = s => { const r = fix(String(s)); return r == null ? s : r; };
