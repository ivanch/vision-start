import assert from 'node:assert/strict';
import { test } from 'node:test';
import { resolve } from 'node:path';
import { mkdtemp, cp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { build, preview } from 'vite';
import { chromium } from 'playwright';

const loadModule = async (entry) => {
  const result = await build({
    configFile: false,
    logLevel: 'silent',
    build: {
      write: false,
      minify: false,
      lib: { entry: resolve(entry), formats: ['es'] },
    },
  });
  const output = Array.isArray(result) ? result[0] : result;
  const code = output.output.find(chunk => chunk.type === 'chunk' && chunk.isEntry).code;
  return import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
};

const storage = new Map();
const chromeStorage = new Map();
let failWrite = null;
let maximumStorageBytes = Infinity;
let chromeReads = 0;
globalThis.localStorage = {
  getItem: key => storage.get(key) ?? null,
  setItem: (key, value) => {
    if (key === failWrite) {
      failWrite = null;
      throw new Error('Quota exceeded');
    }
    const next = new Map(storage).set(key, value);
    if ([...next.values()].reduce((bytes, entry) => bytes + entry.length, 0) > maximumStorageBytes) throw new Error('Quota exceeded');
    storage.set(key, value);
  },
  removeItem: key => storage.delete(key),
};
globalThis.window = { chrome: { storage: { local: {
  get: (keys, callback) => {
    chromeReads++;
    callback(keys === null ? Object.fromEntries(chromeStorage) : Object.fromEntries(keys.map(key => [key, chromeStorage.get(key)])));
  },
  set: (values, callback) => {
    Object.entries(values).forEach(([key, value]) => chromeStorage.set(key, value));
    callback();
  },
  remove: (keys, callback) => { [keys].flat().forEach(key => chromeStorage.delete(key)); callback(); },
} } } };
globalThis.FileReader = class {
  readAsDataURL(blob) {
    blob.arrayBuffer().then(buffer => {
      this.result = `data:${blob.type};base64,${Buffer.from(buffer).toString('base64')}`;
      this.onloadend?.();
      this.onload?.();
    });
  }
};
const [{ ConfigurationService, DEFAULT_CONFIG, normalizeConfig, normalizeCategories }, icons, { default: ping }, { normalizeWebsiteUrl }, { pruneCachedIconsFromChromeStorageLocal }] = await Promise.all([
  loadModule('components/services/ConfigurationService.ts'),
  loadModule('components/utils/iconService.ts'),
  loadModule('components/utils/jsping.ts'),
  loadModule('components/utils/urlUtils.ts'),
  loadModule('components/utils/StorageLocalManager.ts'),
]);
const file = value => new File([JSON.stringify(value)], 'config.json', { type: 'application/json' });
const iconUrl = name => `https://www.google.com/s2/favicons?domain=${name}.com&sz=128`;
const originalFetch = globalThis.fetch;

await test('malformed stored data recovers without shared defaults or unsafe polling rates', () => {
  const config = normalizeConfig({ currentWallpapers: [null, 'Beach', 'Beach'], serverWidget: { pingFrequency: -1, servers: [null, {}, { id: '1', name: 'Server', address: 'localhost' }] }, clock: { size: 'unknown' }, wallpaperBlur: Infinity });
  assert.deepEqual(config.currentWallpapers, ['Beach']);
  assert.equal(config.serverWidget.pingFrequency, 5);
  assert.equal(config.serverWidget.servers.length, 1);
  assert.equal(config.clock.size, 'medium');
  assert.equal(config.wallpaperBlur, 0);
  const defaults = normalizeConfig(null);
  defaults.clock.enabled = false;
  defaults.currentWallpapers.length = 0;
  assert.equal(DEFAULT_CONFIG.clock.enabled, true);
  assert.deepEqual(DEFAULT_CONFIG.currentWallpapers, ['Beach']);
  storage.set('categories', 'null');
  assert.equal(ConfigurationService.loadCategories()[0].name, 'Search');
  assert.deepEqual(normalizeCategories([]), []);
  assert.deepEqual(normalizeCategories([null, { id: 'c', name: 'Group', websites: [null, { id: 'w', name: 'Site', url: 'https://example.com', categoryId: 'wrong' }] }])[0].websites[0].categoryId, 'c');
  storage.set('userWallpapers', '{}');
  assert.deepEqual(ConfigurationService.loadUserWallpapers(), []);
});

await test('website URLs, clock fonts, and wallpaper frequency are normalized', async () => {
  assert.equal(normalizeWebsiteUrl('github.com'), 'https://github.com/');
  assert.equal(normalizeWebsiteUrl('localhost:8080/app'), 'https://localhost:8080/app');
  assert.equal(normalizeWebsiteUrl('mailto:me@example.com'), 'mailto:me@example.com');
  assert.equal(normalizeWebsiteUrl('javascript:alert(1)'), null);
  assert.equal(normalizeWebsiteUrl('data:text/html,hi'), null);
  assert.equal(normalizeWebsiteUrl('   '), null);
  const websites = normalizeCategories([{ id: 'c', name: 'Group', websites: [
    { id: 'a', name: 'Bad', url: 'javascript:alert(1)' },
    { id: 'b', name: 'Bare', url: 'example.com' },
  ] }])[0].websites;
  assert.deepEqual(websites.map(website => website.url), ['https://example.com/']);
  assert.equal(normalizeConfig({ clock: { font: `'Orbitron', sans-serif` } }).clock.font, 'Helvetica');
  assert.equal(normalizeConfig({ clock: { font: 'monospace' } }).clock.font, 'monospace');
  assert.equal(normalizeConfig({ wallpaperFrequency: '2d' }).wallpaperFrequency, '48h');
  assert.equal(normalizeConfig({ wallpaperFrequency: 'weekly' }).wallpaperFrequency, '24h');
  chromeStorage.clear();
  chromeStorage.set(`vision-start:icon:${encodeURIComponent(iconUrl('keep'))}`, 'data:image/png;base64,a');
  chromeStorage.set(`vision-start:icon:${encodeURIComponent(iconUrl('drop'))}`, 'data:image/png;base64,b');
  chromeStorage.set('My Wallpaper', 'data:image/png;base64,c');
  assert.equal(await pruneCachedIconsFromChromeStorageLocal([iconUrl('keep')]), 1);
  assert.deepEqual([...chromeStorage.keys()].sort(), ['My Wallpaper', `vision-start:icon:${encodeURIComponent(iconUrl('keep'))}`].sort());
  chromeStorage.clear();
});

await test('imports validate before writing, roll back failures, and preserve omitted settings', async () => {
  await assert.rejects(ConfigurationService.importConfig({ size: 10 * 1024 * 1024 + 1, text: () => assert.fail('Oversized files must not be read into memory') }), /10MB/);
  storage.clear();
  storage.set('config', JSON.stringify({ title: 'Original' }));
  storage.set('categories', '[]');
  await assert.rejects(ConfigurationService.importConfig(file({ config: { title: 'Bad' }, categories: {} })), /Invalid categories/);
  assert.equal(JSON.parse(storage.get('config')).title, 'Original');
  failWrite = 'categories';
  await assert.rejects(ConfigurationService.importConfig(file({ config: { title: 'Bad' }, categories: [] })), /Quota/);
  assert.equal(JSON.parse(storage.get('config')).title, 'Original');
  const partial = await ConfigurationService.importConfig(file({ categories: '[]' }));
  assert.equal(partial.config.title, 'Original');
  const legacy = await ConfigurationService.importConfig(file({ config: JSON.stringify({ title: 'Legacy', clock: { enabled: false } }) }));
  assert.equal(legacy.config.title, 'Legacy');
  assert.equal(legacy.config.clock.enabled, false);
  assert.equal(legacy.config.clock.size, 'medium');
  storage.set('config', JSON.stringify(normalizeConfig({ title: 'Original'.repeat(50) })));
  storage.set('userWallpapers', '[]');
  const previous = new Map(storage);
  maximumStorageBytes = [...storage.values()].reduce((bytes, value) => bytes + value.length, 0) + 32;
  try {
    await assert.rejects(ConfigurationService.importConfig(file({ config: { title: 'Small' }, categories: [{ id: 'c', name: 'Group'.repeat(40), websites: [] }], userWallpapers: [{ name: 'Large', url: `https://example.com/${'image'.repeat(200)}` }] })), /Quota/);
    assert.deepEqual(storage, previous);
  } finally { maximumStorageBytes = Infinity; }
});

await test('wallpaper collisions and non-image uploads cannot overwrite storage', async () => {
  await assert.rejects(ConfigurationService.addWallpaper('Beach', 'https://example.com/image.png'), /already exists/);
  await assert.rejects(ConfigurationService.addWallpaper('vision-start:icon:reserved', 'https://example.com/image.png'), /reserved/);
  await assert.rejects(ConfigurationService.addWallpaperFile(new File(['text'], 'image.png', { type: 'text/plain' })), /image file/);
});

await test('server probes reject network failures, timeouts, and cancellation', async () => {
  try {
    globalThis.fetch = async (_url, options) => {
      assert.equal(options.method, 'HEAD');
      assert.equal(options.credentials, 'omit');
      return new Response(null);
    };
    assert.equal(typeof await ping('localhost:8080'), 'number');
    globalThis.fetch = async () => { throw new Error('Network failure'); };
    await assert.rejects(ping('https://offline.example'), /Network failure/);
    await assert.rejects(ping('ftp://example.com'), /HTTP or HTTPS/);
    globalThis.fetch = async (_url, { signal }) => new Promise((_resolve, reject) => {
      if (signal.aborted) reject(new Error('Aborted'));
      else signal.addEventListener('abort', () => reject(new Error('Aborted')), { once: true });
    });
    const controller = new AbortController();
    const request = ping('https://slow.example', 1, controller.signal);
    controller.abort();
    await assert.rejects(request, /Aborted/);
    const originalTimeout = globalThis.setTimeout;
    globalThis.setTimeout = callback => { queueMicrotask(callback); return 0; };
    try { await assert.rejects(ping('https://slow.example'), /Aborted/); }
    finally { globalThis.setTimeout = originalTimeout; }
  } finally { globalThis.fetch = originalFetch; }
});

await test('icon requests deduplicate, cap concurrency, reject oversized streams, and evict by bytes', async () => {
  let active = 0;
  let maximum = 0;
  let requests = 0;
  try {
    globalThis.fetch = async () => {
      requests++;
      maximum = Math.max(maximum, ++active);
      await new Promise(resolve => setTimeout(resolve, 5));
      active--;
      return new Response(new Uint8Array(200 * 1024), { headers: { 'content-type': 'image/png' } });
    };
    const results = await Promise.all(Array.from({ length: 12 }, (_, index) => icons.cacheWebsiteIcon(iconUrl(`site${index}`))));
    assert(results.every(result => result?.startsWith('data:image/png')));
    assert(maximum <= 4);
    const reads = chromeReads;
    await icons.getCachedWebsiteIcon(iconUrl('site0'));
    assert(chromeReads > reads, 'The oldest large icon must leave the extra memory cache');
    const before = requests;
    await Promise.all([icons.cacheWebsiteIcon(iconUrl('shared')), icons.cacheWebsiteIcon(iconUrl('shared'))]);
    assert.equal(requests - before, 1);
    let cancelled = false;
    globalThis.fetch = async () => new Response(new ReadableStream({
      pull(controller) { controller.enqueue(new Uint8Array(128 * 1024)); },
      cancel() { cancelled = true; },
    }), { headers: { 'content-type': 'image/png' } });
    assert.equal(await icons.cacheWebsiteIcon(iconUrl('oversized')), null);
    assert.equal(cancelled, true);
  } finally { globalThis.fetch = originalFetch; }
});

await test('production UI survives malformed data, distinguishes server status, and releases modal memory', async () => {
  const server = await preview({ logLevel: 'silent', preview: { host: '127.0.0.1', port: 0, strictPort: true } });
  const browser = await chromium.launch();
  try {
    const address = server.httpServer.address();
    const baseUrl = `http://127.0.0.1:${address.port}`;
    const context = await browser.newContext();
    const errors = [];
    const page = await context.newPage();
    await page.clock.install();
    page.on('pageerror', error => errors.push(error.message));
    await context.addInitScript(() => {
      localStorage.setItem('config', JSON.stringify({ currentWallpapers: [], serverWidget: { enabled: true, pingFrequency: 5, servers: [null, { id: 'on', name: 'Online', address: 'https://online.example' }, { id: 'off', name: 'Offline', address: 'https://offline.example' }] } }));
      localStorage.setItem('categories', JSON.stringify([null, { id: 'c', name: 'Group', websites: [{ id: 'a', name: 'Alpha', url: 'https://example.com', icon: '' }, { id: 'b', name: 'Beta', url: 'https://example.org', icon: '' }] }]));
      localStorage.setItem('userWallpapers', 'null');
    });
    let onlineProbes = 0;
    await context.route('https://online.example/**', route => {
      onlineProbes++;
      return route.fulfill({ status: 200, body: '' });
    });
    await context.route('https://offline.example/**', route => route.abort('connectionfailed'));
    const metadata = Object.fromEntries(Array.from({ length: 4000 }, (_, index) => [`service-${index}`, { base: 'svg', colors: { blue: `service-${index}-blue` }, aliases: ['unused'.repeat(100)], update: { author: { name: 'unused'.repeat(100) } } }]));
    let metadataLoads = 0;
    let delayMetadata = false;
    let releaseMetadata = () => {};
    await context.route('**/icon-metadata.json', async route => {
      metadataLoads++;
      if (delayMetadata) await new Promise(resolve => { releaseMetadata = resolve; });
      return route.fulfill({ json: metadata });
    });
    await context.route('https://cdn.jsdelivr.net/**', route => route.abort());
    await page.goto(baseUrl);
    await page.getByRole('link', { name: 'Open Alpha' }).waitFor();
    await page.waitForFunction(() => [...document.querySelectorAll('.liquid-status-dot')].some(dot => dot.classList.contains('bg-green-400')) && [...document.querySelectorAll('.liquid-status-dot')].some(dot => dot.classList.contains('bg-red-400')));
    const beforeHidden = onlineProbes;
    const clockBeforeHidden = await page.locator('.liquid-clock-text').textContent();
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await page.clock.fastForward(120_000);
    assert.equal(onlineProbes, beforeHidden);
    assert.equal(await page.locator('.liquid-clock-text').textContent(), clockBeforeHidden);
    const resumedProbe = page.waitForRequest('https://online.example/');
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await resumedProbe;
    await page.waitForFunction(before => document.querySelector('.liquid-clock-text').textContent !== before, clockBeforeHidden);
    await page.waitForFunction(() => [...document.querySelectorAll('.liquid-status-dot')].some(dot => dot.classList.contains('bg-green-400')));
    const downloaded = [];
    page.on('request', request => downloaded.push(request.url()));
    await page.getByRole('button', { name: 'Open configuration' }).click();
    await page.getByRole('dialog').waitFor();
    assert(!downloaded.some(url => url.includes('ServerWidgetTab.js')));
    await page.getByRole('button', { name: 'Server Widget', exact: true }).click();
    await page.getByPlaceholder('Server Name').waitFor();
    assert(downloaded.some(url => url.includes('ServerWidgetTab.js')));
    await page.getByRole('button', { name: 'Cancel', exact: true }).click();
    await page.getByRole('dialog').waitFor({ state: 'hidden' });
    await page.getByRole('button', { name: 'Edit page' }).click();
    await page.getByRole('button', { name: 'Move Beta left' }).click();
    assert.deepEqual(await page.locator('a[aria-label$="edit controls"]').evaluateAll(links => links.map(link => [...link.querySelectorAll('span')].at(-1).textContent)), ['Beta', 'Alpha']);
    const openPicker = async () => {
      await page.getByRole('button', { name: 'Edit Alpha', exact: true }).click();
      const input = page.getByPlaceholder('Icon URL or name');
      await input.fill('service');
      await input.focus();
      await page.locator('.liquid-dropdown-list').waitFor();
      assert.equal(await page.locator('.liquid-dropdown-list img').count(), 50);
      await page.getByRole('button', { name: 'Close', exact: true }).click();
      await page.getByPlaceholder('Icon URL or name').waitFor({ state: 'hidden' });
    };
    await openPicker();
    const session = await context.newCDPSession(page);
    const heap = async () => {
      await session.send('HeapProfiler.collectGarbage');
      return (await session.send('Runtime.getHeapUsage')).usedSize;
    };
    const before = await heap();
    for (let cycle = 0; cycle < 15; cycle++) await openPicker();
    const growth = (await heap()) - before;
    assert(growth < 2 * 1024 * 1024, `Retained JS heap grew by ${growth} bytes`);
    assert.equal(metadataLoads, 16);
    await page.evaluate(() => {
      const original = window.fetch;
      window.fetch = (url, options) => {
        if (String(url).endsWith('/icon-metadata.json')) window.metadataSignal = options.signal;
        return original(url, options);
      };
    });
    delayMetadata = true;
    await page.getByRole('button', { name: 'Edit Alpha', exact: true }).click();
    const pendingMetadata = page.waitForRequest('**/icon-metadata.json');
    await page.getByPlaceholder('Icon URL or name').focus();
    await pendingMetadata;
    await page.getByRole('button', { name: 'Close', exact: true }).click();
    await page.waitForFunction(() => window.metadataSignal?.aborted === true);
    releaseMetadata();
    delayMetadata = false;
    await openPicker();
    assert.equal(metadataLoads, 18);
    assert.deepEqual(errors, []);
    console.log(`Retained JS heap change after 15 picker cycles: ${Math.round(growth / 1024)} KiB`);
    await context.close();
  } finally {
    await browser.close();
    await new Promise(resolve => server.httpServer.close(resolve));
  }
});

await test('unpacked MV3 extension loads its new-tab page with working chrome storage', async () => {
  const temporary = await mkdtemp(resolve(tmpdir(), 'vision-start-check-'));
  const extension = resolve(temporary, 'extension');
  let context;
  try {
    await cp(resolve('dist'), extension, { recursive: true });
    await cp(resolve('manifest.json'), resolve(extension, 'manifest.json'));
    await cp(resolve('extension'), resolve(extension, 'extension'), { recursive: true });
    context = await chromium.launchPersistentContext(resolve(temporary, 'profile'), {
      channel: 'chromium',
      headless: true,
      args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`],
    });
    await context.route(/^https?:/, route => route.abort());
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('chrome://newtab');
    await page.getByRole('button', { name: 'Open configuration' }).waitFor();
    const origin = await page.evaluate(() => document.location.origin);
    assert(origin.startsWith('chrome-extension://'), `Unexpected new-tab origin: ${origin}`);
    assert.equal(await page.evaluate(async () => {
      await chrome.storage.local.set({ regression: 'working' });
      return (await chrome.storage.local.get('regression')).regression;
    }), 'working');
    await page.getByRole('button', { name: 'Open configuration' }).click();
    await page.getByRole('dialog').waitFor();
    assert.deepEqual(errors, []);
  } finally {
    await context?.close();
    await rm(temporary, { recursive: true, force: true });
  }
});
