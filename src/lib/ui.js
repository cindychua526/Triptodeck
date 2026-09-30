import { REDUCE } from "./util.js";
/* shared bottom sheet + overlay + toast */
let sheetEl, ovEl, toastEl, onClose = null;
export function initUI() {
  ovEl = document.createElement("div"); ovEl.className = "uov"; document.body.appendChild(ovEl);
  sheetEl = document.createElement("div"); sheetEl.className = "usheet"; sheetEl.setAttribute("role", "dialog"); sheetEl.setAttribute("aria-modal", "true"); document.body.appendChild(sheetEl);
  toastEl = document.getElementById("toast"); toastEl.setAttribute("aria-live", "polite");
  ovEl.addEventListener("click", () => { if (sheetEl.dataset.lock !== "1") closeSheet(); });
  addEventListener("keydown", e => { if (e.key === "Escape" && sheetEl.classList.contains("on") && sheetEl.dataset.lock !== "1") closeSheet(); });
}
export function openSheet(html, opts = {}) {
  sheetEl.innerHTML = html; sheetEl.style.setProperty("--a", opts.accent || "#c8472f");
  sheetEl.style.maxHeight = opts.maxH || "88vh"; sheetEl.dataset.lock = opts.lock ? "1" : "";
  onClose = opts.onClose || null;
  ovEl.classList.add("on"); requestAnimationFrame(() => sheetEl.classList.add("on"));
  if (opts.focus !== false) setTimeout(() => { const f = sheetEl.querySelector("[autofocus]"); f && f.focus({ preventScroll: true }); }, REDUCE ? 0 : 250);
  return sheetEl;
}
export function setSheet(html) { sheetEl.innerHTML = html; return sheetEl; }
export function lockSheet(v) { sheetEl.dataset.lock = v ? "1" : ""; }
export function closeSheet() { sheetEl.classList.remove("on"); ovEl.classList.remove("on"); const f = onClose; onClose = null; f && f(); }
export const sheetOpen = () => sheetEl.classList.contains("on");
export function toast(msg, ms = Math.max(4200, String(msg).length * 160)) { toastEl.textContent = msg; toastEl.classList.add("on"); clearTimeout(toast._t); toast._t = setTimeout(() => toastEl.classList.remove("on"), ms); }
export function bind(root, map) { root.querySelectorAll("[data-act]").forEach(b => { const f = map[b.dataset.act]; if (f) b.onclick = e => f(b, e); }); }

/* in-app dialogs (replace the phone's grey confirm()/prompt() boxes): a paper card with a stamp */
function dialog({ title, msg, input, value = "", ok = "好", cancel = "取消", danger = false, multiline = false, max = 200 }) {
  return new Promise(resolve => {
    const d = document.createElement("div"); d.className = "dlg"; d.setAttribute("role", "dialog"); d.setAttribute("aria-modal", "true");
    const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
    d.innerHTML = `<div class="dlg-card${danger ? " danger" : ""}">${danger ? `<i class="dlg-stamp">作废</i>` : `<i class="dlg-pin"></i>`}
      ${title ? `<b class="dlg-t">${esc(title)}</b>` : ""}${msg ? `<p class="dlg-m">${esc(msg)}</p>` : ""}
      ${input ? (multiline ? `<textarea class="inp dlg-in" rows="3" maxlength="${max}">${esc(value)}</textarea>` : `<input class="inp dlg-in" maxlength="${max}" value="${esc(value)}">`) : ""}
      <div class="dlg-b">${cancel ? `<button class="btn" data-x="0">${esc(cancel)}</button>` : ""}<button class="btn ${danger ? "warn solid" : "ink"}" data-x="1">${esc(ok)}</button></div></div>`;
    document.body.appendChild(d); requestAnimationFrame(() => d.classList.add("on"));
    const inp = d.querySelector(".dlg-in"); if (inp) setTimeout(() => { inp.focus(); inp.select && inp.select(); }, REDUCE ? 0 : 180);
    const done = v => { d.classList.remove("on"); d.classList.add(v === false || v === null ? "no" : "yes"); setTimeout(() => d.remove(), 260); resolve(v); };
    d.querySelector('[data-x="1"]').onclick = () => done(input ? inp.value : true);
    const c = d.querySelector('[data-x="0"]'); if (c) c.onclick = () => done(input ? null : false);
    d.addEventListener("click", e => { if (e.target === d) done(input ? null : false); });
    d.addEventListener("keydown", e => { if (e.key === "Escape") done(input ? null : false); if (e.key === "Enter" && !multiline) { e.preventDefault(); done(input ? inp.value : true); } });
  });
}
/* askConfirm("删除这一项？") → true / false · askText("改成", "旧名字") → string / null */
export const askConfirm = (msg, o = {}) => dialog({ msg, ok: o.ok || (/删|移除|离开|退出|清空|作废/.test(msg) ? "确定" : "好"), danger: o.danger ?? /删|移除|离开|退出|清空/.test(msg), title: o.title, cancel: o.cancel ?? "取消" });
export const askText = (title, value = "", o = {}) => dialog({ title, value: value ?? "", input: true, ok: o.ok || "好", msg: o.msg, multiline: o.multiline, max: o.max });
