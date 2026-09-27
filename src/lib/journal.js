/* your writing for a trip: a summary + one note per day. Private. Stored in journals.content as JSON. */
import { api } from "./api.js";
let cache = {};
export async function getJournal(tid) {
  tid = tid || (api.trip && api.trip.id); if (!tid) return { summary: "", days: {}, mood: "" };
  if (cache[tid]) return cache[tid];
  let j = null; try { j = await api.journal(tid); } catch (e) {}
  let v = { summary: "", days: {}, mood: (j && j.mood) || "" };
  if (j && j.content) { try { const o = JSON.parse(j.content); if (o && o.v === 2) v = { summary: o.summary || "", days: o.days || {}, moods: o.moods || {}, mood: j.mood || "" }; else v.summary = j.content; } catch (e) { v.summary = j.content; } }
  return cache[tid] = v;
}
let t = 0;
export function saveJournal(v, tid) { tid = tid || api.trip.id; cache[tid] = v; clearTimeout(t); return new Promise(res => { t = setTimeout(async () => { try { await api.saveJournal(JSON.stringify({ v: 2, summary: v.summary, days: v.days, moods: v.moods || {} }), v.mood, tid); } catch (e) {} res(); }, 600); }); }
export const journalText = v => [v.summary, ...Object.keys(v.days).sort().map(d => v.days[d])].filter(Boolean).join("\n\n");
