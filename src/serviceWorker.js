const CACHE_NAME = "vert-v3";
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
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(precacheList);

      const shellResponse = await cache.match(scopeUrl, { ignoreVary: true });
      if (!shellResponse) throw new Error("Cached shell response not found");

      const shellHtml = await shellResponse.text();
      const assetUrls = [
        ...shellHtml.matchAll(
          /(?:src|href)\s*=\s*["']([^"']*\/assets\/[^"']+)["']/g,
        ),
      ].map((match) => new URL(match[1], scopeUrl).href);
      const uncachedAssetUrls = [
        ...new Set(assetUrls.filter((url) => !precacheList.includes(url))),
      ];

      await cache.addAll(uncachedAssetUrls);

      const cssUrls = uncachedAssetUrls.filter((url) =>
        new URL(url).pathname.endsWith(".css")
      );
      const fontUrls = new Set();

      for (const cssUrl of cssUrls) {
        const cssResponse = await cache.match(cssUrl, { ignoreVary: true });
        if (!cssResponse) continue;

        const css = await cssResponse.text();
        for (
          const match of css.matchAll(
            /url\(\s*["']?([^"')]+\.woff2?)["']?\s*\)/g,
          )
        ) {
          fontUrls.add(new URL(match[1], cssUrl).href);
        }
      }

      await Promise.allSettled(
        [...fontUrls].map(async (fontUrl) => {
          const response = await fetch(fontUrl);
          if (response.ok) await cache.put(fontUrl, response);
        }),
      );

      await self.skipWaiting();
    })(),
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
    return (await caches.match(scopeUrl, { ignoreVary: true })) ||
      new Response("Offline", {
        status: 503,
        headers: { "Content-Type": "text/plain" },
      });
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request, { ignoreVary: true });

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
  const cached = await cache.match(request, { ignoreVary: true });
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
