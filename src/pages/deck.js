import { api, on, nameOf } from "../lib/api.js";
import { ic } from "../lib/icons.js";
import { $, esc, today, yesterday, tomorrow, shortDate, weekday, toMin, fmtMin, hm, wait, buzz, REDUCE, whenTxt } from "../lib/util.js";
import { openSheet, setSheet, closeSheet, toast, bind, lockSheet } from "../lib/ui.js";
import { sfx } from "../lib/sound.js";
import { SKILLS, CARD, ALL_CARDS, isMinor } from "../data/skills.js";
import { notifyAll } from "../lib/notify.js";
import { characterSVG, CARD_BACK, emblemSVG } from "../data/characters.js";
import { acts, dayActs, usable, tripDays, openAdd, getSelDate } from "./trip.js";
import { openSpecial } from "./checkin.js";
import { startRewrite, goCoin } from "./coin.js";

let date = today(), mine = null, table = [], effects = [], logs = [], loading = true, busy = false;
const FRAME = `<svg class="tc-frame" viewBox="0 0 100 148" aria-hidden="true"><g fill="none" stroke="var(--gold)">
  <rect x="3.5" y="3.5" width="93" height="141" rx="4" stroke-width=".6"/><rect x="6" y="6" width="88" height="136" rx="2.6" stroke-width=".3"/>
  <path d="M6 16h4a6 6 0 0 0 6-6V6M94 16h-4a6 6 0 0 1-6-6V6M6 132h4a6 6 0 0 1 6 6v4M94 132h-4a6 6 0 0 0-6 6v4" stroke-width=".4"/>
  <path d="M50 3.5l2 2.5-2 2.5-2-2.5zM50 139.5l2 2.5-2 2.5-2-2.5z" fill="var(--gold)" stroke="none"/></g></svg>`;
export function cardHTML(k, o = {}) {
  const s = CARD[k], st = o.state || "";
  return `<div class="tc ${o.cls || ""} ${st ? "st-" + st : ""}${o.down ? " down" : ""}" style="--gold:${s.accent};--bgc:${s.bg};--bgc2:${s.bg2}" data-card="${k}">
    <div class="tc-in">
      <div class="tc-face tc-front">${FRAME}
        <div class="tc-c tl">${isMinor(k) ? s.numeral : k}${isMinor(k) ? `<i>${s.name}</i>` : ""}</div><div class="tc-c br">${isMinor(k) ? s.numeral : k}</div>
        <div class="tc-art char">${isMinor(k) ? emblemSVG(k) : characterSVG(k)}<div class="tc-burst"></div></div>
        <div class="tc-plate"><div class="tc-myth">${s.myth}</div><div class="tc-name">${s.name}</div><div class="tc-en">${s.en}</div></div>
        <div class="tc-mark">已发动</div><div class="foil"></div>
      </div>
      <div class="tc-face tc-back">${CARD_BACK}</div>
    </div></div>`;
}
const backHTML = (i, extra = "") => `<div class="ocard" style="--i:${i}${extra}">${CARD_BACK}</div>`;

async function refreshBelow() {
  try { [table, effects, logs] = await Promise.all([api.deckTable(date), api.effects(), api.log()]); } catch (e) { return; }
  const root = $("deckRoot"); if (!root) return; const keepAct = $("dkAct") && $("dkAct").innerHTML;
  render(); if (keepAct && $("dkAct")) { $("dkAct").innerHTML = keepAct; wire(root); }
}
export async function refresh() {
  date = today();
  try { [mine, table, effects, logs] = await Promise.all([api.myDraw(date), api.deckTable(date), api.effects(), api.log()]); } catch (e) { console.warn(e); }
  loading = false; render();
}
let rt = null; const soon = () => { clearTimeout(rt); rt = setTimeout(() => { if ($("pg-deck").classList.contains("on") && !busy) refresh(); }, 350); };
on("skill_log", soon); on("skill_effects", soon); on("trip_members", soon);
export async function onShowDeck() { await api.settleDay(yesterday()); refresh(); }
const stateOf = d => !d ? "" : d.status === "activated" ? "done" : "mine";
const dayNo = () => { const i = tripDays().indexOf(date); return i >= 0 ? `DAY ${i + 1} · ` : ""; };

