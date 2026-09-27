/* The Trip Deck: six skills, each guarded by a figure from Chinese mythology */
export const SKILLS = [
  { key: "K", name: "镜界", en: "MIRROR REALM", myth: "嫦娥 · 月镜", mythEn: "Chang'e of the Moon", effect: "可以复制其他技能（最多1次）", ooc: "复制今天最后一个发动的技能，明天自动生效", accent: "#d9c38a", bg: "#1b2240", bg2: "#2c3868" },
  { key: "Q", name: "时间暂停", en: "TIME PAUSE", myth: "羲和 · 驭日", mythEn: "Xihe, Driver of the Sun", effect: "多停留1个小时", ooc: "明天必须比原计划晚出门30分钟", accent: "#e6c27a", bg: "#14332d", bg2: "#1f4b42" },
  { key: "J", name: "命运改写", en: "FATE REWRITE", myth: "月老 · 红线", mythEn: "Yue Lao of the Red Thread", effect: "可以重新决定一次", ooc: "明天第一个决定，自动反转", accent: "#e3b98c", bg: "#35151a", bg2: "#56222a" },
  { key: "10", name: "主角光环", en: "MAIN CHARACTER AURA", myth: "妈祖 · 引航", mythEn: "Mazu, Guide of the Sea", effect: "接下来30分钟，这个人负责带大家逛", ooc: "明天随机指定一个人，拥有第一站决定权", accent: "#e8c98a", bg: "#0f2638", bg2: "#1a3d57" },
  { key: "9", name: "传送门", en: "PORTAL", myth: "哪吒 · 风火轮", mythEn: "Nezha on Wind-Fire Wheels", effect: "跳过，直接进入下一个地点", ooc: "明天必须新增一个，原本没计划的地点", accent: "#efb57a", bg: "#2a100d", bg2: "#4a1c15" },
  { key: "8", name: "虚假世界", en: "FALSE WORLD", myth: "庄周 · 梦蝶", mythEn: "Zhuangzi's Butterfly Dream", effect: "1小时内迷失在这边区域，只能凭感觉", ooc: "明天必须删掉一个，原本计划的地点", accent: "#d8c2e6", bg: "#241d38", bg2: "#3a2f58" },
  { key: "7", name: "射日", en: "SHOOT THE SUN", myth: "后羿 · 射日", mythEn: "Hou Yi the Archer", effect: "今天从行程里射掉一项，不用商量（主要行程除外）", ooc: "明天随机射掉一项", accent: "#e0a84a", bg: "#2a1a10", bg2: "#4a2c16", effectEn: "Remove one item from today's plan, no discussion (main items are safe)" },
  { key: "6", name: "催雨", en: "CALL THE RAIN", myth: "雷公 · 催雨", mythEn: "Lei Gong, Lord of Thunder", effect: "氛围牌：今天全房间下雨，日历卡变成雨天，所有人的手机打一声雷", ooc: "雨下到明天中午", accent: "#9fb8d8", bg: "#161c2c", bg2: "#243050", effectEn: "Atmosphere: it rains in the whole room today" },
  { key: "4", name: "借路", en: "BORROW THE ROAD", myth: "土地公 · 借路", mythEn: "Tudi Gong, the Earth God", effect: "今天一次打卡不用拍照、不用旅伴确认，土地公担保直接盖章", ooc: "盖的章是灰色的", accent: "#c8b078", bg: "#221c14", bg2: "#3a3020", effectEn: "One check-in today without a photo or approval — the Earth God vouches for you" },
  { key: "X", name: "无常", en: "THE WANDERER", myth: "鬼牌 · 无常", mythEn: "Wuchang, the Joker", effect: "随机复制昨天房间里有人抽到的一张牌的效果；第一天抽到等于空牌", ooc: "无", accent: "#c9c3d6", bg: "#141018", bg2: "#2a2234", effectEn: "Copies a random card someone drew yesterday" }
];
export const CARD = Object.fromEntries(SKILLS.map(s => [s.key, s]));
export const COIN_RULES = { heads: "左边 / 吃 / 进", tails: "右边 / 不吃 / 不进" };

/* ---------- 36 everyday skills in four suits (minor arcana) ----------
   kind: simple = announce & do it | target = pick a travel buddy | timer = runs for N minutes (everyone sees the countdown) */
