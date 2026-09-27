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
export function toast(msg, ms = 2600) { toastEl.textContent = msg; toastEl.classList.add("on"); clearTimeout(toast._t); toast._t = setTimeout(() => toastEl.classList.remove("on"), ms); }
export function bind(root, map) { root.querySelectorAll("[data-act]").forEach(b => { const f = map[b.dataset.act]; if (f) b.onclick = e => f(b, e); }); }
