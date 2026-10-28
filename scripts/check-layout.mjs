// Optional browser QA against the generated Pages output; never contacts the live site.
// Set PLAYWRIGHT_MODULE to an installed Playwright module if it is outside this repo.
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const chrome = process.env.CHROME_EXECUTABLE || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const browser = await chromium.launch({
  headless: true,
  ...(!existsSync(chromium.executablePath()) && existsSync(chrome) ? { executablePath: chrome } : {}),
});
const root = resolve(fileURLToPath(new URL('../docs/', import.meta.url)));
const output = mkdtempSync(join(tmpdir(), 'evansworld-layout-'));
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png' };
const server = createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  const relative = pathname.replace(/^\/evansworld\//, '') || 'index.html';
  const target = resolve(root, relative);
  if (!target.startsWith(root + sep)) {
    response.writeHead(403).end();
    return;
  }
  try {
    const bytes = readFileSync(target);
    response.writeHead(200, { 'Content-Type': types[extname(target)] || 'application/octet-stream' });
    response.end(bytes);
  } catch {
    response.writeHead(404).end();
  }
});

try {
  await new Promise((accept, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', accept);
  });
  const origin = `http://127.0.0.1:${server.address().port}`;
  for (const [width, height] of [[1440, 750], [390, 844], [844, 390]]) {
    for (const colorScheme of ['light', 'dark']) {
      const context = await browser.newContext({ viewport: { width, height }, colorScheme });
      const page = await context.newPage();
      const errors = [], missing = [], musicRequests = [], externalHosts = new Set();
      page.on('pageerror', error => errors.push(error.message));
      page.on('response', response => { if (response.status() >= 400) missing.push(response.url()); });
      page.on('request', request => { if (/\/music\/|\.(mp3|ogg|wav)(?:\?|$)/i.test(request.url())) musicRequests.push(request.url()); });
      await context.route('**/*', route => {
        const url = new URL(route.request().url());
        if (url.origin === origin) return route.continue();
        externalHosts.add(url.hostname);
        return route.abort();
      });
      await page.addInitScript(() => {
        window.qaAudioContexts = 0;
        if (window.AudioContext) window.AudioContext = new Proxy(window.AudioContext, {
          construct(target, args) { window.qaAudioContexts++; return Reflect.construct(target, args); },
        });
      });
      await page.goto(`${origin}/evansworld/`, { waitUntil: 'networkidle' });
      await page.locator('.sky-tools').waitFor();

      async function checkLayout(name) {
        assert.equal(await page.locator('audio, .radio, [aria-label*="radio" i]').count(), 0);
        assert.equal(await page.getByRole('link', { name: /radio/i }).count(), 0);
        const boxes = await page.locator('header, .sky-tools, .greeting, .games-panel').evaluateAll(elements =>
          elements.filter(element => element.getClientRects().length).map(element => {
            const { x, y, width, height } = element.getBoundingClientRect();
            return { name: element.className || element.tagName, x, y, width, height };
          }));
        for (const box of boxes) {
          assert.ok(box.x >= -1 && box.y >= -1 && box.x + box.width <= width + 1 && box.y + box.height <= height + 1,
            `${name}: clipped ${box.name}: ${JSON.stringify(box)}`);
        }
        const clippedControls = await page.locator('button, select, .site-tabs a, .wordmark').evaluateAll(elements =>
          elements.filter(element => element.getClientRects().length).filter(element => {
            const box = element.getBoundingClientRect();
            return box.x < -1 || box.y < -1 || box.right > innerWidth + 1 || box.bottom > innerHeight + 1;
          }).map(element => element.textContent.trim()));
        assert.deepEqual(clippedControls, [], `${name}: clipped controls`);
        for (let first = 0; first < boxes.length; first++) {
          for (let second = first + 1; second < boxes.length; second++) {
            const a = boxes[first], b = boxes[second];
            const overlapX = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
            const overlapY = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
            assert.ok(overlapX < 1 || overlapY < 1, `${name}: ${a.name} overlaps ${b.name}`);
          }
        }
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
        await page.screenshot({ path: join(output, `${width}x${height}-${colorScheme}-${name}.png`) });
      }

      await checkLayout('drawing');
      await page.getByRole('combobox', { name: 'Background preset' }).selectOption('earth');
      await page.getByRole('button', { name: 'Change trail colour' }).click();
      await page.getByRole('button', { name: 'Star burst' }).click();
      await page.locator('.galaxy-touch').focus();
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('Space');
      await checkLayout('earth');
      assert.equal(await page.evaluate(() => window.qaAudioContexts), 0, 'Sky interactions must stay silent');
      await page.evaluate(() => { window.qaGalaxy = document.querySelector('.galaxy-sky'); });
      await page.getByRole('link', { name: 'Games', exact: true }).click();
      await checkLayout('games');
      assert.equal(await page.evaluate(() => window.qaGalaxy === document.querySelector('.galaxy-sky')), true);
      assert.equal(await page.getByRole('combobox', { name: 'Background preset' }).inputValue(), 'earth');

      await page.getByRole('button', { name: /Bag Bashers/ }).click();
      const bag = page.frameLocator('iframe[title="Bag Bashers"]');
      await bag.getByRole('button', { name: 'MIKE TYSON', exact: true }).waitFor();
      assert.equal(await bag.getByRole('button', { name: 'CHICKEN BOSS', exact: true }).count(), 1);
      await checkLayout('bag-bashers');
      await page.getByRole('button', { name: '← Games', exact: true }).click();
      await page.getByRole('button', { name: /Snakes & Ladders/ }).click();
      await page.frameLocator('iframe[title="Snakes & Ladders"]').getByRole('button', { name: '1 player', exact: true }).waitFor();
      await checkLayout('snakes-ladders');
      await page.getByRole('button', { name: '← Games', exact: true }).click();
      await page.getByRole('link', { name: 'Home', exact: true }).click();
      await page.getByRole('combobox', { name: 'Background preset' }).selectOption('pixel');
      await page.reload({ waitUntil: 'networkidle' });
      assert.equal(await page.getByRole('combobox', { name: 'Background preset' }).inputValue(), 'pixel');
      assert.deepEqual(await page.evaluate(() => Object.keys(localStorage)), ['evan-universe-sky-preset']);
      assert.deepEqual(musicRequests, []);
      assert.deepEqual(missing, []);
      assert.deepEqual(errors, []);
      console.log(`PASS ${width}x${height} ${colorScheme}: layouts, games, sky persistence and silent homepage`);
      if (externalHosts.size) console.log(`Existing external requests blocked for offline QA: ${[...externalHosts].join(', ')}`);
      await context.close();
    }
  }
  console.log(`Screenshots: ${output}`);
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
