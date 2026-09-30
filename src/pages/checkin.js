import { api, on, nameOf } from "../lib/api.js";
import { ic } from "../lib/icons.js";
import { $, esc, seeded, shrinkImage, dataUrlToBlob, wait, buzz, today, fmtMin, shortDate } from "../lib/util.js";
import { openSheet, setSheet, closeSheet, toast, bind, lockSheet, sheetOpen } from "../lib/ui.js";
import { sfx } from "../lib/sound.js";
import { missionFor as pickMission, missionIcon } from "../data/missions.js";
import { hash } from "../lib/util.js";
import { placeStampSVG, flyToTab, myStamps } from "./collection.js";
import { waxSeal } from "../data/stamps.js";
import { onNotifyAction } from "../lib/notify.js";
import { tripCityNames, durPicker, wireDur } from "./trip.js";
import { greyDay, greySvg, GREY_NOTE } from "../lib/grey.js";

const short = n => n.replace(/（.*?）|\(.*?\)/g, "").replace(/ · .*/, "").trim();
const rerollKey = (d, n) => `td-reroll:${d}:${n}`;
function missionFor(name, city, date, parent, kind) {
  let rr = 0; try { rr = +localStorage.getItem(rerollKey(date, name)) || 0; } catch (e) {}
  const me = api.me && api.me.id || "me", v = (hash(me) % 3) + rr * 3;
  return { ...pickMission(name, city, date, v, parent, kind), rr };
}
/* ---------- the room's check-ins (shared, so a buddy can approve) ---------- */
export let checkins = [];
export async function loadCheckins() { if (!api.trip) { checkins = []; return; } try { checkins = await api.checkins(); } catch (e) { checkins = []; } document.dispatchEvent(new CustomEvent("td-checkins")); }
on("checkins", loadCheckins); on("trip", loadCheckins);
export const toReview = () => checkins.filter(c => c.status === "pending" && (c.user_id !== api.me.id || api.mode === "local"));
export const myPending = () => checkins.filter(c => c.status === "pending" && c.user_id === api.me.id);
const buddies = () => api.members.filter(m => m.id !== api.me.id);
const needsBuddy = () => api.trip && api.trip.kind !== "solo" && buddies().length > 0;

