/* 手账: every trip is a shelf of keepsakes — passport of stamps, photo album, stamp archive,
   food-ticket wallet, diary and the final receipt. Everything here is private to you. */
import { api, on } from "../lib/api.js";
import { $, esc, shortDate, weekday, hash, addDays, today } from "../lib/util.js";
import { toast, openSheet, closeSheet, bind, askConfirm, askText } from "../lib/ui.js";
import { sfx } from "../lib/sound.js";
import { placeStamp, citySeal, waxSeal , cityMedal, MEDAL_AT } from "../data/stamps.js";
import { posterStamp } from "../data/posterstamp.js";
import { doodle } from "../data/doodles.js";
import { foodArt } from "../data/foodart.js";
import { mus } from "../lib/sound.js";
const postageStamp = (name, city, date, kind) => posterStamp({ name, city, date, kind }, { cityEn: (guideFor(city) || {}).en });
import { guideFor } from "../data/guides.js";
import { makePoster } from "./poster.js";
import { lookChips, bindLookChips } from "../lib/look.js";
import { departuresOf, sealCeremony } from "./arrive.js";
import { tripDays, cityOf, dayActs as dayActsOf, tripCityNames } from "./trip.js";
import { shrinkImage, dataUrlToBlob } from "../lib/util.js";
import { openFlipbook } from "./flipbook.js";
import { t as T } from "../lib/i18n.js";
import { openReceipt } from "./receipt.js";
import { openShelf } from "./trips.js";
import { isGrey, greySvg, GREY_NOTE } from "../lib/grey.js";

let stamps = [], trips = [], importedTickets = null;
import("./tickets.js").then(m => { importedTickets = m; });
export const myStamps = () => stamps;
export async function loadStamps() { syncSelfie(); try { stamps = await api.stamps(); trips = await api.listTrips(); } catch (e) { stamps = []; } renderBook(); medalCheck(); }
on("stamps", async () => { stamps = await api.stamps(); renderBook(); medalCheck(); });
/* first time a city reaches MEDAL_AT place stamps: a banner, once */
function medalCheck() {
  if (!api.trip) return; const by = {}; stamps.filter(s => (s.kind === "place" || s.kind === "special") && s.trip_id === api.trip.id).forEach(s => by[s.city] = (by[s.city] || 0) + 1);
  Object.entries(by).filter(([, n]) => n >= MEDAL_AT).forEach(([c]) => { const k = `td-medal:${api.trip.id}:${c}`; try { if (localStorage.getItem(k)) return; localStorage.setItem(k, "1"); } catch (e) { return; }
    import("../lib/notify.js").then(m => m.banner({ kind: "reviewed", id: k, art: cityMedal(c, by[c], today()), kicker: T("解锁城市勋章", "Medal unlocked"), title: T(`${c}城市勋章到手！`, `${c} city medal unlocked!`), body: T(`在${c}盖了 ${by[c]} 枚章，去护照看看`, `${by[c]} stamps in ${c} — see your passport`), action: T("去看看", "Open") })); });
}
on("trip", async () => { try { trips = await api.listTrips(); } catch (e) {} renderBook(); });
on("wallet", () => renderBook());
document.addEventListener("td-grey", () => { renderBook(); document.dispatchEvent(new Event("td-sv-refresh")); });

export function placeStampSVG(name, cityName, date, special) { return placeStamp(name, cityName, date, { special }); }
const stampRaw = s => s.kind === "city" ? citySeal(s.city || s.name, s.date) : s.kind === "experience" ? waxSeal(s.name, s.city, s.date) : placeStamp(s.name, s.city, s.date, { special: s.kind === "special" });
export const stampFor = s => isGrey(s) ? greySvg(stampRaw(s)) : stampRaw(s);
export async function ensureEntrySeal() {}
export async function addCityStamp() {}
export function flyToTab(svg, fromRect) {
  const tab = $("tab-collect"); if (!tab || !fromRect || !fromRect.width) return;
  const tr = tab.getBoundingClientRect(), f = document.createElement("div"); f.className = "stamp-fly";
  Object.assign(f.style, { left: fromRect.left + "px", top: fromRect.top + "px", width: fromRect.width + "px", height: fromRect.height + "px" });
  f.innerHTML = svg; document.body.appendChild(f);
  const dx = tr.left + tr.width / 2 - (fromRect.left + fromRect.width / 2), dy = tr.top + tr.height / 2 - (fromRect.top + fromRect.height / 2);
  f.animate([{ transform: "rotate(-12deg) scale(1)", opacity: 1 }, { transform: `translate(${dx * .4}px,${dy * .4 - 40}px) rotate(10deg) scale(.8)`, opacity: 1, offset: .45 }, { transform: `translate(${dx}px,${dy}px) rotate(30deg) scale(.12)`, opacity: .3 }], { duration: 900, easing: "cubic-bezier(.5,0,.3,1)", fill: "forwards" }).onfinish = () => { f.remove(); tab.classList.remove("bump"); void tab.offsetWidth; tab.classList.add("bump"); sfx.tap(); };
}
const tripStamps = () => api.trip ? stamps.filter(s => s.trip_id === api.trip.id) : [];
const short = n => n.replace(/（.*?）|\(.*?\)/g, "").replace(/ · .*/, "").trim();
const cover = () => { const g = guideFor((api.trip && api.trip.cities || [])[0]); return g ? g.color : "#3a2c1f"; };

