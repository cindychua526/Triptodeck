/* Trip map: our itinerary as routes on a live map (高德 tiles work well in China; OSM as fallback). */
import { ic } from "../lib/icons.js";
/* leaflet is only loaded the first time a map is shown, so the app opens faster */
let L = null, loadingL = null;
const loadLeaflet = () => loadingL || (loadingL = Promise.all([import("leaflet"), import("leaflet/dist/leaflet.css")]).then(([m]) => { L = m.default || m; return L; }));
import { api } from "../lib/api.js";
import { esc, toMin, shortDate, weekday, today, wait } from "../lib/util.js";
import { toast } from "../lib/ui.js";
import { sfx } from "../lib/sound.js";
import { COORDS, STAYS } from "../data/fujian.js";
import { GUIDES } from "../data/guides.js";
const guideLL = n => { for (const g of GUIDES) { const s = g.spots.find(x => x.n === n); if (s && s.ll) return s.ll; } return null; };

const DAYC = ["#e0a458", "#6fb3a8", "#e07a5f", "#8fa9d9", "#d9b36a", "#b58fd1", "#7fbf7f", "#e39bb0", "#c9c9c9"];
const SKIP = /^(早餐|午餐|晚餐|回酒店|回民宿|CHECK OUT)$|^(打车|步行|地铁)/;
/* WGS-84 ⇄ GCJ-02 (China map offset) */
const PI = Math.PI, A = 6378245.0, EE = 0.00669342162296594323;
function tLat(x, y) { let r = -100 + 2 * x + 3 * y + .2 * y * y + .1 * x * y + .2 * Math.sqrt(Math.abs(x)); r += (20 * Math.sin(6 * x * PI) + 20 * Math.sin(2 * x * PI)) * 2 / 3; r += (20 * Math.sin(y * PI) + 40 * Math.sin(y / 3 * PI)) * 2 / 3; r += (160 * Math.sin(y / 12 * PI) + 320 * Math.sin(y * PI / 30)) * 2 / 3; return r; }
function tLng(x, y) { let r = 300 + x + 2 * y + .1 * x * x + .1 * x * y + .1 * Math.sqrt(Math.abs(x)); r += (20 * Math.sin(6 * x * PI) + 20 * Math.sin(2 * x * PI)) * 2 / 3; r += (20 * Math.sin(x * PI) + 40 * Math.sin(x / 3 * PI)) * 2 / 3; r += (150 * Math.sin(x / 12 * PI) + 300 * Math.sin(x / 30 * PI)) * 2 / 3; return r; }
function toGcj(lat, lng) { let dLat = tLat(lng - 105, lat - 35), dLng = tLng(lng - 105, lat - 35); const rl = lat / 180 * PI; let m = Math.sin(rl); m = 1 - EE * m * m; const s = Math.sqrt(m); dLat = dLat * 180 / ((A * (1 - EE)) / (m * s) * PI); dLng = dLng * 180 / (A / s * Math.cos(rl) * PI); return [lat + dLat, lng + dLng]; }
function toWgs(lat, lng) { const [a, b] = toGcj(lat, lng); return [lat * 2 - a, lng * 2 - b]; }

let map = null, el = null, tiles = null, layers = null, provider = localStorage.getItem("td-map-tiles") || "amap", dark = localStorage.getItem("td-map-dark") !== "0";
let placing = null, editPins = false, meMarker = null, geoBusy = false;
const fwd = (lat, lng) => provider === "amap" ? toGcj(lat, lng) : [lat, lng];
const back = (lat, lng) => provider === "amap" ? toWgs(lat, lng) : [lat, lng];
export const coordOf = a => (a.lat && a.lng) ? [a.lat, a.lng] : (COORDS[a.title] || guideLL(a.title) || null);

