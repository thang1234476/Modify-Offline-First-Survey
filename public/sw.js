const CACHE_NAME = "vku-guide-v2";

const APP_SHELL = [
    "/",
    "/index.html",
    "/style.css",
    "/app.js",
    "/manifest.json",
    "/offline.html",
    "/icons/icon-192.png",
    "/icons/icon-512.png"
];

self.addEventListener("install", (event) => {
    console.log("[SW] install");

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log("[SW] caching app shell");
                return cache.addAll(APP_SHELL);
            })
            .then(() => {
                console.log("[SW] app shell cached successfully");
            })
            .catch((error) => {
                console.error("[SW] cache failed:", error);
            })
    );

    self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
    if (event.request.method !== "GET") return;

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;

            return fetch(event.request).catch(() => {
                if (event.request.mode === "navigate") {
                    return caches.match("/offline.html");
                }
            });
        })
    );
});