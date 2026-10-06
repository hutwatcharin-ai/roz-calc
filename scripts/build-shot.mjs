// Screenshots of /tools/build with a sample build loaded, desktop and phone.
// Local preview check only: node scripts/build-shot.mjs <base-url> <out-dir>
import { chromium } from 'playwright';

const base = process.argv[2] ?? 'http://localhost:3177';
const outDir = process.argv[3] ?? '.';
const build = {
  cls: 'assassin', lv: 60, job: 40,
  st: { str: 50, agi: 70, vit: 20, int: 1, dex: 40, luk: 20 },
  g: { weapon: { id: 1201, r: 7, c: [4029, 4006, 0] }, garment: { id: 480414, r: 4, c: [4183] }, armor: { id: 2301, r: 5, c: [] } },
  f: [12065],
};

const browser = await chromium.launch();
for (const [name, viewport] of [['desktop', { width: 1280, height: 900 }], ['mobile', { width: 390, height: 844 }]]) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: name === 'mobile' ? 2 : 1 });
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(`${base}/tools/build`, { waitUntil: 'networkidle' });
  await page.evaluate((b) => localStorage.setItem('roz-calc:build', JSON.stringify(b)), build);
  await page.goto(`${base}/tools/build?monster=1002`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  const m = await page.evaluate(() => ({
    scrollW: document.documentElement.scrollWidth,
    vw: window.innerWidth,
    wide: [...document.querySelectorAll('.buildsim *')].filter((e) => e.getBoundingClientRect().right > window.innerWidth + 1).slice(0, 8).map((e) => `${e.tagName}.${e.className}`),
    broken: [...document.images].filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.src),
  }));
  console.log(name, JSON.stringify(m), errors.length ? `errors: ${errors.join(' | ')}` : '');
  const el = await page.$('main');
  await el.screenshot({ path: `${outDir}/build-${name}.png` });
  if (name === 'mobile') {
    await page.click('.buildsim__slot:nth-child(3) .buildsim__pick');
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${outDir}/build-${name}-picker.png` });
  }
  await page.close();
}
await browser.close();
