/**
 * Load the demo in a real headless browser and check that it works.
 *
 * Serves the project locally and drives it with the same minimal Chrome
 * driver the grid's own test suite uses (tools/browser.js), so this needs no
 * dependency beyond Chrome itself.
 *
 * Checks:
 *   - the library arrived and left the LatticeGrid global behind;
 *   - all 20 orders land in the grid, in 4 region groups, each open by default;
 *   - each region's group row shows the right order count, e.g. "(5)";
 *   - each region's group row shows the right subtotal for Amount, computed
 *     here from the same inline data demo.js loads;
 *   - collapsing a group's band hides its member rows, and expanding it
 *     again brings them back;
 *   - nothing logged a console error or threw while the page ran.
 *
 * Exits non-zero on any failure, so it can gate a deployment.
 *
 * Usage: node tools/verify.mjs
 */

import { startServer } from './serve.mjs';
import { Browser, available } from './browser.js';

if (!available()) {
  console.log('No headless browser on this machine; skipping verify.mjs.');
  process.exit(0);
}

// The same 20 orders demo.js loads, so the expected count and sum per region
// are computed here rather than hard-coded, and stay honest if the data ever
// changes.
const ORDERS = [
  { region: 'North', amount: 120 }, { region: 'North', amount: 340 },
  { region: 'North', amount: 90 }, { region: 'North', amount: 560 },
  { region: 'North', amount: 200 },
  { region: 'South', amount: 275 }, { region: 'South', amount: 150 },
  { region: 'South', amount: 430 }, { region: 'South', amount: 60 },
  { region: 'South', amount: 320 },
  { region: 'East', amount: 500 }, { region: 'East', amount: 175 },
  { region: 'East', amount: 90 }, { region: 'East', amount: 240 },
  { region: 'East', amount: 110 },
  { region: 'West', amount: 60 }, { region: 'West', amount: 400 },
  { region: 'West', amount: 220 }, { region: 'West', amount: 175 },
  { region: 'West', amount: 300 },
];

const EXPECTED = {};
for (const { region, amount } of ORDERS) {
  EXPECTED[region] ??= { count: 0, sum: 0 };
  EXPECTED[region].count += 1;
  EXPECTED[region].sum += amount;
}

// The grid formats amount with { style: 'currency', currency: 'USD', decimals: 0 }
// under its default 'en-GB' locale, which disambiguates the $ sign as "US$".
const currency = (n) => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

// A group row's own DOM query, by the label text the grid renders rather than
// by data-key (which the grid prefixes internally, e.g. "g\u0000North").
const groupRow = (region) =>
  `[...document.querySelectorAll('.lat-row--group')].find((r) => r.querySelector('.lat-group-label')?.textContent === '${region}')`;

const { server, port } = await startServer();
const browser = new Browser();

