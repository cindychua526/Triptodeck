/* 手账: every trip is a shelf of keepsakes — passport of stamps, photo album, stamp archive,
   food-ticket wallet, diary and the final receipt. Everything here is private to you. */
import { api, on } from "../lib/api.js";
import { $, esc, shortDate, weekday, hash, addDays, today } from "../lib/util.js";
import { toast, openSheet, closeSheet, bind } from "../lib/ui.js";
import { sfx } from "../lib/sound.js";
import { placeStamp, citySeal, waxSeal } from "../data/stamps.js";
import { posterStamp } from "../data/posterstamp.js";
import { doodle } from "../data/doodles.js";
import { foodArt } from "../data/foodart.js";
import { mus } from "../lib/sound.js";
const postageStamp = (name, city, date, kind) => posterStamp({ name, city, date, kind }, { cityEn: (guideFor(city) || {}).en });
import { guideFor } from "../data/guides.js";
import { makePoster } from "./poster.js";
import { departuresOf } from "./arrive.js";
import { tripDays, cityOf } from "./trip.js";
import { openFlipbook } from "./flipbook.js";
import { t as T } from "../lib/i18n.js";
import { openReceipt } from "./receipt.js";
import { openShelf } from "./trips.js";

let stamps = [], trips = [];
export const myStamps = () => stamps;
export async function loadStamps() { try { stamps = await api.stamps(); trips = await api.listTrips(); } catch (e) { stamps = []; } renderBook(); }
on("stamps", async () => { stamps = await api.stamps(); renderBook(); });
on("trip", async () => { try { trips = await api.listTrips(); } catch (e) {} renderBook(); });
on("wallet", () => renderBook());

