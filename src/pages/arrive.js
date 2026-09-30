/* Departures (everyone's own starting point + airport photo, shared in the room) and the entry-seal ceremony */
import { ic } from "../lib/icons.js";
import { api, on, nameOf } from "../lib/api.js";
import { $, esc, today, shrinkImage, dataUrlToBlob, buzz, REDUCE, shortDate } from "../lib/util.js";
import { openSheet, closeSheet, toast, bind, lockSheet } from "../lib/ui.js";
import { sfx } from "../lib/sound.js";
import { citySeal } from "../data/stamps.js";
import { myStamps, flyToTab } from "./collection.js";

const ORIGINS = ["槟城 PEN", "吉隆坡 KUL", "新加坡樟宜 SIN", "新山 JHB", "怡保 IPH", "曼谷 BKK", "香港 HKG", "上海 PVG"];
let deps = [];
export async function loadDepartures() { if (!api.trip) { deps = []; return; } try { deps = await api.departures(); } catch (e) { deps = []; } }
on("departures", async () => { await loadDepartures(); document.dispatchEvent(new CustomEvent("td-departures")); });
on("trip", async () => { await loadDepartures(); document.dispatchEvent(new CustomEvent("td-departures")); refreshArrive(); });

export function departuresHTML() {
  const mine = deps.find(d => d.user_id === api.me.id);
  return `<div class="dep"><div class="dep-h"><b>各自出发</b><small>每个人从自己的地方出发，出发前在机场拍一张</small></div>
    <div class="dep-list">${api.members.map(m => { const d = deps.find(x => x.user_id === m.id);
      return `<div class="dep-card${d && d.photo_path ? " has" : ""}"><div class="dep-ph" ${d && d.photo_path ? `data-dpath="${esc(d.photo_path)}"` : ""}>${d && d.photo_path ? "" : "✈"}</div><b>${esc(m.name)}${m.id === api.me.id ? "（你）" : ""}</b><small>${d ? esc(d.origin) : "还没出发"}</small></div>`; }).join("")}</div>
    <button class="btn sm" data-act="dep">${ic("airplane-takeoff")} ${mine ? "改我的出发" : "我从哪里出发"}</button></div>`;
}
export async function hydrateDeparturePhotos(root) { for (const el of root.querySelectorAll("[data-dpath]")) { const u = await api.sharedUrl(el.dataset.dpath); if (u && el.isConnected) el.style.backgroundImage = `url("${u}")`; } }
export function openDeparture() {
  const mine = deps.find(d => d.user_id === api.me.id) || {};
  let origin = mine.origin || "", photo = null;
  const draw = () => {
    const sh = openSheet(`<div class="as"><small class="as-k">DEPARTURE</small><h3>我从哪里出发</h3>
      <p class="as-hint" style="margin-top:0">${api.trip.kind === "solo" ? "记下出发地和一张机场照，会收进你的手账和海报。" : "你的出发地和机场照，这个房间的旅伴都看得到。"}</p>
      <div class="chips-wrap">${ORIGINS.map(o => `<button class="chip sm${o === origin ? " on" : ""}" data-o="${esc(o)}" style="--c:#3a2c1f">${esc(o)}</button>`).join("")}</div>
      <label class="lbl">或者自己写<input class="inp" id="depO" maxlength="24" value="${esc(ORIGINS.includes(origin) ? "" : origin)}" placeholder="比如：新加坡樟宜 T3"></label>
      <div class="dep-shot" id="depShot">${photo ? `<img src="${photo}" alt="">` : `<span>${ic("camera")} 拍一张机场照（可选）</span>`}</div><input type="file" accept="image/*" capture="environment" id="depFile" hidden>
      <div class="as-btns"><button class="btn ink full" data-act="save">出发！</button></div></div>`, { accent: "#3a2c1f" });
    sh.querySelectorAll("[data-o]").forEach(b => b.onclick = () => { origin = b.dataset.o; $("depO").value = ""; sh.querySelectorAll("[data-o]").forEach(x => x.classList.toggle("on", x === b)); sfx.tap(); });
    $("depShot").onclick = () => $("depFile").click();
    $("depFile").onchange = async () => { const f = $("depFile").files[0]; if (!f) return; photo = await shrinkImage(f, 1280, .82); origin = $("depO").value.trim() || origin; draw(); };
    bind(sh, { save: async () => { const o = $("depO").value.trim() || origin; if (!o) return toast("选一个出发地");
      lockSheet(true); let path = mine.photo_path || null;
      try { if (photo) { const small = api.mode === "local" ? await shrinkImage(dataUrlToBlob(photo), 520, .7) : photo; path = await api.uploadShared(dataUrlToBlob(small), small); } await api.setDeparture({ origin: o, photo_path: path }); sfx.success(); lockSheet(false); closeSheet(); toast("一路顺风 ✈"); }
      catch (e) { lockSheet(false); toast("没能保存：" + e.message); } } });
  };
  draw();
}
export const departuresOf = () => deps;