/* ---------- the trip shelf ---------- */
export function renderBook() {
  const root = $("bookRoot"); if (!root) return;
  if (!api.trip) { root.innerHTML = ""; return; }
  const ss = tripStamps(), seals = ss.filter(s => s.kind === "city"), places = ss.filter(s => s.kind === "place" || s.kind === "special"), exps = ss.filter(s => s.kind === "experience"), photos = ss.filter(s => s.photo_path);
  const t = api.trip, ended = today() >= t.end_date, last = photos[photos.length - 1];
  const pouch = localStorage.getItem("td-pouch") || "gold";
  const g = guideFor((t.cities || [])[0]), stampsFan = places.slice(-3), inks = [...seals.slice(-1), ...places.slice(-2)];
  root.innerHTML = `<div class="bk2-top"><button class="trip-sw" data-act="lib"><small>MY TRAVEL BOOK · ${T("只有你看得到", "only you can see")} ⇄</small><h2>${esc(t.name)}</h2><span>${g ? esc(g.en) : ""} · ${(t.start_date || "").slice(5).replace("-", ".")} – ${(t.end_date || "").slice(5).replace("-", ".")}</span></button><div class="bk2-acts"><button class="icon-btn" data-open="receipt">${T("发票", "Receipt")}</button><button class="icon-btn" data-act="poster" aria-label="生成海报">${T("海报", "Poster")}</button></div></div>
    <div class="bk2">
      <button class="bk2-t" data-open="album"><span class="bk2-pv al" ${last ? `data-bg="${esc(last.photo_path)}"` : ""}>${last ? "" : `<i class="bk2-empty">${doodle("camera", { sketch: true, accent: "#c8c8cc", ink: "#c8c8cc" })}</i>`}</span><span class="bk2-l"><b>${T("相册", "Album")}</b><small>${photos.length} ${T("张照片", "photos")}</small></span></button>
      <button class="bk2-t" data-open="archive"><span class="bk2-pv st">${stampsFan.length ? stampsFan.map((x, i) => `<i style="--i:${i}">${postageStamp(x.name, x.city, x.date)}</i>`).join("") : `<i class="bk2-empty">${doodle("ticket", { sketch: true, accent: "#c8c8cc", ink: "#c8c8cc" })}</i>`}</span><span class="bk2-l"><b>${T("邮票集", "Stamps")}</b><small>${places.length} ${T("张", "stamps")}</small></span></button>
      <button class="bk2-t" data-open="passport"><span class="bk2-pv pp">${inks.length ? inks.map((x, i) => `<i style="--i:${i}">${stampFor(x)}</i>`).join("") : `<i class="bk2-empty">${doodle("star", { sketch: true, accent: "#c8c8cc", ink: "#c8c8cc" })}</i>`}</span><span class="bk2-l"><b>${T("印章护照", "Passport")}</b><small>${seals.length} ${T("枚入境章", "entry")} · ${places.length + exps.length} ${T("枚印章", "seals")}</small></span></button>
      <button class="bk2-t" data-open="diary"><span class="bk2-pv dy" id="bk2Diary"><em>${T("写几句今天…", "A few lines…")}</em></span><span class="bk2-l"><b>${T("旅行日记", "Diary")}</b><small>${T("每天一页，只有你看得到", "One page a day, private")}</small></span></button>
      <button class="bk2-t" data-open="wallet"><span class="bk2-pv wl" id="bk2Wallet"><i class="bk2-empty">${doodle("noodles", { sketch: true, accent: "#c8c8cc", ink: "#c8c8cc" })}</i></span><span class="bk2-l"><b>${T("美食票夹", "Food tickets")}</b><small><span id="walletCount">0</span> ${T("张", "tickets")}</small></span></button>
      <button class="bk2-t" data-open="shared"><span class="bk2-pv sh" id="bk2Shared"><i class="bk2-empty">${doodle("camera", { sketch: true, accent: "#c8c8cc", ink: "#c8c8cc" })}</i></span><span class="bk2-l"><b>${T("大家的相册", "Everyone's photos")}</b><small id="bk2SharedN">${T("房间里每个人都看得到", "Everyone in the room")}</small></span></button>
    </div>
    <p class="col-note"><button class="linkbtn" data-act="how">${T("印章和邮票怎么收集？", "How do I collect stamps?")}</button></p>`;
  if (!root.querySelector(".bk2-pv.al[data-bg]")) Promise.all([api.foodPhotos(), api.sharedPhotos()]).then(async ([F, S]) => { const m = [...F, ...S].filter(x => x.user_id === api.me.id).sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))[0]; const al = root.querySelector(".bk2-pv.al"); if (m && al) { const u = await api.sharedUrl(m.photo_path); if (u && al.isConnected) { al.innerHTML = ""; al.style.backgroundImage = `url("${u}")`; } } }).catch(() => {});
  api.sharedPhotos().then(async L => { const el = $("bk2Shared"), n = $("bk2SharedN"); if (n) n.textContent = L.length ? `${L.length} 张 · 大家都看得到` : "房间里每个人都看得到"; if (el && L.length) { el.innerHTML = L.slice(0, 4).map(p => `<i class="bk2-sp" data-p="${esc(p.photo_path)}"></i>`).join(""); for (const d of el.querySelectorAll("[data-p]")) { const u = await api.sharedUrl(d.dataset.p); if (u && d.isConnected) d.style.backgroundImage = `url("${u}")`; } } }).catch(() => {});
  import("./tickets.js").then(m => { const W = (m.walletItems ? m.walletItems() : []).slice(-3), el = $("bk2Wallet"); if (el && W.length) el.innerHTML = W.map((w, i) => `<i class="bk2-stub" style="--i:${i}"><span>${foodArt(w.name)}</span><b>${esc(w.name)}</b></i>`).join(""); });
  import("../lib/journal.js").then(async m => { const J = await m.getJournal(t.id), txt = J.summary || Object.keys(J.days).sort().map(k => J.days[k]).filter(Boolean).pop() || ""; const el = $("bk2Diary"); if (el && txt) el.innerHTML = `<p>${esc(txt.slice(0, 60))}</p>`; });
  root.querySelectorAll("[data-open]").forEach(b => b.onclick = () => { sfx.click(); OPEN[b.dataset.open](); });
  root.querySelector("[data-act=lib]").onclick = () => openShelf();
  root.querySelector("[data-act=poster]").onclick = openPoster;
  root.querySelector("[data-act=how]").onclick = () => { const sh = openSheet(`<div class="as"><small class="as-k">HOW TO COLLECT</small><h3>印章和邮票怎么收集</h3>
    <div class="how"><div><span>${citySeal("厦门", today())}</span><p><b>入境章</b>每到一座新城市，「今日」页会出现「抵达 · 盖入境章」，点一下盖上。一座城市一枚，盖在印章护照那座城市的第一页。</p></div>
    <div><span>${placeStamp("日光岩", "厦门", today())}</span><p><b>地点印章</b>到了行程里的地方，点它拍一张符合任务的照片，交给旅伴。任何一位旅伴确认后，印章就盖进印章护照。个人旅行拍完直接盖。</p></div>
    <div><span>${postageStamp("日光岩", "厦门", today())}</span><p><b>邮票</b>不用另外做什么：同一次打卡通过时，也会寄来一张盖了邮戳的邮票，收进邮票集。所以打卡越多，邮票越多。</p></div>
    <div><span>${placeStamp("巷子里的茶馆", "厦门", today(), { special: true })}</span><p><b>奇遇星章</b>去了计划外的地方？在行程页点「临时打卡」，写下地方、拍照、旅伴确认，拿到星形印章。</p></div>
    <div><span>${waxSeal("蟳埔簪花围", "泉州", today())}</span><p><b>体验印记</b>攻略里的「特色体验」（比如泉州簪花），完成后点「我体验了」拍照确认，拿到一枚蜡封印记。</p></div></div>
    <div class="as-btns"><button class="btn ink full" data-act="close">知道了</button></div></div>`, { accent: "#3a2c1f" }); bind(sh, { close: closeSheet }); };
  const bg = root.querySelector("[data-bg]"); if (bg) api.photoUrl(bg.dataset.bg).then(u => { if (u && bg.isConnected) bg.style.backgroundImage = `url("${u}")`; });
  const wc = $("walletCount"); if (wc) api.wallet().then(w => { if (wc.isConnected) wc.textContent = w.filter(x => x.trip_id === t.id).length; }).catch(() => {});
}
export function openPoster() { import("./poster2.js").then(m => m.openPosterStudio()); }
function poster() {
  const t = api.trip, extra = {}; const me = departuresOf().find(d => d.user_id === api.me.id); if (me) extra.origin = me.origin;
  const segs = []; tripDays().forEach(d => { const c = cityOf(d), last = segs[segs.length - 1]; if (last && last.city === c) last.to = d; else segs.push({ city: c, from: d, to: d }); }); extra.segments = segs;
  makePoster(t, tripStamps(), extra);
}
/* passport photo: your own selfie, kept on this phone — it never changes by itself */
const selfieKey = () => "td-selfie:" + ((api.me && api.me.id) || "me");
export function getSelfie() { try { return localStorage.getItem(selfieKey()) || null; } catch (e) { return null; } }
export function setSelfie(url) { try { localStorage.setItem(selfieKey(), url); } catch (e) { toast("手机空间不够，照片没存下来"); }
  if (api.saveSelfie) api.saveSelfie(dataUrlToBlob(url)).catch(() => {}); }
