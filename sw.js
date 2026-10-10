/* Trip Deck service worker
   App files (page, scripts, config) are fetched from the network first, so every new deploy shows up right away.
   The saved copy is only used when there's no network. */
const V = "td3-20261010021605";
const LIBS = "td-libs-1", LIB_URLS = ["https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js", "https://cdn.jsdelivr.net/npm/html-to-image@1.11.11/dist/html-to-image.js", "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"];
const SHELL = ["/", "/index.html", "/config.js", "/sync.js", "/manifest.webmanifest", "/icons/icon-192.png", "/icons/icon-512.png"];
/* the app itself, plus the three libraries used for 3D tickets, saving images and reading Excel — stored once so they work offline */
self.addEventListener("install", e => { e.waitUntil(Promise.all([caches.open(V).then(c => c.addAll(SHELL)), caches.open(LIBS).then(c => Promise.all(LIB_URLS.map(u => c.match(u).then(hit => hit || fetch(u, { mode:"cors" }).then(r => r.ok ? c.put(u, r) : null).catch(() => null)))))]).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V && k !== LIBS).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
const netFirst = req => fetch(req, { cache:"no-store" }).then(n => { if(n.ok){ const c = n.clone(); caches.open(V).then(x => x.put(req, c)); } return n; }).catch(() => caches.match(req, { ignoreSearch:true }).then(r => r || caches.match("/index.html")));
self.addEventListener("fetch", e => { const u = new URL(e.request.url); if(e.request.method !== "GET") return;
  if(u.origin === location.origin){ if(u.pathname.startsWith("/api/")) return; if(e.request.mode === "navigate" || /\.(html|js|webmanifest)$/.test(u.pathname) || u.pathname === "/"){ e.respondWith(netFirst(e.request)); return; }
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(n => { if(n.ok){ const c = n.clone(); caches.open(V).then(x => x.put(e.request, c)); } return n; }))); return; }
  if(/cdn\.jsdelivr\.net|cdnjs\.cloudflare\.com|fonts\.(googleapis|gstatic)\.com/.test(u.host)){ e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(n => { if(n.ok || n.type === "opaque"){ const c = n.clone(); caches.open(LIBS).then(x => x.put(e.request, c)); } return n; }))); } });

/* notifications from travel buddies, shown even when the app is closed */
self.addEventListener("push", e => { let d = {}; try{ d = e.data ? e.data.json() : {}; }catch(err){ d = { body: e.data && e.data.text() }; }
  e.waitUntil(self.registration.showNotification(d.title || "旅行手账", { body: d.body || "", tag: d.tag || "td", renotify: true, icon: "/icons/icon-192.png", badge: "/icons/favicon-64.png", data: { url: d.url || "/" } })); });
self.addEventListener("notificationclick", e => { e.notification.close(); const url = (e.notification.data && e.notification.data.url) || "/";
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(L => { for(const c of L){ if("focus" in c) return c.focus(); } return self.clients.openWindow(url); })); });
