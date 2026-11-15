// Headless Edge/Chrome test with a temporary profile and a local mock API; no live data is accessed.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createServer as createPortServer } from 'node:net';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, resolve, join, extname, basename, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../dist');
const profile = await mkdtemp(join(tmpdir(), 'bplo-cache-browser-'));
let role = null;
const account = () => ({ id: '1', role, name: 'Cache Test', email: 'cache@example.test', phone: '09170000001', address: 'Test address' });
const server = createServer(async (request, response) => {
  const path = new URL(request.url, 'http://localhost').pathname;
  if (path.startsWith('/api/')) {
    response.setHeader('Content-Type', 'application/json');
    response.setHeader('Cache-Control', 'no-store');
    response.end(JSON.stringify(path.endsWith('/auth/me') ? { user: account() } : path.endsWith('/settings') ? { data: {} } : { data: [] }));
    return;
  }
  const target = resolve(root, '.' + (path === '/' ? '/index.html' : path));
  if (!target.startsWith(root + sep)) { response.writeHead(403).end(); return; }
  try {
    const types = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.png': 'image/png' };
    response.setHeader('Content-Type', types[extname(target)] || 'application/octet-stream');
    response.setHeader('Cache-Control', path === '/sw.js' || path === '/' ? 'no-cache' : 'public, max-age=31536000, immutable');
    if (path === '/sw.js') response.setHeader('Service-Worker-Allowed', '/');
    response.end(await readFile(target));
  } catch { response.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const portServer = createPortServer();
await new Promise(resolve => portServer.listen(0, '127.0.0.1', resolve));
const debugPort = portServer.address().port;
await new Promise(resolve => portServer.close(resolve));
const binary = process.env.BROWSER_BINARY || (process.platform === 'win32' ? 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' : 'google-chrome');
let browser;
let ws;
let startupError;
let log = '';
const pending = new Map();
let nextId = 0;
const cachedResources = [];
let call;
try {
  browser = spawn(binary, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    `--remote-debugging-port=${debugPort}`, `--user-data-dir=${profile}`, 'about:blank'], { windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] });
  browser.on('error', error => { startupError = error; });
  browser.stderr.on('data', data => { log = (log + data.toString()).slice(-2000); });
  let page;
  for (let attempt = 0; attempt < 70; attempt++) {
    if (startupError) throw startupError;
    try { page = (await (await fetch(`http://127.0.0.1:${debugPort}/json/list`)).json()).find(target => target.type === 'page'); if (page) break; }
    catch { /* Wait for the browser's local debugging socket. */ }
    await delay(150);
  }
  assert(page, 'Browser did not start: ' + log);
  ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.addEventListener('open', resolve, { once: true }); ws.addEventListener('error', reject, { once: true }); });
  ws.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const item = pending.get(message.id); pending.delete(message.id); clearTimeout(item.timeout);
      message.error ? item.reject(new Error(message.error.message)) : item.resolve(message.result);
    }
    if (message.method === 'Network.responseReceived' && message.params.response.fromServiceWorker) cachedResources.push(message.params.response.url);
  });
  call = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++nextId;
    const timeout = setTimeout(() => { pending.delete(id); reject(new Error('Browser command timed out: ' + method)); }, 20000);
    pending.set(id, { resolve, reject, timeout });
    ws.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async expression => {
    const result = await call('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
    return result.result.value;
  };
  const waitFor = async expression => {
    for (let attempt = 0; attempt < 100; attempt++) {
      try { if (await evaluate(expression)) return; } catch { /* Page is changing documents. */ }
      await delay(120);
    }
    throw new Error('Browser condition timed out: ' + expression);
  };
  await call('Page.enable');
  await call('Runtime.enable');
  await call('Network.enable');
  await call('Network.setCacheDisabled', { cacheDisabled: true });
  await call('Page.navigate', { url: origin });
  await waitFor('Boolean(document.querySelector(".welcome-site"))');
  await waitFor('Boolean(navigator.serviceWorker.controller)');
  const keys = await evaluate('(async()=>{const names=await caches.keys();const cache=await caches.open(names.find(name=>name.startsWith("bplo-static-")));return (await cache.keys()).map(request=>new URL(request.url).pathname);})()');
  assert(keys.includes('/index.html') && keys.includes('/calapan-bplo-logo.png'));
  assert(keys.some(path => /AdminApp.*\.js$/.test(path)), 'Admin workspace bundle is precached');
  assert(keys.some(path => /ApplicantPortal.*\.js$/.test(path)), 'Applicant workspace bundle is precached');
  for (const nextRole of ['admin', 'applicant']) {
    role = nextRole;
    await evaluate(`sessionStorage.setItem('bplo-api-session',${JSON.stringify(JSON.stringify(account()))});localStorage.setItem('bplo-token','${'a'.repeat(64)}');true`);
    await call('Page.reload');
    await waitFor(`Boolean(document.querySelector('${nextRole === 'admin' ? '.ad-shell' : '.portal-shell'}'))`);
    await evaluate("fetch('/api/bplo/cache-probe',{cache:'no-store',headers:{Authorization:'Bearer test'}}).then(response=>response.json())");
    const privateKeys = await evaluate('(async()=>{const names=await caches.keys();const paths=[];for(const name of names){if(name.startsWith("bplo-static-")){for(const request of await(await caches.open(name)).keys())paths.push(request.url);}}return paths.filter(path=>path.includes("/api/")||path.includes("private_uploads")||path.includes("/proof"));})()');
    assert.deepEqual(privateKeys, [], nextRole + ' API data must never enter the worker cache');
  }
  assert(cachedResources.some(url => /\/assets\/.*\.js$/.test(url)), 'A warm reload serves JavaScript from the service worker');
  assert(cachedResources.some(url => /\.css$/.test(url)), 'Workspace styles load from the service worker');
  await call('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: 0, uploadThroughput: 0 });
  const asset = keys.find(path => path.endsWith('.js'));
  assert.equal(await evaluate(`fetch(${JSON.stringify(asset)}).then(response=>response.ok)`), true, 'Cached public asset works offline');
  assert.equal(await evaluate("fetch('/api/bplo/cache-probe',{cache:'no-store',headers:{Authorization:'Bearer test'}}).then(()=>false).catch(()=>true)"), true, 'Private API has no offline cache fallback');
  await call('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
  console.log('PASS: actual browser service-worker installation, public/admin/applicant display, cached JS/CSS on reload, offline static assets and network-only private API.');
} finally {
  if (call && ws?.readyState === WebSocket.OPEN) { try { await call('Browser.close'); } catch { /* Browser may close before replying. */ } }
  ws?.close();
  for (const entry of pending.values()) clearTimeout(entry.timeout);
  if (browser?.pid && browser.exitCode === null && browser.signalCode === null) {
    const closed = new Promise(resolve => browser.once('close', resolve));
    browser.kill(); await Promise.race([closed, delay(3000)]);
  }
  await new Promise(resolve => server.close(resolve));
  const target = resolve(profile);
  if (dirname(target) !== resolve(tmpdir()) || !basename(target).startsWith('bplo-cache-browser-')) throw new Error('Unsafe browser test cleanup target');
  await rm(target, { recursive: true, force: true, maxRetries: 15, retryDelay: 150 });
}
