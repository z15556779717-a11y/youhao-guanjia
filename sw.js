const CACHE_NAME = 'drive-cost-calc-v13';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-180.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  // 页面（HTML）：网络优先，保证每次打开都能拿到最新版；断网时回退缓存
  if (e.request.mode === 'navigate' || e.request.destination === 'document') {
    e.respondWith(
      fetch(e.request).then(resp => {
        const copy = resp.clone();
        caches.open(CACHE_NAME).then(c => c.put('./index.html', copy));
        return resp;
      }).catch(() => caches.match('./index.html', { ignoreSearch: true }))
    );
    return;
  }
  // 静态资源（图标等）：缓存优先，离线可用
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(hit => {
      return hit || fetch(e.request).then(resp => {
        const copy = resp.clone();
        caches.open(CACHE_NAME).then(c => c.put(e.request, copy));
        return resp;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
