/* Trip Deck service worker: the app shell is cached so it opens without network; data goes through Supabase when online */
const V = "td3-v1";
const SHELL = ["/", "/index.html", "/config.js", "/sync.js", "/manifest.webmanifest", "/icons/icon-192.png", "/icons/icon-512.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => { const u = new URL(e.request.url); if(e.request.method !== "GET") return;
  if(u.origin === location.origin && !u.pathname.startsWith("/api/")){ e.respondWith(caches.match(e.request, { ignoreSearch:true }).then(r => r || fetch(e.request).then(n => { if(n.ok){ const c = n.clone(); caches.open(V).then(x => x.put(e.request, c)); } return n; }).catch(() => caches.match("/index.html")))); return; }
  if(/cdn\.jsdelivr\.net|cdnjs\.cloudflare\.com|fonts\.(googleapis|gstatic)\.com/.test(u.host)){ e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(n => { const c = n.clone(); caches.open(V).then(x => x.put(e.request, c)); return n; }))); } });
