/* The strip under the Today header: today's weather, today's note, and the little games. */
import { api, on, nameOf } from "../lib/api.js";
import { $, esc, today, shortDate, weekday } from "../lib/util.js";
import { openSheet, setSheet, closeSheet, bind, toast } from "../lib/ui.js";
import { t as T } from "../lib/i18n.js";
import { weatherFor } from "../lib/weather.js";
import { playMotion, weatherMotion } from "../lib/motion.js";
import { doodle, doodleFor } from "../data/doodles.js";
import { getJournal, saveJournal } from "../lib/journal.js";
import { mus, setSoundTheme, THEME_NAME } from "../lib/sound.js";
import { guideFor } from "../data/guides.js";
import { tripDays, cityOf, dayActs } from "./trip.js";
import { sunTimes } from "../lib/sun.js";
import { ic } from "../lib/icons.js";
import { CARD } from "../data/skills.js";
import { lang } from "../lib/i18n.js";

let WX = null, WXcity = null;
const wxDoodle = v => !v ? "sun" : /雨|rain/i.test(v.text || "") ? "umbrella" : /云|阴|雾/.test(v.text || "") ? "boat" : "sun";
const EN_WD = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"], EN_M = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const sketchFor = (v, first) => { const t = (v && v.text) || ""; if (/雨|rain|drizzle|shower/i.test(t)) return ["boots", "#5b8def"]; if (/雷/.test(t)) return ["umbrella", "#5b8def"]; if (/晴|clear|sun/i.test(t)) return ["sun", "#f0b429"]; if (/云|阴|fog|cloud/i.test(t)) return ["boat", "#7aa7c7"]; return [first ? doodleFor(first, "place") : "plane", "#e8663a"]; };
export async function renderToday() {
  const el = $("todayStrip"); if (!el) return;
  if (!api.trip) { el.innerHTML = ""; return; }
  const d = today(), days = tripDays(), inTrip = days.includes(d), city = cityOf(inTrip ? d : days[0] || d), gg = guideFor(city), th = setSoundTheme(gg && gg.id);
  const J = await getJournal(), note = J.days[d] || "", moods = J.moods || {};
  const start = days[0], end = days[days.length - 1], phase = !start ? "during" : d < start ? "before" : d > end ? "after" : "during";
  const dayN = days.indexOf(d) + 1, left = days.length - dayN, daysTo = start ? Math.round((new Date(start + "T12:00:00") - new Date(d + "T12:00:00")) / 864e5) : 0, daysBack = end ? Math.round((new Date(d + "T12:00:00") - new Date(end + "T12:00:00")) / 864e5) : 0;
  if (WX && WX.text) { try { localStorage.setItem(`td-wx:${api.trip.id}:${d}`, JSON.stringify({ t: WX.text, hi: WX.hi, lo: WX.lo })); } catch (e) {} }
  if (phase === "before") { const sd = new Date(start + "T12:00:00"); renderBefore(el, { daysTo, start, gg, city, sun: gg && gg.ll ? sunTimes(gg.ll[0], gg.ll[1], sd, ({ TH: 420, VN: 420, KR: 540, JP: 540, NZ: 780 })[gg.w && gg.w.cc] ?? 480) : null }); document.body.classList.add("phase-before"); return; }
  document.body.classList.remove("phase-before");
  if (phase === "after") { renderAfter(el, { daysBack, end, days }); return; }
  const dt = new Date(d + "T12:00:00"), sun = gg && gg.ll ? sunTimes(gg.ll[0], gg.ll[1], dt, ({ TH: 420, VN: 420, KR: 540, JP: 540, NZ: 780 })[gg.w && gg.w.cc] ?? 480) : null;
  const todays = inTrip ? dayActs(d).filter(a => a.kind !== "transit" && a.status !== "removed" && a.status !== "skipped").slice(0, 6) : [];
  let [sk, skc] = sketchFor(WX, todays[0] && todays[0].title); if (document.body.classList.contains("atm-rain")) [sk, skc] = ["boots", "#b3341e"]; else if (document.body.classList.contains("atm-snow")) [sk, skc] = ["umbrella", "#b3341e"];
  const PAST = ["#d9f3ec", "#e9dff8", "#d8ecf9", "#fde6d8", "#f8e9c8", "#e4f0d9"];
  el.innerHTML = `<div class="hb"><i class="hb-hole l"></i><i class="hb-hole r"></i>
      <div class="hb-sun l"><svg viewBox="0 0 24 24"><path d="M4 16h16M8 16a4 4 0 0 1 8 0M12 3v4M6 8l1.5 1.5M18 8l-1.5 1.5"/></svg><small>${sun ? sun.rise : "--:--"}</small></div>
      <div class="hb-sun r"><svg viewBox="0 0 24 24"><path d="M4 16h16M8 16a4 4 0 0 1 8 0M12 7V3M6 8l1.5 1.5M18 8l-1.5 1.5"/></svg><small>${sun ? sun.set : "--:--"}</small></div>
      <div class="hb-wd">${EN_WD[dt.getDay()]}</div><div class="hb-num">${dt.getDate()}</div><div class="hb-my"><span>${EN_M[dt.getMonth()]}</span><span>${dt.getFullYear()}</span></div>
      <div class="hb-art">${doodle(sk, { sketch: true, accent: skc, seed: dt.getDate() })}</div>
      <div class="hb-wx"><b>${WX && WX.temp != null ? Math.round(WX.hi ?? WX.temp) + "°" : "--"}</b><span>/ ${WX && WX.lo != null ? Math.round(WX.lo) + "°" : "--"}</span><small>${esc(gg ? gg.en : city || "")}${WX ? " · " + esc(WX.text || "") : ""}</small></div>
      <div class="hb-src">${WX ? esc((WX.source || "").replace("（备用）", "")) : T("部署后显示天气", "Weather after deploy")}</div>
      <button class="hb-note" id="tsNote" aria-label="${T("写日记", "Write")}">${note ? `<span class="hb-note-t">${esc(note.slice(0, 26))}</span>` : `<span class="hb-note-t muted">${T("写几句今天", "A few lines about today")}</span>`}<em>✎</em></button>
      <span class="hb-washi"></span><span class="hb-seal">${d === end ? "终" : "旅"}</span>
      ${inTrip ? `<div class="hb-prog"><small>${T(`第 ${dayN} 天 / 共 ${days.length} 天`, `Day ${dayN} of ${days.length}`)}${left > 0 ? ` <i>· ${T(`还有 ${left} 天回家`, `${left} days to go`)}</i>` : ` <i>· ${T("最后一天", "last day")}</i>`}${moods[d] ? ` <b class="hb-mood">${esc(moods[d])}</b>` : ""}</small><div class="hb-bar">${days.map(x => `<i class="${x < d ? "past" : x === d ? "now" : ""}${J.days[x] ? " wrote" : ""}"></i>`).join("")}</div></div>` : ""}
      ${homeClock(gg)}</div>
    ${todays.length ? `<div class="hb-ev">${todays.map((a, i) => `<div class="hb-row" style="--c:${PAST[i % PAST.length]}"><time>${esc(a.time || "—")}</time><div><b>${esc(a.title)}</b>${a.note || a.area ? `<small>${esc(a.area || a.note || "")}</small>` : ""}</div></div>`).join("")}</div>` : `<div class="hb-ev"><div class="hb-row" style="--c:#eef0f2"><time>—</time><div><b>${inTrip ? T("今天还没安排", "Nothing planned yet") : T(`旅行 ${(days[0] || "").slice(5).replace("-", ".")} 出发`, `Trip starts ${days[0] || ""}`)}</b><small>${T("往下滑抽今日旅运", "Scroll down for today's fortune")}</small></div></div></div>`}`;
  // 今日四件小事: the rituals that slow the day down
  let fortuneDone = false; try { const v = JSON.parse(localStorage.getItem("travel-fortune-v1") || "null"); fortuneDone = !!(v && v.date === d); } catch (e) {}
  let drawDone = false, stampDone = false, spendDone = false;
  try { drawDone = !!(await api.myDraw(d)); } catch (e) {}
  try { stampDone = (await api.stamps()).some(s => s.date === d); } catch (e) {}
  try { const B = await import("./budget.js"); spendDone = B.exps.some(e => e.date === d && !e.prepaid); } catch (e) {}
  const lastDay = d === end;
  const R = lastDay ? [["stamp", T("把没盖的章盖了", "Stamp what's left"), stampDone, "stamp"], ["note", T("把想说的写了，选一个字", "Write the last line, pick a word"), !!note, "pencil-simple-line"], ["spend", T("买伴手礼，记一笔", "Souvenirs, log it"), spendDone, "receipt"], ["poster", T("看一眼海报", "Look at the poster"), !!localStorage.getItem("td-poster-seen:" + api.trip.id), "image"], ["letter", T("给一位旅伴写一封信，回家第七天才能拆", "A letter to a buddy, opens in 7 days"), !!localStorage.getItem("td-letter:" + api.trip.id), "paper-plane-tilt"]]
    : [["fortune", T("拆一封今日旅运", "Open today's fortune"), fortuneDone, "envelope"], ["deck", T("抽一张牌，定今天的心情", "Draw a card for the day"), drawDone, "cards"], ["stamp", T("到一个地方，盖一个章", "Arrive somewhere, stamp it"), stampDone, "stamp"], ["spend", T("记一笔，撕一张美食票", "Log a spend, tear a food ticket"), spendDone, "receipt"], ["note", T("睡前写一句今天，选一个字", "One line before sleep, one word"), !!note, "pencil-simple-line"]];
  const B2 = await import("./budget.js"), todaySpend = B2.exps.filter(e => e.date === d && !e.prepaid), tot = todaySpend.reduce((q, e) => q + B2.myShare(e), 0);
  let ritEl = el.querySelector("#ritSlot"); if (!ritEl) { ritEl = document.createElement("div"); ritEl.id = "ritSlot"; el.appendChild(ritEl); }
  let live = ""; try { const N = await import("../lib/notices.js"); live = N.countdownHTML(); const fx = (await api.effects()).filter(x => x.target_date === d && !x.resolved && x.card !== "X" && CARD[x.card]); if (fx.length) live += `<div class="ooc-banner"><i>失控</i><div>${fx.map(x => `<b>${x.card} · ${CARD[x.card] ? CARD[x.card].name : ""}</b><span>${esc(((CARD[x.card] && CARD[x.card].ooc) || x.description || "").replace(/明天/g, "今天"))}${x.detail ? "：" + esc(x.detail) : ""}</span>`).join("")}<small class="ooc-tap">点一下，重看失控 ›</small></div></div>`; } catch (e) {}
  ritEl.innerHTML = live + `<div class="rit"><div class="rit-h"><small>SLOW DOWN</small><b>${T("今天的五件小事", "Five small things today")}</b><span>${R.filter(r => r[2]).length}/${R.length}</span></div>
    ${R.map(([k, l, done, i]) => `<button class="rit-row${done ? " done" : ""}" data-rit="${k}"><i>${done ? ic("check") : ""}</i><span>${l}</span>${ic(i === "envelope" ? "ticket" : i)}</button>`).join("")}</div>
    <button class="rcp" data-rit="budget"><small>TODAY'S RECEIPT · ${d.slice(5).replace("-", ".")}</small>${todaySpend.length ? todaySpend.slice(0, 4).map(e => `<span><b>${esc(e.note || e.category)}</b><em>${B2.money(B2.myShare(e))}</em></span>`).join("") : `<span><b>${T("今天还没花钱", "Nothing spent yet")}</b><em>—</em></span>`}<strong><b>${T("今日合计", "Today")}</b><em>${B2.money(tot)}</em></strong></button>${await extrasHTML(d, days, gg)}`;
  el.querySelectorAll("[data-rit]").forEach(b => b.onclick = () => { const k = b.dataset.rit; mus.pluck(2, .03); if (k === "fortune") document.getElementById("stage")?.scrollIntoView({ behavior: "smooth", block: "center" }); else if (k === "note") openDiary(inTrip ? d : null); else if (k === "stamp") window.tdGo && window.tdGo("trip"); else if (k === "deck") window.tdGo && window.tdGo("deck"); else if (k === "spend") window.tdGo && window.tdGo("tear"); else if (k === "budget") window.tdGo && window.tdGo("budget"); else if (k === "poster") { localStorage.setItem("td-poster-seen:" + api.trip.id, "1"); import("./collection.js").then(m => m.openPoster()); } else if (k === "letter") openLetter(d); else if (k === "moment") askMoment(d); });
  el.querySelectorAll("[data-atm]").forEach(b => b.onclick = () => import("../lib/atmos.js").then(m => toast(m.ATMOS[b.dataset.atm].hint)));
  $("tsNote").onclick = () => openDiary(inTrip ? d : null);
  el.querySelector(".hb-art").onclick = () => playMotion(weatherMotion(WX), { temp: WX && WX.temp != null ? Math.round(WX.temp) : null });
  if (WXcity !== city) { WXcity = city; weatherFor(city).then(v => { WX = v; renderToday(); }); }
}
on("trip", () => { WXcity = null; renderToday(); });

