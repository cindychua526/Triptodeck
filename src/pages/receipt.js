/* The end-of-trip receipt: prints out of a little printer, can be saved as a JPG. */
import { api } from "../lib/api.js";
import { esc, shortDate, today, hash } from "../lib/util.js";
import { toast } from "../lib/ui.js";
import { sfx } from "../lib/sound.js";
import { budgetSummary } from "./budget.js";
import { myStamps } from "./collection.js";
import { departuresOf } from "./arrive.js";
import { tripDays } from "./trip.js";
import { nameOf } from "../lib/api.js";
import { guideFor } from "../data/guides.js";
import { getJournal, journalText } from "../lib/journal.js";
import { tr } from "../lib/i18n.js";

const RATE = { love: "♥", ok: "○", meh: "✕" };
import { fmt } from "../lib/money.js";
const rm = n => fmt(n, api.membership);
async function lines() {
  const t = api.trip, ss = myStamps().filter(s => s.trip_id === t.id);
  let wallet = [], logs = [], j = null; try { [wallet, logs, j] = await Promise.all([api.wallet(), api.log(), api.journal()]); } catch (e) {}
  wallet = wallet.filter(w => w.trip_id === t.id);
  const places = ss.filter(s => s.kind === "place" || s.kind === "special"), exps = ss.filter(s => s.kind === "experience"), seals = ss.filter(s => s.kind === "city");
  const skills = logs.filter(l => l.action === "ACTIVATED" && l.user_id === api.me.id).length;
  const b = budgetSummary(), dep = departuresOf().find(d => d.user_id === api.me.id);
  const days = Math.round((new Date(t.end_date) - new Date(t.start_date)) / 864e5) + 1;
  const no = "#TD" + (t.end_date || "").replace(/-/g, "") + "-" + String(hash(t.id + api.me.id) % 10000).padStart(4, "0");
  const L = [];
  L.push({ k: "tiny", t: "THE TRIP DECK / TRAVEL ARCHIVE" }, { k: "title", t: "Travel Receipt" }, { k: "tiny", t: "— 旅行发票 —" }, { k: "rule" });
  L.push({ k: "lr", l: "TRIP", r: t.name }, { k: "lr", l: "DATE", r: `${shortDate(t.start_date)} – ${shortDate(t.end_date)}` }, { k: "lr", l: "RECEIPT", r: no }, { k: "lr", l: "TRAVELLER", r: api.me.name });
  if (dep) L.push({ k: "lr", l: "FROM", r: dep.origin });
  L.push({ k: "rule" }, { k: "head", l: "#  名称", r: "QTY" }, { k: "bold" });
  let n = 1; const item = (name, qty, subs = []) => { L.push({ k: "item", no: String(n++).padStart(2, "0"), l: name, r: "×" + qty }); subs.slice(0, 8).forEach(s => L.push({ k: "sub", t: "· " + s })); if (subs.length > 8) L.push({ k: "sub", t: `· 还有 ${subs.length - 8} 个` }); L.push({ k: "dash" }); };
  item("天数 DAYS", days);
  item("城市 CITIES", Math.max(seals.length, (t.cities || []).length), (t.cities || []).map(c => (guideFor(c) || { name: c }).name));
  item("印章 STAMPS", places.length, places.map(s => s.name.replace(/（.*?）/g, "")));
  item("美食 TASTES", wallet.length, wallet.map(w => { const nm = (w.spot_id || "").split(":").pop(); return `${nm} ${RATE[w.rating] || ""}`; }));
  if (exps.length) item("特色体验", exps.length, exps.map(s => s.name));
  item("技能发动 SKILLS", skills);
  try { const { tripAwards } = await import("../lib/awards.js"); const aw = await tripAwards(); if (aw.length) { L.push({ k: "sec", t: api.members.length > 1 ? "旅伴奖项 MVP" : "你的称号" }); aw.slice(0, 8).forEach(a => L.push({ k: "lr", l: `${a.icon} ${a.title}`, r: api.members.length > 1 ? `${a.name} · ${a.why}` : a.why })); } } catch (e) {}
  L.push({ k: "sec", t: "花费" });
  b.cats.slice().sort((a, c) => c.v - a.v).slice(0, 6).forEach(c => L.push({ k: "lr", l: c.n, r: rm(c.v) }));
  L.push({ k: "bold" }, { k: "total", l: "TOTAL · 你的花费", r: rm(b.mine) }, { k: "lr", l: "预算", r: rm(b.budget) }, { k: "lr", l: b.mine <= b.budget ? "省下" : "超出", r: rm(Math.abs(b.budget - b.mine)) });
  if (b.settle && b.settle.out.length && api.members.length > 1) { L.push({ k: "sec", t: "结算" }); b.settle.out.forEach(x => L.push({ k: "lr", l: `${nameOf(x.from)} → ${nameOf(x.to)}`, r: rm(x.amount) })); }
  L.push({ k: "sec", t: "优惠码" }, { k: "big", t: j && j.mood ? `今日心情：${j.mood}` : "开心每一天" });
  const JJ = await getJournal(), jt = journalText(JJ);
  const wxIcon = t => /雷/.test(t) ? "⚡" : /雨/.test(t) ? "☂" : /雪/.test(t) ? "❄" : /阴|雾/.test(t) ? "☁" : /云/.test(t) ? "⛅" : "☀";
  const wxLine = tripDays().map(d => { try { const w = JSON.parse(localStorage.getItem(`td-wx:${api.trip.id}:${d}`) || "null"); return w ? wxIcon(w.t) : "·"; } catch (e) { return "·"; } }).join(" ");
  const moodLine = tripDays().map(d => (JJ.moods || {})[d] || "—").join("");
  if (wxLine.replace(/[· ]/g, "")) L.push({ k: "lr", l: "这几天的天气", r: wxLine }); if (moodLine.replace(/—/g, "")) L.push({ k: "lr", l: "每天一个字", r: moodLine }); if (jt) L.push({ k: "quote", t: jt.slice(0, 120) + (jt.length > 120 ? "…" : "") });
  L.push({ k: "rule" }, { k: "lr", l: "ITEM GROUPS", r: String(n - 1).padStart(2, "0") }, { k: "lr", l: "TOTAL ENTRIES", r: String(days + places.length + wallet.length + exps.length + skills).padStart(2, "0") }, { k: "dash" });
  L.push({ k: "tiny", t: "TODAY'S MOOD" }, { k: "barcode", t: no }, { k: "center", t: "THANK YOU · 下次再出发" });
  return L;
}
function html(L) {
  return L.map(x => ({
    tiny: `<p class="r-tiny">${esc(x.t)}</p>`, title: `<h3 class="r-title">${esc(x.t)}</h3>`, rule: `<hr class="r-rule">`, dash: `<hr class="r-dash">`, bold: `<hr class="r-bold">`,
    lr: `<p class="r-lr"><span>${esc(x.l)}</span><span>${esc(x.r)}</span></p>`, head: `<p class="r-lr r-head"><span>${esc(x.l)}</span><span>${esc(x.r)}</span></p>`,
    item: `<p class="r-item"><span>${x.no}</span><b>${esc(x.l)}</b><span>${esc(x.r)}</span></p>`, sub: `<p class="r-sub">${esc(x.t)}</p>`,
    sec: `<p class="r-sec"><span>${esc(x.t)}</span></p>`, total: `<p class="r-lr r-total"><span>${esc(x.l)}</span><span>${esc(x.r)}</span></p>`,
    big: `<p class="r-big">${esc(x.t)}</p>`, quote: `<p class="r-quote">${esc(x.t)}</p>`, center: `<p class="r-center">${esc(x.t)}</p>`,
    barcode: `<div class="r-bar">${barSVG(x.t)}<small>${esc(x.t)}</small></div>`
  })[x.k] || "").join("");
}
function bars(t) { const out = []; let h = hash(t); for (let i = 0; i < 64; i++) { h = (h * 1103515245 + 12345) & 0x7fffffff; out.push(1 + (h % 3)); } return out; }
function barSVG(t) { let x = 0; const b = bars(t).map((w, i) => { const r = i % 2 ? "" : `<rect x="${x}" y="0" width="${w}" height="40"/>`; x += w; return r; }).join(""); return `<svg viewBox="0 0 ${x} 40" preserveAspectRatio="none">${b}</svg>`; }
async function toJpg(L) {
  await document.fonts.load('16px "JetBrains Mono"').catch(() => {});
  const W = 900, P = 60, mono = '"JetBrains Mono", "Noto Sans SC", monospace', c = document.createElement("canvas"), x = c.getContext("2d"); const ft = x.fillText.bind(x); x.fillText = (s, a, b, m) => ft(tr(String(s)), a, b, m);
  const rows = L.map(r => ({ r, h: { title: 70, tiny: 34, big: 56, quote: 30 * Math.ceil((r.t || "").length / 28), sub: 34, barcode: 110, rule: 26, dash: 26, bold: 26 }[r.k] || 44 }));
  const H = rows.reduce((s, r) => s + r.h, 0) + P * 2 + 30; c.width = W; c.height = H;
  x.fillStyle = "#f6f1e6"; x.fillRect(0, 0, W, H);
  x.fillStyle = "#e8dcc4"; for (let i = 0; i < W; i += 30) { x.beginPath(); x.moveTo(i, H); x.lineTo(i + 15, H - 16); x.lineTo(i + 30, H); x.fill(); }
  let y = P; x.fillStyle = "#1f1a14";
  const lr = (l, r, f) => { x.font = f; x.textAlign = "left"; x.fillText(l, P, y + 28); x.textAlign = "right"; x.fillText(r, W - P, y + 28); x.textAlign = "left"; };
  for (const { r, h } of rows) {
    const f = `400 24px ${mono}`, fb = `700 24px ${mono}`;
    if (r.k === "title") { x.font = `700 52px ${mono}`; x.textAlign = "center"; x.fillText(r.t, W / 2, y + 52); x.textAlign = "left"; }
    else if (r.k === "tiny" || r.k === "center") { x.font = `400 20px ${mono}`; x.textAlign = "center"; x.fillText(r.t.split("").join(" "), W / 2, y + 24); x.textAlign = "left"; }
    else if (r.k === "rule" || r.k === "dash" || r.k === "bold") { x.strokeStyle = "#1f1a14"; x.lineWidth = r.k === "bold" ? 4 : 1.5; x.setLineDash(r.k === "dash" ? [4, 6] : r.k === "rule" ? [10, 4] : []); x.beginPath(); x.moveTo(P, y + 13); x.lineTo(W - P, y + 13); x.stroke(); x.setLineDash([]); }
    else if (r.k === "lr" || r.k === "head") lr(r.l, r.r, r.k === "head" ? fb : f);
    else if (r.k === "total") lr(r.l, r.r, `700 30px ${mono}`);
    else if (r.k === "item") { x.font = f; x.fillText(r.no, P, y + 28); x.font = fb; x.fillText(r.l, P + 60, y + 28); x.font = f; x.textAlign = "right"; x.fillText(r.r, W - P, y + 28); x.textAlign = "left"; }
    else if (r.k === "sub") { x.font = `400 21px ${mono}`; x.fillStyle = "#5a5046"; x.fillText(r.t, P + 60, y + 24); x.fillStyle = "#1f1a14"; }
    else if (r.k === "sec") { x.font = fb; x.textAlign = "center"; x.fillText(r.t, W / 2, y + 28); x.textAlign = "left"; x.setLineDash([4, 6]); x.beginPath(); x.moveTo(P, y + 20); x.lineTo(W / 2 - 50, y + 20); x.moveTo(W / 2 + 50, y + 20); x.lineTo(W - P, y + 20); x.stroke(); x.setLineDash([]); }
    else if (r.k === "big") { x.font = `700 34px ${mono}`; x.fillText(r.t, P, y + 40); }
    else if (r.k === "quote") { x.font = `400 22px ${mono}`; const t = r.t; for (let i = 0; i * 28 < t.length; i++) x.fillText(t.slice(i * 28, i * 28 + 28), P, y + 26 + i * 30); }
    else if (r.k === "barcode") { let bx = W / 2 - 200; bars(r.t).forEach((w, i) => { if (!(i % 2)) x.fillRect(bx, y + 10, w * 3, 70); bx += w * 3; }); x.font = `400 18px ${mono}`; x.textAlign = "center"; x.fillText(r.t, W / 2, y + 102); x.textAlign = "left"; }
    y += h;
  }
  return await new Promise(r => c.toBlob(r, "image/jpeg", .94));
}
export async function openReceipt() {
  if (!api.trip) return;
  const L = await lines();
  document.querySelector(".rcpt")?.remove();
  const ov = document.createElement("div"); ov.className = "rcpt"; ov.setAttribute("role", "dialog"); ov.setAttribute("aria-label", "旅行发票");
  const early = today() < api.trip.end_date;
  ov.innerHTML = `<button class="sc-x" aria-label="关闭">×</button><div class="rc-scroll"><div class="printer"><div class="pr-body"><span class="pr-led"></span></div><div class="pr-slot"></div></div>
    <div class="paper-clip"><div class="paper" id="rcPaper">${html(L)}</div></div>
    ${early ? `<p class="rc-note">旅行还没结束，这是目前为止的发票。</p>` : ""}
    <div class="rc-btns"><button class="btn" id="rcAgain">重新打印</button><button class="btn ink" id="rcSave">保存 / 分享</button></div></div>`;
  document.body.appendChild(ov); requestAnimationFrame(() => ov.classList.add("on"));
  const paper = ov.querySelector("#rcPaper");
  const print = () => { paper.classList.remove("printing"); void paper.offsetWidth; paper.classList.add("printing"); let k = 0; const tick = setInterval(() => { sfx.tap(); if (++k > 14) { clearInterval(tick); sfx.tear ? sfx.tear() : sfx.paper(); } }, 170); };
  setTimeout(print, 350);
  ov.querySelector(".sc-x").onclick = () => { ov.classList.remove("on"); setTimeout(() => ov.remove(), 350); };
  ov.querySelector("#rcAgain").onclick = print;
  ov.querySelector("#rcSave").onclick = async () => { try { const blob = await toJpg(L), f = new File([blob], `${api.trip.name}-receipt.jpg`, { type: "image/jpeg" }); if (navigator.canShare && navigator.canShare({ files: [f] })) await navigator.share({ files: [f], title: api.trip.name }); else { const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = f.name; a.click(); } } catch (e) { toast("没能保存"); } };
}
