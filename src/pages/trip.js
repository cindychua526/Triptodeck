import { api, on, nameOf } from "../lib/api.js";
import { ic } from "../lib/icons.js";
import { $, esc, today, addDays, shortDate, weekday, toMin, fmtMin, whenTxt, uid } from "../lib/util.js";
import { openSheet, closeSheet, toast, bind } from "../lib/ui.js";
import { sfx } from "../lib/sound.js";
import { GUIDE, STAYS, EXTRA_PLACES, kindIcon } from "../data/fujian.js";
import { ICON } from "../data/world.js";
import { openCheckin, openSpecial, reviewInboxHTML, wireInbox, loadCheckins } from "./checkin.js";
import { myStamps } from "./collection.js";
import { openSettings } from "./settings.js";
import { mountMap, mapTools, missingCoords } from "./map.js";
import { GUIDES, guideFor } from "../data/guides.js";
import { expsFor } from "../data/experiences.js";
import { loreFor } from "../data/lore.js";
import { doodle, doodleFor } from "../data/doodles.js";
import { foodArt } from "../data/foodart.js";
import { openAdd as openExpense } from "./budget.js";
import { waxSeal } from "../data/stamps.js";
import { weatherFor, weatherLine } from "../lib/weather.js";
import { openTrips } from "./trips.js";
import { departuresHTML, hydrateDeparturePhotos, openDeparture, loadDepartures, needsSeal, sealCeremony } from "./arrive.js";

export let acts = [], checks = [], customs = [];
let selDate = null, seg = "plan", ready = false, mapDay = null;
export const isReady = () => ready;
const CITY_KEY = { "厦门": "xm", "泉州": "qz", "漳州": "zz", "福州": "fz", "平潭": "pn" };
export const tripDays = () => { const t = api.trip; if (!t) return []; const out = []; for (let d = t.start_date; d <= t.end_date; d = addDays(d, 1)) out.push(d); return out; };
export const dayActs = d => acts.filter(a => a.date === d).sort((a, b) => toMin(a.time) - toMin(b.time));
export const tripCities = () => { const t = api.trip; const g = ((t && t.cities) || []).map(c => guideFor(c)).filter(Boolean); return g; };
export const tripCityNames = () => ((api.trip && api.trip.cities) || []).map(c => (guideFor(c) || {}).name || c);
const firstCity = () => tripCityNames()[0] || "厦门";
export const cityOf = d => { const a = dayActs(d).find(x => x.city); if (a) return a.city; const days = tripDays(); if (!days.length) return firstCity(); if (d < days[0] && days[0] !== d) { const b = dayActs(days[0]).find(x => x.city); return b ? b.city : firstCity(); } const prev = days.filter(x => x < d).reverse().map(x => dayActs(x).find(y => y.city)).find(Boolean); return prev ? prev.city : firstCity(); };
export const tripCityKey = () => CITY_KEY[cityOf(today())] || null;
export const cityGuide = d => guideFor(cityOf(d));
export const lockedKinds = ["transit", "lodging", "flight"];
export const usable = a => a.status !== "removed" && a.status !== "skipped" && !a.is_main && !lockedKinds.includes(a.kind);
export async function loadTrip() {
  if (!api.trip) { acts = []; checks = []; customs = []; ready = true; render(); return; }
  try { [acts, checks, customs] = await Promise.all([api.activities(), api.checklist(), api.customItems()]); await loadDepartures(); await loadCheckins(); } catch (e) { console.warn(e); }
  ready = true; render();
}
on("trip", () => { selDate = null; mapDay = null; loadTrip(); });
on("custom_items", async () => { if (api.trip) { customs = await api.customItems(); render(); } });
on("activities", async () => { if (api.trip) { acts = await api.activities(); render(); } });
on("checklist_items", async () => { if (api.trip) { checks = await api.checklist(); render(); } });
on("stamps", () => render());
on("trip_members", () => render());

function dayIndex(d) { return tripDays().indexOf(d) + 1; }
function stayFor(d) { return api.trip && api.trip.template === "fujian" ? STAYS.find(s => d >= s.in && d < s.out) : null; }
const KIND_LABEL = { sight: "景点", food: "美食", transit: "交通", lodging: "住宿", flight: "航班" };