export const SUITS = {
  F: { name: "味", en: "TASTE", full: "味之章", accent: "#e8b98a", bg: "#3a1a14", bg2: "#5a2a1e" },
  M: { name: "行", en: "ROAD", full: "行之章", accent: "#c9d3e8", bg: "#141c30", bg2: "#22304e" },
  P: { name: "影", en: "LENS", full: "影之章", accent: "#bfe0d2", bg: "#10282a", bg2: "#1a3e40" },
  S: { name: "缘", en: "BOND", full: "缘之章", accent: "#f0c4c8", bg: "#2e1424", bg2: "#4a2038" }
};
const N = ["", "壹", "贰", "叁", "肆", "伍", "陆", "柒", "捌", "玖"];
const m = (key, name, en, effect, o = {}) => ({ key, name, en, effect, suit: key[0], n: +key[1], numeral: N[+key[1]], kind: o.kind || "simple", minutes: o.minutes, ooc: o.ooc || `明天要补做一次「${name}」` });
export const MINORS = [
  m("F1", "点菜权", "THE ORDER", "下一餐由你一个人点菜，其他人不许反对。", { ooc: "明天第一餐由旅伴帮你点" }),
  m("F2", "路边第一口", "FIRST BITE", "接下来看到的第一家路边小吃，买一份大家分着吃。"),
  m("F3", "交换盘子", "SWAP PLATES", "这一餐每个人都要尝一口别人点的菜。"),
  m("F4", "本地人推荐", "ASK A LOCAL", "问一位店家或路人推荐一样吃的，照着去吃。", { ooc: "明天必须吃一样从没吃过的东西" }),
  m("F5", "盲选", "BLIND PICK", "下一杯饮料闭着眼在菜单上随便指一个。", { ooc: "明天的饮料由旅伴帮你选" }),
  m("F6", "甜点时间", "SWEET BREAK", "现在找一家甜品店，全员来一份甜的。"),
  m("F7", "辣度加一级", "ONE MORE CHILI", "下一餐点一道比平时辣一级的菜。"),
  m("F8", "美食评审", "THE CRITIC", "下一餐由你给每道菜打分（满分 10），大家要听你点评。"),
  m("F9", "放下手机吃饭", "PHONES DOWN", "下一餐手机全部收起来，好好聊天吃饭。"),
  m("M1", "左右由天", "COIN AT THE CORNER", "下一个路口往哪边走，用旅途通宝决定。"),
  m("M2", "带路人", "THE GUIDE", "指定一位旅伴，接下来 30 分钟由他带路。", { kind: "target", minutes: 30 }),
  m("M3", "走路去", "ON FOOT", "下一站如果在 1.5 公里内，全员走路过去。"),
  m("M4", "慢速模式", "SLOW MODE", "接下来 20 分钟放慢脚步，好好看路边的小东西。", { kind: "timer", minutes: 20 }),
  m("M5", "随便一条巷", "ANY ALLEY", "走进附近任意一条没去过的小巷，逛 10 分钟。", { kind: "timer", minutes: 10 }),
  m("M6", "原地休息", "TAKE A SEAT", "马上找地方坐下休息 15 分钟，喝点东西。", { kind: "timer", minutes: 15 }),
  m("M7", "提前集合", "EARLY CALL", "这一站提前 15 分钟结束，多出来的时间自由活动。"),
  m("M8", "反向探索", "THE OTHER WAY", "往和计划相反的方向走 5 分钟，看看会遇到什么。", { kind: "timer", minutes: 5 }),
  m("M9", "交通升级", "UPGRADE", "下一段路换成更舒服的方式（打车、坐船），不许说贵。"),
  m("P1", "全员腾空", "JUMP SHOT", "下一个地点拍一张全员跳起来的合照。"),
  m("P2", "御用摄影师", "PERSONAL PHOTOGRAPHER", "指定一位旅伴，接下来 30 分钟当你的专属摄影师。", { kind: "target", minutes: 30 }),
  m("P3", "只拍一张", "ONE FRAME", "下一个景点每人只能拍一张照片，拍完就收手机。"),
  m("P4", "颜色猎人", "COLOR HUNT", "20 分钟内找到 5 样同一种颜色的东西拍下来。", { kind: "timer", minutes: 20 }),
  m("P5", "偷拍大赛", "CANDID", "30 分钟内偷拍旅伴最自然的一张，晚上投票选最好的。", { kind: "timer", minutes: 30 }),
  m("P6", "模仿秀", "COPY THAT", "下一个景点所有人模仿同一座雕像或同一个姿势拍照。"),
  m("P7", "三秒合照", "THREE SECONDS", "现在马上拍一张全员合照，三秒内摆好姿势。"),
  m("P8", "交换镜头", "SWAP LENS", "用别人的手机，帮他拍一张他最喜欢的照片。"),
  m("P9", "明信片", "POSTCARD", "给这里拍一张像明信片的照片，发给一个不在这里的人。"),
  m("S1", "夸夸时间", "COMPLIMENTS", "指定一位旅伴，接下来 10 分钟他说的每句话你都要夸。", { kind: "target", minutes: 10 }),
  m("S2", "当地话", "SAY IT LOCAL", "用当地话或当地语言跟店家说一句「谢谢」。"),
  m("S3", "小导游", "FUN FACT", "指定一位旅伴，下一站由他给大家讲一个冷知识。", { kind: "target" }),
  m("S4", "陌生人合影", "A STRANGER'S LENS", "请一位陌生人帮全员拍一张合照。"),
  m("S5", "禁语「好」", "NO 'OKAY'", "接下来 30 分钟，谁说「好」字谁就给大家讲个笑话。", { kind: "timer", minutes: 30 }),
  m("S6", "猜拳拿东西", "ROCK PAPER BAGS", "用石头剪刀布决定下一段路谁帮大家拿东西。"),
  m("S7", "谢谢你", "THANK YOU", "今天睡前，每个人都要对一位旅伴说一句谢谢。"),
  m("S8", "多数决", "SHOW OF HANDS", "所有人同时指一个方向，多数人指的方向就是下一段的去处。"),
  m("S9", "今日之星", "STAR OF THE DAY", "投票选出今天的「最佳旅伴」，他今晚可以点宵夜。")
].map(c => ({ ...c, ...SUITS[c.suit], myth: SUITS[c.suit].full + " · " + c.numeral, mythEn: SUITS[c.suit].en + " · " + c.n }));
MINORS.forEach(c => { CARD[c.key] = c; });
export const ALL_CARDS = [...SKILLS]; // the six guardians only
export const isMinor = k => /^[FMPS]\d$/.test(k);

