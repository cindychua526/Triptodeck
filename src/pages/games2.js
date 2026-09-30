/* Three more ways to play: 城市宾果 (bingo card per day), 秘密任务 (a secret mission each morning, revealed at night),
   猜价格 (everyone guesses before paying). Progress lives on this phone; results go into the room's log. */
import { api, nameOf } from "../lib/api.js";
import { esc, today, buzz, seeded, shortDate } from "../lib/util.js";
import { toast } from "../lib/ui.js";
import { sfx, mus } from "../lib/sound.js";
import { cityOf, tripDays } from "./trip.js";

const LS = { get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };
const tid = () => (api.trip ? api.trip.id : "x"), me = () => (api.me ? api.me.id : "me");
const log = text => { if (api.trip) api.addLog(today(), null, "PLAY", text).catch(() => {}); };
function shell(title, en, cls = "") {
  document.querySelector(".dz")?.remove();
  const ov = document.createElement("div"); ov.className = "dz " + cls; ov.setAttribute("role", "dialog"); ov.setAttribute("aria-label", title);
  ov.innerHTML = `<button class="sc-x" aria-label="关闭">×</button><div class="dz-in"><small class="as-k">${en}</small><h2>${title}</h2><div class="g2-body"></div></div>`;
  document.body.appendChild(ov); requestAnimationFrame(() => ov.classList.add("on")); sfx.paper();
  ov.querySelector(".sc-x").onclick = () => { ov.classList.remove("on"); setTimeout(() => ov.remove(), 320); };
  return ov.querySelector(".g2-body");
}
const pick = (arr, rnd, n) => { const a = [...arr], out = []; while (a.length && out.length < n) out.push(a.splice(Math.floor(rnd() * a.length), 1)[0]); return out; };
const day = () => { const d = today(), ds = tripDays(); return !ds.length || ds.includes(d) ? d : d < ds[0] ? ds[0] : ds[ds.length - 1]; };

/* ---------------- 城市宾果 ---------------- */
const BINGO = ["看到一只猫", "吃到甜的东西", "听到当地话", "看到一座庙", "坐一次公交或地铁", "拍到一扇好看的门", "看到有人在喝茶", "买了一样零食", "遇到下雨或起风", "看到一棵很老的树", "找到一面涂鸦墙", "有人请你试吃", "看到婚纱照在拍", "走过一座桥", "看到老人在下棋", "吃到没吃过的东西", "看到一辆三轮车", "有人问你从哪来", "看到晾在外面的衣服", "听到有人在唱歌", "走进一条很窄的巷子", "看到日落或日出", "喝到一杯当地饮料", "看到一只狗在睡觉", "发现一家老字号", "看到红灯笼", "有人帮你们拍照", "看到小朋友在玩", "迷路了一下", "听到寺庙的钟或鼓"];
const BINGO_CITY = { "潮汕": ["喝一杯工夫茶", "吃到一颗牛肉丸", "看到嵌瓷屋顶", "看到一块粿印", "看到英歌舞的脸谱", "听到潮州话"], "厦门": ["看到三角梅", "吃到沙茶面", "看到骑楼", "听到闽南话", "看到鼓浪屿的渡轮"], "泉州": ["看到簪花围", "看到红砖古厝", "看到开元寺的塔"] };
export function openBingo() {
  const d = day(), city = api.trip ? cityOf(d) : "", key = `td-bingo:${tid()}:${me()}:${d}`;
  const pool = [...(BINGO_CITY[city] || (city && /潮|汕/.test(city) ? BINGO_CITY["潮汕"] : [])), ...BINGO], rnd = seeded(key);
  const cells = pick(pool, rnd, 9);
  let st = LS.get(key, { on: [], lines: 0 });
  const body = shell("城市宾果", "CITY BINGO · " + shortDate(d));
  const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
  const paint = pop => {
    const done = LINES.filter(l => l.every(i => st.on.includes(i)));
    body.innerHTML = `<p class="dz-hint">${esc(city || "今天")}的宾果卡，每个人的都不一样。<br>看到了就点一下，连成一条线就宾果！</p>
      <div class="bg9">${cells.map((c, i) => `<button class="bg9-c${st.on.includes(i) ? " on" : ""}${done.some(l => l.includes(i)) ? " line" : ""}${pop === i ? " pop" : ""}" data-i="${i}"><span>${esc(c)}</span></button>`).join("")}</div>
      <div class="dz-res${done.length ? " on" : ""}">${done.length ? `<small>${done.length} 条线</small><b>${done.length >= 8 ? "全满！" : "宾果！"}</b><p>${done.length >= 8 ? "今天被你看完了。" : "继续看，还能连更多条。"}</p>` : ""}</div>
      <p class="as-hint">${st.on.length} / 9 · 明天会换一张新卡</p>`;
    body.querySelectorAll("[data-i]").forEach(b => b.onclick = () => { const i = +b.dataset.i, had = st.on.includes(i); st.on = had ? st.on.filter(x => x !== i) : [...st.on, i]; sfx[had ? "tap" : "stamp"](); buzz(8);
      const n = LINES.filter(l => l.every(x => st.on.includes(x))).length; if (n > st.lines) { mus.harp(2, 7, .05); buzz([20, 40, 20, 40, 60]); log(`在城市宾果连成了 ${n} 条线（${city}）`); } st.lines = Math.max(st.lines, n); LS.set(key, st); paint(had ? null : i); });
  };
  paint();
}

