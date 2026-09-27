/* today's weather for a guide city; cached 30 minutes */
import { guideFor } from "../data/guides.js";
const ICON = t => /雷/.test(t) ? "⛈" : /雨|hujan/i.test(t) ? "🌧" : /阴/.test(t) ? "☁️" : /多云|云/.test(t) ? "⛅" : /雾|霾/.test(t) ? "🌫" : "☀️";
export async function weatherFor(cityKeyOrName) {
  const g = guideFor(cityKeyOrName); if (!g) return null;
  const k = "td-wx:" + g.id; try { const c = JSON.parse(localStorage.getItem(k)); if (c && Date.now() - c.at < 30 * 60e3) return c.v; } catch (e) {}
  try {
    const q = new URLSearchParams({ cc: g.w.cc, name: g.w.name, lat: g.ll[0], lng: g.ll[1] });
    let v = null;
    try { const r = await fetch("/api/weather?" + q); if (r.ok) { v = await r.json(); if (v.error) v = null; } } catch (e) {}
    if (!v) v = await openMeteo(g.ll[0], g.ll[1]);
    if (!v) return null;
    v.icon = ICON(v.text || ""); v.city = g.name;
    try { localStorage.setItem(k, JSON.stringify({ at: Date.now(), v })); } catch (e) {}
    return v;
  } catch (e) { return null; }
}
export const weatherLine = v => !v ? "" : `${v.icon} ${v.city} ${v.temp != null ? Math.round(v.temp) + "° · " : ""}${v.text || ""}${v.hi != null ? ` ${Math.round(v.lo)}–${Math.round(v.hi)}°` : ""}`;

/* fallback straight from the browser when the official-weather function isn't available */
const WMO = c => c === 0 ? "晴" : c <= 2 ? "多云" : c === 3 ? "阴" : c <= 48 ? "雾" : c <= 57 ? "毛毛雨" : c <= 67 ? "雨" : c <= 77 ? "雪" : c <= 82 ? "阵雨" : c <= 99 ? "雷阵雨" : "";
async function openMeteo(lat, lng) {
  try { const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=1`); if (!r.ok) return null; const j = await r.json();
    return { temp: j.current.temperature_2m, text: WMO(j.current.weather_code), hi: j.daily.temperature_2m_max[0], lo: j.daily.temperature_2m_min[0], source: "Open-Meteo（备用）" }; } catch (e) { return null; }
}
