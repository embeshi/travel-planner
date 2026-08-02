/* ============================================================
   NGƯỜI GÁC KHO · Thời đại 9 · Nhà kho di động (PWA)
   App: Kế hoạch du lịch · embeshi.github.io/travel-planner
   Luật vận hành:
   1. Trữ sẵn vỏ app + thư viện + font trong kho (cache).
   2. Có mạng: luôn ưu tiên lấy bản MỚI của trang (network-first),
      nên tem phiên bản mới hiện ra ngay sau mỗi lần upload.
   3. Mất mạng: mở kho dự trữ — app vẫn lên, kể cả mở mới hoàn toàn.
   4. Dữ liệu sống ở Supabase KHÔNG BAO GIỜ bị cache — đồng bộ
      thật/giả rõ ràng, app tự lo phần offline của dữ liệu.
   ============================================================ */

const CACHE = "travel-planner-v8";

const CORE = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./apple-touch-icon.png",
  "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2",
  "https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,500;0,600;1,500&family=Be+Vietnam+Pro:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap"
];

/* Nhập kho lần đầu — từng món một, món nào hỏng bỏ qua, không chặn cả kho */
self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await Promise.all(
      CORE.map((url) => cache.add(url).catch(() => null))
    );
    await self.skipWaiting();
  })());
});

/* Người gác mới nhận ca: đốt các kho phiên bản cũ, tiếp quản mọi tab */
self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter((k) => k.startsWith("travel-planner-") && k !== CACHE)
        .map((k) => caches.delete(k))
    );
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  /* Dữ liệu sống: đường ai nấy đi, không cache */
  if (url.hostname.endsWith(".supabase.co")) return;

  /* Mở trang: mạng trước (để nhận bản mới), kho sau (để sống lúc offline) */
  if (req.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const cache = await caches.open(CACHE);
        cache.put("./index.html", fresh.clone());
        return fresh;
      } catch (err) {
        const cache = await caches.open(CACHE);
        return (
          (await cache.match("./index.html")) ||
          (await cache.match("./")) ||
          Response.error()
        );
      }
    })());
    return;
  }

  /* Đồ trong kho + thư viện + font: kho trước cho nhanh, âm thầm lấy bản mới */
  const OK_HOSTS = ["cdn.jsdelivr.net", "fonts.googleapis.com", "fonts.gstatic.com"];
  if (url.origin === self.location.origin || OK_HOSTS.includes(url.hostname)) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      const hit = await cache.match(req);
      const refreshing = fetch(req)
        .then((res) => {
          if (res && (res.ok || res.type === "opaque")) {
            cache.put(req, res.clone());
          }
          return res;
        })
        .catch(() => null);
      return hit || (await refreshing) || Response.error();
    })());
  }
});

/* Cửa hậu cho lệnh thay ca tức thì (dự phòng cho tương lai) */
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});