/* ---------------- 秘密任务 ---------------- */
const SECRET = ["让{b}今天说出三次「好吃」", "偷偷帮{b}拍一张最好看的照片，晚上送给TA", "今天找机会夸{b}一句，要真心的", "悄悄帮{b}买一样TA多看了两眼的小东西", "让大家在不知情的情况下走进一家你选的店", "今天让{b}笑出声三次", "找一个时机跟{b}合照，还不能被发现是任务", "今天让全员都尝一口你点的东西", "让{b}替你做一个决定，还要TA觉得是自己想的", "今天偷偷记下{b}说过最好笑的一句话", "让大家在一个地方多停五分钟", "帮{b}拿一次东西，不说为什么", "今天不说一个「累」字", "让{b}教你一句当地话", "悄悄把一张好看的照片设成今天的合照封面"];
export function openSecret() {
  const d = day(), key = `td-secret:${tid()}:${me()}:${d}`, rnd = seeded(key), bs = (api.members || []).filter(m => m.id !== me());
  const buddy = bs.length ? bs[Math.floor(rnd() * bs.length)].name : "自己";
  const text = pick(SECRET, rnd, 1)[0].replace(/\{b\}/g, buddy);
  let st = LS.get(key, { seen: false, done: false, told: false });
  const night = new Date().getHours() >= 20;
  const body = shell("秘密任务", "SECRET MISSION · " + shortDate(d), "g2-dark");
  const paint = () => {
    body.innerHTML = `<p class="dz-hint">每天早上一人一个，只有你自己知道。<br>晚上 8 点以后揭晓，看谁偷偷完成了。</p>
      <div class="sm-env${st.seen ? " open" : ""}" role="button" tabindex="0"><div class="sm-flap"></div><div class="sm-card"><small>TOP SECRET · 今日任务</small><p>${st.seen ? esc(text) : "轻点拆开信封<br><span>别让旁边的人看到</span>"}</p></div><i class="sm-seal">密</i></div>
      ${st.seen ? `<div class="as-btns">${st.done ? `<p class="sm-ok">✓ 已经偷偷完成了</p>` : `<button class="btn ink full" data-act="done">我偷偷完成了</button>`}
        ${st.done && !st.told ? `<button class="btn full" data-act="tell"${night ? "" : " disabled"}>${night ? "揭晓给大家" : "晚上 8 点后才能揭晓"}</button>` : ""}${st.told ? `<p class="as-hint">已经揭晓，大家在动态里看得到。</p>` : ""}</div>` : ""}`;
    const env = body.querySelector(".sm-env"); env.onclick = () => { if (st.seen) return; st.seen = true; LS.set(key, st); sfx.tear(); buzz([10, 30, 10]); paint(); };
    const dn = body.querySelector("[data-act=done]"); if (dn) dn.onclick = () => { st.done = true; LS.set(key, st); sfx.stamp(); mus.harp(3, 5, .06); toast("嘘——晚上再揭晓"); paint(); };
    const tl = body.querySelector("[data-act=tell]"); if (tl) tl.onclick = () => { st.told = true; LS.set(key, st); log(`揭晓了今天的秘密任务：${text} ✓`); mus.harp(1, 8, .05); paint(); };
  };
  paint();
}