/* new phone or cleared storage: bring the passport selfie back from the cloud */
export async function syncSelfie() {
  if (getSelfie() || !api.loadSelfie || !api.me) return;
  try { const u = await api.loadSelfie(); if (!u) return; const b = await (await fetch(u)).blob(); const d = await new Promise(r => { const f = new FileReader(); f.onload = () => r(f.result); f.readAsDataURL(b); }); localStorage.setItem(selfieKey(), d); renderBook(); } catch (e) {}
}
/* ---------- readers ---------- */
const OPEN = {
  async passport() {
    const ss = tripStamps(), t = api.trip, dep = departuresOf().find(d => d.user_id === api.me.id), days = tripDays();
    const cities = [...new Set([...days.map(d => cityOf(d)), ...tripCityNames(), ...ss.map(s => s.city)].filter(Boolean))];
    const face = getSelfie();
    const hib = `<svg viewBox="0 0 100 100" class="pp-hib" fill="none" stroke="currentColor" stroke-width="1.6">${[0, 72, 144, 216, 288].map(r => `<path transform="rotate(${r} 50 50)" d="M50 50C38 40 36 18 50 10C64 18 62 40 50 50Z"/>`).join("")}<circle cx="50" cy="50" r="4.5"/><path d="M50 50L66 28"/><circle cx="67" cy="26" r="1.8" fill="currentColor"/><circle cx="71" cy="30" r="1.4" fill="currentColor"/><circle cx="63" cy="23" r="1.4" fill="currentColor"/><circle cx="50" cy="50" r="46" stroke-width=".8"/><circle cx="50" cy="50" r="42" stroke-width=".5"/></svg>`;
    const chip = `<svg viewBox="0 0 40 26" class="pp-chip" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="1" y="1" width="38" height="24" rx="2"/><circle cx="20" cy="13" r="6"/><path d="M1 13h13M26 13h13"/></svg>`;
    const mrz = (x => x.toUpperCase().replace(/[^A-Z0-9]/g, "<"))((api.me.name || "TRAVELLER").split("").map(c => /[a-z0-9]/i.test(c) ? c : "").join("") || "TRAVELLER");
    const no = "TD" + String(hash(t.id) % 10000000).padStart(7, "0");
    const g = `<i class="pp-gui"></i>`;
    const pages = [
      `<div class="pp-page mcover" data-noi18n><small class="mc-top">MALAYSIA · 马来西亚</small>${hib}<b class="mc-t1">PASPORT</b><b class="mc-t2">PASSPORT · 旅行护照</b>${chip}<span class="mc-trip">${esc(t.name)}</span><em class="mc-by">THE TRIP DECK</em></div>`,
      `<div class="pp-page mdata" data-noi18n>${g}<div class="md-h"><b>PASPORT · PASSPORT</b><span>${no}</span></div>
        <div class="md-body"><button class="md-ph pp-photo pp-selfie" data-nofl data-selfie ${face ? `style="background-image:url('${face}')"` : ""} aria-label="自拍一张护照照片">${face ? `<i class="pp-re">重拍</i>` : `<span>${T("点这里<br>自拍一张", "Tap for<br>a selfie")}</span>`}</button><input type="file" accept="image/*" capture="user" id="ppSelfie" hidden>
        <dl><dt>Nama / Name / 姓名</dt><dd>${esc(api.me.name)}</dd><dt>Perjalanan / Trip / 旅行</dt><dd>${esc(t.name)}</dd><dt>Tarikh / Dates / 日期</dt><dd>${shortDate(t.start_date)} – ${shortDate(t.end_date)}</dd><dt>Dari / From / 出发地</dt><dd>${esc(dep ? dep.origin : "—")}</dd><dt>Bandar / Cities / 城市</dt><dd>${esc(cities.join(" · ") || "—")}</dd></dl></div>
        <div class="md-mrz">P&lt;TDK${mrz.padEnd(20, "<").slice(0, 20)}&lt;&lt;${String(ss.length).padStart(2, "0")}<br>${no}&lt;${(t.start_date || "").replace(/-/g, "").slice(2)}&lt;${(t.end_date || "").replace(/-/g, "").slice(2)}&lt;&lt;&lt;&lt;</div></div>`
    ];
    cities.forEach((c, ci) => {
      const seal = ss.find(s => s.kind === "city" && s.city === c), rest = ss.filter(s => s.kind !== "city" && s.city === c).sort((a, b) => a.date.localeCompare(b.date));
      for (let i = 0; i < Math.max(1, Math.ceil(rest.length / 6)); i++) {
        const chunk = rest.slice(i * 6, i * 6 + 6);
        pages.push(`<div class="pp-page mvisa" data-noi18n>${g}<div class="mv-h"><small>VISA · 签证 · ${String(pages.length).padStart(2, "0")}</small><b>${esc(c)}</b><span>${i ? "续页 · continued" : seal ? "入境 · Arrival " + shortDate(seal.date) : "还没盖入境章 · Not yet arrived"}</span></div>
          ${!i ? (seal ? `<div class="mv-seal">${stampFor(seal)}</div>` : `<div class="mv-seal empty"><span>${esc(c)}</span><small>抵达后盖一枚</small><button class="btn sm ink" data-nofl data-seal="${esc(c)}">✦ 盖入境章</button></div>`) : ""}
          ${!i ? (rest.length >= MEDAL_AT ? `<button class="mv-medal" data-nofl data-medal="${esc(c)}">${cityMedal(c, rest.length, rest[MEDAL_AT - 1].date)}</button>` : `<p class="mv-prog"><i style="--w:${rest.length / MEDAL_AT * 100}%"></i><span>${T(`再盖 ${MEDAL_AT - rest.length} 枚，解锁${c}城市勋章`, `${MEDAL_AT - rest.length} more to unlock the ${c} medal`)}</span></p>`) : ""}
          <div class="mv-grid">${chunk.map(s => { const h = hash(s.id); return `<div class="pp-st" style="--r:${(h % 25) - 12}deg;--dx:${(h >> 3) % 15 - 7}px;--dy:${(h >> 5) % 13 - 6}px;--ink:${.72 + ((h >> 7) % 25) / 100}">${stampFor(s)}</div>`; }).join("")}</div><span class="mv-no">${pages.length}</span></div>`);
      }
    });
    pages.push(`<div class="pp-page mvisa" data-noi18n>${g}<div class="mv-h"><small>VISA · 签证</small><b>下一站</b><span>This page is left for the next journey.</span></div><div class="mv-seal empty"><span>？</span><small>留给下一段旅程</small></div></div>`);
    openFlipbook({ pages, theme: "passport", title: "印章护照", after: async ov => {
      const sb = ov.querySelector("[data-selfie]"), fi = ov.querySelector("#ppSelfie");
      if (sb && fi) { sb.onclick = e => { e.stopPropagation(); fi.click(); }; fi.onchange = async () => { const f = fi.files && fi.files[0]; if (!f) return; try { const url = await shrinkImage(f, 420, .82); setSelfie(url); sb.style.backgroundImage = `url('${url}')`; sb.innerHTML = `<i class="pp-re">重拍</i>`; sfx.stamp(); toast("护照照片换好了，以后都用这张"); } catch (er) { toast("这张照片读不出来，换一张试试"); } }; }
      ov.querySelectorAll("[data-medal]").forEach(b => b.onclick = e => { e.stopPropagation(); const c = b.dataset.medal, list = stamps.filter(s => s.city === c && (s.kind === "place" || s.kind === "special"));
        const m = document.createElement("div"); m.className = "medal-ov"; m.innerHTML = `<div class="medal-big">${cityMedal(c, list.length, (list[MEDAL_AT - 1] || list[list.length - 1] || {}).date || today())}</div><b>${esc(c)}</b><p>${T(`你在${c}盖了 ${list.length} 枚章`, `${list.length} stamps collected in ${c}`)}</p><small>${list.map(s => esc(short(s.name))).join(" · ")}</small>`;
        m.onclick = () => { m.classList.remove("on"); setTimeout(() => m.remove(), 300); }; document.body.appendChild(m); requestAnimationFrame(() => m.classList.add("on")); [0, 4, 7, 12].forEach((n, i) => mus.chime(n, .03, i * .08)); });
      ov.querySelectorAll("[data-seal]").forEach(b => b.onclick = e => { e.stopPropagation(); const c = b.dataset.seal, d = tripDays().find(x => cityOf(x) === c) || today(); ov.querySelector(".fb-x").click(); setTimeout(() => sealCeremony(c, d <= today() ? d : today()), 380); });
      for (const el of ov.querySelectorAll("[data-cpath]")) { const u = await api.photoUrl(el.dataset.cpath); if (u && el.isConnected) el.style.backgroundImage = `url("${u}")`; } } });
  },
  async album() {
    let fp = [], sp = []; try { [fp, sp] = await Promise.all([api.foodPhotos(), api.sharedPhotos()]); } catch (e) {}
    const mine = x => x.user_id === api.me.id;
    const ph = [...tripStamps().filter(s => s.photo_path).map(s => ({ ...s, k: "stamp" })), ...fp.filter(mine).map(f => ({ id: f.id, photo_path: f.photo_path, name: f.food, date: f.date, caption: f.caption, k: "food" })), ...sp.filter(mine).map(f => ({ id: f.id, photo_path: f.photo_path, name: "", date: f.date, caption: f.caption, k: "shared" }))].sort((a, b) => String(a.date).localeCompare(String(b.date)));
    const t = api.trip, dep = departuresOf().find(d => d.user_id === api.me.id), src = p => p.k === "stamp" || p.dep ? `data-cpath="${esc(p.photo_path)}"` : `data-spath="${esc(p.photo_path)}"`;
    const byDay = {}; ph.forEach(s => (byDay[s.date] = byDay[s.date] || []).push(s));
    if (dep && dep.photo_path) (byDay[t.start_date] = byDay[t.start_date] || []).unshift({ photo_path: dep.photo_path, name: "出发", date: t.start_date, dep: true });
    const months = []; for (let d = t.start_date.slice(0, 7) + "-01"; d <= t.end_date; ) { months.push(d.slice(0, 7)); const [y, m] = d.split("-").map(Number); d = `${m === 12 ? y + 1 : y}-${String(m === 12 ? 1 : m + 1).padStart(2, "0")}-01`; }
    const MZ = ["", "一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"];
    const cov = ph.slice(-3).reverse();
    const pages = [`<div class="al-page cover"><small>ALBUM · 相册</small><div class="al-cov">${cov.length ? cov.map((p, i) => `<i style="--i:${i}" ${src(p)}></i>`).join("") : `<em class="al-cov-empty">打卡、撕票、上传的照片<br>都会贴在这里</em>`}</div><b>${esc(t.name)}</b><em>${ph.length} 张照片</em><div class="al-looks"><small>滤镜 · 整本一起换</small>${lookChips()}</div></div>`, ...months.map(mo => {
      const [y, m] = mo.split("-").map(Number), first = new Date(y, m - 1, 1), n = new Date(y, m, 0).getDate(), lead = (first.getDay() + 6) % 7;
      const cells = []; for (let i = 0; i < lead; i++) cells.push(`<div class="cal-c empty"></div>`);
      for (let d = 1; d <= n; d++) { const iso = `${mo}-${String(d).padStart(2, "0")}`, inTrip = iso >= t.start_date && iso <= t.end_date, p = byDay[iso];
        cells.push(`<div class="cal-c${inTrip ? " trip" : ""}${p ? " has" : ""}" ${p ? `${src(p[0])} data-day="${iso}"` : ""}><span>${d}</span>${p && p.length > 1 ? `<i>${p.length}</i>` : ""}</div>`); }
      return `<div class="al-page cal"><div class="cal-h"><b>${MZ[m]}</b><em>${y}</em><span>${String(m).padStart(2, "0")}</span></div><div class="cal-w">${"一二三四五六日".split("").map(x => `<span>${x}</span>`).join("")}</div><div class="cal-g">${cells.join("")}</div></div>`;
    }), ...Object.keys(byDay).sort().map(d => `<div class="al-page day"><div class="cal-h"><b>${shortDate(d)}</b><em>${weekday(d)} · ${esc(cityOf(d))}</em></div><div class="day-ph">${byDay[d].map((s, i) => `<figure class="pola" style="--r:${((i * 37) % 9) - 4}deg"><div class="dp" ${src(s)}></div><figcaption ${s.id ? `data-cap="${s.k}:${s.id}"` : ""}>${esc(s.caption || short(s.name || "")) || `<span class="cap-hint">点这里写一句</span>`}</figcaption></figure>`).join("")}</div><p class="al-tip">点照片下面，写一句话。会一起印在海报上。</p></div>`)];
    openFlipbook({ pages, theme: "album", title: "相册", after: async ov => {
      bindLookChips(ov);
      ov.querySelectorAll("[data-cap]").forEach(fc => fc.onclick = async e => { e.stopPropagation(); const [k, id] = fc.dataset.cap.split(":"), cur0 = fc.querySelector(".cap-hint") ? "" : fc.textContent; const v = await askText("在这张照片下面写一句", cur0); if (v === null) return; try { await api.setCaption(k, id, v.trim()); fc.innerHTML = esc(v.trim()) || `<span class="cap-hint">点这里写一句</span>`; mus.chime(4, .02); } catch (err) { toast("没能保存：" + err.message); } });
      for (const el of ov.querySelectorAll("[data-cpath]")) { const u = await api.photoUrl(el.dataset.cpath); if (u && el.isConnected) el.style.backgroundImage = `url("${u}")`; }
      for (const el of ov.querySelectorAll("[data-spath]")) { const u = await api.sharedUrl(el.dataset.spath); if (u && el.isConnected) el.style.backgroundImage = `url("${u}")`; } } });
  },
  archive() {
    /* a real stamp album: leather cover, black pages with glassine strips, every stamp in its own mount */
    const ss = tripStamps().filter(s => s.kind === "place" || s.kind === "special" || s.kind === "experience").sort((a, b) => String(a.date).localeCompare(String(b.date)) || String(a.created_at).localeCompare(String(b.created_at)));
    const days = tripDays(), cityOrder = [...new Set([...days.map(d => cityOf(d)), ...tripCityNames(), ...ss.map(s => s.city)].filter(Boolean))];
    const planned = {}; days.forEach(d => { const c = cityOf(d); (dayActsOf(d) || []).filter(a => (a.kind === "sight" || a.kind === "food") && a.status !== "removed").forEach(a => { (planned[c] = planned[c] || new Set()).add(a.title); }); });
    const sections = cityOrder.map(c => { const got = ss.filter(s => s.city === c), names = new Set(got.map(s => s.name)), todo = [...(planned[c] || [])].filter(n => !names.has(n) && ![...names].some(x => x.includes(n) || n.includes(x)));
      return { c, got, todo }; }).filter(x => x.got.length || x.todo.length);
    const total = sections.reduce((q, x) => q + x.got.length + x.todo.length, 0), have = ss.length, t = api.trip;
    const pm = (c, date) => `<svg class="sb-pm" viewBox="0 0 90 60" aria-hidden="true"><circle cx="30" cy="30" r="24" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="30" cy="30" r="17" fill="none" stroke="currentColor" stroke-width=".8"/><text x="30" y="27" text-anchor="middle" font-size="8" fill="currentColor" font-family="Noto Serif SC,serif">${esc(String(c || "").slice(0, 3))}</text><text x="30" y="39" text-anchor="middle" font-size="7" fill="currentColor" font-family="Special Elite,monospace">${String(date || "").slice(5).replace("-", ".")}</text>${[0, 1, 2, 3].map(i => `<path d="M56 ${16 + i * 9}q8 -4 16 0t16 0" fill="none" stroke="currentColor" stroke-width="1.1"/>`).join("")}</svg>`;
    const mount = (s, n) => `<button class="sb-slot" data-sid="${s.id}" style="--r:${(hash(s.id) % 7) - 3}deg"><span class="sb-mount${isGrey(s) ? " grey" : ""}">${s.photo_path ? `<span class="sb-perf"><i data-cpath="${esc(s.photo_path)}"></i><em>${esc(short(s.name))}</em><b>${n}</b></span>` : `<span class="sb-art">${isGrey(s) ? greySvg(postageStamp(s.name, s.city, s.date, s.kind)) : postageStamp(s.name, s.city, s.date, s.kind)}</span>`}${pm(s.city, s.date)}</span><small>${esc(short(s.name))}</small></button>`;
    const blank = n => `<div class="sb-slot empty"><span class="sb-mount"><span class="sb-hole"><b>${esc(short(n))}</b><i>还没去</i></span></span><small>${esc(short(n))}</small></div>`;
    const PER = 6, pages = [];
    pages.push(`<div class="sb-page sb-cover" data-noi18n><div class="sb-cv-frame"><small>PHILATELY · 旅行集邮</small><div class="sb-cv-seal">${doodle("ticket", { sketch: true, accent: "#d9b878", ink: "#d9b878" })}</div><b>STAMP ALBUM</b><strong>集邮册</strong><span class="sb-cv-trip">${esc(t.name)}</span><em>${(t.start_date || "").replace(/-/g, ".")} — ${(t.end_date || "").replace(/-/g, ".")}</em><i class="sb-cv-n">${have}${total > have ? " / " + total : ""} 枚</i></div><span class="sb-ribbon"></span></div>`);
    let no = 0; const idx = [];
    sections.forEach(x => { const all = [...x.got.map(s => ({ s })), ...x.todo.map(n => ({ n }))], first = pages.length + 1;
      for (let i = 0; i < Math.max(1, Math.ceil(all.length / PER)); i++) { const chunk = all.slice(i * PER, i * PER + PER);
        pages.push(`<div class="sb-page" data-noi18n><div class="sb-h"><small>${i ? "CONTINUED · 续" : "SECTION · " + String(idx.length + 1).padStart(2, "0")}</small><b>${esc(x.c)}</b><span>${x.got.length} 枚${x.todo.length ? ` · 还差 ${x.todo.length}` : ""}</span></div>
          <div class="sb-strips">${[0, 1, 2].map(r => `<div class="sb-strip">${chunk.slice(r * 2, r * 2 + 2).map(o => o.s ? mount(o.s, String(++no).padStart(2, "0")) : blank(o.n)).join("")}</div>`).join("")}</div></div>`); }
      idx.push({ c: x.c, n: x.got.length, of: x.got.length + x.todo.length, p: first }); });
    if (!sections.length) pages.push(`<div class="sb-page" data-noi18n><div class="sb-h"><small>SECTION · 01</small><b>第一页</b><span>还是空的</span></div><div class="sb-strips">${[0, 1, 2].map(() => `<div class="sb-strip"><div class="sb-slot empty"><span class="sb-mount"><span class="sb-hole"><i>等你打卡</i></span></span></div><div class="sb-slot empty"><span class="sb-mount"><span class="sb-hole"><i>等你打卡</i></span></span></div></div>`).join("")}</div><p class="sb-tip">到一个地方打卡、拍一张，那张照片就会变成这里的第一枚邮票。</p></div>`);
    else pages.splice(1, 0, `<div class="sb-page sb-toc" data-noi18n><div class="sb-h"><small>CONTENTS · 目录</small><b>这本集邮册</b><span>${have} 枚邮票 · ${sections.length} 座城市</span></div><ol>${idx.map(x => `<li><b>${esc(x.c)}</b><i></i><span>${x.n}${x.of > x.n ? "/" + x.of : ""} 枚 · p.${x.p + 1}</span></li>`).join("")}</ol><p class="sb-tip">点一枚邮票，拿起来看看背面。空着的格子是行程里还没去的地方。</p></div>`);
    pages.push(`<div class="sb-page sb-end" data-noi18n><div class="sb-h"><small>THE END · 未完待续</small><b>下一段旅程</b><span>This page is left blank.</span></div><div class="sb-strips"><div class="sb-strip"><div class="sb-slot empty"><span class="sb-mount"><span class="sb-hole"><i>？</i></span></span></div><div class="sb-slot empty"><span class="sb-mount"><span class="sb-hole"><i>？</i></span></span></div></div></div></div>`);
    openFlipbook({ pages, theme: "stampbook", title: "邮票集", onClose: () => renderBook(), after: async ov => {
      ov.querySelectorAll("[data-sid]").forEach(b => b.onclick = e => { e.stopPropagation(); openStampViewer(ss, ss.findIndex(x => x.id === b.dataset.sid)); });
      for (const el of ov.querySelectorAll("[data-cpath]")) { const u = await api.photoUrl(el.dataset.cpath); if (u && el.isConnected) el.style.backgroundImage = `url("${u}")`; } } });
  },
  wallet() {
    const awaitWallet = () => { let L = []; try { L = importedTickets && importedTickets.walletItems ? importedTickets.walletItems() : []; } catch (e) {} return L; };
    const ov = document.createElement("div"); ov.className = "showcase reader fw-reader"; const t = api.trip;
    let W = []; try { W = (awaitWallet() || []); } catch (e) {}
    const loved = W.filter(w => w.rating === "love").length, peek = W.slice(-4);
    ov.innerHTML = `<button class="sc-x" aria-label="关闭">×</button>
      <div class="fw-cover" role="button" tabindex="0" aria-label="打开美食票夹"><div class="fw-leather"><span class="fw-stitch"></span>
        <div class="fw-peek">${peek.length ? peek.map((w, i) => `<i style="--i:${i};--n:${peek.length}"><span>${foodArt(w.name)}</span><b>${esc(w.name)}</b></i>`).join("") : `<i style="--i:0;--n:1" class="ghost"><span>${foodArt("沙茶面")}</span><b>第一张</b></i>`}</div>
        <div class="fw-plate"><small>TASTE PASS · 美食通行证</small><b>美食票夹</b><span>${esc(t.name)}</span><em>${W.length} 张票${loved ? ` · ${loved} 张好吃到想再来` : ""}</em></div>
        <div class="fw-strap"><i></i></div><div class="fw-embossed">${doodle("noodles", { sketch: true, accent: "#e8cf9a", ink: "#e8cf9a" })}</div>
        <p class="fw-open">轻点打开 ›</p></div></div>
      <div class="rd-h"><small>FOOD TICKETS · ${esc(t.name)}</small><b>美食票夹</b></div><div class="rd-body"></div>`;
    const cv = ov.querySelector(".fw-cover"), openIt = () => { if (cv.classList.contains("open")) return; cv.classList.add("open"); sfx.paper(); setTimeout(() => cv.remove(), 900); };
    cv.onclick = openIt; cv.onkeydown = e => { if (e.key === "Enter" || e.key === " ") openIt(); };
    const w = $("colWallet"); ov.querySelector(".rd-body").appendChild(w); document.body.appendChild(ov); requestAnimationFrame(() => ov.classList.add("on"));
    ov.querySelector(".sc-x").onclick = () => { $("walletHost").appendChild(w); ov.classList.remove("on"); setTimeout(() => ov.remove(), 350); };
  },
  diary() { import("./today.js").then(m => m.openDiary()); },
  receipt() { openReceipt(); },
  shared() { import("./shared.js").then(m => m.openShared()); },
};
export const openBookPart = k => OPEN[k] && OPEN[k]();

