/* Notices: what other people did (skills fired, decisions made), unread badge, and the running countdowns. */
import { api, on, nameOf } from "./api.js";
import { today, buzz } from "./util.js";
import { toast } from "./ui.js";
import { cardFx } from "./sound.js";
import { CARD } from "../data/skills.js";
const KEY = () => "td-seen-log:" + (api.trip ? api.trip.id : "");
let seen = 0, items = [], timer = 0;
const TIMED = { Q: 60, "10": 30, "8": 60 };
export function unread() { return items.filter(x => Date.parse(x.created_at) > seen).length; }
export function list() { return items; }
export function markRead() { seen = Date.now(); try { localStorage.setItem(KEY(), String(seen)); } catch (e) {} paintBadge(); }
export function line(l) { const who = nameOf(l.user_id), me = l.user_id === api.me.id; const c = l.card && CARD[l.card];
  if (l.action === "ACTIVATED") return `${me ? "你" : who}发动了 ${l.card} · ${c ? c.name : ""}${l.effect ? "：" + l.effect : ""}`;
  if (l.action === "DECIDED") return `${me ? "你" : who}${l.effect || "定了一件事"}`;
  if (l.action === "EFFECT") return `失控：${l.effect || ""}`;
  if (l.action === "DRAWN") return `${me ? "你" : who}抽了一张牌`;
  return `${who} ${l.effect || l.action}`; }
async function load(first) {
  if (!api.trip) return; try { seen = +localStorage.getItem(KEY()) || (first ? Date.now() : 0); } catch (e) {}
  let L = []; try { L = await api.log(); } catch (e) { return; }
  const fresh = L.filter(l => Date.parse(l.created_at) > seen && l.user_id !== api.me.id && l.action !== "DRAWN");
  if (!first) fresh.slice(0, 3).forEach(l => { toast(line(l)); if (l.action === "ACTIVATED" && l.card) { cardFx(l.card); buzz([30, 40, 30]); } });
  items = L; paintBadge(); document.dispatchEvent(new CustomEvent("notices"));
}
function paintBadge() { const t = document.getElementById("tab-play"); if (!t) return; let b = t.querySelector(".badge"); const n = unread(); if (!b) { b = document.createElement("span"); b.className = "badge"; t.appendChild(b); } b.textContent = n || ""; b.classList.toggle("on", n > 0); }
/* running countdowns from today's activated timed cards */
export function running() { const d = today(), out = []; items.filter(l => l.action === "ACTIVATED" && l.date === d && TIMED[l.card]).forEach(l => { const end = Date.parse(l.created_at) + TIMED[l.card] * 60000, left = end - Date.now(); if (left > 0) out.push({ card: l.card, name: CARD[l.card].name, who: nameOf(l.user_id), left, end, text: l.effect || "" }); }); return out; }
export function countdownHTML() { const R = running(); if (!R.length) return ""; return `<div class="cd-run">${R.map(r => { const m = Math.floor(r.left / 60000), s = Math.floor(r.left % 60000 / 1000); return `<div class="cd-row" data-end="${r.end}"><b>${r.card} · ${r.name}</b><span>${r.who}${r.text ? " · " + r.text : ""}</span><time>${m}:${String(s).padStart(2, "0")}</time></div>`; }).join("")}</div>`; }
export function tickCountdowns(root = document) { root.querySelectorAll(".cd-row[data-end]").forEach(el => { const left = +el.dataset.end - Date.now(); const t = el.querySelector("time"); if (left <= 0) { el.classList.add("over"); t.textContent = "时间到"; } else t.textContent = `${Math.floor(left / 60000)}:${String(Math.floor(left % 60000 / 1000)).padStart(2, "0")}`; }); }
on("trip", () => load(true)); on("skill_log", () => load(false));
if (typeof window !== "undefined") { setTimeout(() => load(true), 1200); timer = setInterval(() => tickCountdowns(), 1000); }
