// Chức năng: đặt version cho App Shell cache.
const CACHE_NAME =
  "vku-field-survey-v6";

// Chức năng: precache các tài nguyên có URL ổn định.
const APP_SHELL = [
  "/",
  "/index.html",
  "/style.css",
  "/app.js",
  "/db.js",
  "/survey-schema.js",
  "/manifest.json",
  "/offline.html",
  "/icons/icon-192.png",
  "/icons/icon-512.png"
];

// Chức năng: precache App Shell khi install.
self.addEventListener(
  "install",
  (event) => {
    event.waitUntil(
      caches
        .open(CACHE_NAME)
        .then((cache) => {
          return cache.addAll(
            APP_SHELL
          );
        })
    );

    self.skipWaiting();
  }
);

// Chức năng: xóa cache version cũ.
self.addEventListener(
  "activate",
  (event) => {
    event.waitUntil(
      caches
        .keys()
        .then((keys) => {
          return Promise.all(
            keys
              .filter(
                (key) =>
                  key !== CACHE_NAME
              )
              .map(
                (key) =>
                  caches.delete(key)
              )
          );
        })
    );

    self.clients.claim();
  }
);

// Chức năng: Cache First + Runtime Cache cho static resources.
self.addEventListener(
  "fetch",
  (event) => {
    const request =
      event.request;

    const url =
      new URL(request.url);

    // Quan trọng:
    // API data không dùng Cache First.
    if (
      url.pathname
        .startsWith("/api/")
    ) {
      return;
    }

    if (
      request.method !== "GET"
    ) {
      return;
    }

    event.respondWith(
      (async () => {
        // Quan trọng:
        // ignoreVary giúp match static asset
        // ổn định hơn khi response có Vary: Origin.
        const cachedResponse =
          await caches.match(
            request,
            {
              ignoreVary: true
            }
          );

        if (cachedResponse) {
          return cachedResponse;
        }

        try {
          // Cache miss → thử network.
          const networkResponse =
            await fetch(request);

          // Runtime-cache static asset cùng origin.
          // Nhờ vậy bundle hash của Vite cũng được lưu.
          if (
            networkResponse.ok
            && url.origin
            === self.location.origin
          ) {
            const cache =
              await caches.open(
                CACHE_NAME
              );

            await cache.put(
              request,
              networkResponse.clone()
            );
          }

          return networkResponse;
        } catch (error) {
          // Navigation fail khi Offline
          // → trả offline fallback.
          if (
            request.mode
            === "navigate"
          ) {
            return caches.match(
              "/offline.html",
              {
                ignoreVary: true
              }
            );
          }

          throw error;
        }
      })()
    );
  }
);