// Service worker: guarda a "casca" da app para abrir sem internet.
// Ficheiros da app: rede primeiro (vês sempre a versão mais recente) e cache
// só quando estás offline. Tipos de letra: cache primeiro.
// Os dados (Supabase) nunca passam por aqui: vêm sempre da rede.
const CACHE = 'plano-treino-v8';
const SHELL = [
  './', 'index.html', 'manifest.webmanifest',
  'css/style.css',
  'js/app.js', 'js/api.js', 'js/config.js', 'js/data.js', 'js/icons.js', 'js/fx.js', 'js/progress.js', 'js/timer.js', 'js/gaby-data.js', 'js/doodles.js',
  'fonts/poppins-400.woff2', 'fonts/poppins-500-italic.woff2', 'fonts/poppins-500.woff2', 'fonts/poppins-600.woff2', 'fonts/poppins-700.woff2',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const isFont = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (url.origin !== self.location.origin && !isFont) return; // Supabase etc.: sempre rede

  e.respondWith(
    caches.open(CACHE).then(async (cache) => {
      if (isFont) {
        const hit = await cache.match(req);
        if (hit) return hit;
      }
      try {
        const res = await fetch(req);
        if (res.ok || res.type === 'opaque') cache.put(req, res.clone());
        return res;
      } catch {
        const hit = await cache.match(req, { ignoreSearch: true });
        if (hit) return hit;
        return req.mode === 'navigate' ? cache.match('index.html') : Response.error();
      }
    })
  );
});
