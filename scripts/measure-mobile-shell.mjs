// Measures how much of a phone screen the site spends before the page starts.
//
// The UX audit's numbers were taken this way and the one item left on it --
// a bottom nav -- is justified by a measurement ("h1 at 260-266px, 29% of the
// first screen"), so the change has to be checked the same way rather than by
// eye. Prints, per page: where the H1 sits, how tall the top bar is, and
// whether anything overflows sideways.
//
// Run against a build already being served:
//   npx next start -p 3177
//   node scripts/measure-mobile-shell.mjs [http://localhost:3177]

import { chromium } from 'playwright';

const base = process.argv[2] ?? 'http://localhost:3177';
const PAGES = ['/', '/database/monsters', '/database/monsters/1002', '/tools/leveling-spots', '/guides'];
// iPhone 12/13/14 logical width, the commonest phone width in the GA4 report.
const VIEWPORT = { width: 390, height: 844 };

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: VIEWPORT, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  console.log(`${VIEWPORT.width}x${VIEWPORT.height}`);
  console.log('page                          h1 top   topbar   bottom nav   sideways overflow');

  for (const path of PAGES) {
    await page.goto(base + path, { waitUntil: 'networkidle' });
    const measured = await page.evaluate(() => {
      const top = (selector) => {
        const el = document.querySelector(selector);
        return el ? Math.round(el.getBoundingClientRect().top + window.scrollY) : null;
      };
      const height = (selector) => {
        const el = document.querySelector(selector);
        return el ? Math.round(el.getBoundingClientRect().height) : null;
      };
      return {
        h1: top('h1'),
        topbar: height('.topbar'),
        bottomnav: height('.bottomnav'),
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      };
    });
    console.log(
      `${path.padEnd(30)}${String(measured.h1 ?? '—').padStart(6)}${String(measured.topbar ?? '—').padStart(9)}` +
        `${String(measured.bottomnav ?? '—').padStart(13)}${String(measured.overflow).padStart(20)}`,
    );
  }

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
