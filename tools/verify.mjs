/**
 * Load the demo in a real headless browser and check that it works.
 *
 * Serves the project locally and drives it with the same minimal Chrome
 * driver the grid's own test suite uses (tools/browser.js), so this needs no
 * dependency beyond Chrome itself.
 *
 * Checks:
 *   - the library arrived and left the LatticeGrid global behind;
 *   - all 20 orders land in the grid, in 4 region groups;
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

const currency = (n) => `$${n.toLocaleString('en-US')}`;

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
  const rowCount = await browser.evaluate(`window.__demoGrid.rows.count()`);

  const failures = [];
  if (!hasGrid) failures.push('LatticeGrid.createGrid was not found on the page');
  if (rowCount !== 20) failures.push(`expected 20 orders, grid reports ${rowCount}`);

  for (const [region, { count, sum }] of Object.entries(EXPECTED)) {
    const rowSel = `document.querySelector('.lat-row[data-key="${region}"]')`;
    const expanded = await browser.evaluate(`${rowSel}?.getAttribute('aria-expanded')`);
    const label = await browser.evaluate(`${rowSel}?.querySelector('.lat-group-label')?.textContent`);
    const shownCount = await browser.evaluate(`${rowSel}?.querySelector('.lat-group-count')?.textContent`);
    const shownAmount = await browser.evaluate(`${rowSel}?.querySelector('[data-col="amount"]')?.textContent`);

    if (label !== region) failures.push(`${region}: group label was "${label}", expected "${region}"`);
    if (shownCount !== `(${count})`) failures.push(`${region}: group count was "${shownCount}", expected "(${count})"`);
    if (!shownAmount || !shownAmount.includes(currency(sum))) {
      failures.push(`${region}: group subtotal was "${shownAmount}", expected to include "${currency(sum)}"`);
    }
    if (expanded !== 'true') failures.push(`${region}: expected the band open (aria-expanded="true") on load, was "${expanded}"`);
  }

  // Collapse North and check its 5 member rows disappear from the DOM, then
  // expand it again and check they come back.
  const memberRows = `document.querySelectorAll('.lat-row [data-col="rep"]').length`;
  const membersBefore = await browser.evaluate(memberRows);

  await browser.evaluate(`document.querySelector('.lat-row[data-key="North"] .lat-expander').click()`);
  await new Promise((r) => setTimeout(r, 300));
  const northExpandedAfterCollapse = await browser.evaluate(`document.querySelector('.lat-row[data-key="North"]')?.getAttribute('aria-expanded')`);
  const membersWhileCollapsed = await browser.evaluate(memberRows);
  if (northExpandedAfterCollapse !== 'false') failures.push(`collapsing North did not set aria-expanded="false" (was "${northExpandedAfterCollapse}")`);
  if (membersWhileCollapsed !== membersBefore - EXPECTED.North.count) {
    failures.push(`collapsing North left ${membersWhileCollapsed} member rows on screen, expected ${membersBefore - EXPECTED.North.count}`);
  }

  await browser.evaluate(`document.querySelector('.lat-row[data-key="North"] .lat-expander').click()`);
  await new Promise((r) => setTimeout(r, 300));
  const northExpandedAfterReopen = await browser.evaluate(`document.querySelector('.lat-row[data-key="North"]')?.getAttribute('aria-expanded')`);
  const membersAfterReopen = await browser.evaluate(memberRows);
  if (northExpandedAfterReopen !== 'true') failures.push(`re-expanding North did not set aria-expanded="true" (was "${northExpandedAfterReopen}")`);
  if (membersAfterReopen !== membersBefore) failures.push(`re-expanding North left ${membersAfterReopen} member rows on screen, expected ${membersBefore}`);

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
