import "./styles.css";
import "./skin.css";
import "./stage.css";
import "./washi.css";
import { startI18n } from "./lib/i18n.js";
import { renderToday } from "./pages/today.js";
import "./lib/atmos.js";
import "./lib/notices.js";
import "./lib/refresh.js";
import "./lib/keepon.js";
import { ic } from "./lib/icons.js";
document.querySelectorAll("[data-ic]").forEach(el => { el.outerHTML = ic(el.dataset.ic); });
import "./lib/motion.js";
import { api, on } from "./lib/api.js";
import { $ } from "./lib/util.js";
import { initUI, closeSheet, sheetOpen } from "./lib/ui.js";
import { sfx, soundOn, setSound, onSoundChange, unlock } from "./lib/sound.js";
import { onboard } from "./pages/onboard.js";
import { loadTrip, render as renderTrip } from "./pages/trip.js";
import { initCollection, loadStamps, renderBook } from "./pages/collection.js";
import { initTickets, onShow as showTickets, refreshTripTickets } from "./pages/tickets.js";
import { onShowDeck } from "./pages/deck.js";
import { render as renderCoin, loadCoin } from "./pages/coin.js";
import { loadBudget, render as renderBudget } from "./pages/budget.js";
import { renderPlay } from "./pages/play.js";
import { refreshArrive } from "./pages/arrive.js";
import { cityOf } from "./pages/trip.js";
import { today } from "./lib/util.js";
import { openShelf } from "./pages/trips.js";
import { startNotify, setCardArt, onNotifyAction } from "./lib/notify.js";
import { cardHTML } from "./pages/deck.js";
import { openReceipt } from "./pages/receipt.js";
import { openBookPart } from "./pages/collection.js";

initUI();
const TAB_OF = { fortune: "fortune", trip: "trip", play: "play", deck: "play", coin: "play", tear: "play", collect: "collect", budget: "budget" };
let fortuneMod = null;
function syncSound() { const on = soundOn(), t = on ? "🔊" : "🔇"; document.querySelectorAll(".snd").forEach(b => { if (b.textContent !== t) b.textContent = t; const p = String(on); if (b.getAttribute("aria-pressed") !== p) { b.setAttribute("aria-pressed", p); b.setAttribute("aria-label", on ? "音效：开" : "音效：关"); } }); }
let sndT = 0; new MutationObserver(() => { clearTimeout(sndT); sndT = setTimeout(syncSound, 60); }).observe(document.body, { childList: true, subtree: true });
onSoundChange(syncSound);
window.tdGo = p => go(p);
export function go(p, push = true) {
  if (p === "fortune") setTimeout(() => renderToday(), 80);
  if (!document.getElementById("pg-" + p)) p = "fortune";
  document.querySelectorAll(".page").forEach(s => s.classList.toggle("on", s.id === "pg-" + p));
  /* delegated so buttons re-rendered by a page keep working */
document.addEventListener("click", e => {
  const b = e.target.closest && e.target.closest("[data-back]"); if (b) { sfx.tap(); go("play"); return; }
  const s = e.target.closest && e.target.closest(".snd"); if (s) { setSound(!soundOn()); }
});
document.getElementById("bookBtn").addEventListener("click", () => openShelf());
document.querySelectorAll(".tab").forEach(t => t.classList.toggle("on", t.dataset.p === TAB_OF[p]));
  if (push && location.hash !== "#/" + p) history.pushState({ p }, "", "#/" + p);
  if (p === "trip") renderTrip();
  if (p === "deck") onShowDeck();
  if (p === "coin") { renderCoin(); loadCoin(); }
  if (p === "tear") showTickets();
  if (p === "collect") { renderBook(); showTickets(); }
  if (p === "budget") renderBudget();
  if (p === "fortune" && fortuneMod) fortuneMod.fortuneResize();
  syncSound();
}
/* delegated so buttons re-rendered by a page keep working */
document.addEventListener("click", e => {
  const b = e.target.closest && e.target.closest("[data-back]"); if (b) { sfx.tap(); go("play"); return; }
  const s = e.target.closest && e.target.closest(".snd"); if (s) { setSound(!soundOn()); }
});
document.querySelectorAll(".tab").forEach(t => t.addEventListener("click", () => { sfx.tap(); if (sheetOpen()) closeSheet(); go(t.dataset.p); }));
addEventListener("popstate", () => { const m = location.hash.match(/^#\/(\w+)/); go(m ? m[1] : "fortune", false); });
addEventListener("td-go", e => go(e.detail));
/* keyboard shortcuts on the deck page: nothing to pick (it's random), Enter/Space draws via the focused deck */

async function start() {
  let s = null; try { s = await api.init(); } catch (e) { console.warn(e); }
  if (!s || !api.trip) await onboard();
  fortuneMod = await import("./pages/fortune.js");
  fortuneMod.hydrateFortune();
  initTickets(); initCollection();
  renderPlay(go);
  await Promise.all([loadTrip(), loadStamps(), loadBudget()]);
  refreshTripTickets(); fortuneMod.refreshFortuneMission(); fortuneMod.refreshWeather(); refreshArrive(() => api.trip ? cityOf(today()) : null);
  on("trip", async () => { await loadBudget(); fortuneMod.refreshWeather(); refreshArrive(); if (!api.trip) go("trip"); });
  const m = location.hash.match(/^#\/(\w+)/);
  go(m ? m[1] : "fortune", false);
  if (s && api.trips.length) openShelf();
  startI18n(); renderToday();
  setCardArt(k => { try { return cardHTML(k, { cls: "mini" }); } catch (e) { return ""; } }); startNotify();
  onNotifyAction("skill", () => go("deck")); onNotifyAction("reviewed", () => { go("collect"); setTimeout(() => openBookPart("passport"), 300); }); onNotifyAction("receipt", () => openReceipt());
}
start();
