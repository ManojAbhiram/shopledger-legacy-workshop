const assert = require('node:assert/strict');
const test = require('node:test');

const dates = require('../lib/dates');
const ledger = require('../lib/ledger');
const orders = require('../lib/orders');

const orderHistory = [
  { id: 1001, date: '28/12/2021' },
  { id: 1009, date: '15/03/2022' },
  { id: 1004, date: '30/01/2022' },
  { id: 1008, date: '15/03/2022' }
];

test('order history sorts by calendar date and then by newest order ID', () => {
  const result = orders.list({ orders: orderHistory });

  assert.deepEqual(result.map(order => order.id), [1009, 1008, 1004, 1001]);
  assert.deepEqual(orderHistory.map(order => order.id), [1001, 1009, 1004, 1008]);
});

test('order date filters include both endpoints and accept ISO and day-first dates', () => {
  const db = { orders: orderHistory };

  assert.deepEqual(
    orders.list(db, { from: '2021-12-28', to: '30/01/2022' }).map(order => order.id),
    [1004, 1001]
  );
  assert.deepEqual(orders.list(db, { from: '2022-03-15' }).map(order => order.id), [1009, 1008]);
  assert.deepEqual(orders.list(db, { to: '2022-01-30' }).map(order => order.id), [1004, 1001]);
});

test('fiscal year still starts in April for both date formats', () => {
  assert.equal(dates.getFiscalYear('31/03/2022'), 'FY21-22');
  assert.equal(dates.getFiscalYear('2022-04-01'), 'FY22-23');
});

function khataDb(totalSettled = 1200) {
  return {
    customers: [{ id: 1, name: 'Meera Joshi', openingBalance: 2000, totalBilled: 432.01, totalSettled }],
    settlements: [],
    nextSettlementId: 501
  };
}

test('a browser settlement string reduces the Khata balance numerically', () => {
  const db = khataDb();
  assert.equal(ledger.listCustomers(db)[0].balance, 1232.01);

  const result = ledger.recordSettlement(db, '1', '500', 'upi');

  assert.equal(result.ok, true);
  assert.equal(result.customer.totalSettled, 1700);
  assert.equal(result.customer.balance, 732.01);
  assert.equal(ledger.listCustomers(db)[0].balance, 732.01);
  assert.equal(db.settlements[0].amount, 500);
});

test('decimal payments use the same amount in history and in the running total', () => {
  const db = khataDb('1200.10');

  const result = ledger.recordSettlement(db, 1, 0.205);

  assert.equal(result.ok, true);
  assert.equal(result.settlement.amount, 0.21);
  assert.equal(result.customer.totalSettled, 1200.31);
  assert.equal(result.customer.balance, 1231.70);
});

test('invalid settlement amounts leave the customer and settlement history unchanged', () => {
  const db = khataDb();

  for (const amount of ['', 'abc', 'Infinity', -1, NaN, true, [500], '0.001']) {
    assert.equal(ledger.recordSettlement(db, 1, amount).ok, false, String(amount));
    assert.deepEqual(db, khataDb());
  }
});
