// Service worker template. The build (plugins/serviceWorkerPlugin.ts) prepends
// BUILD_VERSION and PRECACHE_PATHS and writes the result to dist/sw.js.
//
// Strategy: the whole build is precached at install into a cache named after
// the build version, and every request for it is answered from that cache
// without touching the network. Launching the installed app therefore never
// waits on the network, whether offline, on a captive portal, or on a
// connection that is technically up but not delivering anything.
//
// Updates arrive as a new sw.js (its contents change with every build). The
// new worker downloads the complete new build in the background and only
// takes over once all of it is cached, so the shell and its hashed assets
// always come from the same build. The next launch shows the new version.

/* global BUILD_VERSION, PRECACHE_PATHS */

const CACHE_PREFIX = "vert-";
const CACHE_NAME = `${CACHE_PREFIX}${BUILD_VERSION}`;
const scopeUrl = new URL(self.registration.scope);
const shellUrl = scopeUrl.href;
const precacheUrls = PRECACHE_PATHS.map((path) => new URL(path, scopeUrl).href);

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      try {
        // Bypass the HTTP cache: GitHub Pages serves everything with
        // max-age=600, so a cached index.html could belong to the previous
        // deploy and reference assets this build does not contain.
        await cache.addAll(
          precacheUrls.map((url) => new Request(url, { cache: "reload" })),
        );
        await assertShellIsComplete(cache);
      } catch (error) {
        // Leave the previous, complete version in charge and retry on the
        // next update check rather than activating a partial build.
        await caches.delete(CACHE_NAME);
        throw error;
      }
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
          .map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin || !url.href.startsWith(shellUrl)) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(fromCacheOrNetwork(shellUrl, request));
    return;
  }

  event.respondWith(fromCacheOrNetwork(request, request));
});

async function fromCacheOrNetwork(cacheKey, request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(cacheKey, { ignoreVary: true });
  if (cached) return cached;

  try {
    return await fetch(request);
  } catch (error) {
    if (request.mode !== "navigate") throw error;
    return new Response(
      "Vert is offline and its files are not available on this device yet. " +
        "Open it once while online.",
      { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } },
    );
  }
}

/**
 * Guards against a deploy race in which index.html already belongs to a newer
 * build than this sw.js: every asset the shell references must be precached,
 * or launching offline would load a shell whose scripts are missing.
 */
async function assertShellIsComplete(cache) {
  const shell = await cache.match(shellUrl, { ignoreVary: true });
  if (!shell) throw new Error("App shell missing from precache");

  const html = await shell.text();
  const referenced = [
    ...html.matchAll(/(?:src|href)\s*=\s*["']([^"']+)["']/g),
  ]
    .map((match) => new URL(match[1], scopeUrl))
    .filter((url) =>
      url.origin === scopeUrl.origin && url.href.startsWith(shellUrl)
    )
    .map((url) => url.href);

  const missing = referenced.filter((url) => !precacheUrls.includes(url));
  if (missing.length > 0) {
    throw new Error(`App shell references uncached files: ${missing}`);
  }
}
