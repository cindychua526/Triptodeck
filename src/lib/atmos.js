/* 氛围: one mood for the whole room for one day.
   rain   — someone activated 雷公 (6) today
   snow / dusk / night — scheduled: two of the middle days of a trip, chosen from the trip id
   fire   — the last day
   Nothing here changes data; it only changes how today looks and sounds. */
import { api, on } from "./api.js";
import { today, hash, buzz } from "./util.js";
import { mus, sfx, ambient, ambientLevel, stopAmbient } from "./sound.js";
import { tripDays } from "../pages/trip.js";

export const ATMOS = {
  rain: { name: "雷公 · 催雨", zh: "今天下雨", hint: "雷公在。整个房间今天都是雨天。" },
  snow: { name: "雪女 · 落雪", zh: "今天下雪", hint: "雪女经过。翻页会踩到雪。" },
  dusk: { name: "夸父 · 追日", zh: "今天是黄昏", hint: "夸父追着太阳，天一直是傍晚。" },
  night: { name: "烛龙 · 长夜", zh: "今天是长夜", hint: "烛龙闭上眼，今天没有白天。" },
  fire: { name: "祝融 · 焰火", zh: "最后一天", hint: "祝融在。每完成一件事，就放一朵烟花。" }
};
let current = null, canvas = null, raf = 0, parts = [];
export function scheduled(date = today()) {
  const t = api.trip; if (!t) return null; const days = tripDays(); if (days.length < 3) return date === days[days.length - 1] ? "fire" : null;
  if (days.length === 3) return date === days[2] ? "fire" : date === days[1] ? ["snow", "dusk", "night"][hash(t.id + "atmos") % 3] : null;
  if (date === days[days.length - 1]) return "fire";
  const mid = days.slice(1, -1), h = hash(t.id + "atmos"), pool = ["snow", "dusk", "night"];
  const pick = new Set(); if (mid.length >= 2) { const a = h % mid.length; let b = (h >>> 5) % mid.length; if (b === a) b = (a + 1 + ((h >>> 11) % (mid.length - 1))) % mid.length; pick.add(mid[a]); pick.add(mid[b]); }
  const arr = [...pick]; const i = arr.indexOf(date); if (i < 0) return null; const first = (h >>> 9) % pool.length; return pool[(first + i * (1 + ((h >>> 13) % 2))) % pool.length];
}
export async function todaysAtmos() {
  const d = today(); let fx = null;
  /* the card itself, or K 镜界 / X 无常 copying it (copied, or activation.as) */
  const as = x => x.status === "activated" ? [x.card, x.copied, x.activation && x.activation.as, x.activation && x.activation.atmos === "rain" ? "6" : null, x.activation && x.activation.atmos === "snow" ? "5" : null] : [];
  try { const T = await api.deckTable(d); const ks = T.flatMap(as); fx = ks.includes("6") ? "rain" : ks.includes("5") ? "snow" : null; } catch (e) {}
  if (!fx) { try { const E = (await api.effects()).filter(e => e.target_date === d && e.source === "unexecuted"); if (E.some(e => e.card === "6") && new Date().getHours() < 12) fx = "rain"; else if (E.some(e => e.card === "5")) fx = "snow"; } catch (e) {} }
  return fx || scheduled(d);
}
export function current_() { return current; }
export async function refresh() { const a = api.trip ? await todaysAtmos() : null; apply(a); }
function apply(a) {
  if (a === current) return; current = a;
  document.body.classList.remove("atm-rain", "atm-snow", "atm-dusk", "atm-night", "atm-fire"); if (a) document.body.classList.add("atm-" + a);
  stop(); if (a === "rain" || a === "snow") start(a); else if (a) { ambient(a); soundOnly(); }
  if (a === "rain") { setTimeout(() => { buzz([40, 60, 80]); mus.whoosh(); }, 300); }
  if (a === "snow") { setTimeout(() => { buzz([8, 60, 8]); try { mus.chime(6, .02); mus.chime(9, .015, .2); } catch (e) {} }, 300); }
  document.dispatchEvent(new CustomEvent("atmos", { detail: a }));
}
/* rain / snow: full on the 今日 page, only a light sprinkle elsewhere (so it never covers what you're reading),
   paused while the app is in the background, and much lighter on slow phones or when "reduce motion" / data saver is on */
