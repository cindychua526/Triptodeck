/* Horizontal tab strips (day tabs, city chips…) re-render and snap back to the start, so day 8 "jumps" to day 1.
   Whenever one of these strips is (re)drawn, scroll it so the active item sits in view. */
const STRIPS = [".dy2-days", ".day-strip", ".map-bar", ".map-days", ".gk-tabs", ".bg-days", "#cities", "#countries", "#wCountries", ".seg-top", ".mood-row", ".chips-wrap", ".gd-cities", ".tp-cities"];
const ACTIVE = ".on, .now, .cur, [aria-selected=true]";
const seen = new WeakMap();
function center(strip) {
  if (strip.scrollWidth <= strip.clientWidth + 2) return;
  const a = strip.querySelector(ACTIVE); if (!a) return;
  const sr = strip.getBoundingClientRect(), ar = a.getBoundingClientRect();
  const want = strip.scrollLeft + (ar.left - sr.left) - (sr.width - ar.width) / 2;
  strip.scrollLeft = Math.max(0, Math.min(want, strip.scrollWidth - strip.clientWidth));
}
function sweep() { document.querySelectorAll(STRIPS.join(",")).forEach(st => { const key = st.innerHTML.length + ":" + (st.querySelector(ACTIVE) || {}).textContent; if (seen.get(st) === key) return; seen.set(st, key); center(st); }); }
let t = 0; new MutationObserver(() => { cancelAnimationFrame(t); t = requestAnimationFrame(sweep); }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
addEventListener("resize", () => { requestAnimationFrame(() => document.querySelectorAll(STRIPS.join(",")).forEach(center)); });