/* English effects (used by the English interface) */
const EFFECT_EN = {
  K: "Copy another skill (once).", Q: "Stay one hour longer.", J: "Make one decision again.", "10": "For 30 minutes, this person leads the group.", "9": "Skip ahead to the next stop.", "8": "Get lost in this area for an hour — no maps, just instinct.",
  F1: "You alone order the next meal — no objections.", F2: "Buy the first street snack you see and share it.", F3: "Everyone tastes someone else's dish this meal.", F4: "Ask a local what to eat, then go eat it.", F5: "Pick your next drink with your eyes closed.", F6: "Find a dessert shop — everyone gets something sweet.", F7: "Order one dish a level spicier than usual.", F8: "Score every dish of the next meal out of 10.", F9: "Phones away for the next meal.",
  M1: "Flip the coin at the next corner.", M2: "Pick a buddy — they lead the way for 30 minutes.", M3: "If the next stop is within 1.5 km, walk there.", M4: "Slow down for 20 minutes and notice the small things.", M5: "Wander down any alley you haven't been in, for 10 minutes.", M6: "Sit down right now and rest for 15 minutes.", M7: "End this stop 15 minutes early and roam freely.", M8: "Walk 5 minutes the opposite way and see what you find.", M9: "Take the comfier ride for the next leg — no complaining about the price.",
  P1: "Take an everyone-jumping photo at the next stop.", P2: "Pick a buddy — they're your photographer for 30 minutes.", P3: "One photo each at the next sight, then phones away.", P4: "Find and shoot 5 things of the same color in 20 minutes.", P5: "Take the most natural candid of a buddy in 30 minutes; vote tonight.", P6: "Everyone copies the same statue or pose for a photo.", P7: "Group photo right now — three seconds to pose.", P8: "Use a buddy's phone to take a photo they'll love.", P9: "Shoot a postcard of this place and send it to someone far away.",
  S1: "Pick a buddy — compliment everything they say for 10 minutes.", S2: "Say thank you in the local language.", S3: "Pick a buddy to share a fun fact at the next stop.", S4: "Ask a stranger to take a group photo.", S5: "For 30 minutes, whoever says 'okay' tells a joke.", S6: "Rock-paper-scissors for who carries the bags next.", S7: "Before bed, everyone thanks one buddy.", S8: "Everyone points at once — the majority direction is where you go.", S9: "Vote for today's best buddy — they pick the late-night snack."
};
[...SKILLS, ...MINORS].forEach(c => { c.effectEn = EFFECT_EN[c.key]; });