export function openCheckin(o) {
  const date = o.date || today(), special = o.kind === "special";
  let m = o.mission ? { ...o.mission, rr: 1, fixed: true } : missionFor(o.name, o.city, date, o.parent, o.activityKind), photo = null;
  const already = myStamps().some(s => s.date === date && s.name === o.name);
  let tudi = false; api.myDraw(date).then(d => { tudi = !!(d && d.card === "4" && d.status === "activated" && !localStorage.getItem("td-tudi-" + date)); if (tudi && document.querySelector(".usheet [data-act=shoot]") && !document.querySelector(".usheet [data-act=tudi]")) intro(); }).catch(() => {});
  const exp = o.kind === "experience", grey = greyDay(date), stampPreview = () => { const svg = exp ? waxSeal(o.name, o.city, date) : placeStampSVG(o.name, o.city, date, special); return grey ? greySvg(svg) : svg; };
  const head = () => `<div class="ci-head"><div class="ci-ghost">${stampPreview()}</div><div><small class="as-k">${esc(o.city || "")}${o.parent ? " · " + esc(o.parent) : ""}${special ? " · ✦计划外" : ""}</small><h3>${esc(o.name)}</h3>${grey ? `<p class="ci-grey">🪨 ${GREY_NOTE}</p>` : ""}</div></div>`;
  const input = `<input type="file" accept="image/*" capture="environment" id="ciFile" hidden>`;
  const intro = () => setSheet(`<div class="as">${head()}
    ${already ? `<p class="as-hint">你今天已经在这里盖过章了，再打一次会多一枚。</p>` : ""}
    <div class="ci-mission ${m.type}"><span>${missionIcon(m.type)}</span><p>${esc(m.text)}</p>
      ${m.rr < 1 ? `<button class="linkbtn" data-act="reroll">换一个任务（只能换 1 次）</button>` : ""}</div>
    <p class="as-hint">${needsBuddy() ? "拍好照片交给旅伴，任何一位旅伴确认后就会盖章。" : "拍好照片就能盖章。"}照片会收进你的手账。</p>
    <div class="as-btns"><button class="btn ink full" data-act="shoot">${ic("camera")} 拍照打卡</button>${tudi ? `<button class="btn full tudi" data-act="tudi">土地公担保 · 不拍照直接盖章</button>` : ""}<button class="btn full" data-act="cancel">稍后再说</button></div>${input}</div>`) && wire();
  const preview = () => setSheet(`<div class="as">${head()}<div class="ci-mission ${m.type}"><span>${missionIcon(m.type)}</span><p>${esc(m.text)}</p></div>
    <div class="polaroid" id="ciPol"><img src="${photo}" alt="你的照片"><div class="pol-stamp" id="ciStamp">${stampPreview()}</div></div>
    <div class="as-btns"><div class="row"><button class="btn" data-act="shoot">重拍</button><button class="btn ink" data-act="submit">${needsBuddy() ? "交给旅伴确认" : "盖章"}</button></div></div>${input}</div>`) && wire();
  const sent = () => { setSheet(`<div class="as">${head()}<div class="kapok-send"><svg viewBox="0 0 200 190" class="kapok"><g class="kp-flower"><path d="M100 60C88 40 70 20 52 30C66 38 80 50 92 66Z" fill="#b8282a"/><path d="M100 60C112 40 130 20 148 30C134 38 120 50 108 66Z" fill="#b8282a"/><path d="M100 64C80 60 56 64 44 80C62 78 80 74 96 72Z" fill="#7a1418"/><path d="M100 64C120 60 144 64 156 80C138 78 120 74 104 72Z" fill="#7a1418"/><path d="M92 20Q100 10 108 20L106 72Q100 78 94 72Z" fill="#d8342e"/><path d="M96 70l4 8 4-8z" fill="#f3e0b0"/></g><g class="kp-threads" stroke="#2a2a30" stroke-width=".6" fill="none">${[70, 80, 90, 100, 110, 120, 130].map((x, i) => `<path d="M100 76Q${x} 110 ${x - 4 + (i % 2) * 8} 140"/>`).join("")}</g><g class="kp-notes">${[0, 1, 2, 3].map(i => `<g transform="translate(${62 + i * 18} ${134 + (i % 2) * 8}) rotate(${-8 + i * 6})"><rect width="30" height="38" fill="#f3e6c4" stroke="#c8b890" stroke-width=".6"/>${[6, 11, 16, 21, 26].map(y => `<path d="M${4 + (y % 3)} ${y}h20" stroke="#8a7a60" stroke-width=".6"/>`).join("")}</g>`).join("")}</g></svg><img src="${photo}" alt="" class="kp-photo"></div>
      <div class="ci-verdict ok"><b>已经交给旅伴</b><p>${esc(buddies().map(x => x.name).join("、"))} 任何一位确认后，印章就会盖进你的手账。</p></div>
      <div class="as-btns"><button class="btn ink full" data-act="close">好的</button></div></div>`); wire(); sfx.paper(); };
  const surprise = () => { let n = 0; try { n = +localStorage.getItem("td-stamp-n") || 0; localStorage.setItem("td-stamp-n", String(n + 1)); } catch (e) {} if (n === 2 || (n > 2 && Math.random() < .18)) { let k = 0; const tick = () => { k++; if (k > 40) return; if (sheetOpen() || document.querySelector(".mo")) return setTimeout(tick, 500); import("../lib/motion.js").then(m => m.playMotion(Math.random() < .5 ? "lantern" : "qian")); }; setTimeout(tick, 1400); } };
  const stamped = () => { surprise(); setSheet(`<div class="as">${head()}<div class="polaroid passed" id="ciPol"><img src="${photo}" alt=""><div class="pol-stamp on">${stampPreview()}</div></div>
      <div class="ci-verdict ok"><b>✓ 打卡成功</b><p>印章已经盖进手账</p></div><div class="as-btns"><button class="btn ink full" data-act="close">好的</button></div></div>`); wire(); sfx.stamp(); sfx.success(); buzz([20, 40, 20]); };
  async function tudiSubmit() {
    lockSheet(true);
    try { const r = await api.submitCheckin({ kind: exp ? "experience" : special ? "special" : "place", name: o.name, city: o.city, date, mission: "土地公担保", photo_path: null, activity_id: o.activityId || null });
      if (r.status !== "approved") await api.guaranteeCheckin(r.id);
      localStorage.setItem("td-tudi-" + date, "1"); lockSheet(false); stamped(); o.onDone && o.onDone({ approved: true }); }
    catch (e) { lockSheet(false); toast("土地公没能担保：" + e.message); }
  }
  async function submit() {
    lockSheet(true);
    let path = null;
    try { const small = api.mode === "local" ? await shrinkImage(dataUrlToBlob(photo), 520, .7) : photo; path = await api.uploadCheckinPhoto(dataUrlToBlob(small), small); } catch (e) { lockSheet(false); return toast("照片没能上传，请检查网络"); }
    try {
      const r = await api.submitCheckin({ kind: exp ? "experience" : special ? "special" : "place", name: o.name, city: o.city, date, mission: m.text, photo_path: path, activity_id: o.activityId || null });
      if (special && o.addToPlan) { const d = new Date(); api.addActivity({ date, time: o.time || fmtMin(d.getHours() * 60 + d.getMinutes()), title: o.name, city: o.city, kind: "sight", dur: o.dur || 60, source: "special" }).catch(() => {}); }
      lockSheet(false);
      if (r.status === "approved" || !needsBuddy()) { stamped(); const el = document.querySelector(".pol-stamp"); if (el) setTimeout(() => flyToTab(stampPreview(), el.getBoundingClientRect()), 700); o.onDone && o.onDone({ approved: true }); }
      else { sent(); o.onDone && o.onDone({ pending: true }); }
    } catch (e) { lockSheet(false); toast("没能提交：" + e.message); }
  }
  function wire() {
    const sh = document.querySelector(".usheet");
    const f = $("ciFile");
    if (f) f.onchange = async () => { const file = f.files && f.files[0]; if (!file) return; try { photo = await shrinkImage(file, 1280, .82); sfx.flip(); preview(); } catch (e) { toast("这张照片读不出来，换一张试试"); } };
    bind(sh, {
      shoot: () => { $("ciFile").click(); }, tudi: () => tudiSubmit(),
      cancel: () => closeSheet(), close: () => closeSheet(),
      reroll: () => { try { localStorage.setItem(rerollKey(date, o.name), String(m.rr + 1)); } catch (e) {} m = missionFor(o.name, o.city, date, o.parent, o.activityKind); sfx.shuffle(); intro(); },
      rerollAfter: () => { if (m.rr >= 1) return toast(m.fixed ? "这是今日运势给你的专属任务，不能换" : "今天这里的任务已经换过了"); try { localStorage.setItem(rerollKey(date, o.name), String(m.rr + 1)); } catch (e) {} m = missionFor(o.name, o.city, date, o.parent, o.activityKind); photo = null; sfx.shuffle(); intro(); },
      submit: () => submit()
    });
  }
  openSheet("", { accent: "#c8472f", focus: false }); intro();
}