export function placeStampSVG(name, cityName, date, special) { return placeStamp(name, cityName, date, { special }); }
export const stampFor = s => s.kind === "city" ? citySeal(s.city || s.name, s.date) : s.kind === "experience" ? waxSeal(s.name, s.city, s.date) : placeStamp(s.name, s.city, s.date, { special: s.kind === "special" });
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
  root.innerHTML = `<div class="bk2-top"><button class="trip-sw" data-act="lib"><small>MY TRAVEL BOOK · ${T("只有你看得到", "only you can see")} ⇄</small><h2>${esc(t.name)}</h2><span>${g ? esc(g.en) : ""} · ${(t.start_date || "").slice(5).replace("-", ".")} – ${(t.end_date || "").slice(5).replace("-", ".")}</span></button><button class="icon-btn" data-act="poster" aria-label="生成海报">${T("海报", "Poster")}</button></div>
    <div class="bk2">
      <button class="bk2-t" data-open="album"><span class="bk2-pv al" ${last ? `data-bg="${esc(last.photo_path)}"` : ""}>${last ? "" : `<i class="bk2-empty">${doodle("camera", { sketch: true, accent: "#c8c8cc", ink: "#c8c8cc" })}</i>`}</span><span class="bk2-l"><b>${T("相册", "Album")}</b><small>${photos.length} ${T("张照片", "photos")}</small></span></button>
      <button class="bk2-t" data-open="archive"><span class="bk2-pv st">${stampsFan.length ? stampsFan.map((x, i) => `<i style="--i:${i}">${postageStamp(x.name, x.city, x.date)}</i>`).join("") : `<i class="bk2-empty">${doodle("ticket", { sketch: true, accent: "#c8c8cc", ink: "#c8c8cc" })}</i>`}</span><span class="bk2-l"><b>${T("邮票集", "Stamps")}</b><small>${places.length} ${T("张", "stamps")}</small></span></button>
      <button class="bk2-t" data-open="passport"><span class="bk2-pv pp">${inks.length ? inks.map((x, i) => `<i style="--i:${i}">${stampFor(x)}</i>`).join("") : `<i class="bk2-empty">${doodle("star", { sketch: true, accent: "#c8c8cc", ink: "#c8c8cc" })}</i>`}</span><span class="bk2-l"><b>${T("印章护照", "Passport")}</b><small>${seals.length} ${T("枚入境章", "entry")} · ${places.length + exps.length} ${T("枚印章", "seals")}</small></span></button>
      <button class="bk2-t" data-open="diary"><span class="bk2-pv dy" id="bk2Diary"><em>${T("写几句今天…", "A few lines…")}</em></span><span class="bk2-l"><b>${T("旅行日记", "Diary")}</b><small>${T("每天一页，只有你看得到", "One page a day, private")}</small></span></button>
      <button class="bk2-t" data-open="wallet"><span class="bk2-pv wl" id="bk2Wallet"><i class="bk2-empty">${doodle("noodles", { sketch: true, accent: "#c8c8cc", ink: "#c8c8cc" })}</i></span><span class="bk2-l"><b>${T("美食票夹", "Food tickets")}</b><small><span id="walletCount">0</span> ${T("张", "tickets")}</small></span></button>
      <button class="bk2-t ready" data-open="receipt"><span class="bk2-pv rc"><i></i></span><span class="bk2-l"><b>${T("旅行发票", "Receipt")}</b><small>${ended ? T("旅行结束了，打印整趟", "The whole trip") : T("随时可以打印，截至今天", "Print anytime, up to today")}</small></span></button>
    </div>
    <p class="col-note"><button class="linkbtn" data-act="how">${T("印章和邮票怎么收集？", "How do I collect stamps?")}</button></p>`;
  import("./tickets.js").then(m => { const W = (m.walletItems ? m.walletItems() : []).slice(-3), el = $("bk2Wallet"); if (el && W.length) el.innerHTML = W.map((w, i) => `<i class="bk2-stub" style="--i:${i}"><span>${foodArt(w.name)}</span><b>${esc(w.name)}</b></i>`).join(""); });
  import("../lib/journal.js").then(async m => { const J = await m.getJournal(t.id), txt = J.summary || Object.keys(J.days).sort().map(k => J.days[k]).filter(Boolean).pop() || ""; const el = $("bk2Diary"); if (el && txt) el.innerHTML = `<p>${esc(txt.slice(0, 60))}</p>`; });
  root.querySelectorAll("[data-open]").forEach(b => b.onclick = () => { sfx.click(); OPEN[b.dataset.open](); });
  root.querySelector("[data-act=lib]").onclick = () => openShelf();
  root.querySelector("[data-act=poster]").onclick = poster;
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
export function openPoster() { poster(); }
function poster() {
  const t = api.trip, extra = {}; const me = departuresOf().find(d => d.user_id === api.me.id); if (me) extra.origin = me.origin;
  const segs = []; tripDays().forEach(d => { const c = cityOf(d), last = segs[segs.length - 1]; if (last && last.city === c) last.to = d; else segs.push({ city: c, from: d, to: d }); }); extra.segments = segs;
  makePoster(t, tripStamps(), extra);
}
/* ---------- readers ---------- */
const OPEN = {
  passport() {
    const ss = tripStamps(), t = api.trip, dep = departuresOf().find(d => d.user_id === api.me.id);
    const cities = [...new Set(ss.map(s => s.city).filter(Boolean))];
    const pages = [`<div class="pp-page cover" style="--c:${cover()}"><i class="pp-emb big">✦</i><small>THE TRIP DECK</small><b>PASSPORT</b><em>印章护照</em><span>${esc(t.name)}</span></div>`,
      `<div class="pp-page id"><small>TRAVELLER · 持照人</small><h4>${esc(api.me.name)}</h4><dl><dt>旅行</dt><dd>${esc(t.name)}</dd><dt>日期</dt><dd>${shortDate(t.start_date)} – ${shortDate(t.end_date)}</dd><dt>出发地</dt><dd>${esc(dep ? dep.origin : "—")}</dd><dt>城市</dt><dd>${esc(cities.join("、") || "—")}</dd></dl><p class="mrz">P&lt;TRIPDECK&lt;&lt;${esc((t.name || "").replace(/\s/g, "").slice(0, 8))}&lt;&lt;&lt;&lt;${(t.start_date || "").replace(/-/g, "")}&lt;&lt;</p></div>`];
    cities.forEach(c => {
      const seal = ss.find(s => s.kind === "city" && s.city === c), rest = ss.filter(s => s.kind !== "city" && s.city === c).sort((a, b) => a.date.localeCompare(b.date));
      for (let i = 0; i < Math.max(1, Math.ceil(rest.length / 6)); i++) {
        const chunk = rest.slice(i * 6, i * 6 + 6);
        pages.push(`<div class="pp-page visa"><div class="pp-h"><b>${esc(c)}</b><small>${i ? "续页" : seal ? "入境 " + shortDate(seal.date) : "还没盖入境章"}</small></div>${!i && seal ? `<div class="pp-seal">${stampFor(seal)}</div>` : ""}
          <div class="pp-grid">${chunk.map(s => `<div class="pp-st" style="--r:${(hash(s.id) % 25) - 12}deg">${stampFor(s)}</div>`).join("")}</div><span class="pp-no">${pages.length}</span></div>`);
      }
    });
    pages.push(`<div class="pp-page visa blank"><div class="pp-h"><b>待盖章</b><small>下一个地方</small></div><p class="pp-empty">这一页留给下一段旅程。</p></div>`);
    openFlipbook({ pages, theme: "passport", title: "印章护照" });
  },
  album() {
    const ph = tripStamps().filter(s => s.photo_path), t = api.trip, dep = departuresOf().find(d => d.user_id === api.me.id);
    const byDay = {}; ph.forEach(s => (byDay[s.date] = byDay[s.date] || []).push(s));
    if (dep && dep.photo_path) (byDay[t.start_date] = byDay[t.start_date] || []).unshift({ photo_path: dep.photo_path, name: "出发", date: t.start_date, shared: true });
    const months = []; for (let d = t.start_date.slice(0, 7) + "-01"; d <= t.end_date; ) { months.push(d.slice(0, 7)); const [y, m] = d.split("-").map(Number); d = `${m === 12 ? y + 1 : y}-${String(m === 12 ? 1 : m + 1).padStart(2, "0")}-01`; }
    const MZ = ["", "一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"];
    const pages = [`<div class="al-page cover"><small>ALBUM · 相册</small><b>${esc(t.name)}</b><em>${ph.length} 张照片</em></div>`, ...months.map(mo => {
      const [y, m] = mo.split("-").map(Number), first = new Date(y, m - 1, 1), n = new Date(y, m, 0).getDate(), lead = (first.getDay() + 6) % 7;
      const cells = []; for (let i = 0; i < lead; i++) cells.push(`<div class="cal-c empty"></div>`);
      for (let d = 1; d <= n; d++) { const iso = `${mo}-${String(d).padStart(2, "0")}`, inTrip = iso >= t.start_date && iso <= t.end_date, p = byDay[iso];
        cells.push(`<div class="cal-c${inTrip ? " trip" : ""}${p ? " has" : ""}" ${p ? `data-cpath="${esc(p[0].photo_path)}" data-day="${iso}"` : ""}><span>${d}</span>${p && p.length > 1 ? `<i>${p.length}</i>` : ""}</div>`); }
      return `<div class="al-page cal"><div class="cal-h"><b>${MZ[m]}</b><em>${y}</em><span>${String(m).padStart(2, "0")}</span></div><div class="cal-w">${"一二三四五六日".split("").map(x => `<span>${x}</span>`).join("")}</div><div class="cal-g">${cells.join("")}</div></div>`;
    }), ...Object.keys(byDay).sort().map(d => `<div class="al-page day"><div class="cal-h"><b>${shortDate(d)}</b><em>${weekday(d)} · ${esc(cityOf(d))}</em></div><div class="day-ph">${byDay[d].map(s => `<figure><div class="dp" data-cpath="${esc(s.photo_path)}"></div><figcaption>${esc(short(s.name))}</figcaption></figure>`).join("")}</div></div>`)];
    openFlipbook({ pages, theme: "album", title: "相册", after: async ov => { for (const el of ov.querySelectorAll("[data-cpath]")) { const u = await api.photoUrl(el.dataset.cpath); if (u && el.isConnected) el.style.backgroundImage = `url("${u}")`; } } });
  },
  archive() {
    const ss = tripStamps().filter(s => s.kind === "place" || s.kind === "special" || s.kind === "experience");
    let color = localStorage.getItem("td-pouch") || "gold";
    const ov = document.createElement("div"); ov.className = "arch"; ov.setAttribute("role", "dialog"); ov.setAttribute("aria-label", "邮票集");
    const draw = () => { ov.innerHTML = `<button class="sc-x" aria-label="关闭">×</button><div class="arch-in"><div class="arch-stage"><div class="arch-pouch p-${color}"><b>集めたもの</b><small>Mini Archive · ${esc(api.trip.name)}</small><i></i></div>
        <div class="arch-fan">${ss.map((s, i) => `<button class="arch-st" data-sid="${s.id}" style="--i:${i};--n:${ss.length}">${postageStamp(s.name, s.city, s.date, s.kind)}</button>`).join("") || `<p class="arch-empty">还没有邮票。打卡通过后，每个地方会有一张。</p>`}</div></div>
        <p class="arch-hint">${ss.length ? "点封套把邮票拉出来，点一张邮票慢慢看" : ""}</p><div class="arch-dots">${["gold", "rose", "ink"].map(c => `<button class="ad ad-${c}${c === color ? " on" : ""}" data-c="${c}" aria-label="${c}"></button>`).join("")}</div></div>`;
      ov.querySelector(".sc-x").onclick = () => { ov.classList.remove("on"); setTimeout(() => ov.remove(), 350); renderBook(); };
      ov.querySelector(".arch-pouch").onclick = () => { ov.classList.toggle("out"); sfx.paper(); };
      ov.querySelectorAll("[data-c]").forEach(b => b.onclick = () => { color = b.dataset.c; localStorage.setItem("td-pouch", color); const o = ov.classList.contains("out"); draw(); if (o) ov.classList.add("out"); sfx.tap(); });
      ov.querySelectorAll("[data-sid]").forEach(b => b.onclick = e => { e.stopPropagation(); openStampViewer(ss, ss.findIndex(x => x.id === b.dataset.sid)); }); };
    draw(); document.body.appendChild(ov); requestAnimationFrame(() => { ov.classList.add("on"); setTimeout(() => ov.classList.add("out"), 500); });
  },
  wallet() {
    const ov = document.createElement("div"); ov.className = "showcase reader"; ov.innerHTML = `<button class="sc-x" aria-label="关闭">×</button><div class="rd-h"><small>FOOD TICKETS</small><b>美食票夹</b></div><div class="rd-body"></div>`;
    const w = $("colWallet"); ov.querySelector(".rd-body").appendChild(w); document.body.appendChild(ov); requestAnimationFrame(() => ov.classList.add("on"));
    ov.querySelector(".sc-x").onclick = () => { $("walletHost").appendChild(w); ov.classList.remove("on"); setTimeout(() => ov.remove(), 350); };
  },
  diary() { import("./today.js").then(m => m.openDiary()); },
  receipt() { openReceipt(); },
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
  const art = st => o.postage && st.kind !== "experience" ? postageStamp(st.name, st.city, st.date, st.kind) : stampFor(st);
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
    <p class="sv-name" id="svName"></p><div class="sv-dots" id="svDots"></div>
    <div class="sv-bar"><button data-a="fav" aria-label="${T("收藏", "Favourite")}">☆</button><button data-a="flip" aria-label="${T("翻面", "Flip")}">↻</button><button data-a="next" aria-label="${T("下一张", "Next")}">→</button></div>`;
  document.body.appendChild(ov); requestAnimationFrame(() => ov.classList.add("on")); mus.chime(2, .025); mus.chime(4, .02, .08);
  const card = ov.querySelector("#svCard"), holo = ov.querySelector("#svHolo"); let flipped = false, rx = 0, ry = 0;
  const show = (dir = 0) => { const st = list[i], f = favs();
    ov.querySelector("#svFront").innerHTML = posterStamp(st, { no: i + 1, cityEn: (guideFor(st.city) || {}).en });
    ov.querySelector("#svBack").innerHTML = `<div class="svb"><div class="svb-seal">${stampFor(st)}</div><dl><dt>${T("地点", "Place")}</dt><dd>${esc(st.name)}</dd><dt>${T("城市", "City")}</dt><dd>${esc(st.city || "")}</dd><dt>${T("日期", "Date")}</dt><dd>${shortDate(st.date)} ${weekday(st.date)}</dd>${st.mission ? `<dt>${T("任务", "Mission")}</dt><dd>${esc(st.mission)}</dd>` : ""}${st.verify_note ? `<dt>${T("确认", "Approved")}</dt><dd>${esc(st.verify_note)}</dd>` : ""}</dl>${st.photo_path ? `<div class="svb-ph" data-p="${esc(st.photo_path)}"></div>` : ""}<p class="svb-no">No.${String(i + 1).padStart(2, "0")} / ${String(list.length).padStart(2, "0")}</p></div>`;
    const ph = ov.querySelector("[data-p]"); if (ph) api.photoUrl(ph.dataset.p).then(u => { if (u && ph.isConnected) ph.style.backgroundImage = `url("${u}")`; });
    ov.querySelector("#svWhen").textContent = T(`收集于 ${st.date.replace(/-/g, ".")}`, `Collected on ${st.date}`);
    ov.querySelector("#svName").textContent = `${short(st.name)} · ${st.city || ""}`;
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
  window.addEventListener("deviceorientation", orient);
  ov.querySelector(".sc-x").onclick = () => { window.removeEventListener("deviceorientation", orient); ov.classList.remove("on"); setTimeout(() => ov.remove(), 350); };
  ov.querySelector("[data-a=flip]").onclick = flip; ov.querySelector("[data-a=next]").onclick = () => go(1);
  ov.querySelector("[data-a=fav]").onclick = () => { const f = favs(), id = list[i].id; f.has(id) ? f.delete(id) : (f.add(id), mus.chime(4, .03), mus.chime(6, .02, .1)); localStorage.setItem("td-fav-stamps", JSON.stringify([...f])); show(); };
  ov.tabIndex = -1; ov.focus(); ov.addEventListener("keydown", e => { if (e.key === "ArrowRight") go(1); if (e.key === "ArrowLeft") go(-1); if (e.key === " ") flip(); });
  show();
}