/* showcase: one stamp at a time, big, on paper — swipe or use the arrows */
function openStamp(id, o = {}) {
  const list = tripStamps().filter(s => o.postage ? s.kind !== "city" : true).sort((a, b) => a.date.localeCompare(b.date) || a.created_at.localeCompare(b.created_at));
  let i = Math.max(0, list.findIndex(x => x.id === id));
  document.querySelector(".showcase.sc1")?.remove();
  const ov = document.createElement("div"); ov.className = "showcase sc1"; ov.setAttribute("role", "dialog"); ov.setAttribute("aria-label", "欣赏印章");
  ov.innerHTML = `<button class="sc-x" aria-label="关闭">×</button><div class="sc-stage" id="scStage"></div><div class="sc-nav"><button class="sc-a" data-d="-1" aria-label="上一枚">‹</button><span id="scIdx"></span><button class="sc-a" data-d="1" aria-label="下一枚">›</button></div>`;
  document.body.appendChild(ov); requestAnimationFrame(() => ov.classList.add("on")); sfx.paper();
  const art = st => o.postage && st.kind !== "experience" ? (isGrey(st) ? greySvg(postageStamp(st.name, st.city, st.date, st.kind)) : postageStamp(st.name, st.city, st.date, st.kind)) : stampFor(st);
  const show = async (dir = 0) => {
    const st = list[i], stage = $("scStage");
    stage.innerHTML = `<div class="sc-card${dir ? (dir > 0 ? " in-r" : " in-l") : ""}"><div class="sc-paper"><div class="sc-stamp">${art(st)}</div></div>
      <small>${shortDate(st.date)} ${weekday(st.date)} · ${esc(st.city || "")}${st.kind === "city" ? " · 入境章" : st.kind === "special" ? " · 计划外" : st.kind === "experience" ? " · 体验印记" : ""}</small>
      <h3>${esc(st.name)}</h3>${st.mission ? `<p>${esc(st.mission)}</p>` : ""}${st.verify_note ? `<p class="sc-by">${esc(st.verify_note)}</p>` : ""}
      ${st.photo_path ? `<div class="sc-photo"><div class="polaroid mini"><img id="scImg" alt="打卡照片"></div><button class="btn sm" id="scSave">保存照片</button></div>` : ""}</div>`;
    $("scIdx").textContent = `${i + 1} / ${list.length}`;
    if (st.photo_path) { const u = await api.photoUrl(st.photo_path); const im = $("scImg"); if (im && u) im.src = u;
      const sv = $("scSave"); if (sv) sv.onclick = async () => { try { const b = await (await fetch(u)).blob(), f = new File([b], `${st.name}-${st.date}.jpg`, { type: "image/jpeg" }); if (navigator.canShare && navigator.canShare({ files: [f] })) await navigator.share({ files: [f] }); else { const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = f.name; a.click(); } } catch (e) {} }; }
  };
  const go = d => { if (list.length < 2) return; i = (i + d + list.length) % list.length; sfx.paper(); show(d); };
  ov.querySelectorAll(".sc-a").forEach(b => b.onclick = () => go(+b.dataset.d));
  const close = () => { ov.classList.remove("on"); setTimeout(() => ov.remove(), 350); };
  ov.querySelector(".sc-x").onclick = close;
  let x0 = null; ov.addEventListener("pointerdown", e => { x0 = e.clientX; }); ov.addEventListener("pointerup", e => { if (x0 == null) return; const dx = e.clientX - x0; x0 = null; if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1); });
  ov.tabIndex = -1; ov.focus(); ov.addEventListener("keydown", e => { if (e.key === "ArrowRight") go(1); if (e.key === "ArrowLeft") go(-1); if (e.key === "Escape") close(); });
  show();
}
export function initCollection() {}