/* the diary: one page per day + the trip summary */
export async function openDiary(date) {
  const days = tripDays(), J = await getJournal(); let cur = date && days.includes(date) ? date : "summary";
  const prompts = [T("今天最难忘的一刻是……", "The moment I'll remember…"), T("最好吃的一口是……", "The best bite…"), T("今天学到的一件小事……", "A small thing I learned…"), T("想对同行的人说……", "To the people I travelled with…")];
  const draw = () => {
    const txt = cur === "summary" ? J.summary : (J.days[cur] || "");
    const html = `<div class="as diary2"><small class="as-k">${T("旅行日记 · 只有你看得到", "Travel diary · private")}</small><h3>${cur === "summary" ? T("整趟旅行的总结", "Looking back on the trip") : `${shortDate(cur)} ${weekday(cur)} · ${esc(cityOf(cur))}`}</h3>
      <div class="dy2-days"><button data-d="summary" class="${cur === "summary" ? "on" : ""}">${T("总结", "Summary")}</button>${days.map((d, i) => `<button data-d="${d}" class="${cur === d ? "on" : ""}${J.days[d] ? " has" : ""}">${T("第" + (i + 1) + "天", "D" + (i + 1))}</button>`).join("")}</div>
      ${cur !== "summary" ? `<div class="mood-row">${["喜", "静", "累", "雨", "饱", "想家", "热", "满"].map(w => `<button data-mood="${w}" class="${(J.moods || {})[cur] === w ? "on" : ""}">${w}</button>`).join("")}<small>${T("今天一个字", "one word")}</small></div>` : ""}
      <textarea class="dy2-text" id="dy2" placeholder="${prompts[(cur.length + days.indexOf(cur) + 4) % prompts.length]}">${esc(txt)}</textarea>
      <div class="dy2-prompts">${prompts.map(p => `<button data-p="${esc(p)}">${esc(p)}</button>`).join("")}</div>
      <p class="as-hint" id="dy2s">${T("写的会自动保存，会排进旅行 zine、发票和海报。", "Saves as you type. It goes into your zine, receipt and poster.")}</p>
      <div class="as-btns"><button class="btn ink full" data-act="done">${T("好了", "Done")}</button></div></div>`;
    setSheet(html); const el = document.querySelector(".usheet");
    const ta = el.querySelector("#dy2");
    ta.oninput = () => { if (cur === "summary") J.summary = ta.value; else { J.days[cur] = ta.value; shareLine(cur, ta.value, (J.moods || {})[cur]); } saveJournal(J).then(() => { const s = el.querySelector("#dy2s"); if (s) s.textContent = T("已保存 · ", "Saved · ") + new Date().toTimeString().slice(0, 5); }); if (Math.random() < .3) mus.pluck(Math.floor(Math.random() * 8), .015); };
    el.querySelectorAll("[data-mood]").forEach(b => b.onclick = () => { J.moods = J.moods || {}; J.moods[cur] = J.moods[cur] === b.dataset.mood ? "" : b.dataset.mood; el.querySelectorAll("[data-mood]").forEach(x => x.classList.toggle("on", J.moods[cur] === x.dataset.mood)); saveJournal(J); shareLine(cur, ta.value, J.moods[cur]); mus.pluck(4, .03); });
    el.querySelectorAll("[data-d]").forEach(b => b.onclick = () => { cur = b.dataset.d; mus.pluck(2, .03); draw(); });
    el.querySelectorAll("[data-p]").forEach(b => b.onclick = () => { ta.value = (ta.value ? ta.value + "\n" : "") + b.dataset.p; ta.oninput(); ta.focus(); });
    bind(el, { done: () => { closeSheet(); renderToday(); } });
  };
  openSheet(`<div class="as"></div>`, { accent: "#2f5a8a" }); draw();
}

