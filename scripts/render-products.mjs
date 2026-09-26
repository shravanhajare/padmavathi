#!/usr/bin/env node
/**
 * Renders every catalogue item with the procedural 3D models and saves the
 * result to public/images/products/<id>.webp (transparent background).
 *
 *   1. npm run dev              (in another terminal)
 *   2. npm run render:products  [optional product ids...]
 *
 * Uses your installed Google Chrome through playwright-core. To use a
 * different browser set CHROME_PATH=/path/to/chrome, or STUDIO_URL if the
 * dev server is not on http://localhost:3000.
 */
import { chromium } from 'playwright-core';
import fs from 'node:fs/promises';
import path from 'node:path';

const base = process.env.STUDIO_URL ?? 'http://localhost:3000';
const outDir = path.resolve('public/images/products');
const only = process.argv.slice(2);

const launch = process.env.CHROME_PATH
  ? { executablePath: process.env.CHROME_PATH }
  : { channel: process.env.CHROME_CHANNEL ?? 'chrome' };

const browser = await chromium.launch({
  ...launch,
  headless: true,
  args: ['--enable-gpu', '--ignore-gpu-blocklist', '--enable-webgl'],
});

try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
  page.on('pageerror', (e) => console.error('[page error]', e.message));
  await page.goto(`${base}/studio?capture=1`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__peStudio?.ready, null, { timeout: 120_000 });
  const ids = only.length ? only : await page.evaluate(() => window.__peStudio.ids);
  await fs.mkdir(outDir, { recursive: true });
  for (const id of ids) {
    const dataUrl = await page.evaluate((i) => window.__peStudio.render(i), id);
    const b64 = dataUrl.split(',')[1];
    const file = path.join(outDir, `${id}.webp`);
    await fs.writeFile(file, Buffer.from(b64, 'base64'));
    console.log(`✓ ${id}  →  ${path.relative(process.cwd(), file)}`);
  }
  console.log(`\nRendered ${ids.length} product image(s).`);
} finally {
  await browser.close();
}
