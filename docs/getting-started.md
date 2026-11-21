# Run ShopLedger and place a practice order

You’ll start a local copy, bill one item with a coupon, and verify the printable invoice and inventory change. Allow a few minutes to install dependencies.

## Prerequisites

- A local checkout of ShopLedger and Git.
- Node.js 22 and npm. The app and tests were verified with Node.js 22.
- A browser and an unused local port. The examples use port 3000.

## 1. Start a practice copy

Run these commands from the repository root. The clone gives the practice server its own tracked JSON datastore.

```shell
git clone --no-local . ../shopledger-practice
cd ../shopledger-practice
npm install
npm start
```

Open [localhost:3000](http://localhost:3000). The **New Order (POS)** tab should show the product catalog. If port 3000 is occupied, set `PORT` to an unused port before running `npm start` and use that port in your browser.

## 2. Preview and place a sale

1. Search for `GRN-001` and set the quantity of **Indrayani Basmati Rice 5kg** to **1**.
2. Leave the customer as a walk-in and keep **Cash Counter** and **Completed (Immediate)**. Choose `SAVE10` under **Promo / Coupon Code**.
3. With the bundled catalog and coupon settings, the preview shows ₹640.00 subtotal, ₹64.00 discount, ₹28.80 GST, and **₹604.80** payable.
4. Click **Place Order & Commit Stock**. Note the order ID and check that the ledger total is ₹604.80 and the product's sellable quantity dropped by one.

If the totals differ, compare the price and coupon settings in your practice copy. If the cart is rejected, check the selected stock and coupon feedback before submitting again.

## 3. Verify and cancel the practice order

1. Open **Order History** and search for your new order ID. Click **Invoice**. Verify the total is ₹604.80 and that the ₹28.80 GST splits into ₹14.40 CGST and ₹14.40 SGST.
2. Return to **Order History** and click **Cancel** on the practice order. Verify **Cancelled** status and confirm that the catalog shows the original sellable quantity again.
3. Stop the practice server with **Ctrl+C**. To run the automated checks from the practice directory, run `node --test`.

## What you built

You used the same checkout path as the sales desk and followed one order through billing, invoicing, and stock restoration. See [daily workflows](workflows.md) for khata payments and date filters or the [API reference](api-reference.md) for the requests behind the UI.