export function openSpecial({ date, city, onDone, title } = {}) {
  const cities = tripCityNames().length ? tripCityNames() : ["厦门"];
  let c = city || cities[0], add = true;
  const draw = () => {
    const sh = openSheet(`<div class="as"><small class="as-k">✦ SPECIAL · 计划外</small><h3>${esc(title || "突然去了个特别的地方？")}</h3>
      <p class="as-hint" style="margin-top:0">写下这个地方，完成拍照任务、旅伴确认后，就能拿到一枚「奇遇」星形印章。</p>
      <input class="inp" id="spN" maxlength="30" placeholder="地方的名字，比如：巷子里的老茶馆" autofocus>
      <div class="chips-wrap" style="margin-top:10px">${cities.map(x => `<button class="chip sm${x === c ? " on" : ""}" data-c="${x}" style="--c:#3a2c1f">${x}</button>`).join("")}</div>
      <label class="tog"><input type="checkbox" id="spAdd" ${add ? "checked" : ""}> 同时加入这一天的行程（大家都看得到）</label>
      <div id="spWhen"><label class="lbl">几点到的<input class="inp" type="time" id="spT" value="${fmtMin(new Date().getHours() * 60 + new Date().getMinutes())}"></label>${durPicker("spDur", 60)}</div>
      <div class="as-btns"><button class="btn ink full" data-act="go">去打卡</button></div></div>`, { accent: "#3a2c1f" });
    sh.querySelectorAll("[data-c]").forEach(b => b.onclick = () => { c = b.dataset.c; sh.querySelectorAll("[data-c]").forEach(x => x.classList.toggle("on", x === b)); });
    const getDur = wireDur(sh, "spDur"), when = $("spWhen"), tog = () => { when.style.display = $("spAdd").checked ? "" : "none"; }; $("spAdd").onchange = tog; tog();
    bind(sh, { go: () => { const n = $("spN").value.trim(); if (!n) return toast("先写下地方的名字"); add = $("spAdd").checked; const t = $("spT").value; openCheckin({ name: n, city: c, date, kind: "special", addToPlan: add, time: /^\d{1,2}:\d{2}$/.test(t) ? t.padStart(5, "0") : null, dur: getDur(), onDone }); } });
  };
  draw();
}

