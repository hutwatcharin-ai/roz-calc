// Usage: node scripts/style-diff.mjs /path /path ...  (live site vs next start on :3177)
// Compares computed styles element by element between the live site and the
// local build, to prove moving CSS rules changed no styling.
import { chromium } from 'playwright';

const PAGES = process.argv.slice(2);
const PROPS = ['display', 'position', 'margin', 'padding', 'font-size', 'font-weight', 'font-family', 'color', 'background-color', 'background-image', 'border', 'border-radius', 'box-shadow', 'width', 'grid-template-columns', 'gap', 'text-shadow', 'opacity', 'text-align'];

const browser = await chromium.launch();
async function snap(base, path, width) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  await page.goto(base + path, { waitUntil: 'networkidle', timeout: 120000 });
  const out = await page.evaluate((props) => {
    const rows = [];
    for (const el of document.querySelectorAll('main *')) {
      if (el.closest('ins, iframe, .adslot, [data-ad]')) continue;
      const cs = getComputedStyle(el);
      rows.push(el.tagName + '.' + (el.getAttribute('class') || '') + ' ' + props.map((p) => cs.getPropertyValue(p)).join('|'));
    }
    return rows;
  }, PROPS);
  await page.close();
  return out;
}
for (const path of PAGES) {
  for (const width of [1280, 390]) {
    const [a, b] = await Promise.all([snap('https://rozerothai.com', path, width), snap('http://localhost:3177', path, width)]);
    let diffs = 0;
    const shown = [];
    const n = Math.min(a.length, b.length);
    for (let i = 0; i < n; i++) {
      if (a[i] !== b[i]) {
        diffs++;
        if (shown.length < 4) shown.push(`  live : ${a[i].slice(0, 300)}\n  local: ${b[i].slice(0, 300)}`);
      }
    }
    console.log(`${path} @${width}: elements ${a.length}/${b.length}, differing ${diffs}`);
    for (const s of shown) console.log(s);
  }
}
await browser.close();