export const LOW_POWER = (() => { try { return matchMedia("(prefers-reduced-motion: reduce)").matches || (navigator.connection && navigator.connection.saveData) || (navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 3; } catch (e) { return false; } })();
if (typeof document !== "undefined" && LOW_POWER) { const on = () => document.body && document.body.classList.add("lowpower"); document.body ? on() : addEventListener("DOMContentLoaded", on); }
function start(kind) {
  canvas = document.createElement("canvas"); canvas.className = "atm-cv"; document.body.appendChild(canvas);
  const x = canvas.getContext("2d"); let w = 0, h = 0; const size = () => { if (!canvas) return; w = canvas.width = innerWidth; h = canvas.height = innerHeight; }; size(); addEventListener("resize", size);
  const N = Math.round((kind === "snow" ? 90 : 110) * (LOW_POWER ? .35 : 1));
  parts = Array.from({ length: N }, (_, i) => ({ i, x: Math.random() * innerWidth, y: Math.random() * innerHeight, v: kind === "snow" ? .4 + Math.random() * .9 : 7 + Math.random() * 6, r: kind === "snow" ? 1.2 + Math.random() * 2.2 : 0, d: Math.random() * 6.28 }));
  let t = 0, last = 0, lvl = -1; ambient(kind);
  const loop = ts => { raf = requestAnimationFrame(loop);
    if (document.hidden) return; if (LOW_POWER && ts - last < 33) return; last = ts;   // ~30fps on slow phones
    t += .016; x.clearRect(0, 0, w, h);
    const today = !!document.querySelector("#pg-fortune.on"), busy = !!document.querySelector(".usheet.on, .sheet.on, .fb, .sv, .npo, .shp, .showcase.on, .rcpt");
    const share = busy ? 0 : today ? 1 : .3, n = Math.round(parts.length * share);
    const al = busy ? .35 : today ? 1 : .45; if (al !== lvl) { lvl = al; ambientLevel(al); }
    if (!n) return;
    if (kind === "snow") { x.fillStyle = today ? "rgba(255,255,255,.95)" : "rgba(255,255,255,.8)"; x.shadowColor = "rgba(110,130,150,.35)"; x.shadowBlur = 3;
      for (let k = 0; k < n; k++) { const p = parts[k]; p.y += p.v; p.x += Math.sin(t + p.d) * .3; if (p.y > h) { p.y = -4; p.x = Math.random() * w; } x.beginPath(); x.arc(p.x, p.y, today ? p.r : p.r * .75, 0, 7); x.fill(); } }
    else { x.strokeStyle = today ? "rgba(47,58,46,.34)" : "rgba(47,58,46,.2)"; x.lineWidth = 1.1;
      for (let k = 0; k < n; k++) { const p = parts[k]; p.y += p.v; p.x -= 1.2; if (p.y > h) { p.y = -14; p.x = Math.random() * w + 40; } x.beginPath(); x.moveTo(p.x, p.y); x.lineTo(p.x - 3, p.y + 18); x.stroke(); } }
  };
  raf = requestAnimationFrame(loop);
}
/* dusk / night / fire have no particles, only sound: keep its level in step with the page you're on */
let sIv = 0;
function soundOnly() { clearInterval(sIv); let lvl = -1; sIv = setInterval(() => { const today = !!document.querySelector("#pg-fortune.on"), busy = !!document.querySelector(".usheet.on, .fb, .sv, .npo, .shp, .showcase.on, .rcpt, .rc");
  const al = busy ? .35 : today ? 1 : .45; if (al !== lvl) { lvl = al; ambientLevel(al); } }, 700); }
function stop() { clearInterval(sIv); stopAmbient(); cancelAnimationFrame(raf); if (canvas) { canvas.remove(); canvas = null; } }
/* 祝融: a little firework when something gets done on the last day */
export function celebrate() {
  if (current !== "fire") return;
  const c = document.createElement("canvas"); c.className = "atm-cv"; document.body.appendChild(c); c.width = innerWidth; c.height = innerHeight; const x = c.getContext("2d");
  const cx = innerWidth * (.3 + Math.random() * .4), cy = innerHeight * (.25 + Math.random() * .25), cols = ["#b3341e", "#e6d7a8", "#7c5b3a", "#f2f0e8"];
  const ps = Array.from({ length: 60 }, (_, i) => { const a = i / 60 * 6.28, s = 2.4 + Math.random() * 2.4; return { x: cx, y: cy, vx: Math.cos(a) * s, vy: Math.sin(a) * s, c: cols[i % 4], l: 1 }; });
  mus.pop(); setTimeout(() => mus.harp(4, 5, .05), 120); buzz([10, 30, 10]);
  let n = 0; const loop = () => { n++; x.clearRect(0, 0, c.width, c.height); ps.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += .04; p.l -= .014; x.globalAlpha = Math.max(0, p.l); x.fillStyle = p.c; x.beginPath(); x.arc(p.x, p.y, 2.2, 0, 7); x.fill(); }); if (n < 80) requestAnimationFrame(loop); else c.remove(); }; requestAnimationFrame(loop);
}
on("trip", () => setTimeout(refresh, 300)); on("skill_log", refresh); on("skill_draws", refresh); on("skill_effects", refresh);
if (typeof window !== "undefined") { window.tdCelebrate = celebrate; setTimeout(refresh, 800); setInterval(refresh, 60000); }
