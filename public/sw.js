/* Trip Deck service worker: only for push notifications (no offline caching, so updates always show). */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));
self.addEventListener("push", e => {
  let d = {}; try { d = e.data ? e.data.json() : {}; } catch (err) { d = { title: "旅行手账", body: e.data ? e.data.text() : "" }; }
  e.waitUntil(self.registration.showNotification(d.title || "旅行手账", { body: d.body || "", icon: "/icon-192.png", badge: "/icon-192.png", tag: d.tag || "tripdeck", data: { url: d.url || "/" }, vibrate: [40, 30, 40] }));
});
self.addEventListener("notificationclick", e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(cs => { const c = cs.find(x => "focus" in x); if (c) return c.focus(); return self.clients.openWindow(e.notification.data && e.notification.data.url || "/"); }));
});