export function render() {
  const root = $("tripRoot"); if (!root) return;
  if (!api.trip) { root.innerHTML = `<div class="ph"><h2>还没有旅行</h2><p>开一本新的旅行手账，或者用邀请码加入朋友的。</p></div><div class="tp-actions"><button class="btn ink" data-act="trips">打开我的旅行</button></div>`; bind(root, { trips: () => openTrips() }); return; }
  const days = tripDays();
  if (!selDate || !days.includes(selDate)) selDate = days.includes(today()) ? today() : days[0];
  const d = selDate, idx = dayIndex(d), city = cityOf(d), stay = stayFor(d), list = dayActs(d);
  const doneN = checks.filter(c => c.done).length;
  const isToday = d === today();
  const stamps = myStamps();
  let h = `<div class="tp-top"><button class="trip-sw" data-act="trips" aria-label="切换旅行"><small>${api.trip.kind === "solo" ? "个人旅行" : "旅行房间 · " + api.members.length + " 人"} ⇄</small><h2>${esc(api.trip.name)}</h2></button><button class="icon-btn" data-act="settings" aria-label="设置">⚙︎</button></div>
    <div class="day-strip" role="tablist">${days.map((x, i) => `<button class="day-chip${x === d ? " on" : ""}${x === today() ? " now" : ""}" data-day="${x}" role="tab" aria-selected="${x === d}"><b>Day ${i + 1}</b><span>${shortDate(x)} ${weekday(x)}</span></button>`).join("")}</div>
    <div class="seg seg-top" style="margin:10px 18px 0"><button class="${seg === "plan" ? "on" : ""}" data-seg="plan">日程</button><button class="${seg === "map" ? "on" : ""}" data-seg="map">地图</button><button class="${seg === "guide" ? "on" : ""}" data-seg="guide">攻略</button><button class="${seg === "check" ? "on" : ""}" data-seg="check">清单 ${doneN}/${checks.length}</button></div>`;
  if (seg === "map") {
    const md = mapDay || d, t = mapTools(), miss = missingCoords(acts, md, days);
    h += `<div class="map-bar"><button class="chip sm${md === "all" ? " on" : ""}" data-mday="all">全部路线</button>${days.map((x, i) => `<button class="chip sm${md === x ? " on" : ""}" data-mday="${x}" style="--c:#3a2c1f">D${i + 1}</button>`).join("")}</div>
      <div class="map-holder" id="mapHolder"></div>
      <div class="map-tools"><div class="seg"><button class="${t.provider === "amap" ? "on" : ""}" data-tile="amap">高德</button><button class="${t.provider === "osm" ? "on" : ""}" data-tile="osm">OSM</button></div>
        <button class="btn sm" data-act="mdark">${t.dark ? ic("sun") + " 原色" : ic("moon") + " 夜色"}</button><button class="btn sm" data-act="mme">📍 我在哪</button><button class="btn sm${t.editPins ? " ink" : ""}" data-act="medit">${t.editPins ? "完成调整" : "拖动调整位置"}</button></div>
      ${miss.length ? `<div class="map-miss"><small>这些地方还没在地图上（正在自动查找，也可以手动放）</small>${miss.map(a => `<button class="chip sm" data-place="${a.id}">📌 ${esc(a.title)}</button>`).join("")}</div>` : ""}
      <p class="col-note">路线按每天的时间顺序连起来。点标记可以打卡或导航。</p>`;
  }
  if (seg === "plan") {
    h += reviewInboxHTML();
    h += `<div class="day-head kraft"><div><small>DAY ${idx} · ${shortDate(d)} ${weekday(d)}${isToday ? " · 今天" : ""}</small><b>${esc(city)}</b>${isToday ? `<span class="wx" id="dayWx"></span>` : ""}${d <= today() && needsSeal(city) ? `<button class="seal-chip" data-act="seal">✦ 盖${esc(city)}入境章</button>` : ""}</div>${stay ? `<p>🛏 ${esc(stay.name)}<br><span>${esc(stay.note)}</span></p>` : ""}</div>`;
    if (idx === 1) h += departuresHTML();
    if (!list.length) h += `<p class="empty">这一天还没有安排</p>`;
    h += `<ol class="tl">`;
    const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
    list.forEach(a => {
      const st = a.status, dead = st === "removed" || st === "skipped", mine = stamps.filter(s => s.date === d && (s.name === a.title || (a.spots || []).includes(s.name)));
      if (a.kind === "transit") { h += `<li class="tl-move${dead ? " dead" : ""}"><time>${a.time}</time><span>${esc(a.title)}${a.note ? " · " + esc(a.note) : ""}</span></li>`; return; }
      const cur = isToday && toMin(a.time) <= nowMin && nowMin < toMin(a.time) + a.dur + (a.extra_min || 0);
      h += `<li class="tl-it k-${a.kind}${dead ? " dead" : ""}${st === "done" ? " done" : ""}${cur ? " cur" : ""}">
        <button class="tl-btn" data-open="${a.id}">
          <time>${a.was_time ? `<s>${a.was_time}</s>` : ""}${a.time}</time>
          <span class="tl-body"><b>${esc(a.title)}${a.was_title ? ` <s>${esc(a.was_title)}</s>` : ""}</b>
            <span class="tl-meta">${KIND_LABEL[a.kind] || ""}${a.dur ? " · " + (a.dur >= 60 ? (a.dur / 60).toFixed(a.dur % 60 ? 1 : 0) + "h" : a.dur + "min") : ""}${a.extra_min ? ` · <em>+${a.extra_min / 60}h 时间暂停</em>` : ""}${a.is_main ? " · 🔒主要行程" : ""}${a.source === "special" ? " · ✦计划外" : ""}${st === "skipped" ? " · 已传送跳过" : ""}${st === "removed" ? " · 已删除" : ""}</span>
            ${a.note ? `<span class="tl-note">${esc(a.note)}</span>` : ""}
            ${st === "done" ? `<span class="tl-done">✓ ${esc(nameOf(a.done_by))} 标记完成</span>` : ""}</span>
          ${mine.length ? `<span class="tl-stamp" title="已打卡">印</span>` : ""}
        </button>
        ${(a.spots || []).length ? `<div class="spot-chips">${a.spots.map(s => `<button class="sp-chip${stamps.some(x => x.date === d && x.name === s) ? " got" : ""}" data-spot="${esc(s)}" data-aid="${a.id}">${stamps.some(x => x.date === d && x.name === s) ? "✓ " : ""}${esc(s)}</button>`).join("")}</div>` : ""}
      </li>`;
    });
    h += `</ol><div class="tp-actions"><button class="btn" data-act="add">＋ 加一个地点</button><button class="btn ink" data-act="special">✦ 临时打卡（计划外）</button></div>`;
  } else if (seg === "guide") {
    h += guideHTML();
  } else if (seg === "check") {
    const cats = [...new Set(checks.map(c => c.category))];
    h += `<p class="col-note">清单是大家共用的，谁打了勾所有人都能看到。</p>`;
    cats.forEach(cat => {
      const items = checks.filter(c => c.category === cat);
      h += `<div class="ck-cat"><h3>${esc(cat)} <small>${items.filter(i => i.done).length}/${items.length}</small></h3><ul>${items.map(i => `<li class="${i.done ? "done" : ""}"><button class="ck-box" data-ck="${i.id}" role="checkbox" aria-checked="${i.done}" aria-label="${esc(i.label)}"></button><span><b data-ckren="${i.id}" data-l="${esc(i.label)}">${esc(i.label)}</b>${i.done ? `<small>✓ ${esc(nameOf(i.done_by))} · ${whenTxt(i.done_at)}</small>` : ""}</span><button class="x" data-ckdel="${i.id}" aria-label="删除">×</button></li>`).join("")}</ul>
        <div class="addrow"><input class="inp" data-newin="${esc(cat)}" placeholder="加一项到「${esc(cat)}」" maxlength="40"><button class="btn" data-newck="${esc(cat)}">添加</button></div></div>`;
    });
    h += `<div class="ck-cat"><div class="addrow"><input class="inp" id="newCat" placeholder="新的分类，比如：伴手礼" maxlength="16"><button class="btn" data-act="newcat">新分类</button></div></div>`;
  }
  const keepY = root.scrollTop, strip0 = root.querySelector(".day-strip"), keepX = strip0 ? strip0.scrollLeft : null;
  root.innerHTML = h;
  root.scrollTop = keepY;
  const strip = root.querySelector(".day-strip"), on = strip && strip.querySelector(".day-chip.on");
  if (strip) { if (keepX !== null) strip.scrollLeft = keepX; if (on && (on.offsetLeft < strip.scrollLeft || on.offsetLeft + on.offsetWidth > strip.scrollLeft + strip.clientWidth)) strip.scrollLeft = on.offsetLeft - strip.clientWidth / 2 + on.offsetWidth / 2; }
  if (seg === "guide") wireGuide(root);
  hydrateDeparturePhotos(root); wireInbox(root);
  const wxEl = $("dayWx"); if (wxEl) weatherFor(city).then(v => { if (v && wxEl.isConnected) { wxEl.textContent = weatherLine(v); wxEl.title = "数据来源：" + v.source; } });
  if (seg === "map") {
    mountMap($("mapHolder"), { acts, days, day: mapDay || d, onCheckin: a => openCheckin({ name: a.title, city: a.city, date: a.date, kind: "place", activityId: a.id, activityKind: a.kind }) });
    root.querySelectorAll("[data-mday]").forEach(b => b.onclick = () => { mapDay = b.dataset.mday; if (mapDay !== "all") selDate = mapDay; sfx.tap(); render(); });
    root.querySelectorAll("[data-tile]").forEach(b => b.onclick = () => { mapTools().setProvider(b.dataset.tile); render(); });
    root.querySelectorAll("[data-place]").forEach(b => b.onclick = () => mapTools().place(acts.find(a => a.id === b.dataset.place)));
  }
  root.querySelectorAll("[data-day]").forEach(b => b.onclick = () => { selDate = b.dataset.day; mapDay = b.dataset.day; sfx.tap(); render(); });
  root.querySelectorAll("[data-seg]").forEach(b => b.onclick = () => { seg = b.dataset.seg; sfx.tap(); render(); });
  root.querySelectorAll("[data-open]").forEach(b => b.onclick = () => openActivity(b.dataset.open));
  root.querySelectorAll("[data-spot]").forEach(b => b.onclick = () => { const a = acts.find(x => x.id === b.dataset.aid); openCheckin({ name: b.dataset.spot, city: a.city, date: a.date, kind: "place", parent: a.title }); });
  root.querySelectorAll("[data-ck]").forEach(b => b.onclick = async () => { const it = checks.find(c => c.id === b.dataset.ck); it.done = !it.done; it.done_by = api.me.id; it.done_at = new Date().toISOString(); sfx[it.done ? "stamp" : "tap"](); render(); try { await api.setCheck(it.id, it.done); } catch (e) { toast("没能同步，请检查网络"); } });
  root.querySelectorAll("[data-ckren]").forEach(b => b.onclick = async () => { const n = prompt("改成", b.dataset.l); if (!n || n.trim() === b.dataset.l) return; try { await api.renameCheck(b.dataset.ckren, n.trim()); } catch (e) { toast("没能改"); } });
  root.querySelectorAll("[data-ckdel]").forEach(b => b.onclick = async () => { if (!confirm("删除这一项？")) return; try { await api.deleteCheck(b.dataset.ckdel); } catch (e) { toast("没能删除"); } });
  root.querySelectorAll("[data-newck]").forEach(b => b.onclick = async () => { const inp = root.querySelector(`[data-newin="${CSS.escape(b.dataset.newck)}"]`), v = inp.value.trim(); if (!v) return; try { await api.addCheck(b.dataset.newck, v, 9999); sfx.tap(); } catch (e) { toast("没能添加"); } });
  bind(root, {
    settings: () => openSettings(), trips: () => openTrips(), dep: () => openDeparture(), seal: () => sealCeremony(city, d),
    mdark: () => { const t = mapTools(); t.setDark(!t.dark); render(); }, mme: () => mapTools().locate(), medit: () => { const t = mapTools(); t.setEdit(!t.editPins); render(); },
    add: () => openAdd(),
    special: () => openSpecial({ date: selDate, city: cityOf(selDate) }),
    newcat: async () => { const v = $("newCat").value.trim(); if (!v) return; try { await api.addCheck(v, "（新项目）", 99999); } catch (e) { toast("没能添加"); } }
  });
}
export const setSelDate = d => { selDate = d; render(); };