/* ---------------- 猜价格 ---------------- */
export function openGuess() {
  const ms = (api.members && api.members.length ? api.members : [{ id: "me", name: "你" }]);
  let item = "", guesses = {}, real = null;
  const body = shell("猜价格", "GUESS THE PRICE");
  const paint = () => {
    const res = real != null && ms.every(m => guesses[m.id] != null) ? ms.map(m => ({ m, g: +guesses[m.id], d: Math.abs(+guesses[m.id] - real) })).sort((a, b) => a.d - b.d) : null;
    body.innerHTML = `<p class="dz-hint">付钱之前，大家先猜一下多少钱。<br>手机传一圈，每人写一个数字，最后填真实价格。</p>
      <label class="lbl">猜的是什么<input class="inp" id="gpItem" maxlength="30" placeholder="比如：这一桌牛肉火锅" value="${esc(item)}"></label>
      <div class="gp-list">${ms.map(m => `<label class="gp-row"><b>${esc(m.name)}</b><input class="inp" type="number" inputmode="decimal" min="0" data-g="${m.id}" placeholder="猜多少" value="${guesses[m.id] ?? ""}"${res ? " disabled" : ""}></label>`).join("")}</div>
      <label class="lbl gp-real">真实价格<input class="inp" type="number" inputmode="decimal" min="0" id="gpReal" placeholder="账单上的数字" value="${real ?? ""}"${res ? " disabled" : ""}></label>
      ${res ? `<div class="dz-res on"><small>差 ${res[0].d.toFixed(res[0].d % 1 ? 1 : 0)}</small><b>${esc(res[0].m.name)}</b><p>猜得最准！${res.length > 1 ? `最离谱的是 ${esc(res[res.length - 1].m.name)}（猜了 ${res[res.length - 1].g}）` : ""}</p></div>
        <div class="gp-rank">${res.map((r, i) => `<span><i>${i + 1}</i>${esc(r.m.name)} · ${r.g}</span>`).join("")}</div>
        <div class="as-btns"><button class="btn ink full" data-act="book">记进账本</button><button class="btn full" data-act="again">再猜一样</button></div>`
      : `<div class="as-btns"><button class="btn ink full" data-act="go">揭晓</button></div>`}`;
    const it = body.querySelector("#gpItem"); it.oninput = () => { item = it.value; };
    body.querySelectorAll("[data-g]").forEach(i => i.oninput = () => { guesses[i.dataset.g] = i.value === "" ? null : i.value; });
    const rl = body.querySelector("#gpReal"); rl.oninput = () => { real = rl.value === "" ? null : +rl.value; };
    const go = body.querySelector("[data-act=go]"); if (go) go.onclick = () => { if (ms.some(m => guesses[m.id] == null || guesses[m.id] === "")) return toast("每个人都要猜一个数"); if (real == null || isNaN(real)) return toast("填上真实价格"); sfx.stamp(); mus.harp(2, 6, .05); buzz([20, 40, 20]); paint(); const r = ms.map(m => ({ n: m.name, d: Math.abs(+guesses[m.id] - real) })).sort((a, b) => a.d - b.d)[0]; log(`猜价格${item ? "「" + item + "」" : ""}：真实 ${real}，${r.n} 猜得最准`); };
    const bk = body.querySelector("[data-act=book]"); if (bk) bk.onclick = () => import("./budget.js").then(m => { document.querySelector(".dz .sc-x").click(); setTimeout(() => m.openAdd({ date: today(), note: item || "猜价格", amount: real }), 350); });
    const ag = body.querySelector("[data-act=again]"); if (ag) ag.onclick = () => { item = ""; guesses = {}; real = null; sfx.tap(); paint(); };
  };
  paint();
}