function render() {
  const root = $("deckRoot"); if (!root) return;
  const left = ALL_CARDS.length - table.length;
  let h = `<div class="sk-top"><button class="icon-btn" data-back aria-label="返回">${ic("arrow-left")} 返回</button><button class="icon-btn snd" aria-label="音效">🔊</button></div>
    <div class="dk-title"><small>SKILL ACTIVATION · ${dayNo()}${shortDate(date)} ${weekday(date)}</small><h2>The Trip Deck</h2><p>神话里的守护者们，今天只会有一位来找你。</p></div>
    <div class="dk-stage" id="dkStage">`;
  if (loading) h += `<div class="oracle loading"><div class="odeck">${[0, 1, 2].map(i => backHTML(i)).join("")}</div></div><p class="o-hint">正在洗牌…</p>`;
  else if (!mine) {
    h += left > 0 ? `<div class="oracle" id="oracle" role="button" tabindex="0" aria-label="按住牌堆抽牌">
        <svg class="astro" viewBox="0 0 200 200" aria-hidden="true"><circle cx="100" cy="100" r="96"/><circle cx="100" cy="100" r="86" stroke-dasharray="1 5"/>${Array.from({ length: 24 }, (_, i) => `<path d="M100 4v${i % 2 ? 6 : 12}" transform="rotate(${i * 15} 100 100)"/>`).join("")}${["月", "日", "缘", "航", "轮", "梦"].map((t, i) => `<text x="100" y="27" transform="rotate(${i * 60} 100 100)" text-anchor="middle">${t}</text>`).join("")}</svg>
        <svg class="oring" viewBox="0 0 200 200"><circle cx="100" cy="100" r="90" class="bg"/><circle cx="100" cy="100" r="90" class="fg" id="oringFg"/></svg>
        <div class="odeck">${Array.from({ length: Math.min(left, 7) }, (_, i) => backHTML(i)).join("")}</div>
      </div><p class="o-hint" id="oHint">按住牌堆不放，等圆圈转满（约两秒），心里想着今天的旅程……</p><p class="o-left">牌堆里还剩 ${left} 张</p>`
      : `<p class="empty">今天的牌都被请走了，明天再来。</p>`;
  } else h += `<div class="my-card" id="myCard">${cardHTML(mine.card, { state: stateOf(mine), cls: "hero powered" })}</div><p class="o-hint"><b>${CARD[mine.card].myth}</b><span class="en-only">　${CARD[mine.card].mythEn}</span></p>`;
  h += `</div><div id="dkAct">${mine && !loading ? actionsHTML() : ""}</div>`;
  const tFx = effects.filter(e => e.target_date === date && e.card !== "X"), mFx = effects.filter(e => e.target_date === tomorrow() && e.card !== "X");
  if (tFx.length) h += `<div class="sk-sec-h">TODAY'S EFFECTS <b>今天生效的失控</b></div>` + tFx.map(e => fxHTML(e)).join("");
  if (mFx.length) h += `<div class="sk-sec-h">TOMORROW <b>明天</b></div>` + mFx.map(e => fxHTML(e, true)).join("");
  h += `<div class="sk-sec-h">THE TABLE <b>今天的牌桌</b></div><div class="seats">${api.members.map(m => { const r = table.find(t => t.user_id === m.id);
      const inner = !r ? `<div class="seat-empty">还没抽</div>` : r.card ? cardHTML(r.card, { cls: "mini", state: r.status === "activated" ? "done" : "" }) : `<div class="tc mini down"><div class="tc-in"><div class="tc-face tc-back">${CARD_BACK}</div></div></div>`;
      return `<div class="seat"${r && r.card ? ` data-show="${r.card}" data-who="${esc(m.name)}" data-txt="${esc((r.activation && r.activation.text) || "")}"` : ""}>${inner}<b>${esc(m.name)}${m.id === api.me.id ? "（你）" : ""}</b><small>${!r ? "" : r.status === "activated" ? "✓ 已发动" : r.card ? "未发动" : "已抽 · 未揭晓"}</small></div>`; }).join("")}</div>`;
  h += `<div class="sk-sec-h">SKILL LOG <b>技能日志</b></div><div class="log">${logs.length ? logs.slice(0, 40).map(l => `<div class="log-row"><time>${hm(l.created_at)}</time><div><b>${l.card && CARD[l.card] ? `${l.card} · ${CARD[l.card].name}` : l.action === "DICE" ? "旅途骰子" : l.action === "PLAY" ? "小游戏" : "牌堆"}</b>　${({ DRAWN: "抽了一张牌", ACTIVATED: "发动", EFFECT: "⚠ 执行失控", DICE: "🎲 掷骰子", PLAY: "✦ 玩了一局" })[l.action] || esc(l.action)}<br><span>${esc(nameOf(l.user_id))}</span>${l.effect && l.action !== "DRAWN" ? `<p>${esc(l.effect)}</p>` : ""}<small>${l.date !== today() ? shortDate(l.date) : ""}</small></div></div>`).join("") : `<div class="log-empty">还没有人抽牌。第一张会是谁？</div>`}</div>`;
  root.innerHTML = h; wire(root);
}
function actionsHTML() {
  const s = CARD[mine.card], a = mine.activation || {};
  if (mine.status === "activated") { const left = a.until ? Math.max(0, Math.ceil((a.until - Date.now()) / 60000)) : 0; return `<div class="dk-note done"><b>✓ 已发动 · ${hm(mine.activated_at)}</b><p>${esc(a.text || "")}${mine.copied ? `（镜界复制了 ${mine.copied} · ${CARD[mine.copied].name}）` : ""}</p>${left ? `<p class="timer-line">⏳ 还剩 ${left} 分钟</p>` : ""}</div>`; }
  return `<div class="dk-note"><b>${s.key} · ${s.name}</b><p>${s.effect}</p><p class="warn-line">${ic("warning")} 今天不发动，明天会失控：${s.ooc}</p></div>
    <div class="dk-btns"><button class="btn accent full" style="--a:${s.bg2}" data-act="activate">发动技能 · ACTIVATE</button></div>`;
}
/* 失控: what each guardian says when their card was drawn and never used */
export const OOC_LINE = {
  K: "月镜没被照亮。嫦娥把昨天最后一道光，留到了今天。", Q: "羲和的马车晚出发了——今天的太阳，会晚半小时升起。", J: "红线松了。今天的第一个决定，会被悄悄系反。",
  "10": "妈祖的灯没人接，今天她自己挑一个人掌舵。", "9": "风火轮没转起来，今天它要硬拉你们多去一个地方。", "8": "蝴蝶飞走了。梦里多出来的一站，今天要醒过来划掉。",
  "7": "箭没射出去。今天，会有一个太阳自己掉下来。", "6": "雷公的鼓还没停，雨要一直下到中午。", "5": "雪女在门外等了一夜，今天整天都在飘雪。", "4": "土地公记下了。今天他盖的章，只有灰色——今天打卡拿到的每一枚章和邮票，都会是灰的。"
};
export const oocLine = k => OOC_LINE[k] || (CARD[k] ? `「${CARD[k].name}」昨天没有做，守护者今天来讨了。` : "昨天的牌没有发动。");
/* the text was written the day before ("明天…"); on the day itself it reads as 今天 */
export const oocText = (e, future) => { const t = (CARD[e.card] && CARD[e.card].ooc) || e.description || ""; return future ? t : t.replace(/明天/g, "今天"); };
const FX_BTN = { "8": "选要删掉的地点", "9": "加一个计划外地点", "7": "让后羿射一箭", Q: "全部推迟 30 分钟", "10": "知道了" };
export function fxAction(e) { if (e.card === "K") return /自动生效：(\w+)/.test(e.detail || "") ? ["K", "执行复制的技能"] : ["ok", "知道了"]; if (isMinor(e.card)) return ["redo", "今天补做"]; if (FX_BTN[e.card]) return [e.card === "10" ? "ok" : e.card, FX_BTN[e.card]]; return ["ok", e.card === "6" || e.card === "5" ? "知道了，天气变了" : "知道了"]; }
const CRACK = `<svg class="fx2-crack" viewBox="0 0 100 148" aria-hidden="true"><path d="M58 0L50 34L62 52L44 80L56 104L46 148M50 34L30 44M62 52L84 60M44 80L20 92M56 104L78 120" fill="none" stroke="#fff" stroke-width="1.1" stroke-linejoin="bevel"/></svg>`;
function fxHTML(e, future) {
  const s = CARD[e.card] || {}, [fk, label] = fxAction(e), act = !future && !e.resolved ? `<button class="btn sm ${fk === "ok" ? "" : "ink"}" data-fx="${e.id}" data-fk="${fk}">${label}</button>${fk !== "ok" ? `<button class="linkbtn" data-fxshow="${e.id}">重看失控</button>` : `<button class="linkbtn" data-fxshow="${e.id}">重看失控</button>`}` : "";
  return `<div class="fx2${e.resolved ? " resolved" : ""}${future ? " future" : ""}"><div class="fx2-card">${CARD[e.card] ? cardHTML(e.card, { cls: "mini" }) : ""}${CRACK}<i class="fx2-seal">${e.resolved ? "已平息" : "失控"}</i></div>
    <div class="fx2-body"><small>${esc(s.myth || "")}${future ? " · 明天" : e.resolved ? " · 已处理" : " · 昨天没发动"}</small><b>${esc(e.card)} · ${esc(s.name || "")}</b><em>${esc(oocLine(e.card))}</em><p>${esc(oocText(e, future))}${e.detail ? "<br><strong>" + esc(e.detail) + "</strong>" : ""}</p>${act ? `<div class="fx-act">${act}</div>` : ""}</div></div>`;
}
function wire(root) {
  const o = $("oracle"); if (o) holdToDraw(o);
  root.querySelectorAll(".seat[data-show]").forEach(sd => sd.onclick = () => { const k = sd.dataset.show, c = CARD[k]; if (!c) return; sfx.flip();
    openSheet(`<div class="as show-card"><small class="as-k">${esc(sd.dataset.who)} · ${sd.dataset.txt ? "已发动" : "还没发动"}</small><div class="show-big">${cardHTML(k, { cls: "hero" })}</div><h3>${k} · ${c.name}</h3><p class="show-myth">${c.myth}</p><p>${c.effect}</p>${sd.dataset.txt ? `<p class="show-txt">${esc(sd.dataset.txt)}</p>` : ""}<p class="as-hint">失控：${c.ooc}</p><div class="as-btns"><button class="btn full" data-act="close">好</button></div></div>`);
    bind(document.querySelector(".usheet"), { close: () => closeSheet() }); });
  import("../lib/atmos.js").then(async A => { const a = await A.todaysAtmos(); const top = root.querySelector(".dk-title, .tp-top, .ph"); if (a && top && !root.querySelector(".atm-card")) top.insertAdjacentHTML("afterend", `<div class="atm-card"><small>今日氛围牌 · 自动出现，人人都有</small><b>${A.ATMOS[a].name}</b><span>${A.ATMOS[a].hint}</span></div>`); });
  const mc = $("myCard"); if (mc) { const c = mc.querySelector(".tc"); mc.onclick = () => { c.classList.remove("poke"); void c.offsetWidth; c.classList.add("poke"); sfx.tap(); buzz(6); }; tilt(mc, c); }
  root.querySelectorAll("[data-fx]").forEach(b => b.onclick = () => handleFx(effects.find(e => e.id === b.dataset.fx), b.dataset.fk));
  root.querySelectorAll("[data-fxshow]").forEach(b => b.onclick = () => import("../lib/ooc.js").then(m => m.ceremony(effects.find(e => e.id === b.dataset.fxshow))));
  bind(root, { activate: () => startActivate(mine.card) });
}
function tilt(wrap, card) {
  if (REDUCE) return;
  wrap.onpointermove = e => { const r = wrap.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5; card.style.transform = `rotateY(${x * 18}deg) rotateX(${-y * 14}deg)`; card.style.setProperty("--fx", (50 + x * 90) + "%"); card.style.setProperty("--fy", (50 + y * 90) + "%"); };
  wrap.onpointerleave = () => { card.style.transform = ""; };
}
function holdToDraw(el) {
  const fg = $("oringFg"), C = 2 * Math.PI * 90; fg.style.strokeDasharray = C; fg.style.strokeDashoffset = C;
  let t0 = 0, raf = 0, holding = false, lastTick = 0; const DUR = 1700;
  const step = ts => { if (!holding) return; const p = Math.min(1, (ts - t0) / DUR); fg.style.strokeDashoffset = C * (1 - p); el.style.setProperty("--p", p);
    if (ts - lastTick > 110) { lastTick = ts; sfx.charge(p); buzz(4); }
    if (p >= 1) { holding = false; el.classList.remove("charging"); doDraw(el); return; } raf = requestAnimationFrame(step); };
  const start = e => { if (busy) return; e.preventDefault(); holding = true; t0 = performance.now(); el.classList.add("charging"); $("oHint").textContent = "别松手……星图在转动"; sfx.shuffle(); raf = requestAnimationFrame(step); };
  const stop = () => { if (!holding) return; holding = false; cancelAnimationFrame(raf); el.classList.remove("charging"); el.style.setProperty("--p", 0); fg.style.transition = "stroke-dashoffset .4s"; fg.style.strokeDashoffset = C; setTimeout(() => fg.style.transition = "", 400); $("oHint").textContent = "再专注一点，按住不放"; };
  el.addEventListener("pointerdown", start); ["pointerup", "pointerleave", "pointercancel"].forEach(ev => el.addEventListener(ev, stop));
  el.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); doDraw(el); } });
}
async function doDraw(el) {
  if (busy) return; busy = true;
  el.classList.add("shuffling"); sfx.shuffle(); setTimeout(() => sfx.shuffle(), 380);
  let r = null, err = null;
  try { [r] = await Promise.all([api.drawCard(date), wait(REDUCE ? 100 : 1100)]); } catch (e) { err = e; await wait(600); }
  if (err) { busy = false; el.classList.remove("shuffling"); const m = String(err.message || ""); toast(m.includes("DECK_EMPTY") ? "今天的牌已经被抽完了" : m.includes("NOT_MEMBER") ? "你还不在这趟旅程里" : "暂时抽不了牌，请再试一次"); refresh(); return; }
  mine = r; const stage = $("dkStage"), s = CARD[r.card];
  stage.innerHTML = `<div class="my-card rising" id="myCard">${cardHTML(r.card, { state: "mine", cls: "hero flipping", down: true })}</div><p class="o-hint" id="oHint">&nbsp;</p>`;
  const c = stage.querySelector(".tc");
  await wait(REDUCE ? 0 : 450); sfx.flip(); c.classList.remove("down");
  await wait(REDUCE ? 0 : 420); c.classList.add("transforming"); sfx.transform(); buzz([20, 40, 30, 40, 60]);
  await wait(REDUCE ? 0 : 2300); c.classList.remove("transforming", "flipping"); c.classList.add("powered"); sfx.reveal();
  $("oHint").innerHTML = `<b>${s.myth}</b> 降临 —— 你抽到了 <b>${s.key} · ${s.name}</b>`;
  busy = false; $("dkAct").innerHTML = actionsHTML(); wire($("deckRoot"));
  /* the table and the log below were skipped while the card was being revealed: bring them up to date */
  setTimeout(() => { if (!busy) refreshBelow(); }, 400);
  setTimeout(refresh, 2200);
}