function openActivity(id) {
  const a = acts.find(x => x.id === id); if (!a) return;
  sfx.click();
  const gs = guideSpot(a.title), g = GUIDE[a.title] || (gs ? { note: gs.d + (gs.tip ? "　" + gs.tip : ""), dur: gs.time } : {}), stamps = myStamps().filter(s => s.date === a.date && s.name === a.title);
  const canCheck = !lockedKinds.includes(a.kind) || a.kind === "lodging";
  const icon = ICON[kindIcon(a.title, a.kind)] || "";
  const sh = openSheet(`<div class="as">
    <div class="as-top"><svg viewBox="0 0 120 80" class="as-art">${icon}</svg><div><small>${shortDate(a.date)} ${weekday(a.date)} · ${a.time}</small><h3>${esc(a.title)}</h3></div></div>
    ${g.hours || g.fee || g.dur ? `<div class="as-guide">${g.hours ? `<span><em>开放</em>${esc(g.hours)}</span>` : ""}${g.fee ? `<span><em>门票</em>${esc(g.fee)}</span>` : ""}${g.dur ? `<span><em>建议</em>${esc(g.dur)}</span>` : ""}${g.level ? `<span><em>等级</em>${esc(g.level)}</span>` : ""}</div>` : ""}
    ${g.foods ? `<div class="as-sec"><small>必吃 · 来自行程表</small><p>${g.foods.map(esc).join("、")}</p></div>` : ""}
    ${g.note || a.note ? `<div class="as-sec"><small>备注</small><p>${esc([a.note, g.note].filter(Boolean).join("　"))}</p></div>` : ""}
    ${stamps.length ? `<div class="as-sec"><small>你的打卡</small><p>✓ 已在这里盖过章</p></div>` : ""}
    <div class="as-btns">
      ${canCheck && a.status !== "removed" ? `<button class="btn ink full" data-act="checkin">${ic("stamp")} 抵达打卡 · 盖章</button>` : ""}
      <div class="row"><button class="btn" data-act="done">${a.status === "done" ? "取消完成" : "✓ 标记完成"}</button><button class="btn" data-act="main">${a.is_main ? "取消主要行程" : "设为主要行程"}</button></div>
      <div class="row"><button class="btn" data-act="rename">改名字 / 备注</button><button class="btn" data-act="time">改时间</button>${a.status === "skipped" || a.status === "removed" ? `<button class="btn" data-act="restore">恢复</button>` : ""}<button class="btn warn" data-act="del">删除</button></div>
      <p class="as-hint">${ic("lock-simple")} 主要行程不能被技能卡影响（行程表规则）。</p>
    </div></div>`, { accent: "#3a2c1f" });
  bind(sh, {
    checkin: () => { closeSheet(); openCheckin({ name: a.title, city: a.city, date: a.date, kind: "place", activityId: a.id, activityKind: a.kind }); },
    done: async () => { const done = a.status !== "done"; try { await api.updateActivity(a.id, { status: done ? "done" : "planned", done_by: done ? api.me.id : null, done_at: done ? new Date().toISOString() : null }); sfx[done ? "stamp" : "tap"](); closeSheet(); } catch (e) { toast("没能保存"); } },
    main: async () => { try { await api.updateActivity(a.id, { is_main: !a.is_main }); closeSheet(); } catch (e) { toast("没能保存"); } },
    restore: async () => { try { await api.updateActivity(a.id, { status: "planned" }); closeSheet(); } catch (e) { toast("没能保存"); } },
    rename: async () => { const n = prompt("地点名字", a.title); if (n === null) return; const note = prompt("备注（可以留空）", a.note || ""); if (note === null) return; try { await api.updateActivity(a.id, { title: n.trim() || a.title, note: note.trim() || null }); closeSheet(); } catch (e) { toast("没能保存"); } },
    time: async () => { const v = prompt("新的时间（HH:MM）", a.time); if (!v || !/^\d{1,2}:\d{2}$/.test(v)) return; try { await api.updateActivity(a.id, { time: v.padStart(5, "0") }); closeSheet(); } catch (e) { toast("没能保存"); } },
    del: async () => { if (!confirm(`删除「${a.title}」？所有人的行程都会删除这一项。`)) return; try { await api.deleteActivity(a.id); closeSheet(); } catch (e) { toast("没能删除"); } }
  });
}

