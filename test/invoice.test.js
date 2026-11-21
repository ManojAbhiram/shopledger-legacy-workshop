const assert = require('node:assert/strict');
const test = require('node:test');

const invoice = require('../lib/invoice');
const orders = require('../lib/orders');
const pricing = require('../lib/pricing');
const reports = require('../lib/reports');

function billOrder(items, coupon = '') {
  const db = { nextOrderId: 1001, orders: [] };
  const totals = pricing.computeTotals(items, coupon);
  return orders.add(db, { ...totals, items, coupon, date: '21/11/2026' });
}

function mixedSlabOrder() {
  return billOrder([
    { id: 1, name: 'Rice', sku: 'RICE', hsn: '1006', price: 500, qty: 2 },
    { id: 2, name: 'Ghee', sku: 'GHEE', hsn: '0405', price: 1000, qty: 1 }
  ], 'SAVE10');
}

test('checkout applies the capped coupon before GST and splits an odd paisa', () => {
  const order = mixedSlabOrder();
  assert.deepEqual(
    [order.subtotal, order.discount, order.tax, order.total],
    [2000, 150, 157.25, 2007.25]
  );

  const totals = pricing.computeTotals(order.items, order.coupon);
  assert.deepEqual([totals.cgst, totals.sgst], [78.63, 78.62]);
  assert.deepEqual(
    totals.lines.map(({ gstPercent, discount, taxable, tax }) => ({
      gstPercent, discount, taxable, tax
    })),
    [
      { gstPercent: 5, discount: 75, taxable: 925, tax: 46.25 },
      { gstPercent: 12, discount: 75, taxable: 925, tax: 111 }
    ]
  );
});

test('the printed invoice matches the billed total and GST for a discounted mixed-slab order', () => {
  const order = mixedSlabOrder();
  const figures = invoice.computeInvoiceFigures(order);

  assert.deepEqual(
    [figures.total, figures.tax, figures.discount, figures.cgst, figures.sgst],
    [2007.25, 157.25, 150, 78.63, 78.62]
  );
  assert.deepEqual(figures.rows.map(row => [row.gstPercent, row.lineTax]), [[5, 46.25], [12, 111]]);

  const html = invoice.render(order);
  assert.match(html, /Invoice Total<\/td><td class="r">\u20B92007\.25/);
  assert.match(html, /<td>CGST<\/td><td class="r">\u20B978\.63/);
  assert.match(html, /<td>SGST<\/td><td class="r">\u20B978\.62/);
  assert.match(html, /CGST \+ SGST \(Total GST\)<\/td><td class="r">\u20B9157\.25/);
  assert.match(html, /<td class="r">5%<\/td><td class="r">\u20B946\.25<\/td>/);
  assert.match(html, /<td class="r">12%<\/td><td class="r">\u20B9111\.00<\/td>/);
  assert.doesNotMatch(html, /Accountant Reconciliation Notice/);

  const report = reports.getGstReconciliation({ orders: [order] });
  assert.deepEqual([report.mismatchCount, report.totalDelta, report.rows[0].matched], [0, 0, true]);
});

test('the printed invoice uses recorded figures when older line GST cannot be reconstructed', () => {
  const order = { ...mixedSlabOrder(), discount: 100, tax: 180, total: 2080 };
  const html = invoice.render(order);

  assert.match(html, /Invoice Total<\/td><td class="r">\u20B92080\.00/);
  assert.match(html, /CGST \+ SGST \(Total GST\)<\/td><td class="r">\u20B9180\.00/);
  assert.match(html, /Coupon Discount \(SAVE10\)<\/td><td[^>]*>-\u20B9100\.00/);
  assert.match(html, /The original line-level GST could not be reconstructed/);
  assert.doesNotMatch(html, /<td class="r">\d+%<\/td>/);

  const report = reports.getGstReconciliation({ orders: [order] });
  assert.deepEqual([report.mismatchCount, report.rows[0].ledgerTax, report.rows[0].invoiceTax], [1, 180, 157.25]);
});

test('a stored order with a whole-percent GST rate and no coupon can match its invoice', () => {
  const order = billOrder([{ name: 'Ghee', price: 100, qty: 1, gstRate: 12 }]);
  const figures = invoice.computeInvoiceFigures(order);

  assert.deepEqual([order.tax, order.total], [12, 112]);
  assert.deepEqual([figures.tax, figures.cgst, figures.sgst, figures.total], [12, 6, 6, 112]);
  assert.doesNotMatch(invoice.render(order), /Accountant Reconciliation Notice/);
});

test('the invoice handles zero and decimal GST rates like checkout', () => {
  const order = billOrder([
    { name: 'Zero-rated item', price: 100, qty: 1, gstRate: 0 },
    { name: 'Item with a decimal rate', price: 100, qty: 1, gstRate: 0.05 }
  ]);
  const figures = invoice.computeInvoiceFigures(order);

  assert.deepEqual([order.tax, order.total], [5, 205]);
  assert.deepEqual(figures.rows.map(row => [row.gstPercent, row.lineTax]), [[0, 0], [5, 5]]);
  assert.deepEqual([figures.tax, figures.cgst, figures.sgst, figures.total], [5, 2.5, 2.5, 205]);
});

test('the invoice uses the same per-line GST rounding as checkout', () => {
  const order = billOrder([
    { name: 'Small line A', price: 0.03, qty: 1, gstRate: 18 },
    { name: 'Small line B', price: 0.03, qty: 1, gstRate: 18 }
  ]);
  const figures = invoice.computeInvoiceFigures(order);

  assert.deepEqual([order.tax, order.total], [0.02, 0.08]);
  assert.deepEqual(figures.rows.map(row => row.lineTax), [0.01, 0.01]);
  assert.deepEqual([figures.tax, figures.cgst, figures.sgst, figures.total], [0.02, 0.01, 0.01, 0.08]);
});

test('recalculation excludes expired coupons and coupons below the minimum subtotal', () => {
  const items = [{ name: 'Tea', price: 100, qty: 1, gstRate: 18 }];
  const belowMinimumOrder = { items, coupon: 'FLAT50' };
  const expiredCouponOrder = { items, coupon: 'DIWALI20' };

  assert.equal(pricing.computeTotals(items, 'FLAT50').discount, 0);
  assert.equal(pricing.computeTotals(items, 'DIWALI20').discount, 0);
  assert.equal(invoice.computeInvoiceFigures(belowMinimumOrder).total, 118);
  assert.equal(invoice.computeInvoiceFigures(expiredCouponOrder).total, 118);
});

test('the report and invoice notice both flag a tax-only mismatch', () => {
  const taxOnlyMismatch = {
    ...billOrder([{ name: 'Tea', price: 100, qty: 1, gstRate: 18 }]),
    discount: 2,
    tax: 20
  };
  const report = reports.getGstReconciliation({ orders: [taxOnlyMismatch] });

  assert.deepEqual([report.totalChecked, report.mismatchCount, report.totalDelta], [1, 1, 0]);
  const [row] = report.rows;
  assert.deepEqual([row.ledgerTax, row.invoiceTax, row.delta, row.matched], [20, 18, 0, false]);
  const html = invoice.render(taxOnlyMismatch);
  assert.match(html, /Accountant Reconciliation Notice/);
  assert.match(html, /CGST \+ SGST \(Total GST\)<\/td><td class="r">\u20B920\.00/);
});
