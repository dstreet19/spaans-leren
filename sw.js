// Service worker van Spaans leren: bewaart de app op het toestel zodat ze ook offline werkt.
// Strategie: eerst uit het geheugen van het toestel (snel, ook offline), en op de achtergrond vernieuwen
// wanneer er internet is. Een nieuwe versie van de app verschijnt dus bij het volgende openen.
// Je woorden en voortgang staan in IndexedDB en worden hier nooit aangeraakt.
const CACHE = 'spaans-leren-v0.9.2';
const BESTANDEN = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png', './favicon-32.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(BESTANDEN)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(namen => Promise.all(namen.filter(n => n.startsWith('spaans-leren-') && n !== CACHE).map(n => caches.delete(n))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== self.location.origin) return;
  e.respondWith(caches.open(CACHE).then(async c => {
    const bewaard = await c.match(r, { ignoreSearch: true });
    const vers = fetch(r).then(res => { if (res && res.ok) c.put(r, res.clone()); return res; }).catch(() => null);
    if (bewaard) { e.waitUntil(vers); return bewaard; }
    const res = await vers;
    if (res) return res;
    // Offline en niet bewaard: bij een paginaverzoek de app zelf tonen.
    if (r.mode === 'navigate') { const i = await c.match('./index.html'); if (i) return i; }
    return new Response('Offline', { status: 503, statusText: 'Offline' });
  }));
});