function openAdd(prefill) {
  const d = selDate, city = cityOf(d), gd = guideFor(city), sugg = [...(gd ? gd.spots.map(x => x.n) : []), ...(EXTRA_PLACES[city] || []), ...customs.filter(c => c.kind === "spot" && c.city === city).map(c => c.name)].filter((x, i, a) => a.indexOf(x) === i && !dayActs(d).some(y => y.title === x));
  const sh = openSheet(`<div class="as"><small class="as-k">DAY ${dayIndex(d)} · ${shortDate(d)} · ${esc(city)}</small><h3>加一个地点</h3>
    <p class="as-hint" style="margin-top:0">从行程表里的候补地点挑一个，或者自己写。</p>
    <div class="chips-wrap">${sugg.map(s => `<button class="chip sm" data-sug="${esc(s)}">${esc(s)}</button>`).join("")}</div>
    <div class="addrow"><input class="inp" type="time" id="addT" value="${prefill && prefill.time || "15:00"}" aria-label="时间"><input class="inp" id="addN" maxlength="30" placeholder="地点名字" value="${esc(prefill && prefill.name || "")}"></div>
    <div class="seg" id="addK"><button class="on" data-k="sight">景点</button><button data-k="food">美食</button></div>
    <div class="as-btns"><button class="btn ink full" data-act="save">加入行程</button></div></div>`, { accent: "#3a2c1f" });
  let kind = "sight";
  sh.querySelectorAll("[data-sug]").forEach(b => b.onclick = () => { $("addN").value = b.dataset.sug; sfx.tap(); });
  sh.querySelectorAll("#addK [data-k]").forEach(b => b.onclick = () => { kind = b.dataset.k; sh.querySelectorAll("#addK button").forEach(x => x.classList.toggle("on", x === b)); });
  bind(sh, { save: async () => { const n = $("addN").value.trim(), t = $("addT").value; if (!n || !t) return toast("写上时间和地点"); const gsp = guideSpot(n); try { await api.addActivity({ date: d, time: t, title: n, city, kind, dur: 60, source: "added", ...(gsp && gsp.ll ? { lat: gsp.ll[0], lng: gsp.ll[1] } : {}) }); sfx.stamp(); closeSheet(); toast(`「${n}」已加入 Day ${dayIndex(d)}`); if (prefill && prefill.after) prefill.after(n); } catch (e) { toast("没能保存"); } } });
}
export { openAdd };

