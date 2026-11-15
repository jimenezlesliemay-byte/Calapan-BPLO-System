/* Only public application files belong in this cache. API data and uploads stay online. */
const BUILD_VERSION = 'development';
const PRECACHE = /* BUILD_ASSETS */ [];
const CACHE_PREFIX = 'bplo-static-';
const CACHE_NAME = CACHE_PREFIX + BUILD_VERSION;
const STATIC_PATHS = new Set(PRECACHE.filter(path => path !== '/index.html'));

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(PRECACHE.map(path => new Request(new URL(path, self.location.origin), { cache: 'reload' })));
    // Updates wait for existing tabs; do not reload an applicant's unfinished form.
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME).map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

async function publicNavigation(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    if (!response.ok || response.redirected || !response.headers.get('Content-Type')?.includes('text/html')) throw new Error('Public shell unavailable');
    // An older worker must not replace its offline shell with HTML needing a newer set of assets.
    const html = await response.clone().text();
    const references = [...html.matchAll(/(?:src|href)=["'](\/assets\/[^"']+\.(?:js|css))["']/g)].map(match => match[1]);
    if (references.length && references.every(path => STATIC_PATHS.has(path))) {
      try { await cache.put('/index.html', response.clone()); } catch { /* Cache quota must not block a page. */ }
    }
    return response;
  } catch (error) {
    const saved = await cache.match('/index.html');
    if (saved) return saved;
    throw error;
  }
}

async function publicAsset(request) {
  const cache = await caches.open(CACHE_NAME);
  const saved = await cache.match(request);
  if (saved) return saved;
  const response = await fetch(request);
  const type = response.headers.get('Content-Type') || '';
  if (response.ok && !response.redirected && !response.headers.has('Content-Disposition') &&
      /^(?:text\/css|(?:text|application)\/javascript|image\/|font\/|application\/font)/.test(type)) {
    try { await cache.put(request, response.clone()); } catch { /* Continue without caching if storage is unavailable. */ }
  }
  return response;
}

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || request.headers.has('Authorization') || url.origin !== self.location.origin || url.search) return;
  // This allowlist excludes /api, PHP routes, uploads, proofs, external maps, and arbitrary pages.
  if (request.mode === 'navigate' && (url.pathname === '/' || url.pathname === '/index.html')) {
    event.respondWith(publicNavigation(request));
  } else if (STATIC_PATHS.has(url.pathname)) {
    event.respondWith(publicAsset(request));
  }
});
