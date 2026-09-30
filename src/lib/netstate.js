/* 离线小标签 + service worker: shows when you're offline and how many changes are waiting to be sent */
import { api } from "./api.js";
import { toast } from "./ui.js";
import { t } from "./i18n.js";
let pill = null;
function paint() {
  const off = navigator.onLine === false, n = api.pending ? api.pending() : 0;
  if (!pill) { pill = document.createElement("div"); pill.className = "netpill"; pill.setAttribute("role", "status"); document.body.appendChild(pill);
    pill.addEventListener("click", () => { if (!navigator.onLine) toast(t("没信号也能用：改动先存在手机里，有网就自动发出去", "Works with no signal: changes stay on this phone and are sent when you are back online")); else if (api.flushQueue) api.flushQueue(); }); }
  pill.classList.toggle("on", off || n > 0); pill.classList.toggle("off", off);
  pill.innerHTML = off ? `<i></i>${t("离线", "Offline")}${n ? ` · ${n} ${t("条待发", "waiting")}` : ""}` : n ? `<i></i>${t("同步中", "Syncing")} · ${n}` : "";
}
addEventListener("online", () => { paint(); setTimeout(paint, 3000); });
addEventListener("offline", () => { paint(); toast(t("没有网络 · 先存在手机里，有网再同步", "No signal · saved on this phone, will sync later")); });
document.addEventListener("td-queue", paint);
setTimeout(paint, 1500);
if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost") && !import.meta.env.DEV) {
  addEventListener("load", () => { try { navigator.serviceWorker.register("/sw.js").catch(() => {}); } catch (e) {} });
}