/* 飞鸟集-style: every character typed lights a key and lets a bird fly out on a red thread */
function typeBird(ov, ta) {
  const page = ov.querySelector(".dy-page.first"), kb = ov.querySelector(".tw-kb"), sky = ov.querySelector(".tw-sky"); if (!page || !kb || !sky) return;
  const ch = (ta.value.slice(-1) || "").toUpperCase(), keys = [...kb.querySelectorAll("[data-k]")], key = keys.find(k => k.dataset.k === ch) || keys[Math.floor(Math.random() * keys.length)];
  key.classList.add("hit"); setTimeout(() => key.classList.remove("hit"), 500);
  const pr = page.getBoundingClientRect(), kr = key.getBoundingClientRect(), x0 = kr.left - pr.left + kr.width / 2, y0 = kr.top - pr.top + kr.height / 2;
  const x1 = 30 + Math.random() * (pr.width - 60), y1 = 20 + Math.random() * pr.height * .35, ns = "http://www.w3.org/2000/svg";
  sky.setAttribute("viewBox", `0 0 ${pr.width} ${pr.height}`);
  const th = document.createElementNS(ns, "path"); th.setAttribute("d", `M${x0} ${y0}C${x0 + (Math.random() - .5) * 120} ${(y0 + y1) / 2} ${x1 + (Math.random() - .5) * 80} ${y1 + 60} ${x1} ${y1}`); th.setAttribute("class", "tw-th"); sky.appendChild(th);
  const L = th.getTotalLength(); th.style.strokeDasharray = L; th.style.strokeDashoffset = L;
  const b = document.createElementNS(ns, "g"); b.setAttribute("class", "tw-bird"); b.innerHTML = `<path d="M-9 0Q-4 -6 0 0Q4 -6 9 0Q4 -2 0 2Q-4 -2 -9 0Z" fill="${Math.random() < .6 ? "#2a2016" : "#ffffff"}" stroke="rgba(0,0,0,.15)" stroke-width=".4"/>`; sky.appendChild(b);
  const t0 = performance.now(), dur = 1400;
  const step = now => { const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3), p = th.getPointAtLength(L * e); th.style.strokeDashoffset = L * (1 - e); b.setAttribute("transform", `translate(${p.x} ${p.y}) scale(${1 + Math.sin(now / 60) * .25} 1)`);
    if (k < 1) requestAnimationFrame(step); else { th.style.transition = "opacity 1.2s"; th.style.opacity = "0"; b.style.transition = "opacity 2s, transform 2s"; b.setAttribute("transform", `translate(${p.x + (Math.random() - .5) * 60} ${p.y - 60})`); b.style.opacity = "0"; setTimeout(() => { th.remove(); b.remove(); }, 2100); } };
  requestAnimationFrame(step);
}

