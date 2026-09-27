/* Web Push: works once the app is on the home screen (iOS 16.4+) and the person allowed notifications. */
import { api } from "./api.js";
const KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || "";
const b64 = s => { const p = "=".repeat((4 - s.length % 4) % 4), b = (s + p).replace(/-/g, "+").replace(/_/g, "/"), r = atob(b); return Uint8Array.from([...r].map(c => c.charCodeAt(0))); };
export const pushSupported = () => "serviceWorker" in navigator && "PushManager" in window && !!KEY;
export async function enablePush() {
  if (!pushSupported()) throw new Error(!KEY ? "NO_KEY" : "UNSUPPORTED");
  const reg = await navigator.serviceWorker.register("/sw.js"); await navigator.serviceWorker.ready;
  const perm = await Notification.requestPermission(); if (perm !== "granted") throw new Error("DENIED");
  let sub = await reg.pushManager.getSubscription(); if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64(KEY) });
  const j = sub.toJSON(); await api.savePushSub({ endpoint: j.endpoint, p256dh: j.keys.p256dh, auth: j.keys.auth }); return true;
}
export async function pushState() { if (!pushSupported()) return "unsupported"; const reg = await navigator.serviceWorker.getRegistration(); const sub = reg && await reg.pushManager.getSubscription(); return sub && Notification.permission === "granted" ? "on" : "off"; }

import { on } from "./api.js";
on("trip", async () => { try { if (!pushSupported()) return; const reg = await navigator.serviceWorker.getRegistration(); const sub = reg && await reg.pushManager.getSubscription(); if (sub && api.trip) { const j = sub.toJSON(); await api.savePushSub({ endpoint: j.endpoint, p256dh: j.keys.p256dh, auth: j.keys.auth }); } } catch (e) {} });
