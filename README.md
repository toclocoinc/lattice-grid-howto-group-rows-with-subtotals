# How to group rows with subtotals in a data grid

Groups twenty orders by region: declare `group: { enabled: true, index: 0 }` on
the region column and `total: 'sum'` on the amount column, and every region
collapses to its own band showing its order count and its own subtotal, no
group footer or separate calculation required. Click a band to collapse or
expand it; that behaviour is the grid's own.

Live demo: https://toclocoinc.github.io/lattice-grid-howto-group-rows-with-subtotals/

**Read the how-to:** https://www.latticegrid.dev/docs/how-to/group-rows-with-subtotals/

## The snippet

```js
const grid = LatticeGrid.createGrid(document.getElementById('grid'), {
  rowKey: 'id',
  columns: [
    { field: 'id', title: 'Order' },
    { field: 'region', title: 'Region', group: { enabled: true, index: 0 } },
    { field: 'rep', title: 'Sales rep' },
    { field: 'amount', title: 'Amount', type: 'number', total: 'sum' },
  ],
  rows, // twenty orders across four regions
});
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
