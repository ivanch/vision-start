import { spawn } from 'node:child_process';
import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const viewport = { width: 1280, height: 800 };
const host = '127.0.0.1';
const port = 4173;
const configuredBaseUrl = process.env.SCREENSHOT_BASE_URL?.replace(/\/+$/, '');
const baseUrl = configuredBaseUrl || `http://${host}:${port}`;
const outputDirectory = process.env.SCREENSHOT_OUTPUT_DIR || 'screenshots';
const demoDataPath = process.env.SCREENSHOT_DEMO_DATA || 'scripts/demoData.json';
const viteCli = path.resolve('node_modules/vite/bin/vite.js');
const imgurImageCache = new Map();

const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const waitForServer = async (preview) => {
  const deadline = Date.now() + 30_000;
  let lastError;

  while (Date.now() < deadline) {
    if (previewError) throw previewError;

    if (preview && preview.exitCode !== null) {
      throw new Error(`Vite preview exited with code ${preview.exitCode}.`);
    }

    try {
      const response = await fetch(baseUrl);
      if (response.ok) return;
      lastError = new Error(`Vite preview returned ${response.status}.`);
    } catch (error) {
      lastError = error;
    }

    await delay(250);
  }

  throw new Error(`Screenshot target did not respond at ${baseUrl}. ${lastError?.message || ''}`.trim());
};

const loadDemoData = async () => {
  const encodedData = JSON.parse(await readFile(demoDataPath, 'utf8'));

  if (!encodedData || typeof encodedData !== 'object' || Array.isArray(encodedData)) {
    throw new Error(`${demoDataPath} must contain an object of base64-encoded localStorage values.`);
  }

  return Object.entries(encodedData).map(([key, value]) => {
    if (typeof value !== 'string') {
      throw new Error(`${demoDataPath} contains a non-string value for ${key}.`);
    }

    return { key, value: Buffer.from(value, 'base64').toString('utf8') };
  });
};

const fulfillImgurRequest = async (route) => {
  const url = route.request().url();
  let image = imgurImageCache.get(url);

  if (!image) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        await route.continue();
        return;
      }

      image = {
        body: Buffer.from(await response.arrayBuffer()),
        contentType: response.headers.get('content-type') || 'image/jpeg',
      };
      imgurImageCache.set(url, image);
    } catch {
      await route.continue();
      return;
    }
  }

  await route.fulfill({
    status: 200,
    headers: { 'content-type': image.contentType },
    body: image.body,
  });
};

const stopPreview = async (preview) => {
  if (preview.exitCode !== null) return;

  const exited = new Promise((resolve) => preview.once('exit', resolve));
  preview.kill('SIGTERM');
  await Promise.race([exited, delay(5_000)]);

  if (preview.exitCode === null) preview.kill('SIGKILL');
};

const assertPngDimensions = (image, filename) => {
  const width = image.readUInt32BE(16);
  const height = image.readUInt32BE(20);

  if (width !== viewport.width || height !== viewport.height) {
    throw new Error(`${filename} was generated at ${width}x${height}, expected ${viewport.width}x${viewport.height}.`);
  }
};

const capture = async (page, filename) => {
  const image = await page.screenshot({
    path: path.join(outputDirectory, filename),
    type: 'png',
    fullPage: false,
    scale: 'css',
    animations: 'disabled',
  });

  assertPngDimensions(image, filename);
};

const loadPage = async (page) => {
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await page.locator('main').waitFor({ state: 'visible' });
  await page.evaluate(() => document.fonts.ready);
  await delay(1_500);
};

let previewError;
const preview = configuredBaseUrl
  ? undefined
  : spawn(
      process.execPath,
      [viteCli, 'preview', '--host', host, '--port', String(port), '--strictPort'],
      { stdio: 'inherit' },
    );

if (preview) {
  preview.once('error', (error) => {
    previewError = error;
  });
}

try {
  await waitForServer(preview);

  await mkdir(outputDirectory, { recursive: true });
  const demoData = await loadDemoData();

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport,
    screen: viewport,
    deviceScaleFactor: 1,
    locale: 'en-US',
    timezoneId: 'America/Sao_Paulo',
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  });
  await context.route('https://i.imgur.com/**', fulfillImgurRequest);
  await context.addInitScript((storageItems) => {
    storageItems.forEach(({ key, value }) => localStorage.setItem(key, value));
  }, demoData);
  const page = await context.newPage();

  try {
    await loadPage(page);
    await capture(page, 'home.png');

    await page.getByRole('button', { name: 'Edit page' }).click();
    await capture(page, 'editing.png');

    await loadPage(page);
    await page.getByRole('button', { name: 'Open configuration' }).click();
    await page.getByRole('dialog').waitFor({ state: 'visible' });
    await page.waitForFunction(
      () => {
        const drawer = document.querySelector('.liquid-drawer');
        if (!drawer) return false;
        const { left, right } = drawer.getBoundingClientRect();
        return left < window.innerWidth && right <= window.innerWidth;
      },
      undefined,
      { timeout: 5_000 },
    );
    await capture(page, 'configuration.png');
  } finally {
    await context.close();
    await browser.close();
  }
} finally {
  if (preview) await stopPreview(preview);
}
