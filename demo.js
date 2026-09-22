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
