/* Trip Deck service worker
   App files (page, scripts, config) are fetched from the network first, so every new deploy shows up right away.
   The saved copy is only used when there's no network. */
const V = "td3-20261002040659";
const SHELL = ["/", "/index.html", "/config.js", "/sync.js", "/manifest.webmanifest", "/icons/icon-192.png", "/icons/icon-512.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
const netFirst = req => fetch(req, { cache:"no-store" }).then(n => { if(n.ok){ const c = n.clone(); caches.open(V).then(x => x.put(req, c)); } return n; }).catch(() => caches.match(req, { ignoreSearch:true }).then(r => r || caches.match("/index.html")));
self.addEventListener("fetch", e => { const u = new URL(e.request.url); if(e.request.method !== "GET") return;
  if(u.origin === location.origin){ if(u.pathname.startsWith("/api/")) return; if(e.request.mode === "navigate" || /\.(html|js|webmanifest)$/.test(u.pathname) || u.pathname === "/"){ e.respondWith(netFirst(e.request)); return; }
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(n => { if(n.ok){ const c = n.clone(); caches.open(V).then(x => x.put(e.request, c)); } return n; }))); return; }
  if(/cdn\.jsdelivr\.net|cdnjs\.cloudflare\.com|fonts\.(googleapis|gstatic)\.com/.test(u.host)){ e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(n => { const c = n.clone(); caches.open(V).then(x => x.put(e.request, c)); return n; }))); } });