function setTiles() {
  if (!map) return;
  if (tiles) map.removeLayer(tiles);
  tiles = provider === "amap"
    ? L.tileLayer("https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}", { subdomains: "1234", maxZoom: 18, attribution: "© 高德地图" })
    : L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "© OpenStreetMap" });
  let ok = 0, bad = 0; tiles.on("tileload", () => { ok++; el.classList.remove("no-tiles"); }); tiles.on("tileerror", () => { bad++; if (!ok && bad > 3) el.classList.add("no-tiles"); });
  tiles.addTo(map);
  el.classList.toggle("dark", dark);
}
function ensureMap() {
  if (map) return;
  el = document.createElement("div"); el.className = "tmap"; el.dataset.noi18n = "1";
  map = L.map(el, { zoomControl: false, attributionControl: true }).setView([24.46, 118.09], 12);
  L.control.zoom({ position: "bottomright" }).addTo(map);
  layers = L.layerGroup().addTo(map);
  setTiles();
  map.on("click", async e => {
    if (!placing) return;
    const [lat, lng] = back(e.latlng.lat, e.latlng.lng), a = placing; placing = null; el.classList.remove("placing");
    try { await api.updateActivity(a.id, { lat, lng }); sfx.stamp(); toast(`已把「${a.title}」放在这里`); } catch (er) { toast("没能保存位置"); }
  });
}
let lastKey = "";
export function mountMap(holder, opts) {
  if (!L) { loadLeaflet().then(() => { if (holder && holder.isConnected) mountMap(holder, opts); }); return; }
  return mountMap0(holder, opts);
}
function mountMap0(holder, { acts, days, day, onCheckin }) {
  ensureMap();
  holder.appendChild(el);
  setTimeout(() => map.invalidateSize(), 30);
  draw(acts, days, day, onCheckin);
}
function draw(acts, days, day, onCheckin) {
  layers.clearLayers();
  const show = day === "all" ? days : [day], bounds = [];
  const missing = [];
  show.forEach(d => {
    const di = days.indexOf(d), col = DAYC[di % DAYC.length];
    const list = acts.filter(a => a.date === d && a.status !== "removed" && !SKIP.test(a.title)).sort((x, y) => toMin(x.time) - toMin(y.time));
    const pts = [];
    list.forEach((a, i) => {
      const c = coordOf(a); if (!c) { if (a.kind !== "transit") missing.push(a); return; }
      const ll = fwd(c[0], c[1]); pts.push(ll); bounds.push(ll);
      const n = pts.length, dead = a.status === "skipped";
      const icon = L.divIcon({ className: "pin-wrap", iconSize: [30, 30], iconAnchor: [15, 15], html: `<div class="pin${dead ? " dead" : ""}${a.status === "done" ? " done" : ""}" style="--c:${col}"><b>${a.status === "done" ? "✓" : n}</b></div><span class="pin-lbl">${esc(a.title.replace(/（.*?）/g, ""))}</span>` });
      const mk = L.marker(ll, { icon, draggable: editPins, keyboard: true, title: a.title }).addTo(layers);
      mk.bindPopup(`<div class="pop"><small>Day ${di + 1} · ${shortDate(d)} ${weekday(d)} · ${a.time}</small><b>${esc(a.title)}</b>${a.status === "skipped" ? "<em>已被传送门跳过</em>" : ""}
        <div class="pop-btns"><button data-ci="${a.id}">${ic("camera")} 打卡</button><a href="https://uri.amap.com/marker?position=${c[1]},${c[0]}&name=${encodeURIComponent(a.title)}&coordinate=wgs84&callnative=1" target="_blank" rel="noopener">导航</a></div></div>`, { closeButton: false });
      mk.on("popupopen", ev => { const b = ev.popup.getElement().querySelector("[data-ci]"); if (b) b.onclick = () => { map.closePopup(); onCheckin(a); }; });
      mk.on("dragend", async () => { const p = mk.getLatLng(), [lat, lng] = back(p.lat, p.lng); try { await api.updateActivity(a.id, { lat, lng }); toast(`「${a.title}」的位置已更新`); } catch (e) { toast("没能保存位置"); } });
    });
    if (pts.length > 1) { L.polyline(pts, { color: col, weight: 6, opacity: .22 }).addTo(layers); L.polyline(pts, { color: col, weight: 2.5, opacity: .95, className: "route-line" }).addTo(layers); }
  });
  const key = day + "|" + bounds.length;
  if (bounds.length && key !== lastKey) { map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 }); lastKey = key; }
  geocode(missing);
  return missing;
}
/* look up places we don't have coordinates for (OpenStreetMap Nominatim, 1 request/second) */
const tried = new Set();
async function geocode(list) {
  if (geoBusy) return; geoBusy = true;
  for (const a of list) {
    if (tried.has(a.id)) continue; tried.add(a.id);
    let q = a.title.replace(/^CHECK IN /, "").replace(/（.*?）|\(.*?\)/g, "").replace(/ · .*/, "").trim();
    const stay = STAYS.find(s => a.title.includes("CHECK IN") && s.in === a.date); if (stay) q = stay.name.replace(/（|）/g, " ");
    try {
      /* search around this trip's own cities (it used to be locked to a box around Fujian, so KL, Bangkok, Tokyo… never found anything) */
      const g = GUIDES.find(x => x.name === a.city) || GUIDES.find(x => (api.trip && api.trip.cities || []).includes(x.id)), box = g && g.ll ? `&viewbox=${g.ll[1] - 1.2},${g.ll[0] + 1.2},${g.ll[1] + 1.2},${g.ll[0] - 1.2}&bounded=1` : "";
      const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&accept-language=zh${box}&q=${encodeURIComponent(q + " " + (a.city || ""))}`);
      const j = await r.json();
      if (j && j[0]) await api.updateActivity(a.id, { lat: +j[0].lat, lng: +j[0].lon });
    } catch (e) {}
    await wait(1100);
  }
  geoBusy = false;
}
export function mapTools() {
  return { provider, dark, editPins,
    setProvider(p) { provider = p; localStorage.setItem("td-map-tiles", p); setTiles(); lastKey = ""; },
    setDark(v) { dark = v; localStorage.setItem("td-map-dark", v ? "1" : "0"); el && el.classList.toggle("dark", v); },
    setEdit(v) { editPins = v; lastKey = "x"; },
    place(a) { placing = a; el.classList.add("placing"); toast(`在地图上点一下，放置「${a.title}」`); },
    locate() { if (!navigator.geolocation) return toast("拿不到定位"); navigator.geolocation.getCurrentPosition(p => { const ll = fwd(p.coords.latitude, p.coords.longitude); if (meMarker) meMarker.remove(); meMarker = L.circleMarker(ll, { radius: 8, color: "#fff", weight: 2, fillColor: "#c8472f", fillOpacity: 1 }).addTo(map); map.setView(ll, 15); }, () => toast("没有拿到定位"), { timeout: 8000 }); }
  };
}
export function missingCoords(acts, day, days) { const show = day === "all" ? days : [day]; return acts.filter(a => show.includes(a.date) && a.status !== "removed" && a.kind !== "transit" && !SKIP.test(a.title) && !coordOf(a)); }
