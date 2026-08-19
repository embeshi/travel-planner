/* ============================================================
   NGƯỜI GÁC KHO · v10
   Bê nguyên bốn luật vận hành của sw.js v9.6, chỉ đổi phần hợp với Vite.

   1. Trữ sẵn vỏ app + thư viện + font trong kho.
   2. Có mạng: luôn ưu tiên bản MỚI của trang (network-first), nên tem
      phiên bản mới hiện ra ngay sau mỗi lần đẩy lên.
   3. Mất mạng: mở kho dự trữ — app vẫn lên, kể cả mở mới hoàn toàn.
   4. Dữ liệu sống ở Supabase KHÔNG BAO GIỜ bị cache.

   KHÁC v9.6 một chỗ, và có lý do: Vite gắn mã băm vào tên file JS/CSS
   (main-CB4BGIXe.js), nên KHÔNG thể liệt kê sẵn chúng trong CORE. Thay
   vào đó mọi thứ cùng nguồn được trữ theo kiểu «lấy kho trước cho nhanh,
   âm thầm tải bản mới» — cách này tự lo được cho tên file đổi mỗi lần build.

   NHỚ: lô nào thay icon hay tệp tĩnh thì phải nâng số kho đệm ở dòng dưới,
   không thì icon cũ bám lại trên máy người dùng (CLAUDE.md).
   ============================================================ */
const CACHE = 'travel-planner-v10';

const CORE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './maskable-512.png',
  './apple-touch-icon.png',
  'https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap'
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    /* Từng món một, món nào hỏng bỏ qua, không chặn cả kho */
    await Promise.all(CORE.map((url) => cache.add(url).catch(() => null)));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys.filter((k) => k.startsWith('travel-planner-') && k !== CACHE)
        .map((k) => caches.delete(k))
    );
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  /* Dữ liệu sống: đường ai nấy đi, không cache */
  if (url.hostname.endsWith('.supabase.co')) return;

  /* Mở trang: mạng trước (nhận bản mới), kho sau (sống lúc offline) */
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const cache = await caches.open(CACHE);
        cache.put('./index.html', fresh.clone());
        return fresh;
      } catch (err) {
        const cache = await caches.open(CACHE);
        return (await cache.match('./index.html')) ||
               (await cache.match('./')) || Response.error();
      }
    })());
    return;
  }

  const OK_HOSTS = ['cdn.jsdelivr.net', 'fonts.googleapis.com', 'fonts.gstatic.com'];
  if (url.origin === self.location.origin || OK_HOSTS.includes(url.hostname)) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      const hit = await cache.match(req);
      const dangTai = fetch(req).then((res) => {
        if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
        return res;
      }).catch(() => null);
      return hit || (await dangTai) || Response.error();
    })());
  }
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
