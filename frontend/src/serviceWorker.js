const CACHE_PREFIX = 'bplo-static-';

export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  const workerUrl = new URL('/sw.js', window.location.origin).href;
  if (import.meta.env.DEV) {
    // A preview and Vite can use the same localhost port; keep development files out of the cache.
    navigator.serviceWorker.getRegistrations().then(registrations => Promise.all(registrations
      .filter(registration => [registration.active, registration.waiting, registration.installing].some(worker => worker?.scriptURL === workerUrl))
      .map(registration => registration.unregister()))).catch(() => {});
    if ('caches' in window) caches.keys().then(names => Promise.all(names.filter(name => name.startsWith(CACHE_PREFIX)).map(name => caches.delete(name)))).catch(() => {});
    return;
  }
  if (!window.isSecureContext) return;
  const start = () => {
    const install = () => navigator.serviceWorker.register(workerUrl, { scope: '/', updateViaCache: 'none' })
      .then(registration => {
        window.addEventListener('online', () => registration.update().catch(() => {}));
      }).catch(error => console.warn('Static caching is unavailable:', error.message));
    if ('requestIdleCallback' in window) window.requestIdleCallback(install, { timeout: 2000 });
    else window.setTimeout(install, 0);
  };
  if (document.readyState === 'complete') start();
  else window.addEventListener('load', start, { once: true });
}
