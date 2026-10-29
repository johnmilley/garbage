// Offline support: serve the saved copy right away, and refresh it in the background
// so a republished schedule shows up the next time the app is opened.
const CACHE = 'garbage-day-2';  // bump to drop old cached files
const FILES = ['./', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)));
  self.skipWaiting();
});
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())
));

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  const key = e.request.mode === 'navigate' ? './' : e.request;
  e.respondWith(caches.open(CACHE).then(async c => {
    const hit = await c.match(key, { ignoreSearch: true });
    const net = fetch(e.request, { cache: 'no-cache' })
      .then(r => { if (r.ok) c.put(key, r.clone()); return r; })
      .catch(() => hit);
    if (hit) { e.waitUntil(net); return hit; }
    return net;
  }));
});