/* ---------- activation engine ---------- */
/* the day skills act on: today during the trip; before/after it (e.g. trying things out at home) the day open in 行程 */
const T = () => { const d = today(), days = tripDays(); if (!days.length || days.includes(d)) return d; const s = getSelDate && getSelDate(); return s && days.includes(s) ? s : (d < days[0] ? days[0] : days[days.length - 1]); };
const dayWord = () => T() === today() ? "今天" : `${shortDate(T())}（行程页选中的那天）`;
function heroFx(cls) { const c = document.querySelector("#myCard .tc"); if (!c) return; c.classList.remove(cls); void c.offsetWidth; c.classList.add(cls); setTimeout(() => c.classList.remove(cls), 1300); }
function optList(items, pick) { return `<div class="opts" role="radiogroup">${items.map(it => `<button class="opt${pick === it.id ? " on" : ""}" data-pick="${esc(it.id)}" role="radio" aria-checked="${pick === it.id}"${it.disabled ? " disabled" : ""}>${it.lead ? `<span class="k">${esc(it.lead)}</span>` : ""}<span>${esc(it.label)}${it.sub ? `<small>${esc(it.sub)}</small>` : ""}</span></button>`).join("")}</div>`; }
const row = (ok, dis) => `<div class="as-btns"><div class="row"><button class="btn" data-act="cancel">取消</button><button class="btn accent" data-act="confirm"${dis ? " disabled" : ""}>${ok}</button></div></div>`;
const emptyBox = (msg, btn) => `<p class="empty">${msg}</p><div class="as-btns">${btn ? `<button class="btn ink full" data-act="${btn[0]}">${btn[1]}</button>` : ""}<button class="btn full" data-act="cancel">返回</button></div>`;
function sheetHead(k, sub) { const s = CARD[k]; return `<div class="skd"><div class="skd-top"><b style="color:${s.accent}">${k}</b><span>${s.en} · ${s.myth}</span></div><h3>${s.name}</h3>${sub ? `<p class="as-hint" style="margin-top:0">${sub}</p>` : ""}`; }

