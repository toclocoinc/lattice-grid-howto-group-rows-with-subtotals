# How to group rows with subtotals in a data grid

Groups twenty orders by region: declare `group: { enabled: true, index: 0 }` on
the region column and `total: 'sum'` on the amount column, and every region
collapses to its own band showing its order count and its own subtotal, no
group footer or separate calculation required. Click a band to collapse or
expand it; that behaviour is the grid's own.

Live demo: https://toclocoinc.github.io/lattice-grid-howto-group-rows-with-subtotals/

**Read the how-to:** https://www.latticegrid.dev/docs/how-to/group-rows-with-subtotals/

## The full source

Two files: `index.html` loads the grid and declares the mount point, `demo.js` configures and creates it. Copy both as they are below and it runs.

### index.html

```html
<!doctype html>
<html lang="en-GB">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>How to group rows with subtotals in a data grid</title>
    <meta
      name="description"
      content="Group twenty orders by region in the same JavaScript data grid: each region collapses to a band showing its own order count and total, and the grand total sits at the foot. Built with Lattice Grid loaded by script tag, no install and no build."
    />
    <link rel="icon" href="data:," />
    <!--
      The grid's stylesheet, from jsDelivr. The address names the exact
      release, 1.68.2, and carries the hash of the file it expects, so the
      page can never quietly pick up a different build than the one it was
      checked against.
    -->
    <link
      rel="stylesheet"
      href="https://cdn.jsdelivr.net/npm/@toclocoinc/lattice-grid@1.68.2/lattice-grid.min.css"
      integrity="sha384-mcpd7S8C5nz58bZDAXdYH6rzezEhfN7B4u2SlW426dSe20GnkxTu4TygyOILnCth"
      crossorigin="anonymous"
    />
    <style>
      body { margin: 0; font-family: system-ui, sans-serif; background: #f4f6f9; color: #131a24; }
      header { padding: 1.5rem 1.5rem 0.5rem; max-width: 960px; margin: 0 auto; }
      header p { color: #4a5568; }
      header a { color: #2d6bff; }
      main { max-width: 960px; margin: 0 auto; padding: 0 1.5rem 2.5rem; }
      #grid { height: 460px; }
      #stat { font-size: 0.9rem; color: #4a5568; margin: 0 0 0.75rem; }
    </style>
  </head>
  <body>
    <header>
      <h1>How to group rows with subtotals in a data grid</h1>
      <p>
        Twenty orders below are grouped by region. Each region's band shows its own order
        count and its own total, and the grand total sits at the foot. Click a region to
        collapse or expand it. Read the
        <a href="https://www.latticegrid.dev/docs/how-to/group-rows-with-subtotals/">full how-to</a>
        on latticegrid.dev.
      </p>
    </header>
    <main>
      <p id="stat"></p>
      <div id="grid"></div>
    </main>

    <!--
      The library, as a classic script tag. No npm install, no bundler, no
      type="module": the file runs as it arrives and leaves the LatticeGrid
      global behind.
    -->
    <script
      src="https://cdn.jsdelivr.net/npm/@toclocoinc/lattice-grid@1.68.2/lattice-grid.min.js"
      integrity="sha384-vCzLyFYn0T0lz/vkdH4x0JpJZkOazZgI2LiGui7lm5uerdZd0Z46G9hr3Aq1FFPS"
      crossorigin="anonymous"
    ></script>
    <script src="./demo.js"></script>
  </body>
</html>
```

### demo.js

