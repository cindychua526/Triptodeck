/* The bookshelf: every trip is a travel book. Opens on launch so you pick which book to continue. */
import { api, FUJIAN_TEMPLATE } from "../lib/api.js";
import { $, esc, today, addDays, shortDate } from "../lib/util.js";
import { openSheet, closeSheet, toast, bind, setSheet, askConfirm, askText } from "../lib/ui.js";
import { sfx } from "../lib/sound.js";
import { GUIDES, COUNTRIES, guideFor } from "../data/guides.js";
import { lang, setLang, t as T } from "../lib/i18n.js";
import { foodArt } from "../data/foodart.js";
import { doodle, doodleFor } from "../data/doodles.js";
import { posterStamp } from "../data/posterstamp.js";
const postageStamp = (name, city, date, kind) => posterStamp({ name, city, date, kind });

const nameOfCity = c => (guideFor(c) || {}).name || c;
const colorOf = t => { const g = guideFor((t.cities || [])[0]); return g ? g.color : "#5a4632"; };
const EMBLEM = `<svg viewBox="0 0 100 100" class="bk-emblem" aria-hidden="true"><g fill="none" stroke="currentColor"><circle cx="50" cy="50" r="40" stroke-width="1.4"/><circle cx="50" cy="50" r="34" stroke-width=".6" stroke-dasharray="1 3"/><circle cx="50" cy="50" r="18" stroke-width=".8"/>${Array.from({ length: 16 }, (_, i) => `<path d="M50 ${i % 2 ? 12 : 8}V16" transform="rotate(${i * 22.5} 50 50)" stroke-width="${i % 2 ? .6 : 1.2}"/>`).join("")}<path d="M50 22L55 50L50 78L45 50Z M22 50L50 45L78 50L50 55Z" stroke-width=".9"/></g><circle cx="50" cy="50" r="2.4" fill="currentColor"/></svg>`;
const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const CODE = { xm: "XMN", qz: "JJN", zz: "XMN", fz: "FOC", kl: "KUL", ipoh: "IPH", taiping: "IPH", hatyai: "HDY", cs: "CSX", zjj: "DYG", cq: "CKG", cs2: "SWA", bj: "PEK", sh: "PVG", hz: "HGH", cd: "TFU", xa: "XIY", gz: "CAN", hk: "HKG", mo: "MFM", pen: "PEN", mlk: "MKZ", jb: "JHB", cam: "IPH", kk: "BKI", lgk: "LGK", sg: "SIN", bkk: "BKK", cnx: "CNX", hkt: "HKT" };
function bookHTML(t, cur, photo, idx, origin, tstamps = []) {
  const dds = [...new Set(tstamps.filter(s => s.kind !== "city").map(s => doodleFor(s.name, "place")))].slice(0, 3);
  const g = guideFor((t.cities || [])[0]), en = g ? g.en.toUpperCase() : (t.name || "").toUpperCase(), cs = (t.cities || []).map(nameOfCity);
  const food = g && g.foods[0] ? g.foods[0].n : "", food2 = g && g.foods[1] ? g.foods[1].n : food;
  const d0 = (t.start_date || "").split("-"), d1 = (t.end_date || "").split("-"), no = String(idx + 1).padStart(3, "0"), me = api.me ? api.me.name : "";
  const from = (origin || "").match(/[A-Z]{3}$/) ? origin.match(/[A-Z]{3}$/)[0] : "HOME", to = CODE[(t.cities || [])[0]] || "TRIP";
  const hello = T(`你好，${cs[0] || t.name}！`, `Hello, ${g ? g.en : t.name}!`);
  return `<button class="fold p-${bookLook(t.id).c} pat-${bookLook(t.id).p}${cur ? " cur" : ""}${bookMeta(t.id).arch ? " archived" : ""}" data-trip="${t.id}" style="--c:${colorOf(t)}" aria-label="${esc(t.name)}" data-noi18n>
    <span class="fd-pass"><i>${T("登机牌", "BOARDING")} · ${from} → ${to}</i><b>${d0[2] || ""} ${T((+d0[1] || 1) + "月", MONTHS[(+d0[1] || 1) - 1])}</b></span>
    <span class="fd-tab"></span><i class="fd-state">${bookMeta(t.id).pin ? "📌 " : ""}${bookStatus(t)}</i>
    <span class="fd-body">
      <span class="fd-spine">${T(`${cs[0] || ""} · 旅行备忘`, `MEMO OF ${en}`)}</span>
      <span class="fd-label"><small>${T(`${esc(me)} 的旅行档案`, `${esc(me)}'s Archive`)}</small><i>${T("编号", "NO.")} ${T("旅行", "Travel")} - ${no}</i><b>${T(esc(t.name), "JOURNEY OF " + esc(en))}</b><em>${T(`${(t.start_date || "").replace(/-/g, "/")} – ${d1.slice(1).join("/")}`, `DATE. ${(t.start_date || "").replace(/-/g, "/")} - ${d1.slice(1).join("/")}`)}</em></span>
      <span class="fd-tape">${[food, food2, food, food2, food].map(f => `<span>${foodArt(f)}</span>`).join("")}</span>
      <span class="fd-clip"></span>
      ${photo ? `<span class="fd-photo" data-cov="${esc(photo)}"></span>` : ""}
      ${dds.length ? `<span class="fd-dds">${dds.map((d, i) => `<i style="--r:${i * 9 - 9}deg">${doodle(d, { seed: i + 2 })}</i>`).join("")}</span>` : ""}
      <span class="fd-hand">${esc(hello)}</span>
      <span class="fd-stamp">${g ? postageStamp(g.spots[0] ? g.spots[0].n : g.name, g.name, t.start_date) : ""}</span>
    </span>
    ${cur ? `<span class="fd-now">${T("正在看", "OPEN")}</span>` : ""}
  </button>`;
}
export async function openShelf() {
  let trips = [], stamps = []; try { [trips, stamps] = await Promise.all([api.listTrips(), api.stamps()]); } catch (e) {}
  const cur = api.trip && api.trip.id;
  trips = trips.slice().sort((a, b) => String(b.start_date).localeCompare(String(a.start_date)));
  const photoOf = t => { const s = stamps.filter(x => x.trip_id === t.id && x.photo_path); return s.length ? s[s.length - 1].photo_path : null; };
  let deps = []; try { deps = api.trip ? await api.departures() : []; } catch (e) {}
  const myOrigin = (deps.find(d => d.user_id === (api.me && api.me.id)) || {}).origin;
  document.querySelector(".shelf")?.remove();
  const el = document.createElement("div"); el.className = "shelf lib"; el.setAttribute("role", "dialog"); el.setAttribute("aria-label", "我的旅行手账");
  const td = today(), stOf = t => (bookMeta(t.id).arch ? "arch" : !t.start_date || td < t.start_date ? "soon" : td > t.end_date ? "done" : "now");
  const rank = { now: 0, soon: 1, done: 2, arch: 3 };
  trips = trips.slice().sort((a, b) => (bookMeta(b.id).pin ? 1 : 0) - (bookMeta(a.id).pin ? 1 : 0) || rank[stOf(a)] - rank[stOf(b)] || (stOf(a) === "soon" ? String(a.start_date).localeCompare(String(b.start_date)) : String(b.start_date).localeCompare(String(a.start_date))));
  const LBL = { now: "进行中", soon: "还没出发", done: "已完成", arch: "已归档" };
  const items = [...trips.map((t, i) => bookHTML(t, t.id === cur, photoOf(t), trips.length - 1 - i, t.id === cur ? myOrigin : "", stamps.filter(x => x.trip_id === t.id))), `<button class="fold new" data-act="new"><span class="fd-body"><b>＋</b><em>${T("开一本新的", "Start a new one")}</em></span></button>`];
  el.innerHTML = `<div class="shelf-in">
    <div class="lib-top"><button class="btn sm ink" data-act="new">＋ ${T("新的旅行", "New trip")}</button></div><div class="lib-dots"><button class="linkbtn" data-act="deco">${T("装饰这一本", "Decorate this one")}</button></div><div class="shelf-h"><h2>${T(`${esc(api.me ? api.me.name : "")}的旅行档案`, `${esc(api.me ? api.me.name : "")}'s Archive`)}</h2><p>${T("每一趟旅行是一份档案。点一下拿出来，再点一下打开。", "Every trip is a folder. Tap to pull it out, tap again to open.")}</p></div>
    <div class="fold-row">${items.join("")}</div>
    <div class="shelf-foot">${api.mode === "cloud" ? `<div class="addrow"><input class="inp" id="shCode" maxlength="8" placeholder="朋友给的邀请码" style="text-transform:uppercase"><button class="btn" data-act="join">加入房间</button></div>` : ""}
      ${cur ? `<button class="linkbtn" data-act="close">回到「${esc(api.trip.name)}」</button>` : ""}</div></div>`;
  document.body.appendChild(el); requestAnimationFrame(() => { el.classList.add("on"); const c = el.querySelector(".fold.cur"); if (c) c.scrollIntoView({ inline: "center", block: "nearest" }); }); sfx.paper();
  el.querySelectorAll("[data-cov]").forEach(async c => { const u = await api.photoUrl(c.dataset.cov); if (u && c.isConnected) c.style.backgroundImage = `url("${u}")`; });
  const close = () => { el.classList.remove("on"); setTimeout(() => el.remove(), 450); };
  el.querySelectorAll("[data-trip]").forEach(b => b.onclick = async () => {
    if (!b.classList.contains("pulled")) { el.querySelectorAll(".fold.pulled").forEach(x => x.classList.remove("pulled")); b.classList.add("pulled"); b.scrollIntoView({ inline: "center", behavior: "smooth", block: "nearest" }); sfx.flip(); return; }
    b.classList.add("opening"); sfx.paper();
    if (b.dataset.trip !== cur) await api.switchTrip(b.dataset.trip);
    setTimeout(close, 700);
  });
  const deco = el.querySelector("[data-act=deco]"); if (deco) deco.onclick = e => { e.stopPropagation(); openDeco(el); };
  bind(el, { new: () => { close(); newTripForm(); }, close, join: async () => { const c = $("shCode").value.trim(); if (!c) return; try { await api.joinTrip(c); close(); import("../lib/motion.js").then(m => m.playMotion("needle", { text: `你加入了「${api.trip.name}」\n线穿过针眼，旅伴们连在一起了。` })); } catch (e) { toast(/NOT_FOUND/.test(e.message) ? "找不到这个邀请码" : /PRIVATE/.test(e.message) ? "这是别人的个人旅行，不能加入" : "没能加入：" + e.message); } } });
}
export const openTrips = openShelf;

export function newTripForm(opts = {}) {
  let kind = "group", cities = [], template = null, q = "";
  const t0 = addDays(today(), 7);
  const val = id => ($(id) || {}).value;
  const draw = () => {
    const keep = { name: val("ntName") || "", start: val("ntStart") || t0, end: val("ntEnd") || addDays(t0, 2), budget: val("ntBudget") || 2000 };
    const fj = cities.includes("xm") || cities.includes("qz");
    const match = g => !q || g.name.includes(q) || g.en.toLowerCase().includes(q.toLowerCase());
    const groups = COUNTRIES.map(c => [c, GUIDES.filter(g => g.country === c && match(g))]).filter(([, l]) => l.length);
    const custom = cities.filter(c => !guideFor(c));
    const html = `<div class="as"><small class="as-k">NEW TRAVEL BOOK</small><h3>开一本新的旅行手账</h3>
      <label class="lbl">名字<input class="inp" id="ntName" maxlength="24" placeholder="比如：KL 周末 · Pavilion 逛吃" value="${esc(keep.name)}"></label>
      <div class="seg" style="margin-top:12px"><button class="${kind === "group" ? "on" : ""}" data-kind="group">和朋友一起（房间）</button><button class="${kind === "solo" ? "on" : ""}" data-kind="solo">个人旅行</button></div>
      <p class="as-hint">${kind === "group" ? "有邀请码。行程、清单、账本、技能牌大家共用；印章、照片和美食票各自收着。" : "只有你自己，别人看不到也加不进来。"}</p>
      <div class="lbl">去哪里 · 可以多选</div>
      ${cities.length ? `<div class="picked">${cities.map(c => `<button class="pk" data-rm="${esc(c)}">${esc(nameOfCity(c))} ×</button>`).join("")}</div>` : ""}
      <input class="inp" id="ntQ" placeholder="搜城市，或者直接写一个新的" value="${esc(q)}">
      ${q && !GUIDES.some(g => g.name === q) ? `<button class="btn sm" data-act="addCity" style="margin-top:8px">＋ 加入「${esc(q)}」（没有攻略，也可以自己写）</button>` : ""}
      <div class="city-pick">${groups.map(([c, l]) => `<div class="cp-g"><small>${esc(c)}</small><div class="cp-list">${l.map(g => `<button class="cp${cities.includes(g.id) ? " on" : ""}" data-city="${g.id}" style="--c:${g.color}"><b>${esc(g.name)}</b><em>${esc(g.en)}</em></button>`).join("")}</div></div>`).join("")}</div>
      <div class="addrow"><label class="lbl" style="flex:1;margin:0">出发<input class="inp" type="date" id="ntStart" value="${keep.start}"></label><label class="lbl" style="flex:1;margin:0">回来<input class="inp" type="date" id="ntEnd" value="${keep.end}"></label></div>
      <label class="lbl">预算（RM）<input class="inp" id="ntBudget" inputmode="decimal" value="${keep.budget}"></label>
      ${fj ? `<label class="tog"><input type="checkbox" id="ntFj" ${template === "fujian" ? "checked" : ""}> 导入「福建 Plan A」行程表（10/31 – 11/08）</label>` : ""}
      <div class="as-btns"><button class="btn ink full" data-act="go">开始这本手账</button></div></div>`;
    const open = document.querySelector(".usheet.on");
    const sh = open ? setSheet(html) : openSheet(html, { accent: "#3a2c1f" });
    sh.querySelectorAll("[data-kind]").forEach(b => b.onclick = () => { kind = b.dataset.kind; draw(); });
    sh.querySelectorAll("[data-city]").forEach(b => b.onclick = () => { const c = b.dataset.city; cities = cities.includes(c) ? cities.filter(x => x !== c) : [...cities, c]; sfx.tap(); draw(); });
    sh.querySelectorAll("[data-rm]").forEach(b => b.onclick = () => { cities = cities.filter(x => x !== b.dataset.rm); draw(); });
    const qi = $("ntQ"); qi.oninput = () => { q = qi.value.trim(); const pos = qi.selectionStart; draw(); const n = $("ntQ"); n.focus(); n.setSelectionRange(pos, pos); };
    const fjBox = $("ntFj"); if (fjBox) fjBox.onchange = () => { template = fjBox.checked ? "fujian" : null; if (template) { $("ntStart").value = FUJIAN_TEMPLATE.start; $("ntEnd").value = FUJIAN_TEMPLATE.end; if (!$("ntName").value) $("ntName").value = FUJIAN_TEMPLATE.name; $("ntBudget").value = FUJIAN_TEMPLATE.budget; } };
    bind(sh, {
      addCity: () => { if (q && !cities.includes(q)) cities.push(q); q = ""; draw(); },
      go: async () => {
        const name = $("ntName").value.trim() || (cities.map(nameOfCity).join(" · ") || "新的旅行"), start = $("ntStart").value, end = $("ntEnd").value;
        if (!start || !end || end < start) return toast("检查一下日期");
        if (!cities.length) return toast("选一个要去的城市");
        try { await api.createTrip({ name, start, end, kind, cities, template, budget: parseFloat($("ntBudget").value) || 2000 }); sfx.success(); closeSheet(); toast(`「${name}」开始了`); opts.after && opts.after(); } catch (e) { toast("没能创建：" + e.message); }
      }
    });
  };
  draw();
}

/* ---------- one book, one look: colour + pattern, kept per trip on this phone ---------- */
export const BOOK_COLORS = [["gold", "金黄", "#e8c86a", "#d0a43a"], ["rose", "玫红", "#f074b0", "#d8468e"], ["ink", "墨黑", "#3a3632", "#141210"], ["moss", "墨绿", "#5c7a55", "#2f3a2e"], ["sky", "天青", "#9fc4e0", "#5f8fb0"], ["plum", "紫藤", "#a58ac4", "#6a4a8a"], ["sand", "米沙", "#e9dcc4", "#c8b48e"], ["clay", "赭土", "#d08a6a", "#a05a3a"]];
export const BOOK_PATS = [["plain", "素面"], ["tape", "纸胶带"], ["stripe", "条纹"], ["dot", "圆点"], ["grid", "方格"]];
export function bookLook(id) { try { const v = JSON.parse(localStorage.getItem("td-book:" + id) || "null"); if (v) return v; } catch (e) {} return { c: localStorage.getItem("td-pouch") || "gold", p: "plain" }; }
function openDeco(el) {
  const id = api.trip && api.trip.id; if (!id) return; const L = bookLook(id);
  const sh = openSheet(`<div class="as"><small class="as-k">DECORATE</small><h3>${T("装饰这一本", "Decorate this book")}</h3>
    <p class="as-hint">${T("只改这一趟旅行的封面，其他本不动。", "Only this trip's cover.")}</p>
    <div class="lbl">${T("颜色", "Colour")}</div><div class="deco-colors">${BOOK_COLORS.map(([k, n, a, b]) => `<button class="dc${L.c === k ? " on" : ""}" data-c="${k}" style="background:linear-gradient(135deg,${a},${b})" aria-label="${n}"></button>`).join("")}</div>
    <div class="lbl" style="margin-top:12px">${T("花纹", "Pattern")}</div><div class="chips-wrap">${BOOK_PATS.map(([k, n]) => `<button class="chip sm${L.p === k ? " on" : ""}" data-p="${k}">${n}</button>`).join("")}</div>
    <div class="lbl" style="margin-top:14px">${T("排序和归档", "Order & archive")}</div><div class="chips-wrap"><button class="chip sm${bookMeta(id).pin ? " on" : ""}" data-m="pin">📌 ${T("放在最前面", "Pin to front")}</button><button class="chip sm${bookMeta(id).arch ? " on" : ""}" data-m="arch">${T("归档（放到最后，随时能打开看）", "Archive")}</button></div>
    <p class="as-hint">${T("没置顶的按：进行中 → 还没出发 → 已完成 → 已归档。", "Unpinned: ongoing, upcoming, done, archived.")}</p>
    <div class="as-btns"><button class="btn ink full" data-act="close">${T("好了", "Done")}</button>
      <button class="btn full del-book" data-act="delbook">${api.mode === "local" || (api.trip && api.trip.created_by === api.me.id) ? T("删除这一本", "Delete this book") : T("离开这一本（从我的档案拿掉）", "Leave this book")}</button></div></div>`);
  sh.querySelectorAll("[data-m]").forEach(b => b.onclick = () => { const M = bookMeta(id); M[b.dataset.m] = !M[b.dataset.m]; localStorage.setItem("td-bookmeta:" + id, JSON.stringify(M)); b.classList.toggle("on", !!M[b.dataset.m]); sfx.tap(); });
  const save = () => { localStorage.setItem("td-book:" + id, JSON.stringify(L)); const f = el.querySelector(`.fold[data-trip="${id}"]`); if (f) { f.className = f.className.replace(/\bp-\w+/, "p-" + L.c).replace(/\bpat-\w+/, "pat-" + L.p); } };
  sh.querySelectorAll("[data-c]").forEach(b => b.onclick = () => { L.c = b.dataset.c; sh.querySelectorAll("[data-c]").forEach(x => x.classList.toggle("on", x === b)); sfx.tap(); save(); });
  sh.querySelectorAll("[data-p]").forEach(b => b.onclick = () => { L.p = b.dataset.p; sh.querySelectorAll("[data-p]").forEach(x => x.classList.toggle("on", x === b)); sfx.tap(); save(); });
  bind(sh, { close: () => { closeSheet(); openTrips(); },
    delbook: async () => { const t = api.trip, owner = api.mode === "local" || t.created_by === api.me.id, group = api.mode === "cloud" && t.kind !== "solo" && api.members.length > 1;
      const msg = owner ? (group ? `删除「${t.name}」？\n\n这是你建的旅行，删除后房间里所有人的这一本都会消失：行程、打卡、邮票、账本、照片全部删掉，不能恢复。\n\n只想自己不看，可以用「归档」。` : `删除「${t.name}」？里面的行程、打卡、账本、照片全部删掉，不能恢复。`) : `离开「${t.name}」？\n\n只是从你的档案里拿掉，旅伴那边不受影响。你打过的卡和记的账会留在房间里。`;
      if (!await askConfirm(msg)) return; if (owner && group && await askText(`确认删除，请输入旅行名字「${t.name}」`) !== t.name) return toast(T("名字不对，没有删", "Name didn't match"));
      try { if (owner) await api.deleteTrip(t.id); else await api.leaveTripById(t.id); try { localStorage.removeItem("td-book:" + t.id); localStorage.removeItem("td-bookmeta:" + t.id); } catch (e) {} closeSheet(); toast(owner ? T("删掉了", "Deleted") : T("离开了", "Left")); setTimeout(() => openTrips(), 300); } catch (e) { toast(T("没能删：", "Couldn't: ") + e.message); } } });
}

export function bookMeta(id) { try { return JSON.parse(localStorage.getItem("td-bookmeta:" + id) || "{}"); } catch (e) { return {}; } }
function bookStatus(t) { const td = today(); if (bookMeta(t.id).arch) return "已归档"; if (!t.start_date || td < t.start_date) { const n = Math.round((new Date(t.start_date + "T12:00:00") - new Date(td + "T12:00:00")) / 864e5); return n > 0 ? `还有 ${n} 天出发` : "还没出发"; } if (td > t.end_date) return "已完成"; return "进行中"; }