/* mode: "card" (your own drawn card) | "effect" (auto effect from K 失控) */
function startActivate(k, opt = {}) {
  const s = CARD[k], mode = opt.mode || "card", srcKey = opt.src || k;
  sfx.click();
  openSheet("", { accent: s.accent, focus: false });
  let v = { pick: null, text: "" };
  const done = async (activation, logText, bodyHTML) => {
    lockSheet(true); setSheet(`${sheetHead(k)}<div class="spinner"></div><p class="empty">正在发动…</p></div>`);
    try {
      if (mode === "card") { await api.activateCard(mine.id, { ...activation, as: k }, (srcKey === "K" || srcKey === "X") && k !== srcKey ? k : null); }
      await api.addLog(T(), mode === "card" ? mine.card : k, mode === "card" ? "ACTIVATED" : "EFFECT", (srcKey === "K" && k !== "K" ? `（镜像 ${k} · ${s.name}）` : "") + logText, { as: k });
      if (opt.onDone) await opt.onDone();
    } catch (e) { lockSheet(false); setSheet(`${sheetHead(k)}<div class="fx"><p>${String(e.message).includes("ALREADY") ? "这张牌已经发动过了。" : "暂时没能发动，请再试一次。"}</p></div>${row("重试")}</div>`); bind(document.querySelector(".usheet"), { cancel: closeSheet, confirm: () => done(activation, logText, bodyHTML) }); return; }
    lockSheet(false); sfx.activate(); buzz([10, 30, 10]); heroFx("casting");
    if (mode === "card" && (k === "J" || k === "8")) setTimeout(() => import("../lib/motion.js").then(m => m.playMotion(k === "J" ? "needle" : "dream", { text: "月老 · 红线已系上\n" + (activation.text || "") })), 900);
    if (mode === "card") notifyAll({ kind: "skill", card: k, title: `你发动了 ${isMinor(k) ? s.full + " · " + s.numeral : k} · ${s.name}`, body: activation.text || s.effect });
    setSheet(`${sheetHead(k)}<div class="skd-result"><div class="ok">✓ ACTIVATED</div><p class="skd-big">${esc(s.name)}</p></div>${bodyHTML || ""}<p class="as-hint" style="text-align:center">${whenTxt(Date.now())}</p><div class="as-btns"><button class="btn ink full" data-act="close">完成 · DONE</button></div></div>`);
    bind(document.querySelector(".usheet"), { close: () => { closeSheet(); refresh(); } });
    if (opt.after) opt.after();
  };
  const paint = (body, extra = {}) => { setSheet(body); const sh = document.querySelector(".usheet"); sh.querySelectorAll("[data-pick]").forEach(b => b.onclick = () => { v.pick = b.dataset.pick; sfx.tap(); flows[k](); }); const inp = sh.querySelector("[data-inp]"); if (inp) inp.oninput = () => { v.text = inp.value; const ok = sh.querySelector('[data-act="confirm"]'); if (ok) ok.disabled = !inp.value.trim(); }; bind(sh, { cancel: closeSheet, confirm: () => extra.apply && extra.apply(), addToday: () => { closeSheet(); openAdd({ date: T() }); }, ...extra }); };
  const todays = () => dayActs(T()).filter(usable);
  const intro = `<div class="skd-sec"><small>ACTIVATE THIS SKILL? · 确认发动</small><p><b>${s.name}</b>　${s.effect}${srcKey === "K" && k !== "K" ? "<br><span class='as-hint'>由 K · 镜界 复制发动</span>" : ""}</p></div>`;
  if (isMinor(k)) {
    let who = null;
    const minor = () => { const ms = api.members.filter(x => x.id !== api.me.id || k === "S3");
      paint(`${sheetHead(k, s.full)}<div class="skd-sec"><small>SKILL · ${s.en}</small><p>${esc(s.effect)}</p>${s.minutes ? `<p class="as-hint">发动后开始计时 ${s.minutes} 分钟，旅伴们都会看到倒计时。</p>` : ""}</div>
        ${s.kind === "target" ? `<div class="skd-sec"><small>指定一位旅伴</small></div>${ms.length ? optList(ms.map(x => ({ id: x.id, label: x.name })), who) : `<p class="as-hint">这趟旅行只有你一个人，就指定自己吧。</p>`}` : ""}
        ${row("发动 · ACTIVATE", s.kind === "target" && ms.length > 0 && !who)}</div>`, { apply: () => { const n = who ? nameOf(who) : null, until = s.minutes ? Date.now() + s.minutes * 60000 : null;
          done({ member: who, until, text: (n ? `${n}：` : "") + s.effect }, (n ? n + " · " : "") + s.name, `<p style="text-align:center">${esc(s.effect)}${n ? `<br><b>${esc(n)}</b>` : ""}${until ? `<br>⏳ ${s.minutes} 分钟` : ""}</p>`); } });
      document.querySelectorAll(".usheet [data-pick]").forEach(b => b.onclick = () => { who = b.dataset.pick; sfx.tap(); minor(); }); };
    minor(); return;
  }
  const flows = {
    "7"() {
      const st = dayActs(T()).filter(x => x.status !== "removed" && x.status !== "skipped" && !x.is_main && !["transit", "lodging", "flight"].includes(x.kind));
      const locked = dayActs(T()).filter(x => x.status !== "removed" && x.status !== "skipped" && (x.is_main || ["lodging", "flight"].includes(x.kind)));
      if (!st.length) return paint(`${sheetHead("7")}${intro}${emptyBox(`${dayWord()}没有可以射掉的行程。${locked.length ? `<br>${locked.map(x => "「" + esc(x.title) + "」").join("")}是主要行程 / 住宿，射不掉——在行程里点它，取消「主要行程」就可以。` : "<br>先在行程里加一个地点吧。"}`, ["addToday", "加一个地点"])}</div>`);
      paint(`${sheetHead("7")}${intro}<div class="skd-sec"><small>SHOOT THE SUN · ${esc(dayWord())}</small><p>选一项，它就没了。全队会收到通知。</p></div>${optList(st.map(x => ({ id: x.id, lead: x.time, label: x.title })), v.pick)}${row("射掉这一项", !v.pick)}</div>`, { apply: async () => {
        const a = st.find(x => x.id === v.pick); try { await api.updateActivity(a.id, { status: "removed" }); } catch (e) { toast("没能射掉，请检查网络再试一次"); return; }
        done({ activity: a.id, text: `射掉了「${a.title}」` }, `射掉「${a.title}」`, `<p style="text-align:center">「${esc(a.title)}」今天不去了。</p>`); } });
    },
    "6"() {
      paint(`${sheetHead("6")}${intro}<div class="skd-sec"><small>CALL THE RAIN</small><p>不改任何行程。今天整个房间的 App 会下雨，日历卡变成雨天，大家的手机会打一声雷。</p></div>${row("催雨")}</div>`, { apply: () => {
        done({ atmos: "rain", text: "今天全房间下雨" }, "催雨", `<p style="text-align:center">雨来了。</p>`); setTimeout(() => import("../lib/atmos.js").then(m => m.refresh()), 400); } });
    },
    "5"() {
      paint(`${sheetHead("5")}${intro}<div class="skd-sec"><small>CALL THE SNOW</small><p>不改任何行程。今天整个房间的 App 会下雪，日历卡变成雪天，大家的手机会轻轻震一下。</p></div>${row("落雪")}</div>`, { apply: () => {
        done({ atmos: "snow", text: "今天全房间下雪" }, "落雪", `<p style="text-align:center">雪落下来了。</p>`); setTimeout(() => import("../lib/atmos.js").then(m => m.refresh()), 400); } });
    },
    "4"() {
      paint(`${sheetHead("4")}${intro}<div class="skd-sec"><small>BORROW THE ROAD</small><p>发动后，今天任何一次打卡面板里会多一个「土地公担保」按钮：不用拍照、不用旅伴确认，直接盖章。只能用一次。</p></div>${row("请土地公担保")}</div>`, { apply: () => {
        done({ token: 1, text: "今天一次免拍照盖章" }, "借路", `<p style="text-align:center">土地公点了点头。去打卡吧。</p>`); } });
    },
    X() {
      paint(`${sheetHead("X")}${intro}<div class="skd-sec"><small>THE WANDERER</small><p>无常会从昨天房间里抽到的牌里随机选一张，用它的效果。</p></div>${row("看命")}</div>`, { apply: async () => {
        let y = []; try { const d = new Date(T() + "T12:00:00"); d.setDate(d.getDate() - 1); y = (await api.deckTable(d.toISOString().slice(0, 10))).map(x => x.card).filter(c => c && c !== "X" && CARD[c]); } catch (e) {}
        if (!y.length) return done({ copied: null, text: "昨天没有牌，今天是空牌" }, "无常 · 空牌", `<p style="text-align:center">昨天没人抽牌，无常两手空空。</p>`);
        const k2 = y[Math.floor(Math.random() * y.length)]; closeSheet(); setTimeout(() => startActivate(k2, { mode: "card", src: "X" }), 350); } });
    },
    K() { paint(`${sheetHead("K", "选一张技能复制，马上用它的效果（只能复制 1 次）。")}${optList(SKILLS.filter(x => x.key !== "K").map(x => ({ id: x.key, lead: x.key, label: x.name, sub: x.effect })), v.pick)}${row("复制这张", !v.pick)}</div>`, { apply: () => { sfx.mirror(); heroFx("mirroring"); closeSheet(); setTimeout(() => startActivate(v.pick, { src: "K" }), 380); } }); },
    Q() {
      const st = todays();
      if (!st.length) return paint(`${sheetHead("Q")}${intro}${emptyBox(`${dayWord()}没有可以用技能的行程。<br>（主要行程、交通和住宿不能用技能）`, ["addToday", "加一个地点"])}</div>`);
      let prev = "";
      if (v.pick) { const p = st.find(x => x.id === v.pick), later = dayActs(T()).filter(x => x.status !== "removed" && x.status !== "skipped" && toMin(x.time) > toMin(p.time));
        prev = `<div class="skd-sec"><small>CHANGES · 会发生的变化</small><ul class="chg"><li><span>${esc(p.title)}</span><span>+1 hour</span></li>${later.map(x => `<li><span>${esc(x.title)}${x.is_main ? " 🔒" : ""}</span><span><s>${x.time}</s> → ${fmtMin(toMin(x.time) + 60)}</span></li>`).join("") || `<li><span>之后没有别的安排</span></li>`}</ul></div>`; }
      paint(`${sheetHead("Q")}${intro}<div class="skd-sec"><small>TIME PAUSE</small><p>选择要多停留的行程</p></div>${optList(st.map(x => ({ id: x.id, lead: x.time, label: x.title })), v.pick)}${prev}${row("确认 +1 小时", !v.pick)}</div>`, { apply: async () => {
        const p = st.find(x => x.id === v.pick), later = dayActs(T()).filter(x => x.status !== "removed" && x.status !== "skipped" && toMin(x.time) > toMin(p.time));
        await Promise.all([api.updateActivity(p.id, { extra_min: (p.extra_min || 0) + 60 }), ...later.map(x => api.updateActivity(x.id, { was_time: x.was_time || x.time, time: fmtMin(toMin(x.time) + 60) }))]);
        done({ stop: p.id, text: `在「${p.title}」多停留 1 小时` }, `${p.title} +1 hour`, `<ul class="chg"><li><span>${esc(p.title)}</span><span>多停留 1 小时</span></li>${later.map(x => `<li><span>${esc(x.title)}</span><span><s>${x.time}</s> → ${fmtMin(toMin(x.time) + 60)}</span></li>`).join("")}</ul>`);
      } });
    },
    async J() {
      if (!v.ds) { v.ds = (await api.decisions()).filter(d => d.date === T()).slice(0, 6); }
      const st = todays();
      if (!v.ds.length && !st.length) return paint(`${sheetHead("J")}${intro}${emptyBox("今天还没有可以重新决定的事。<br>先用硬币做个决定，或者加一个地点。", ["goCoin", "去抛硬币"])}</div>`, { goCoin: () => { closeSheet(); goCoin(); } });
      let extra = "", need = false;
      if (v.pick && v.pick.startsWith("s:")) { const p = st.find(x => "s:" + x.id === v.pick); extra = `<div class="skd-sec"><small>REWRITE · 改成</small><p>把「${esc(p.title)}」换成：</p><input class="inp" data-inp maxlength="30" placeholder="新的去处" value="${esc(v.text)}"></div>`; need = true; }
      else if (v.pick) { const d = v.ds.find(x => "d:" + x.id === v.pick); extra = `<div class="skd-sec"><p>去硬币页重新抛一次「${esc(d.question)}」。</p></div>`; }
      paint(`${sheetHead("J")}${intro}<div class="skd-sec"><small>FATE REWRITE</small><p>你想重新决定哪一件事？</p></div>${v.ds.length ? `<small class="as-k">今天的硬币决定</small>` + optList(v.ds.map(d => ({ id: "d:" + d.id, lead: d.result === "heads" ? "正" : "反", label: d.question }))) : ""}${st.length ? `<small class="as-k">今天的行程</small>` + optList(st.map(x => ({ id: "s:" + x.id, lead: x.time, label: x.title })), v.pick) : ""}${extra}${row("确认改写", !v.pick || (need && !v.text.trim()))}</div>`, { apply: async () => {
        if (v.pick.startsWith("d:")) { const d = v.ds.find(x => "d:" + x.id === v.pick); await done({ decision: d.id, text: `重新决定「${d.question}」` }, `重新决定「${d.question}」`, `<p style="text-align:center">去硬币页重新抛一次吧。</p>`); setTimeout(() => { closeSheet(); startRewrite(d); }, 900); }
        else { const id = v.pick.slice(2), p = st.find(x => x.id === id), nw = v.text.trim(); await api.updateActivity(id, { title: nw, was_title: p.was_title || p.title }); done({ stop: id, text: `「${p.title}」改成「${nw}」` }, `${p.title} → ${nw}`, `<ul class="chg"><li><span>${p.time}</span><span><s>${esc(p.title)}</s> → ${esc(nw)}</span></li></ul>`); }
      } });
    },
    "10"() {
      const ms = api.members;
      if (ms.length < 1) return paint(`${sheetHead("10")}${intro}${emptyBox("还没有旅伴。")}</div>`);
      paint(`${sheetHead("10")}${intro}<div class="skd-sec"><small>MAIN CHARACTER AURA</small><p>谁来拥有主角光环？</p></div>${optList(ms.map(m => ({ id: m.id, label: m.name })), v.pick)}${row("就是TA了", !v.pick)}</div>`, { apply: () => { const n = nameOf(v.pick); const until = Date.now() + 30 * 60000; done({ member: v.pick, until, text: `${n} 接下来 30 分钟负责带大家逛` }, `${n} 带大家逛 30 分钟`, `<p style="text-align:center">主角光环 ✦ <b>${esc(n)}</b><br>接下来 30 分钟负责带大家逛</p>`); } });
    },
    "9"() {
      const st = dayActs(T()).filter(x => x.status !== "removed" && x.status !== "skipped" && !["transit"].includes(x.kind)), d = new Date(), nm = d.getHours() * 60 + d.getMinutes();
      let ci = -1; st.forEach((x, i) => { if (toMin(x.time) <= nm) ci = i; }); if (ci < 0) ci = 0;
      const cur = st[ci], nxt = st[ci + 1];
      if (!cur || !nxt) return paint(`${sheetHead("9")}${intro}${emptyBox(st.length ? "今天已经在最后一站了，没有下一站可以传送。" : "今天还没有行程。", ["addToday", "加一个地点"])}</div>`);
      if (!usable(cur)) return paint(`${sheetHead("9")}${intro}<div class="portal"><small>CURRENT · 当前</small><b>${esc(cur.title)} 🔒</b></div>${emptyBox("当前这一站是主要行程，不能被传送门跳过。")}</div>`);
      paint(`${sheetHead("9")}${intro}<div class="portal"><small>CURRENT · 当前</small><b>${cur.time} ${esc(cur.title)}</b><i>↓</i><small>NEXT · 下一站</small><b>${nxt.time} ${esc(nxt.title)}</b></div>${row("ACTIVATE PORTAL")}</div>`, { apply: async () => { await api.updateActivity(cur.id, { status: "skipped" }); done({ from: cur.id, to: nxt.id, text: `跳过「${cur.title}」，直接去「${nxt.title}」` }, `${cur.title} → ${nxt.title}`, `<ul class="chg"><li><span><s>${esc(cur.title)}</s></span><span>已跳过</span></li><li><span>${esc(nxt.title)}</span><span>现在出发</span></li></ul>`); } });
    },
    "8"() { paint(`${sheetHead("8")}${intro}<div class="skd-sec"><small>FALSE WORLD</small><p>虚假世界：1小时内迷失在这边区域，只能凭感觉。<br>收起地图，跟着感觉走。</p></div>${row("ACTIVATE")}</div>`, { apply: () => { const until = Date.now() + 60 * 60000; done({ until, text: "迷失中：不看地图，只凭感觉走（1 小时）" }, "1 小时内只能凭感觉", `<p style="text-align:center">接下来 1 小时，<br>收起地图，跟着感觉走。</p>`); } }); }
  };
  flows[k]();
}