/* ---------- review a buddy's check-in (any one member is enough) ---------- */
export async function openReview(id) {
  const c = checkins.find(x => x.id === id) || (await api.checkins()).find(x => x.id === id); if (!c) return toast("找不到这次打卡");
  if (c.status !== "pending") return toast(c.status === "approved" ? "已经有人确认过了" : "这次打卡已经处理过了");
  const url = await api.photoUrl(c.photo_path);
  const sh = openSheet(`<div class="as"><small class="as-k">REVIEW · ${esc(nameOf(c.user_id))} 的打卡</small><h3>${esc(c.name)}</h3>
    <div class="ci-mission"><span>任务</span><p>${esc(c.mission || "")}</p></div>
    <div class="polaroid">${url ? `<img src="${url}" alt="打卡照片">` : ""}<div class="pol-stamp">${c.kind === "experience" ? waxSeal(c.name, c.city, c.date) : placeStampSVG(c.name, c.city, c.date, c.kind === "special")}</div></div>
    <p class="as-hint" style="text-align:center">${shortDate(c.date)} · ${esc(c.city || "")}${api.mode === "local" ? " · 单机模式：你可以替旅伴确认" : ""}</p>
    <div class="as-btns"><div class="row"><button class="btn" data-act="no">再拍一张吧</button><button class="btn ink" data-act="ok">✓ 通过，盖章</button></div></div></div>`, { accent: "#c8472f" });
  bind(sh, {
    ok: async () => { lockSheet(true); try { await api.reviewCheckin(c.id, true); lockSheet(false); const el = sh.querySelector(".pol-stamp"); el.classList.add("on"); sfx.stamp(); buzz([20, 40, 20]); setTimeout(() => { closeSheet(); toast(`已帮${nameOf(c.user_id)}盖上「${short(c.name)}」的章`); }, 900); } catch (e) { lockSheet(false); toast(/ALREADY/.test(e.message) ? "已经有人确认过了" : "没能确认：" + e.message); closeSheet(); } },
    no: () => { const note = prompt("想跟TA说什么？（可以不写）", "照片好像还不太符合任务") || null; api.reviewCheckin(c.id, false, note).then(() => { closeSheet(); toast("已经告诉TA再拍一张"); }).catch(e => toast("没能提交：" + e.message)); }
  });
}
export function reviewInboxHTML() {
  const rv = toReview(), mp = myPending().filter(x => !rv.includes(x));
  if (!rv.length && !mp.length) return "";
  return `<div class="inbox">${rv.length ? `<div class="ib-h"><b>等你确认</b><small>${rv.length} 个旅伴的打卡</small></div><div class="ib-list">${rv.map(c => `<button class="ib-card" data-review="${c.id}"><div class="ib-ph" data-ipath="${esc(c.photo_path || "")}"></div><b>${esc(nameOf(c.user_id))}</b><small>${esc(short(c.name))}</small></button>`).join("")}</div>` : ""}
    ${mp.length ? `<p class="ib-mine">${ic("paper-plane-tilt")} 你有 ${mp.length} 个打卡在等旅伴确认：${mp.map(c => esc(short(c.name))).join("、")}</p>` : ""}</div>`;
}
export async function wireInbox(root) {
  root.querySelectorAll("[data-review]").forEach(b => b.onclick = () => openReview(b.dataset.review));
  for (const el of root.querySelectorAll("[data-ipath]")) { if (!el.dataset.ipath) continue; const u = await api.photoUrl(el.dataset.ipath); if (u && el.isConnected) el.style.backgroundImage = `url("${u}")`; }
}
onNotifyAction("review", n => openReview(n.ck));