```js
/**
 * Group rows by one column and see a subtotal per group.
 *
 * `group: { enabled: true, index: 0 }` on the region column groups the grid
 * by region as soon as it mounts. Every region collapses to a band showing
 * how many orders it holds and, because amount declares `total: 'sum'`, the
 * sum for that region too. Click a band to collapse or expand it; that
 * behaviour is the grid's own, nothing here wires it.
 */

// Tied to toclocoinc.github.io only; has no effect anywhere else and needs
// no key at all to run this page from a local copy.
LatticeGrid.setLicence(
  'LG1.eyJ2IjoxLCJwIjoibGF0dGljZS1ncmlkIiwidCI6IlRPQ0xPQ08gSW5jIC0gcHVibGljIGRlbW9zIiwiZSI6IjIwMzAtMDEtMDEiLCJkIjpbInRvY2xvY29pbmMuZ2l0aHViLmlvIl19.9De42ua3aCGpiMB6EVRP7Tv-upUlDI-0T07rlSPzvCrsqg8t4YJi7SRnStEpAg48uzmcG7il1fR_TfwkUE7iCA'
);

const ORDERS = [
  { id: 'REC-101', region: 'North', rep: 'Priya Shah', amount: 120 },
  { id: 'REC-102', region: 'North', rep: 'Priya Shah', amount: 340 },
  { id: 'REC-103', region: 'North', rep: 'Callum Reid', amount: 90 },
  { id: 'REC-104', region: 'North', rep: 'Callum Reid', amount: 560 },
  { id: 'REC-105', region: 'North', rep: 'Priya Shah', amount: 200 },
  { id: 'REC-106', region: 'South', rep: 'Aisha Bello', amount: 275 },
  { id: 'REC-107', region: 'South', rep: 'Aisha Bello', amount: 150 },
  { id: 'REC-108', region: 'South', rep: 'Tom Fenwick', amount: 430 },
  { id: 'REC-109', region: 'South', rep: 'Tom Fenwick', amount: 60 },
  { id: 'REC-110', region: 'South', rep: 'Aisha Bello', amount: 320 },
  { id: 'REC-111', region: 'East', rep: 'Diego Marín', amount: 500 },
  { id: 'REC-112', region: 'East', rep: 'Diego Marín', amount: 175 },
  { id: 'REC-113', region: 'East', rep: 'Wren Ashby', amount: 90 },
  { id: 'REC-114', region: 'East', rep: 'Wren Ashby', amount: 240 },
  { id: 'REC-115', region: 'East', rep: 'Diego Marín', amount: 110 },
  { id: 'REC-116', region: 'West', rep: 'Noor Haddad', amount: 60 },
  { id: 'REC-117', region: 'West', rep: 'Noor Haddad', amount: 400 },
  { id: 'REC-118', region: 'West', rep: 'Lina Osei', amount: 220 },
  { id: 'REC-119', region: 'West', rep: 'Lina Osei', amount: 175 },
  { id: 'REC-120', region: 'West', rep: 'Noor Haddad', amount: 300 },
];

const grid = LatticeGrid.createGrid(document.getElementById('grid'), {
  rowKey: 'id',
  columns: [
    { field: 'id', title: 'Order', layout: { width: 110 } },
    { field: 'region', title: 'Region', group: { enabled: true, index: 0 } },
    { field: 'rep', title: 'Sales rep', layout: { flex: 1, min: 150 } },
    {
      field: 'amount', title: 'Amount', type: 'number', total: 'sum',
      format: { style: 'currency', currency: 'USD', decimals: 0 }, layout: { width: 130 },
    },
  ],
  rows: ORDERS,
});
window.__demoGrid = grid; // read by tools/verify.mjs

const regions = new Set(ORDERS.map((o) => o.region));
document.getElementById('stat').textContent =
  `${ORDERS.length} orders across ${regions.size} regions, grouped by region`;
```

Grouping is declared on the column, not called separately, so the grid opens
already grouped. Each region's band is the grid's own group row: an expander,
the region name, a count of how many orders sit under it, and, because
`amount` names a `total`, that region's own sum. The same reduction also
drives the grand total if one is turned on, so a group's subtotal and the
figure behind the whole grid never disagree.

## Running it yourself

Open `index.html` in a browser, or serve the folder with any static file
server. The grid loads from jsDelivr by script tag, so there is no install
and no build step. It runs keyless on `localhost`; the licence key in
`demo.js` is bound to `toclocoinc.github.io` and has no effect anywhere else.

## Licence

MIT, see [LICENSE](./LICENSE). Lattice Grid itself is licensed separately
per domain: https://www.latticegrid.dev/pricing/
