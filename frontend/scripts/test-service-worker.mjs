import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const origin = 'https://bplo.example.test';
const files = ['/index.html', '/calapan-bplo-logo.png', '/assets/index-deadbeef.js', '/assets/role-12345678.css'];
const template = readFileSync(new URL('../public/sw.js', import.meta.url), 'utf8');
const source = template.replace("const BUILD_VERSION = 'development';", "const BUILD_VERSION = 'test-version';").replace('/* BUILD_ASSETS */ []', JSON.stringify(files));
const cacheName = 'bplo-static-test-version';
const key = request => new URL(typeof request === 'string' ? request : request.url, origin).href;
const stores = new Map();
let offline = false;
let newRelease = false;
let wrongType = false;
let fetches = 0;
let claimed = false;
const shell = version => `<html><script src="/assets/index-${version}.js"></script></html>`;
const network = async request => {
  fetches++;
  if (offline) throw new TypeError('Network unavailable');
  const path = new URL(key(request)).pathname;
  if (path === '/' || path === '/index.html') return new Response(shell(newRelease ? 'newbuild' : 'deadbeef'), { headers: { 'Content-Type': 'text/html' } });
  if (wrongType) return new Response('wrong HTML', { headers: { 'Content-Type': 'text/html' } });
  return new Response('public file ' + path, { headers: { 'Content-Type': path.endsWith('.js') ? 'application/javascript' : path.endsWith('.css') ? 'text/css' : 'image/png' } });
};
const cacheApi = {
  async open(name) {
    if (!stores.has(name)) stores.set(name, new Map());
    const entries = stores.get(name);
    return {
      async match(request) { return entries.get(key(request))?.clone(); },
      async put(request, response) { entries.set(key(request), response.clone()); },
      async addAll(requests) { for (const request of requests) entries.set(key(request), (await network(request)).clone()); },
    };
  },
  async keys() { return [...stores.keys()]; },
  async delete(name) { return stores.delete(name); },
};
const handlers = new Map();
runInNewContext(source, { self: { location: { origin }, clients: { async claim() { claimed = true; } }, addEventListener(type, handler) { handlers.set(type, handler); } },
  caches: cacheApi, fetch: network, Request, Response, URL, Set, console });
async function lifecycle(type) {
  let task;
  handlers.get(type)({ waitUntil(promise) { task = promise; } });
  await task;
}
const request = (path, options = {}) => ({ url: new URL(path, origin).href, method: options.method || 'GET', mode: options.mode || 'cors', headers: new Headers(options.headers || {}) });
function intercept(input) {
  let result;
  handlers.get('fetch')({ request: input, respondWith(promise) { result = promise; } });
  return result;
}
await lifecycle('install');
assert.equal(stores.get(cacheName).size, files.length, 'All public build files are precached');
await cacheApi.open('bplo-static-previous');
await cacheApi.open('another-app-private-cache');
await lifecycle('activate');
assert(claimed);
assert(!stores.has('bplo-static-previous'));
assert(stores.has('another-app-private-cache'), 'Other applications caches are preserved');
for (const input of [
  request('/api/bplo/applications'), request('/api/bplo/auth/me'), request('/api/bplo/payments'),
  request('/api/bplo/applications/REF/payment/submissions/1/proof'), request('/private_uploads/file.pdf'),
  request('https://separate-backend.onrender.com/api/bplo/auth/me'),
  request('https://separate-backend.onrender.com/api/bplo/applications', { headers: { Authorization: 'Bearer test' } }),
  request('/assets/index-deadbeef.js', { headers: { Authorization: 'Bearer example' } }),
  request('/api/bplo/applications', { method: 'POST' }), request('/api/bplo/settings', { method: 'PUT' }),
  request('/api/bplo/applications/REF', { method: 'DELETE' }), request('https://maps.example.test/image.png'),
  request('/calapan-bplo-logo.png?private=1'), request('/unlisted-file.png'),
]) assert.equal(intercept(input), undefined, 'Unlisted/private request bypasses the cache: ' + input.url);
const before = fetches;
offline = true;
assert((await (await intercept(request('/assets/index-deadbeef.js'))).text()).includes('public file'));
assert.equal(fetches, before, 'Cached static asset requires no network request');
const offlineShell = await intercept(request('/', { mode: 'navigate' }));
assert.equal(await offlineShell.text(), shell('deadbeef'));
offline = false;
await intercept(request('/', { mode: 'navigate' }));
newRelease = true;
assert.equal(await (await intercept(request('/', { mode: 'navigate' }))).text(), shell('newbuild'), 'Online navigation gets the latest HTML');
assert.equal(await (await (await cacheApi.open(cacheName)).match('/index.html')).text(), shell('deadbeef'), 'Older worker does not save HTML requiring uncached new-version assets');
stores.get(cacheName).delete(new URL('/calapan-bplo-logo.png', origin).href);
wrongType = true;
await intercept(request('/calapan-bplo-logo.png'));
assert(!stores.get(cacheName).has(new URL('/calapan-bplo-logo.png', origin).href), 'HTML error responses are not saved as static images');
assert([...stores.get(cacheName).keys()].every(url => files.includes(new URL(url).pathname)), 'Cache contains only known public build paths');
console.log('PASS: public precache, offline shell/assets, fresh navigation, safe updates, old-cache cleanup, private/API/auth/write bypass and MIME checks.');
