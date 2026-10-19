const CACHE = 'sispa-ks-v2';
const PRECACHE = [
  './index.html',
  './manifest.webmanifest',
  './storage.js',
  './js/main.js',
  './js/helpers.js',
  './js/modules/dashboard.js',
  './js/modules/guru.js',
  './js/modules/guru-import.js',
  './js/modules/profil.js',
  './js/modules/program.js',
  './js/modules/supervisi.js',
  './js/modules/akademik.js',
  './js/modules/coaching.js',
  './js/modules/analisis.js',
  './js/modules/laporan.js',
  './js/modules/pengaturan.js',
  '../shared/css/tokens.css',
  '../shared/css/base.css',
  '../shared/css/layout.css',
  '../shared/css/components.css',
  '../shared/css/print.css',
  '../shared/css/premium.css',
  '../shared/js/utils.js',
  '../shared/js/icons.js',
  '../shared/js/constants.js',
  '../shared/js/shell.js',
  '../shared/js/router.js',
  '../shared/js/pin.js',
  '../shared/icons/icon.svg'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
    // --- TAMBAHKAN 3 BARIS INI ---
  if (!req.url.startsWith(self.location.origin)) {
    return; // Biarkan browser yang mengurus request ke luar (Supabase)
  }
  // -----------------------------

  if (req.method !== 'GET') return;
  // ... (sisa kode di bawahnya biarkan sama)
  if (req.method !== 'GET') return;
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).catch(() => caches.match('./index.html')));
    return;
  }
  e.respondWith(
    caches.match(req).then(cached => cached || fetch(req).then(resp => {
      if (resp.ok && new URL(req.url).origin === location.origin) {
        const copy = resp.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
      }
      return resp;
    }).catch(() => caches.match('./index.html')))
  );
});
