/* In-app notification banners (+ system notifications when the app is in the background).
   Sources: a buddy activates a skill, a buddy's check-in needs approval, your check-in was approved. */
import { api, on, nameOf } from "./api.js";
import { sfx } from "./sound.js";
import { esc, buzz } from "./util.js";

let q = [], showing = false, seen = null, primed = false;
const KEY = () => "td-seen:" + (api.trip ? api.trip.id : "x");
const loadSeen = () => { try { seen = new Set(JSON.parse(localStorage.getItem(KEY()) || "[]")); } catch (e) { seen = new Set(); } };
const saveSeen = () => { try { localStorage.setItem(KEY(), JSON.stringify([...seen].slice(-400))); } catch (e) {} };
const handlers = {};
export const onNotifyAction = (kind, f) => { handlers[kind] = f; };

export function banner(n) { q.push(n); if (!showing) next(); systemNotify(n); }
function next() {
  const n = q.shift(); if (!n) { showing = false; return; } showing = true;
  const el = document.createElement("div"); el.className = "nb nb-banner"; el.setAttribute("role", "status");
  el.innerHTML = `<div class="nb-in"><div class="nb-art">${n.art || `<span>${n.icon || "✦"}</span>`}</div><div class="nb-txt"><small>${esc(n.kicker || "THE TRIP DECK")}</small><b>${esc(n.title)}</b>${n.body ? `<p>${esc(n.body)}</p>` : ""}</div>${n.action ? `<button class="nb-go">${esc(n.action)}</button>` : ""}</div>`;
  document.body.appendChild(el); requestAnimationFrame(() => el.classList.add("on"));
  sfx.bell ? sfx.bell() : sfx.tap(); buzz([12, 40, 12]);
  let t = setTimeout(close, n.action ? 9000 : 5200), y0 = null;
  function close() { clearTimeout(t); el.classList.remove("on"); setTimeout(() => { el.remove(); next(); }, 380); }
  el.addEventListener("pointerdown", e => { y0 = e.clientY; });
  el.addEventListener("pointerup", e => { if (y0 != null && y0 - e.clientY > 24) close(); y0 = null; });
  const go = el.querySelector(".nb-go"); if (go) go.onclick = () => { close(); handlers[n.kind] && handlers[n.kind](n); };
  el.querySelector(".nb-txt").onclick = () => { if (n.action) { close(); handlers[n.kind] && handlers[n.kind](n); } };
}
function systemNotify(n) {
  try { if (document.hidden && "Notification" in window && Notification.permission === "granted") new Notification(n.title, { body: n.body || "", tag: n.id || undefined }); } catch (e) {}
}
export async function askSystemPermission() { if (!("Notification" in window)) return "unsupported"; try { return await Notification.requestPermission(); } catch (e) { return "denied"; } }

/* when you activate: everyone else gets a banner via realtime; you get a confirmation */
export function notifyAll(n) {
  const others = api.members.filter(m => m.id !== api.me.id).length;
  banner({ ...n, kicker: others ? `已通知 ${others} 位旅伴` : "只有你一个人", icon: "✦" });
}
let cardArt = () => "";
export const setCardArt = f => { cardArt = f; };

async function scan(prime) {
  if (!api.trip || !api.me) return;
  if (!seen) loadSeen();
  let logs = [], cks = [];
  try { [logs, cks] = await Promise.all([api.log(), api.checkins()]); } catch (e) { return; }
  const fresh = [];
  logs.filter(l => l.action === "ACTIVATED" && l.user_id !== api.me.id).forEach(l => { const k = "log:" + l.id; if (!seen.has(k)) { seen.add(k); fresh.push({ kind: "skill", id: k, card: l.card, kicker: "技能发动", title: `${nameOf(l.user_id)} 发动了技能`, body: l.effect || "", art: cardArt(l.card) }); } });
  logs.filter(l => (l.action === "LIGHTREQ" || l.action === "LIGHT") && l.user_id !== api.me.id && l.meta).forEach(l => { const k = "log:" + l.id; if (seen.has(k)) return; seen.add(k);
    if (l.action === "LIGHTREQ" && !logs.some(x => x.action === "LIGHT" && x.meta && x.meta.stamp === l.meta.stamp)) fresh.push({ kind: "light", id: k, info: l.meta, icon: "✦", kicker: "灰章求救", title: l.effect || `${nameOf(l.user_id)} 想请你点亮一枚章`, body: "土地公把 TA 的章弄灰了，按住它就能找回颜色", action: "帮 TA 点亮" });
    if (l.action === "LIGHT" && l.meta.owner === api.me.id) fresh.push({ kind: "lit", id: k, icon: "✦", kicker: "章亮了", title: `${nameOf(l.user_id)} 帮你点亮了「${l.meta.name || ""}」`, body: "去护照看看", action: "去看看" }); });
  let social = []; try { social = api.photoSocial ? await api.photoSocial() : []; } catch (e) {}
  social.filter(r => r.user_id !== api.me.id && r.owner_id === api.me.id).forEach(r => { const k = "ps:" + r.id; if (seen.has(k)) return; seen.add(k);
    fresh.push({ kind: "photo", id: k, icon: r.kind === "like" ? "♥" : "💬", kicker: r.kind === "like" ? "有人点赞" : "新评论", title: r.kind === "like" ? `${nameOf(r.user_id)} 赞了你的照片` : `${nameOf(r.user_id)}：${r.body || ""}`, action: "去看看" }); });
  cks.forEach(c => {
    if (c.status === "pending" && c.user_id !== api.me.id) { const k = "ck:" + c.id; if (!seen.has(k)) { seen.add(k); fresh.push({ kind: "review", id: k, ck: c.id, icon: "📷", kicker: "等你确认", title: `${nameOf(c.user_id)} 在「${c.name}」打卡了`, body: c.mission || "", action: "去确认" }); } }
    if (c.user_id === api.me.id && c.status !== "pending") { const k = "ck:" + c.id + ":" + c.status; if (!seen.has(k)) { seen.add(k); if (!prime && c.reviewed_by !== api.me.id) fresh.push({ kind: "reviewed", id: k, ck: c.id, icon: c.status === "approved" ? "✓" : "↺", kicker: c.status === "approved" ? "印章到手" : "再拍一次", title: c.status === "approved" ? `「${c.name}」的打卡通过了` : `「${c.name}」的打卡没通过`, body: c.status === "approved" ? `${c.reviewed_by ? nameOf(c.reviewed_by) : "旅伴"}确认了，印章已经盖进手账` : (c.note || "旅伴觉得照片还不太符合任务"), action: c.status === "approved" ? "看印章" : null }); } }
  });
  saveSeen();
  if (!prime) fresh.forEach(banner);
}
let st = 0; const soon = () => { clearTimeout(st); st = setTimeout(() => scan(false), 500); };
on("skill_log", soon); on("checkins", soon); on("photo_social", soon);
on("trip", () => { seen = null; loadSeen(); scan(true); });
export function startNotify() { if (primed) return; primed = true; loadSeen(); scan(true); }
