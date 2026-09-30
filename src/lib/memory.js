/* 去年今天: on the same day in a later year, a banner brings back that day of an old trip */
import { api } from "./api.js";
import { today } from "./util.js";
import { t as T } from "./i18n.js";
export async function checkMemory(go) {
  const d = today(), md = d.slice(5), k = "td-memory:" + d; try { if (localStorage.getItem(k)) return; } catch (e) { return; }
  let trips = []; try { trips = await api.listTrips(); } catch (e) { return; }
  for (const t of trips) {
    if (!t.start_date || !t.end_date || t.end_date >= d) continue;
    const y0 = +t.start_date.slice(0, 4), y1 = +t.end_date.slice(0, 4);
    for (let y = y0; y <= y1; y++) { const day = `${y}-${md}`; if (day < t.start_date || day > t.end_date) continue;
      const ago = +d.slice(0, 4) - y; if (ago < 1) continue;
      try { localStorage.setItem(k, "1"); } catch (e) {}
      const { banner, onNotifyAction } = await import("./notify.js");
      onNotifyAction("memory", async n => { if (!api.trip || api.trip.id !== n.tid) await api.switchTrip(n.tid); setTimeout(() => import("../pages/paper.js").then(m => m.openPaper(n.day)), 600); });
      banner({ kind: "memory", id: k, tid: t.id, day, icon: "✦", kicker: ago === 1 ? T("去年今天", "A year ago today") : T(`${ago} 年前的今天`, `${ago} years ago today`), title: T(`你在「${t.name}」`, `You were on "${t.name}"`), body: T("看看那天的小报", "See that day's paper"), action: T("打开", "Open") });
      return; }
  }
}
