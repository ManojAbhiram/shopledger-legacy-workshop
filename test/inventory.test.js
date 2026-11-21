const assert = require('node:assert/strict');
const test = require('node:test');

const inventory = require('../lib/inventory');
const orders = require('../lib/orders');

test('a sale can use the last sellable unit with or without a wholesale reservation', () => {
  const products = [
    { id: 1, name: 'Ghee', stock: 1, reserved: 0 },
    { id: 2, name: 'Chilli powder', stock: 4, reserved: 3 }
  ];
  const items = [{ id: 1, qty: 1 }, { id: 2, qty: 1 }];

  assert.deepEqual(inventory.check(products, items), { ok: true });
  inventory.reserve(products, items);
  assert.deepEqual(products.map(product => product.stock), [0, 3]);
  assert.deepEqual(products.map(product => product.reserved), [0, 3]);
  assert.equal(inventory.check(products, [{ id: 2, qty: 1 }]).ok, false);
});

test('stock checks sum repeated lines for the same product', () => {
  const products = [{ id: 2, name: 'Chilli powder', stock: 7, reserved: 3 }];
  const items = [{ id: 2, qty: 2 }, { id: '2', qty: 2 }];

  assert.deepEqual(inventory.check(products, items), { ok: true });
  assert.deepEqual(inventory.check(products, [...items, { id: 2, qty: 1 }]), {
    ok: false,
    msg: 'Chilli powder is out of stock (4 sellable available)'
  });
  assert.equal(products[0].stock, 7);
});

test('cancelling a pending order restores deducted stock exactly once and preserves reservations', () => {
  const products = [
    { id: 1, name: 'Ghee', stock: 5, reserved: 0 },
    { id: 2, name: 'Chilli powder', stock: 7, reserved: 3 }
  ];
  const items = [{ id: 1, qty: 2 }, { id: 2, qty: 1 }];
  const db = { products, orders: [], nextOrderId: 1007 };
  inventory.reserve(products, items);
  const order = orders.add(db, { items, status: 'pending' });
  assert.deepEqual(products.map(product => product.stock), [3, 6]);

  assert.equal(orders.cancel(db, order.id).ok, true);
  assert.equal(order.status, 'cancelled');
  assert.equal(orders.cancel(db, order.id).ok, false);
  assert.deepEqual(products.map(product => product.stock), [5, 7]);
  assert.deepEqual(products.map(product => product.reserved), [0, 3]);
});

test('releasing a wholesale quote only releases reserved units', () => {
  const products = [{ id: 2, stock: 7, reserved: 3 }];

  inventory.release(products, [{ productId: 2, qty: 1 }]);

  assert.deepEqual(products, [{ id: 2, stock: 7, reserved: 2 }]);
});
