/* 出发提醒: 3 days and 1 day before the trip (and on the morning you leave), a banner lists what's still unchecked on the checklist.
   If you've allowed notifications it also shows as a phone notification. Once per day. */
import { api, on } from "./api.js";
import { today, addDays } from "./util.js";
import { t as T } from "./i18n.js";
async function check() {
  const t = api.trip; if (!t || !t.start_date) return;
  const d = today(), left = Math.round((new Date(t.start_date + "T00:00:00") - new Date(d + "T00:00:00")) / 864e5);
  if (![3, 1, 0].includes(left)) return;
  const k = `td-remind:${t.id}:${d}`; try { if (localStorage.getItem(k)) return; } catch (e) { return; }
  let items = []; try { items = (await api.checklist()).filter(c => !c.done); } catch (e) { return; }
  try { localStorage.setItem(k, "1"); } catch (e) {}
  const when = left === 0 ? T("今天出发！", "Leaving today!") : left === 1 ? T("明天出发", "Leaving tomorrow") : T(`还有 ${left} 天出发`, `${left} days to go`);
  const names = items.slice(0, 5).map(c => c.label).join("、") + (items.length > 5 ? T(` 等 ${items.length} 项`, ` +${items.length - 5} more`) : "");
  const n = { kind: "remind", id: k, icon: "🧳", kicker: when, title: items.length ? T(`清单上还有 ${items.length} 项没勾`, `${items.length} things still unchecked`) : T("清单全部勾完了，出发吧", "Checklist done — off you go"), body: items.length ? names : t.name, action: items.length ? T("去看清单", "Open checklist") : "" };
  const { banner } = await import("./notify.js"); banner(n);
  try { if (document.hidden === false && "Notification" in window && Notification.permission === "granted" && items.length) { const reg = navigator.serviceWorker && await navigator.serviceWorker.getRegistration(); reg ? reg.showNotification(n.title, { body: n.body, tag: k, icon: "/icon-192.png" }) : new Notification(n.title, { body: n.body, tag: k }); } } catch (e) {}
}
let tm = 0; const soon = () => { clearTimeout(tm); tm = setTimeout(check, 4000); };
on("trip", soon); setTimeout(check, 6000); setInterval(check, 30 * 60000);
