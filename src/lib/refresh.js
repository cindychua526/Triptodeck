/* Home-screen apps have no refresh button: pull down at the top of any page, or just come back to the app. */
import { api } from "./api.js";
import { toast } from "./ui.js";
import { mus } from "./sound.js";
let last = 0, busy = false;
export async function refreshNow(quiet) { if (busy || !api.trip) return; busy = true; last = Date.now(); try { await api.refresh(); if (!quiet) { mus.chime(3, .02); toast("更新好了"); } } finally { busy = false; } }
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible" && Date.now() - last > 8000) refreshNow(true); });
addEventListener("pageshow", () => { if (Date.now() - last > 8000) refreshNow(true); });
setInterval(() => { if (document.visibilityState === "visible") refreshNow(true); }, 90000);
/* pull to refresh */
const tip = document.createElement("div"); tip.className = "ptr"; tip.innerHTML = "<i></i><span>往下拉，更新</span>"; document.body.appendChild(tip);
let y0 = null, dy = 0, host = null;
const scrollerOf = t => { const s = t && t.closest && t.closest(".pg-scroll, .page"); return s; };
const NO_PULL = "#stage, .card, .sleeve, .oracle, .coin3d, #coin, .rig, .tape, .spots, .tk, .fly, canvas, .gk-rail, .fb-stage, .moon-play, .shp-view, input, textarea, select, [data-nopull], .hb-strip, .seats";
let x0 = 0, dx = 0;
addEventListener("touchstart", e => { y0 = null; if (e.touches.length > 1 || document.querySelector(".usheet.on, .sheet.on, .shelf.on, .showcase.on, .sv, .rcpt.on, .shp.on, .fdd.on, .fb.on, .arch.on")) return; if (e.target.closest && e.target.closest(NO_PULL)) return; host = scrollerOf(e.target); if (!host || host.scrollTop > 0) return; y0 = e.touches[0].clientY; x0 = e.touches[0].clientX; dy = 0; dx = 0; }, { passive: true });
addEventListener("touchmove", e => { if (y0 == null) return; dy = e.touches[0].clientY - y0; dx = e.touches[0].clientX - x0; if (Math.abs(dx) > Math.abs(dy) || dy <= 40 || (host && host.scrollTop > 0)) { tip.classList.remove("on", "ready"); if (Math.abs(dx) > 30) y0 = null; return; } const p = Math.min(1, (dy - 40) / 110); tip.style.transform = `translate(-50%, ${Math.min(70, (dy - 40) * .6) - 30}px)`; tip.classList.add("on"); tip.classList.toggle("ready", p >= 1); tip.querySelector("span").textContent = p >= 1 ? "放手更新" : "往下拉，更新"; }, { passive: true });
addEventListener("touchend", () => { if (y0 == null) return; const go = dy >= 150 && Math.abs(dx) < 60; y0 = null; tip.style.transform = ""; tip.classList.remove("on", "ready"); if (go) refreshNow(false); }, { passive: true });