/* ---------- entry seal: its own moment, separate from place stamps ---------- */
export const needsSeal = city => !!city && !!api.trip && !myStamps().some(s => s.kind === "city" && s.city === city && s.trip_id === api.trip.id);
export function sealCeremony(city, date = today()) {
  const ov = document.createElement("div"); ov.className = "seal-ov"; ov.setAttribute("role", "dialog"); ov.setAttribute("aria-label", "入境章");
  ov.innerHTML = `<div class="seal-paper"><small>ARRIVAL · 入境</small><div class="seal-slot" id="sealSlot"><span>点一下，盖上入境章</span></div><b>${esc(city)}</b><em>${shortDate(date).replace(".", " / ")}</em><button class="btn ink full" id="sealGo">盖章</button></div>`;
  document.body.appendChild(ov); requestAnimationFrame(() => ov.classList.add("on"));
  const stamp = async () => {
    const btn = $("sealGo"); if (btn.dataset.done) return close(); btn.dataset.done = "1";
    const slot = $("sealSlot"); slot.innerHTML = `<div class="seal-stamp">${citySeal(city, date)}</div>`; slot.classList.add("stamped");
    setTimeout(() => { sfx.stamp(); buzz([40, 30, 20]); }, REDUCE ? 0 : 260);
    try { await api.addStamp({ kind: "city", key: city, name: city, city, date, verified: true, verify_note: `入境章 · ${api.trip.name}` }); } catch (e) { toast("没能保存，请检查网络"); }
    btn.textContent = "收进手账";
  };
  const close = () => { const el = ov.querySelector(".seal-stamp"); if (el) flyToTab(citySeal(city, date), el.getBoundingClientRect()); ov.classList.remove("on"); setTimeout(() => ov.remove(), 400); refreshArrive(); };
  $("sealGo").onclick = stamp; $("sealSlot").onclick = stamp;
  ov.addEventListener("click", e => { if (e.target === ov) close(); });
}
/* banner on the Today page */
export function refreshArrive(cityFn) {
  const el = $("arriveBanner"); if (!el) return;
  const city = (cityFn || refreshArrive.cityFn || (() => null))(); if (cityFn) refreshArrive.cityFn = cityFn;
  if (needsSeal(city)) { el.innerHTML = `<button class="arrive-pill">✦ 抵达${esc(city)} · 盖入境章</button>`; el.querySelector("button").onclick = () => sealCeremony(city); }
  else if (new Date().getHours() >= 21 || new Date().getHours() < 4) { el.innerHTML = `<button class="arrive-pill night">☾ 打开星空灯 · 晚安</button>`; el.querySelector("button").onclick = () => import("../lib/motion.js").then(m => m.playMotion("stars")); }
  else if (new Date().getHours() >= 15 && new Date().getHours() < 17 && !sessionStorage.getItem("td-tea-" + today())) { el.innerHTML = `<button class="arrive-pill tea">🍵 下午茶时间 · 冲一泡工夫茶</button>`; el.querySelector("button").onclick = () => { try { sessionStorage.setItem("td-tea-" + today(), "1"); } catch (e) {} import("../lib/motion.js").then(m => m.playMotion("tea")); refreshArrive(); }; }
  else if (api.trip && today() >= api.trip.end_date) { el.innerHTML = `<button class="arrive-pill gold">${ic("receipt")} 旅行结束了 · 打印你的旅行发票</button>`; el.querySelector("button").onclick = () => import("./receipt.js").then(m => m.openReceipt()); }
  else el.innerHTML = "";
}
on("stamps", () => refreshArrive());