/* ---------- the three ages of a trip ---------- */
function homeClock(gg) { const off = ({ TH: 420, VN: 420, KR: 540, JP: 540, NZ: 780 })[gg && gg.w && gg.w.cc]; if (off == null || off === 480) return ""; const now = new Date(), home = new Date(now.getTime() + (480 - (-now.getTimezoneOffset())) * 60000), hh = home.getHours(); return `<div class="hb-home"><i class="${hh >= 19 || hh < 6 ? "dark" : ""}"></i>${T("家里现在", "Home")} ${String(hh).padStart(2, "0")}:${String(home.getMinutes()).padStart(2, "0")}</div>`; }
function renderBefore(el, { daysTo, start, gg, city, sun }) {
  const K = "td-prep:" + api.trip.id; let done = []; try { done = JSON.parse(localStorage.getItem(K) || "[]"); } catch (e) {}
  const P = [T("护照拍一张，存在相册", "Photo of your passport"), T("换一点当地的钱", "Change some cash"), T("下载离线地图", "Offline map"), T("把航班告诉家里人", "Tell family the flight"), T("清单打完勾", "Finish the checklist")];
  const seal = daysTo <= 1 ? "明" : daysTo <= 3 ? "待" : "旅";
  el.innerHTML = `<div class="hb hb-cd"><i class="hb-hole l"></i><i class="hb-hole r"></i><div class="hb-wd">${T("距离出发", "Until departure")}</div><div class="hb-num">${daysTo}</div><div class="hb-my"><span>${T("天", "days")}</span></div>
    <p class="hb-cd-sub">${esc(gg ? gg.name + " · " + gg.en : city || "")} · ${T("出发", "leaving")} ${start.slice(5).replace("-", ".")}${sun ? ` · ${T("那天日出", "sunrise")} ${sun.rise}` : ""}</p>
    <span class="hb-washi"></span><span class="hb-seal">${seal}</span></div>
    <div class="rit"><div class="rit-h"><small>BEFORE</small><b>${T("出发前的五件事", "Five things before you go")}</b><span>${done.length}/${P.length}</span></div>${P.map((t, i) => `<button class="rit-row${done.includes(i) ? " done" : ""}" data-prep="${i}"><i>${done.includes(i) ? ic("check") : ""}</i><span>${t}</span></button>`).join("")}</div>`;
  el.querySelectorAll("[data-prep]").forEach(b => b.onclick = () => { const i = +b.dataset.prep; done = done.includes(i) ? done.filter(x => x !== i) : done.concat(i); localStorage.setItem(K, JSON.stringify(done)); mus.chime(done.length, .03); renderToday(); });
}
function renderAfter(el, { daysBack, end, days }) {
  const K = "td-blackout:" + api.trip.id;
  if (!localStorage.getItem(K)) { localStorage.setItem(K, "1"); import("./collection.js").then(async m => { const st = (await api.stamps()).filter(x => x.trip_id === api.trip.id); let w = 0; try { w = (await api.wallet()).length; } catch (e) {} const ov = document.createElement("div"); ov.className = "blackout"; ov.innerHTML = `<p>${T("这趟旅行", "This trip")}</p><b>${days.length} ${T("天", "days")} · ${st.length} ${T("个章", "stamps")} · ${w} ${T("张票", "tickets")}</b><small>${esc(api.trip.name)}</small>`; document.body.appendChild(ov); requestAnimationFrame(() => ov.classList.add("on")); mus.harp(0, 5, .12); setTimeout(() => { ov.classList.remove("on"); setTimeout(() => ov.remove(), 800); }, 3600); }); }
  const old = daysBack >= 30; let photo = null; api.stamps().then(async ss => { const p = ss.filter(x => x.trip_id === api.trip.id && x.photo_path).pop(); if (p) { const u = await api.photoUrl(p.photo_path); const ph = el.querySelector(".hb-after-ph"); if (u && ph) ph.style.backgroundImage = `url("${u}")`; } });
  getJournal().then(J => { const k = Object.keys(J.days).sort(); const q = k.length ? J.days[k[old ? Math.floor(daysBack) % k.length : k.length - 1]] : ""; const el2 = el.querySelector(".hb-after-q"); if (el2 && q) el2.textContent = q; });
  el.innerHTML = `<div class="hb hb-cd"><i class="hb-hole l"></i><i class="hb-hole r"></i><div class="hb-wd">${T("回来第", "Back for")}</div><div class="hb-num">${daysBack}</div><div class="hb-my"><span>${T("天", "days")}</span></div>
    <div class="hb-after-ph"></div><p class="hb-after-q"></p><span class="hb-seal">归</span></div>
    <div class="rit"><button class="rit-row" data-next><i>→</i><span>${T("下一次去哪？", "Where next?")}</span>${ic("airplane-tilt")}</button>${lettersHTML()}</div>`;
  el.querySelector("[data-next]").onclick = () => import("./trips.js").then(m => m.newTripForm());
  api.letters().then(L => { const mine = L.filter(x => x.to_id === api.me.id && x.open_at <= today()); const box = el.querySelector(".letters"); if (box && mine.length) box.innerHTML = mine.map(x => `<div class="letter"><small>${T("来自", "From")} ${esc(nameOf(x.from_id || x.user_id))} · ${T("写于最后一夜", "written on the last night")}</small><p>${esc(x.body)}</p></div>`).join(""); });
}
const lettersHTML = () => `<div class="letters"></div>`;
async function extrasHTML(d, days, gg) {
  let out = "";
  // 氛围
  try { const m = await import("../lib/atmos.js"); const a = await m.todaysAtmos(); if (a) out += `<button class="atm-chip" data-atm="${a}"><b>${m.ATMOS[a].name}</b><small>${m.ATMOS[a].zh}</small></button>`; } catch (e) {}
  // 出发日的登机牌
  if (d === days[0]) { try { const B = await import("./budget.js"); const f = B.exps.find(e => e.category === "Flight" && e.prepaid); out += `<div class="bpass"><small>BOARDING PASS · ${T("出发日", "Departure")}</small><b>${esc(api.trip.name)}</b><span>${esc(f ? f.note : T("今天出发", "Today we leave"))} · ${d.slice(5).replace("-", ".")}</span><i></i></div>`; } catch (e) {} }
  // 旅伴昨天的那句
  try { const y = new Date(d + "T12:00:00"); y.setDate(y.getDate() - 1); const ys = y.toISOString().slice(0, 10); const L = (await api.dayLines(ys)).filter(x => x.user_id !== api.me.id && x.text); if (L.length) out += `<div class="ylines"><small>${T("旅伴昨天写的", "What they wrote yesterday")}</small>${L.map(x => `<p><b>${esc(nameOf(x.user_id))}</b>${x.mood ? `<i>${esc(x.mood)}</i>` : ""} ${esc(x.text)}</p>`).join("")}</div>`; } catch (e) {}
  // 同一时刻 15:00–16:00
  try { const h = new Date().getHours(); const M = await api.momentsOn(d); const mine = M.some(x => x.user_id === api.me.id);
    if ((h >= 15 && h < 16 && !mine) || M.length) out += `<div class="rit"><div class="rit-h"><small>15:00</small><b>${T("现在，大家都在哪？", "Where is everyone, right now?")}</b></div>${M.map(x => `<div class="rit-row done"><i>${ic("map-pin")}</i><span><b>${esc(nameOf(x.user_id))}</b> ${esc(x.note || "")}</span></div>`).join("")}${h >= 15 && h < 16 && !mine ? `<button class="rit-row" data-rit="moment"><i></i><span>${T("我在……", "I'm at…")}</span>${ic("map-pin")}</button>` : ""}</div>`; } catch (e) {}
  return out;
}
async function askMoment(d) { const n = prompt(T("现在在哪？一句就好", "Where are you? One line"), ""); if (!n) return; let lat = null, lng = null; try { const pos = await new Promise((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, { timeout: 4000 })); lat = pos.coords.latitude; lng = pos.coords.longitude; } catch (e) {} try { await api.addMoment(d, n.trim(), lat, lng); mus.chime(3, .03); renderToday(); } catch (e) { toast("没能记下"); } }
async function openLetter(d) {
  const others = api.members.filter(m => m.id !== api.me.id); if (!others.length) return toast(T("这趟只有你一个人，信写给未来的自己吧", "Only you on this trip")); 
  const to = others[Math.floor(Math.random() * others.length)];
  const body = prompt(T(`写给 ${to.name} 的一封信（回家第 7 天才能拆）`, `A letter to ${to.name} (opens 7 days after)`), ""); if (!body) return;
  const days = tripDays(), end = days[days.length - 1], o = new Date(end + "T12:00:00"); o.setDate(o.getDate() + 7);
  try { await api.sendLetter(to.id, body.trim(), o.toISOString().slice(0, 10)); localStorage.setItem("td-letter:" + api.trip.id, "1"); mus.harp(2, 6, .07); toast(T("信封好了，第七天才会打开", "Sealed. It opens on day seven.")); renderToday(); } catch (e) { toast("没能寄出"); }
}

let shT = 0; function shareLine(date, text, mood) { clearTimeout(shT); shT = setTimeout(() => { api.saveDayLine(date, (text || "").split(/\n/)[0].slice(0, 80), mood || null).catch(() => {}); }, 900); }
