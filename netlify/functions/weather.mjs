// Today's weather from official sources:
//   China    → 中国气象局 weather.cma.cn (station looked up by city name)
//   Malaysia → MET Malaysia via data.gov.my open API
//   Thailand → Thai Meteorological Department (TMD) 7-day forecast API
//   Singapore→ National Environment Agency via data.gov.sg
// Falls back to Open-Meteo (labelled as such) if the official source doesn't answer.
// GET /api/weather?cc=CN&name=厦门&lat=24.48&lng=118.09
const J = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { "content-type": "application/json", "cache-control": "public, max-age=900" } });
const ua = { "user-agent": "TripDeck/1.0 (travel app)" };
let cmaCities = null, cmaAt = 0;

async function china(name) {
  if (!cmaCities || Date.now() - cmaAt > 6 * 3600e3) {
    const r = await fetch("https://weather.cma.cn/api/map/weather/1?t=" + Date.now(), { headers: ua });
    const j = await r.json(); cmaCities = (j.data && j.data.city) || []; cmaAt = Date.now();
  }
  const row = cmaCities.find(c => c[1] === name) || cmaCities.find(c => String(c[1]).startsWith(name.slice(0, 2)));
  if (!row) return null;
  const r = await fetch(`https://weather.cma.cn/api/weather/view?stationid=${row[0]}`, { headers: ua });
  const j = await r.json(); const d = j.data || {}, day = (d.daily || [])[0] || {}, now = d.now || {};
  return { temp: now.temperature, hi: day.high, lo: day.low, text: day.dayText || "", night: day.nightText || "", humidity: now.humidity, source: "中国气象局", station: row[1] };
}
const MY_WORDS = { "Tiada hujan": "无雨", "Hujan di satu dua tempat": "局部有雨", "Hujan di beberapa tempat": "部分地区有雨", "Ribut petir di satu dua tempat": "局部雷雨", "Ribut petir di beberapa tempat": "部分地区雷雨", "Hujan": "有雨", "Ribut petir": "雷雨", "Berjerebu": "有烟霾", "Hujan menyeluruh": "全面降雨" };
async function malaysia(name) {
  const r = await fetch(`https://api.data.gov.my/weather/forecast?contains=${encodeURIComponent(name)}@location__location_name&sort=date&limit=20`, { headers: ua });
  const rows = await r.json(); if (!Array.isArray(rows) || !rows.length) return null;
  const today = new Date(Date.now() + 8 * 3600e3).toISOString().slice(0, 10);
  const row = rows.find(x => x.date === today) || rows[0];
  const tr = s => MY_WORDS[s] || s;
  return { hi: row.max_temp, lo: row.min_temp, text: tr(row.summary_forecast), when: row.summary_when, morning: tr(row.morning_forecast), afternoon: tr(row.afternoon_forecast), night: tr(row.night_forecast), source: "MET Malaysia", station: row.location && row.location.location_name };
}
async function thailand(province) {
  const uid = process.env.TMD_UID || "api", key = process.env.TMD_UKEY || "api12345";
  const r = await fetch(`https://data.tmd.go.th/api/WeatherForecast7Days/v2/?uid=${uid}&ukey=${key}&format=json`, { headers: ua });
  const j = await r.json();
  const provs = (j.Provinces && (j.Provinces.Province || j.Provinces)) || j.Province || [];
  const list = Array.isArray(provs) ? provs : [provs];
  const p = list.find(x => JSON.stringify(x).includes(province)); if (!p) return null;
  const fc = (p.SevenDaysForecast || p.Forecast || [])[0] || p;
  const pick = (o, re) => { for (const k in o) if (re.test(k)) return typeof o[k] === "object" ? (o[k].Value ?? o[k]["#text"] ?? o[k]) : o[k]; return undefined; };
  return { hi: +pick(fc, /^Max.*Temp/i), lo: +pick(fc, /^Min.*Temp/i), text: pick(fc, /Description(Thai)?$/i) || "", source: "Thai Meteorological Department", station: province };
}
async function singapore() {
  const r = await fetch("https://api.data.gov.sg/v1/environment/24-hour-weather-forecast", { headers: ua });
  const j = await r.json(); const g = j.items && j.items[0] && j.items[0].general; if (!g) return null;
  return { hi: g.temperature && g.temperature.high, lo: g.temperature && g.temperature.low, text: g.forecast || "", source: "新加坡国家环境局 NEA", station: "Singapore" };
}
const WMO = { 0: "晴", 1: "晴间多云", 2: "多云", 3: "阴", 45: "雾", 48: "雾", 51: "小毛毛雨", 53: "毛毛雨", 55: "毛毛雨", 61: "小雨", 63: "中雨", 65: "大雨", 80: "阵雨", 81: "阵雨", 82: "强阵雨", 95: "雷阵雨", 96: "雷阵雨", 99: "强雷阵雨" };
async function openMeteo(lat, lng) {
  const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto&forecast_days=1`);
  const j = await r.json();
  return { temp: j.current && j.current.temperature_2m, hi: j.daily && j.daily.temperature_2m_max[0], lo: j.daily && j.daily.temperature_2m_min[0], text: WMO[j.daily && j.daily.weather_code[0]] || "", source: "Open-Meteo（备用）" };
}
export default async (req) => {
  const u = new URL(req.url), cc = u.searchParams.get("cc"), name = u.searchParams.get("name") || "", lat = u.searchParams.get("lat"), lng = u.searchParams.get("lng");
  let out = null;
  try { out = cc === "CN" ? await china(name) : cc === "MY" ? await malaysia(name) : cc === "TH" ? await thailand(name) : cc === "SG" ? await singapore() : null; } catch (e) { out = null; }
  if (!out && lat && lng) { try { out = await openMeteo(lat, lng); } catch (e) {} }
  return out ? J(out) : J({ error: "unavailable" }, 502);
};
