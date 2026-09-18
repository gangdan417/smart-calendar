/* 智能日历 Service Worker：缓存应用外壳实现离线使用。
   策略：同源 GET 请求缓存优先、后台更新；天气等跨域请求不拦截直连网络。 */
const CACHE = 'smart-cal-v2';
const ASSETS = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-180.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return; // 跨域（天气 API）直连
  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request).then(resp => {
      if (resp && resp.ok) {
        const cp = resp.clone();
        caches.open(CACHE).then(c => c.put(e.request, cp));
      }
      return resp;
    }).catch(() => caches.match('./index.html')))
  );
});
