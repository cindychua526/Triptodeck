/* Trip Deck service worker
   - offline: the app itself (index + hashed /assets) is cached, so it opens with no signal
   - updates still show at once: the page is fetched from the network first, the cache is only the fallback
   - map tiles you have looked at are kept (up to ~2000), so the map works offline for places you've already browsed
   - push notifications */
const V = "td-v6", SHELL = V + "-shell", ASSETS = V + "-assets", TILES = "td-tiles", FONTS = "td-fonts";
self.addEventListener("install", e => { self.skipWaiting(); e.waitUntil(caches.open(SHELL).then(c => c.addAll(["/", "/index.html", "/manifest.webmanifest", "/icon-192.png"]).catch(() => {}))); });
self.addEventListener("activate", e => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (k.startsWith("td-v") && !k.startsWith(V)) await caches.delete(k);
  await self.clients.claim();
})()));
const TILE_HOST = /autonavi\.com|tile\.openstreetmap\.org/;
async function trimTiles() { const c = await caches.open(TILES), keys = await c.keys(); if (keys.length > 2000) for (const k of keys.slice(0, keys.length - 1800)) await c.delete(k); }
self.addEventListener("fetch", e => {
  const req = e.request; if (req.method !== "GET") return;
  const url = new URL(req.url);
  /* the page: network first (so a new version shows straight away), cached copy when offline */
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).then(r => { const cp = r.clone(); caches.open(SHELL).then(c => c.put("/index.html", cp)); return r; }).catch(() => caches.match("/index.html").then(r => r || caches.match("/"))));
    return;
  }
  /* built files have a hash in their name, so they never change: cache first */
  if (url.origin === location.origin && (url.pathname.startsWith("/assets/") || /\.(png|svg|webmanifest|woff2?)$/.test(url.pathname))) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => { if (r.ok) { const cp = r.clone(); caches.open(ASSETS).then(c => c.put(req, cp)); } return r; })));
    return;
  }
  /* map tiles: cache first, keep what you've seen */
  if (TILE_HOST.test(url.host)) {
    e.respondWith(caches.open(TILES).then(c => c.match(req).then(hit => hit || fetch(req).then(r => { if (r.ok || r.type === "opaque") { c.put(req, r.clone()); trimTiles(); } return r; }).catch(() => hit || Response.error()))));
    return;
  }
  /* Google fonts: stale while revalidate */
  if (/fonts\.(googleapis|gstatic)\.com/.test(url.host)) {
    e.respondWith(caches.open(FONTS).then(c => c.match(req).then(hit => { const net = fetch(req).then(r => { c.put(req, r.clone()); return r; }).catch(() => hit); return hit || net; })));
  }
  /* everything else (Supabase, weather) goes to the network; the app keeps its own offline copy of your data */
});
self.addEventListener("push", e => {
  let d = {}; try { d = e.data ? e.data.json() : {}; } catch (err) { d = { title: "旅行手账", body: e.data ? e.data.text() : "" }; }
  e.waitUntil(self.registration.showNotification(d.title || "旅行手账", { body: d.body || "", icon: "/icon-192.png", badge: "/icon-192.png", tag: d.tag || "tripdeck", data: { url: d.url || "/" }, vibrate: [40, 30, 40] }));
});
self.addEventListener("notificationclick", e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(cs => { const c = cs.find(x => "focus" in x); if (c) return c.focus(); return self.clients.openWindow(e.notification.data && e.notification.data.url || "/"); }));
});