/* ---------- effects today ---------- */
export function handleFx(e, kind) {
  if (!e) return;
  if (kind === "7") { const st = dayActs(T()).filter(usable); if (!st.length) { api.resolveEffect(e.id, "今天没有可以射掉的行程，后羿收起了弓").catch(() => {}); toast("今天没有可以射掉的行程，后羿收起了弓"); return; }
    const a = st[Math.floor(Math.random() * st.length)]; sfx.chaos();
    const sh = openSheet(`${sheetHead("7", "失控：后羿闭着眼睛射了一箭")}<div class="ooc-shot"><svg viewBox="0 0 200 110" aria-hidden="true"><circle class="os-sun" cx="150" cy="30" r="16"/><path class="os-arrow" d="M10 100L140 38" /><path class="os-tip" d="M140 38l-9 1 4 7z"/></svg><p>射中了——</p><b>${esc(a.time)} ${esc(a.title)}</b></div>${row("好吧，就它了")}</div>`, { accent: CARD["7"].accent });
    bind(sh, { cancel: () => { closeSheet(); }, confirm: async () => { try { await api.updateActivity(a.id, { status: "removed" }); await api.resolveEffect(e.id, `射掉：${a.title}`); await api.addLog(T(), "7", "EFFECT", `后羿失控，射掉了「${a.title}」`); closeSheet(); toast(`「${a.title}」被射下来了`); } catch (er) { toast("没能保存"); } } });
    sh.querySelector('[data-act="cancel"]').textContent = "等一下再说"; return; }
  if (kind === "Q") { const st = dayActs(T()).filter(x => x.status !== "removed" && x.status !== "skipped" && x.status !== "done");
    if (!st.length) { api.resolveEffect(e.id, "今天还没有行程，太阳晚一点也没关系").catch(() => {}); toast("今天还没有行程"); return; }
    Promise.all(st.map(x => api.updateActivity(x.id, { was_time: x.was_time || x.time, time: fmtMin(toMin(x.time) + 30) }))).then(() => { api.resolveEffect(e.id, `${st.length} 项全部推迟 30 分钟`); api.addLog(T(), "Q", "EFFECT", "羲和失控：今天所有行程推迟 30 分钟"); sfx.chaos(); toast("今天的行程都往后推了 30 分钟"); }).catch(() => toast("没能保存")); return; }
  if (kind === "redo") { startActivate(e.card, { mode: "effect", onDone: () => api.resolveEffect(e.id, "已补做") }); return; }
  if (kind === "ok") { api.resolveEffect(e.id, e.detail || "").catch(() => {}); sfx.tap(); return; }
  if (kind === "9") { openSpecial({ date: T(), title: "传送门（失控）：新增一个原本没计划的地点", onDone: () => { api.resolveEffect(e.id, "已新增计划外地点"); api.addLog(T(), "9", "EFFECT", "新增了一个计划外地点"); } }); return; }
  if (kind === "K") { const k = (e.detail.match(/自动生效：(\w+)/) || [])[1]; if (!CARD[k]) return; startActivate(k, { mode: "effect", src: "K", onDone: () => api.resolveEffect(e.id, `已执行 ${k} · ${CARD[k].name}`) }); return; }
  if (kind === "8") {
    const st = dayActs(T()).filter(usable); let pick = null;
    const draw = () => { const sh = openSheet(`${sheetHead("8", "失控：今天必须删掉一个原本计划的地点")}${st.length ? optList(st.map(x => ({ id: x.id, lead: x.time, label: x.title })), pick) + row("确认删除", !pick) : emptyBox("今天没有可以删掉的地点（主要行程不能删）。")}</div>`, { accent: CARD["8"].accent });
      sh.querySelectorAll("[data-pick]").forEach(b => b.onclick = () => { pick = b.dataset.pick; draw(); });
      bind(sh, { cancel: closeSheet, confirm: async () => { const p = st.find(x => x.id === pick); try { await api.updateActivity(p.id, { status: "removed" }); await api.resolveEffect(e.id, `删掉：${p.title}`); await api.addLog(T(), "8", "EFFECT", `删掉了「${p.title}」`); sfx.chaos(); closeSheet(); toast(`「${p.title}」已从今天的行程删掉`); } catch (er) { toast("没能保存"); } } }); };
    draw();
  }
}

