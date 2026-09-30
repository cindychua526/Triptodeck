/* 土地公失控 (card 4 drawn and never used): every stamp you collect that day comes out grey.
   It's worked out from the day's effects when a stamp is drawn, so it needs no database change. */
import { api, on } from "./api.js";
let days = new Set(), lit = new Set();
export async function loadGrey() {
  let next = new Set(), nlit = new Set();
  try { if (api.trip) next = new Set((await api.effects()).filter(e => e.card === "4" && e.source === "unexecuted").map(e => e.target_date)); } catch (e) {}
  try { if (api.trip && next.size) (await api.log()).filter(l => l.action === "LIGHT" && l.meta && l.meta.stamp).forEach(l => nlit.add(l.meta.stamp)); } catch (e) {}
  const changed = [...next].join() !== [...days].join() || [...nlit].join() !== [...lit].join(); days = next; lit = nlit;
  if (changed) document.dispatchEvent(new CustomEvent("td-grey"));
}
export const greyDay = d => days.has(d);
export const isGrey = s => !!s && days.has(s.date) && !lit.has(s.id) && (!api.trip || !s.trip_id || s.trip_id === api.trip.id);
export const greySvg = svg => String(svg).replace("<svg ", '<svg data-grey="1" style="filter:grayscale(1) contrast(.85) opacity(.7)" ');
export const GREY_NOTE = "土地公失控 · 今天的章只有灰色";
on("trip", loadGrey); on("skill_effects", loadGrey); on("skill_log", loadGrey);
if (typeof window !== "undefined") setTimeout(loadGrey, 900);
