const CACHE_NAME = "vert-v2";
const scopeUrl = new URL(self.registration.scope);
const precacheList = [
  scopeUrl.href,
  new URL("manifest.webmanifest", scopeUrl).href,
  new URL("favicon.ico", scopeUrl).href,
  new URL("logo192.png", scopeUrl).href,
  new URL("logo512.png", scopeUrl).href,
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(precacheList))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  if (url.pathname.includes("/assets/")) {
    event.respondWith(cacheFirst(request));
    return;
  }

  event.respondWith(staleWhileRevalidate(event));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE_NAME).map((key) =>
            caches.delete(key)
          ),
        )
      )
      .then(() => self.clients.claim()),
  );
});

async function networkFirstNavigation(request) {
  const cache = await caches.open(CACHE_NAME);

  try {
    const response = await fetch(request);
    if (response.ok) {
      await cache.put(scopeUrl, response.clone());
    }
    return response;
  } catch {
    return (await caches.match(scopeUrl)) ||
      new Response("Offline", {
        status: 503,
        headers: { "Content-Type": "text/plain" },
      });
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok) {
    await cache.put(request, response.clone());
  }
  return response;
}

async function staleWhileRevalidate(event) {
  const request = event.request;
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  const networkResponse = fetch(request).then(async (response) => {
    if (response.ok) {
      await cache.put(request, response.clone());
    }
    return response;
  });

  if (cached) {
    event.waitUntil(networkResponse.then(() => undefined).catch(() => {}));
    return cached;
  }

  return networkResponse;
}