try {
  await browser.start();

  await browser.send('Page.addScriptToEvaluateOnNewDocument', {
    source: `
      window.__errs = [];
      addEventListener('error', (e) => window.__errs.push(String(e.message || e)));
      addEventListener('unhandledrejection', (e) => window.__errs.push('unhandledrejection: ' + String(e.reason)));
      const origError = console.error.bind(console);
      console.error = (...args) => { window.__errs.push('console.error: ' + args.map(String).join(' ')); origError(...args); };
    `,
  });

  await browser.open(`http://127.0.0.1:${port}/`);
  await new Promise((r) => setTimeout(r, 500));

  const hasGrid = await browser.evaluate(`typeof LatticeGrid !== 'undefined' && typeof LatticeGrid.createGrid === 'function'`);
  // matchCount() is data rows only, excluding the 4 group headings count() would include.
  const orderCount = await browser.evaluate(`window.__demoGrid.rows.matchCount()`);

  const failures = [];
  if (!hasGrid) failures.push('LatticeGrid.createGrid was not found on the page');
  if (orderCount !== 20) failures.push(`expected 20 orders, grid reports ${orderCount}`);

  for (const [region, { count, sum }] of Object.entries(EXPECTED)) {
    const row = groupRow(region);
    const info = await browser.evaluate(`(() => {
      const r = ${row};
      if (!r) return null;
      return {
        expanded: r.getAttribute('aria-expanded'),
        count: r.querySelector('.lat-group-count')?.textContent,
        amount: r.querySelector('[data-col="amount"]')?.textContent,
      };
    })()`);

    if (!info) { failures.push(`${region}: no group row found`); continue; }
    if (info.count !== `(${count})`) failures.push(`${region}: group count was "${info.count}", expected "(${count})"`);
    if (info.amount !== currency(sum)) failures.push(`${region}: group subtotal was "${info.amount}", expected "${currency(sum)}"`);
    if (info.expanded !== 'true') failures.push(`${region}: expected the band open (aria-expanded="true") on load, was "${info.expanded}"`);
  }

  // Collapse North (5 members) and check the grid's own display count drops
  // by exactly 5, and that one of its member rows leaves the DOM entirely;
  // both survive virtualisation, unlike counting mounted rows, which only
  // ever reflects however many fit the viewport. Then expand it again and
  // check both come back.
  const northMemberInDom = `document.querySelector('.lat-row[data-key="REC-101"]') !== null`;
  const countBefore = await browser.evaluate(`window.__demoGrid.rows.count()`);
  const memberVisibleBefore = await browser.evaluate(northMemberInDom);

  await browser.evaluate(`${groupRow('North')}.querySelector('.lat-expander').click()`);
  await new Promise((r) => setTimeout(r, 300));
  const northCollapsed = await browser.evaluate(`${groupRow('North')}.getAttribute('aria-expanded')`);
  const countWhileCollapsed = await browser.evaluate(`window.__demoGrid.rows.count()`);
  const memberVisibleWhileCollapsed = await browser.evaluate(northMemberInDom);
  if (northCollapsed !== 'false') failures.push(`collapsing North did not set aria-expanded="false" (was "${northCollapsed}")`);
  if (!memberVisibleBefore) failures.push('REC-101 (a North order) was not on screen before collapsing');
  if (memberVisibleWhileCollapsed) failures.push('REC-101 (a North order) is still on screen after collapsing its group');
  if (countWhileCollapsed !== countBefore - EXPECTED.North.count) {
    failures.push(`collapsing North left the grid showing ${countWhileCollapsed} rows, expected ${countBefore - EXPECTED.North.count}`);
  }

  await browser.evaluate(`${groupRow('North')}.querySelector('.lat-expander').click()`);
  await new Promise((r) => setTimeout(r, 300));
  const northReopened = await browser.evaluate(`${groupRow('North')}.getAttribute('aria-expanded')`);
  const countAfterReopen = await browser.evaluate(`window.__demoGrid.rows.count()`);
  const memberVisibleAfterReopen = await browser.evaluate(northMemberInDom);
  if (northReopened !== 'true') failures.push(`re-expanding North did not set aria-expanded="true" (was "${northReopened}")`);
  if (!memberVisibleAfterReopen) failures.push('REC-101 (a North order) did not return after re-expanding its group');
  if (countAfterReopen !== countBefore) failures.push(`re-expanding North left the grid showing ${countAfterReopen} rows, expected ${countBefore}`);

  const errors = await browser.evaluate('window.__errs');
  if (errors.length) failures.push(`console/window errors: ${errors.join(' | ')}`);

  if (failures.length) {
    console.error('FAILED:\n' + failures.map((f) => `  - ${f}`).join('\n'));
    process.exitCode = 1;
  } else {
    console.log(
      `OK: 20 orders grouped into 4 regions, each band's count and subtotal match the inline ` +
      `data (${Object.entries(EXPECTED).map(([r, v]) => `${r} (${v.count}) ${currency(v.sum)}`).join(', ')}), ` +
      `collapsing and re-expanding a band works, 0 console errors.`
    );
  }
} finally {
  await browser.close();
  server.close();
}