/* ---------- 攻略: destination guides for this trip's cities ---------- */
let gDeck = null, gCity = null;
export function guideSpot(name) { for (const g of GUIDES) { const s = g.spots.find(x => x.n === name); if (s) return s; } return null; }
function guideHTML() {
  const names = [...new Set([...tripCityNames(), ...customs.map(c => c.city)])];
  if (!gCity || !names.includes(gCity)) gCity = names[0] || null;
  const g = guideFor(gCity), mySpots = customs.filter(c => c.city === gCity && c.kind === "spot"), myFoods = customs.filter(c => c.city === gCity && c.kind === "food");
  let h = `<div class="map-bar">${names.map(n => `<button class="chip sm${n === gCity ? " on" : ""}" data-gcity="${esc(n)}" style="--c:${(guideFor(n) || {}).color || "#3a2c1f"}">${esc(n)}</button>`).join("")}<button class="chip sm" data-act="gmore">＋ 其他城市</button></div>`;
  if (!gCity) return h + `<p class="empty">这趟旅行还没选城市。点「其他城市」加一个。</p>`;
  if (g) h += `<div class="gd-hero" style="--c:${g.color}"><small>${esc(g.country)} · ${esc(g.en)}</small><b>${esc(g.name)}</b><p>${esc(g.intro)}</p></div>`;
  const inPlan = n => acts.some(a => a.title === n || (a.spots || []).includes(n));
  // the guide as a deck of cards: one at a time, tap to flip
  const decks = [];
  decks.push(["places", "必去", [...(g ? g.spots : []).map(s => ({ ...s, mine: false })), ...mySpots.map(c => ({ n: c.name, t: "自己加的", d: c.note || "", id: c.id, mine: true }))].map(x => ({ kind: "place", n: x.n, e: x.e, t: x.t, d: x.d, tip: x.tip, id: x.id, mine: x.mine }))]);
  decks.push(["foods", "必吃", [...(g ? g.foods : []).map(f => ({ ...f })), ...myFoods.map(c => ({ n: c.name, d: c.note || "", id: c.id, mine: true }))].map(x => ({ kind: "food", n: x.n, e: x.e, d: x.d, tip: x.where, id: x.id, mine: x.mine }))]);
  if (g && loreFor(g.id)) decks.push(["lore", "传说", [["history", "历史"], ["legend", "传说"], ["custom", "风情"]].filter(([k]) => loreFor(g.id)[k]).map(([k, zh]) => ({ kind: "lore", k, n: zh, d: loreFor(g.id)[k] }))]);
  if (g && expsFor(g.id).length) decks.push(["exps", "体验", expsFor(g.id).map(x => ({ kind: "exp", n: x.n, d: x.d, t: x.price, got: myStamps().some(st => st.kind === "experience" && st.name === x.n && st.trip_id === api.trip.id) }))]);
  if (!gDeck || !decks.some(d => d[0] === gDeck)) gDeck = decks[0][0];
  const cur = decks.find(d => d[0] === gDeck), cards = cur[2];
  const front = c => c.kind === "lore" ? `<div class="gk-lore"><i class="gk-enso"></i><b>${esc(c.n)}</b><small>${esc(g.name)}</small></div>`
    : `<div class="gk-art">${c.kind === "food" ? foodArt(c.n) : doodle(doodleFor(c.n, "place"), { seed: c.n.length + 3 })}</div><b>${esc(c.n)}</b>${c.e ? `<em>${esc(c.e)}</em>` : ""}${c.t ? `<span class="gk-tag">${esc(c.t)}</span>` : ""}${c.kind === "exp" && c.got ? `<span class="gk-got">已拿到印记</span>` : ""}`;
  const back = c => `<small class="gk-k">${esc(c.n)}</small><p>${esc(c.d || "")}</p>${c.tip ? `<p class="gk-tip">${esc(c.tip)}</p>` : ""}<div class="gk-btns">${c.kind === "place" ? (inPlan(c.n) ? `<small>已在行程里</small>` : `<button class="btn sm" data-addplan="${esc(c.n)}">加入行程</button>`) : ""}${c.kind === "exp" ? (c.got ? `<small>已完成</small>` : `<button class="btn sm ink" data-exp="${esc(c.n)}">我体验了</button>`) : ""}${c.mine ? `<button class="btn sm" data-delc="${c.id}">删除</button>` : ""}</div>`;
  h += `<div class="gk-tabs">${decks.map(([k, l, arr]) => `<button class="${k === gDeck ? "on" : ""}" data-gdeck="${k}">${l}<i>${arr.length}</i></button>`).join("")}</div>
    <div class="gk"><div class="gk-rail" id="gkRail">${cards.map((c, i) => `<div class="gk-slot"><div class="gk-card" data-gi="${i}"><div class="gk-face gk-front">${front(c)}<span class="gk-hint">轻点翻过来</span></div><div class="gk-face gk-back">${back(c)}</div></div></div>`).join("") || `<p class="empty">这一叠还是空的。</p>`}</div><div class="gk-dots" id="gkDots">${cards.map((_, i) => `<i class="${i === 0 ? "on" : ""}"></i>`).join("")}</div><p class="gk-idx" id="gkIdx">${cards.length ? `1 / ${cards.length}` : ""}</p></div>
    <div class="tp-actions"><button class="btn" data-act="gadd">＋ 自己加一个地方或美食</button></div>
    <p class="col-note">攻略内容是出发前整理的资料，开放时间和价格以现场为准。</p>`;
  return h;
}
function wireGuide(root) {
  root.querySelectorAll("[data-gdeck]").forEach(b => b.onclick = () => { gDeck = b.dataset.gdeck; sfx.tap(); render(); });
  root.querySelectorAll(".gk-card").forEach(c => c.onclick = e => { if (e.target.closest("button")) return; c.classList.toggle("flip"); sfx.flip ? sfx.flip() : sfx.tap(); });
  const rail = root.querySelector("#gkRail"); if (rail) { let t; rail.addEventListener("scroll", () => { clearTimeout(t); t = setTimeout(() => { const i = Math.round(rail.scrollLeft / rail.clientWidth); root.querySelectorAll("#gkDots i").forEach((d, k) => d.classList.toggle("on", k === i)); const idx = root.querySelector("#gkIdx"); if (idx) idx.textContent = `${i + 1} / ${rail.children.length}`; }, 60); }, { passive: true }); }
  root.querySelectorAll("[data-gcity]").forEach(b => b.onclick = () => { gCity = b.dataset.gcity; sfx.tap(); render(); });
  root.querySelectorAll("[data-addplan]").forEach(b => b.onclick = () => openAdd({ name: b.dataset.addplan }));
  root.querySelectorAll("[data-exp]").forEach(b => b.onclick = () => { const n = b.dataset.exp; openCheckin({ name: n, city: gCity, date: today(), kind: "experience", mission: { type: "place", text: `体验「${n}」，拍一张最能代表这次体验的照片` }, onDone: () => setTimeout(() => { if (confirm(`要把「${n}」的花费记进账本吗？`)) openExpense({ category: "Experience", note: n, shared: false }); }, 900) }); });
  root.querySelectorAll("[data-delc]").forEach(b => b.onclick = async () => { if (!confirm("删除这一项？")) return; try { await api.deleteCustom(b.dataset.delc); } catch (e) { toast("没能删除"); } });
  bind(root, { gadd: () => openCustom(), gmore: () => openCustom(true) });
}
function openCustom(newCity) {
  let kind = "spot";
  const sh = openSheet(`<div class="as"><small class="as-k">ADD YOUR OWN</small><h3>${newCity ? "加一个城市" : "自己加一个"}</h3>
    <p class="as-hint" style="margin-top:0">自己写，不用 AI。加好以后同一个旅行房间的人都看得到。</p>
    ${newCity ? `<div class="chips-wrap">${GUIDES.filter(g => !tripCities().some(x => x.id === g.id)).map(g => `<button class="chip sm" data-pickg="${g.id}" style="--c:${g.color}">${esc(g.name)}</button>`).join("")}</div><p class="as-hint">点上面的城市直接加入这趟旅行，或者在下面写一个新的。</p>` : ""}
    <label class="lbl">城市<input class="inp" id="cuCity" maxlength="12" value="${esc(newCity ? "" : gCity || "")}"></label>
    <div class="seg" id="cuKind" style="margin-top:10px"><button class="on" data-k="spot">地方</button><button data-k="food">美食</button></div>
    <label class="lbl">名字<input class="inp" id="cuName" maxlength="30" placeholder="比如：巷子里的老茶室"></label>
    <label class="lbl">备注（可选）<input class="inp" id="cuNote" maxlength="80" placeholder="好吃在哪、几点开、怎么去"></label>
    <div class="as-btns"><button class="btn ink full" data-act="save">加上</button></div></div>`, { accent: "#3a2c1f" });
  sh.querySelectorAll("#cuKind [data-k]").forEach(b => b.onclick = () => { kind = b.dataset.k; sh.querySelectorAll("#cuKind button").forEach(x => x.classList.toggle("on", x === b)); });
  sh.querySelectorAll("[data-pickg]").forEach(b => b.onclick = async () => { const cs = [...(api.trip.cities || []), b.dataset.pickg]; try { await api.updateTrip({ cities: cs }); gCity = guideFor(b.dataset.pickg).name; closeSheet(); render(); } catch (e) { toast("没能保存"); } });
  bind(sh, { save: async () => { const c = $("cuCity").value.trim(), n = $("cuName").value.trim(); if (!c || !n) return toast("写上城市和名字"); try { await api.addCustom({ city: c, kind, name: n, note: $("cuNote").value.trim() || null }); gCity = c; sfx.stamp(); closeSheet(); } catch (e) { toast("没能保存"); } } });
}

document.addEventListener("td-departures", () => render());
document.addEventListener("td-checkins", () => render());