/* ---------- the stamp viewer: tilt it, catch the shine, flip it over ---------- */
const favs = () => { try { return new Set(JSON.parse(localStorage.getItem("td-fav-stamps") || "[]")); } catch (e) { return new Set(); } };
export function openStampViewer(list, i = 0) {
  if (!list.length) return; i = Math.max(0, i);
  document.querySelector(".sv")?.remove();
  const ov = document.createElement("div"); ov.className = "sv"; ov.setAttribute("role", "dialog");
  ov.innerHTML = `<div class="sv-top"><small id="svWhen"></small><button class="sc-x" aria-label="${T("关闭", "Close")}">×</button></div>
    <div class="sv-stage"><div class="sv-card" id="svCard"><div class="sv-face sv-front" id="svFront"></div><div class="sv-face sv-back" id="svBack"></div><div class="sv-holo" id="svHolo"></div></div></div>
    <p class="sv-name" id="svName"></p><button class="sv-light" id="svLight" hidden>✦ <span></span></button><div class="sv-dots" id="svDots"></div>
    <div class="sv-bar"><button data-a="del" aria-label="${T("删除", "Delete")}">×</button><button data-a="share" aria-label="${T("分享给大家", "Share")}">⇪</button><button data-a="fav" aria-label="${T("收藏", "Favourite")}">☆</button><button data-a="flip" aria-label="${T("翻面", "Flip")}">↻</button><button data-a="next" aria-label="${T("下一张", "Next")}">→</button></div>`;
  document.body.appendChild(ov); requestAnimationFrame(() => ov.classList.add("on")); mus.chime(2, .025); mus.chime(4, .02, .08);
  const card = ov.querySelector("#svCard"), holo = ov.querySelector("#svHolo"); let flipped = false, rx = 0, ry = 0;
  const show = (dir = 0) => { const st = list[i], f = favs();
    const fr = ov.querySelector("#svFront");
    if (st.photo_path) { fr.innerHTML = `<div class="sv-photo"><i></i><b>${esc(st.name)}</b><em>${esc(st.city || "")} · ${(st.date || "").replace(/-/g, ".")}</em><svg class="a2-pm" viewBox="0 0 80 80"><circle cx="40" cy="40" r="34" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="40" cy="40" r="25" fill="none" stroke="currentColor" stroke-width="1"/><text x="40" y="37" text-anchor="middle" font-size="10" fill="currentColor" font-family="Noto Serif SC,serif">${esc((st.city || "").slice(0, 3))}</text><text x="40" y="51" text-anchor="middle" font-size="9" fill="currentColor" font-family="Special Elite,monospace">${(st.date || "").slice(5).replace("-", ".")}</text></svg></div>`; api.photoUrl(st.photo_path).then(u => { const im = fr.querySelector(".sv-photo i"); if (u && im) im.style.backgroundImage = `url("${u}")`; }); }
    else fr.innerHTML = isGrey(st) ? greySvg(posterStamp(st, { no: i + 1, cityEn: (guideFor(st.city) || {}).en })) : posterStamp(st, { no: i + 1, cityEn: (guideFor(st.city) || {}).en });
    fr.classList.toggle("grey", isGrey(st));
    ov.querySelector("#svBack").innerHTML = `<div class="svb"><div class="svb-seal">${stampFor(st)}</div><dl><dt>${T("地点", "Place")}</dt><dd>${esc(st.name)}</dd><dt>${T("城市", "City")}</dt><dd>${esc(st.city || "")}</dd><dt>${T("日期", "Date")}</dt><dd>${shortDate(st.date)} ${weekday(st.date)}</dd>${st.mission ? `<dt>${T("任务", "Mission")}</dt><dd>${esc(st.mission)}</dd>` : ""}${st.verify_note ? `<dt>${T("确认", "Approved")}</dt><dd>${esc(st.verify_note)}</dd>` : ""}</dl>${st.photo_path ? `<div class="svb-ph" data-p="${esc(st.photo_path)}"></div>` : ""}<p class="svb-no">No.${String(i + 1).padStart(2, "0")} / ${String(list.length).padStart(2, "0")}</p></div>`;
    const ph = ov.querySelector("[data-p]"); if (ph) api.photoUrl(ph.dataset.p).then(u => { if (u && ph.isConnected) ph.style.backgroundImage = `url("${u}")`; });
    ov.querySelector("#svWhen").textContent = T(`收集于 ${st.date.replace(/-/g, ".")}`, `Collected on ${st.date}`) + (isGrey(st) ? " · " + GREY_NOTE : "");
    ov.querySelector("#svName").textContent = `${short(st.name)} · ${st.city || ""}`;
    const lb = ov.querySelector("#svLight"), g = isGrey(st) && (!st.user_id || st.user_id === api.me.id); lb.hidden = !g;
    if (g) { const solo = api.mode === "local" || api.members.filter(m => m.id !== api.me.id).length === 0; lb.querySelector("span").textContent = solo ? T("自己点亮这枚章", "Relight it yourself") : T("请旅伴帮忙点亮", "Ask a buddy to relight it"); lb.onclick = () => import("../lib/relight.js").then(m => m.requestLight(st)); }
    if (!ov._rf) { ov._rf = () => ov.isConnected && show(); document.addEventListener("td-sv-refresh", ov._rf); }
    ov.querySelector("[data-a=fav]").textContent = f.has(st.id) ? "★" : "☆"; ov.querySelector("[data-a=fav]").classList.toggle("on", f.has(st.id));
    ov.querySelector("#svDots").innerHTML = list.map((_, k) => `<i class="${k === i ? "on" : ""}"></i>`).join("");
    flipped = false; setT(); if (dir) { card.animate([{ transform: `translateX(${dir * 60}px) rotate(${dir * 6}deg)`, opacity: 0 }, { transform: tr(), opacity: 1 }], { duration: 380, easing: "cubic-bezier(.2,1.3,.4,1)" }); } };
  const tr = () => `rotateX(${rx}deg) rotateY(${ry + (flipped ? 180 : 0)}deg)`;
  const setT = () => { card.style.transform = tr(); holo.style.backgroundPosition = `${50 + ry * 3}% ${50 - rx * 3}%`; holo.style.opacity = String(.25 + Math.min(.55, (Math.abs(rx) + Math.abs(ry)) / 40)); };
  const go = d => { if (list.length < 2) return; i = (i + d + list.length) % list.length; mus.whoosh(); mus.pluck(i % 7, .03); show(d); };
  let x0 = null, y0 = null, moved = false;
  card.addEventListener("pointerdown", e => { x0 = e.clientX; y0 = e.clientY; moved = false; card.setPointerCapture(e.pointerId); card.style.transition = "none"; });
  card.addEventListener("pointermove", e => { const r = card.getBoundingClientRect(); if (x0 == null) { rx = -((e.clientY - r.top) / r.height - .5) * 16; ry = ((e.clientX - r.left) / r.width - .5) * 20; setT(); return; } const dx = e.clientX - x0, dy = e.clientY - y0; if (Math.hypot(dx, dy) > 6) moved = true; ry = Math.max(-35, Math.min(35, dx / 4)); rx = Math.max(-25, Math.min(25, -dy / 4)); setT(); });
  card.addEventListener("pointerup", e => { const dx = e.clientX - (x0 ?? e.clientX); x0 = null; card.style.transition = ""; if (!moved) { flip(); } else if (Math.abs(dx) > 90) go(dx < 0 ? 1 : -1); rx = 0; ry = 0; setT(); });
  card.addEventListener("pointerleave", () => { if (x0 == null) { rx = 0; ry = 0; setT(); } });
  const flip = () => { flipped = !flipped; mus.pop(); sfx.flip(); setT(); };
  const orient = e => { if (x0 != null || e.gamma == null) return; ry = Math.max(-25, Math.min(25, e.gamma / 2)); rx = Math.max(-18, Math.min(18, (e.beta - 40) / 3)); setT(); };
  ov.querySelector(".sc-x").onclick = () => { window.removeEventListener("deviceorientation", orient); ov.classList.remove("on"); setTimeout(() => ov.remove(), 350); };
  ov.querySelector("[data-a=flip]").onclick = flip; ov.querySelector("[data-a=next]").onclick = () => go(1);
  ov.querySelector("[data-a=share]").onclick = async () => { const st = list[i]; if (!st || !st.photo_path) return toast("这枚章没有照片"); try { const u = await api.photoUrl(st.photo_path); const blob = await (await fetch(u)).blob(); const path = api.mode === "local" ? u : await api.uploadShared(blob); await api.addSharedPhoto(path, st.name, st.date); mus.chime(5, .03); toast("放进大家的相册了"); } catch (e) { toast("没能分享：" + e.message); } };
  ov.querySelector("[data-a=del]").onclick = async () => { const st = list[i]; if (!st) return; if (!await askConfirm(`删掉「${st.name}」这枚章？盖错了可以重新打卡。`)) return; try { await api.deleteStamp(st.id); toast("删掉了"); ov.remove(); document.querySelector(".arch .sc-x") && document.querySelector(".arch .sc-x").click(); } catch (e) { toast("没能删：" + e.message); } };
  ov.querySelector("[data-a=fav]").onclick = () => { const f = favs(), id = list[i].id; f.has(id) ? f.delete(id) : (f.add(id), mus.chime(4, .03), mus.chime(6, .02, .1)); localStorage.setItem("td-fav-stamps", JSON.stringify([...f])); show(); };
  ov.tabIndex = -1; ov.focus(); ov.addEventListener("keydown", e => { if (e.key === "ArrowRight") go(1); if (e.key === "ArrowLeft") go(-1); if (e.key === " ") flip(); });
  show();
}
