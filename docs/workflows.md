# How to work the ShopLedger counter

Use these steps once the app is running. If you are learning the app, start with the [practice checkout](getting-started.md) in a separate copy.

## Place a sale

1. Open **New Order (POS)** and find products by name, SKU, or HSN. HSN is the goods classification code used for GST lookup.
2. Add the quantity for each item. Check the stock badge for sellable units. Where a product shows physical and reserved quantities, reservations already reduce the sellable count.
3. Choose a registered customer, enter a walk-in name, or leave the name blank. Choose **Cash Counter**, **UPI / QR Scan**, or **Khata (Customer Credit)**. Khata requires a registered account with enough available credit. Record cash or UPI after receiving the payment.
4. Select **Completed (Immediate)** or **Pending Dispatch**. Both statuses commit stock and charge the khata account if selected.
5. Enter a coupon if needed and check **Net Payable Total**. Click **Place Order & Commit Stock**. A successful save shows an order ID, the ledger total, and a link to the invoice.

| Coupon | Discount | Minimum subtotal |
| --- | --- | --- |
| `SAVE10` | 10%, up to ₹150 | ₹500 |
| `FLAT50` | ₹50 | ₹300 |
| `WELCOME` | 5%, up to ₹100 | ₹0 |
| `WHOLESALE15` | 15%, up to ₹400 | ₹2,000 |

For a stock rejection, compare all quantities in the cart with the current sellable stock. The preview can calculate a price for a quantity checkout will reject. For a coupon rejection, review the feedback under the promo input and check the subtotal before GST.

## Find, print, or cancel an order

1. Open **Order History**. Search by order ID, customer name, or coupon. Select a **Status** or enter **From Date** and **To Date**, then click **Apply Filter**. Both selected dates are included. Click **Reset** to clear the filters.
2. Click **Invoice** beside an order, then **Print Invoice** to open the browser print dialog. If an accountant reconciliation notice appears, compare the recorded totals with the figures in **Inventory & GST Audit**. A blank GST amount on a line means the app could not reproduce the original line breakdown from the stored order.
3. To cancel a sale, click **Cancel** on the correct order. Verify that its status changes to **Cancelled** and the affected products regain the sold quantities. For a khata order, verify that the charge is reversed. Cancellation updates records in ShopLedger. Handle external payments separately through the original payment channel.

## Record a khata payment

1. Open **Customer Khata (Credit)**. Click **Settle** on the customer row or choose the account in **Record Khata Settlement**.
2. Enter **Amount Received** and select **Payment Channel**. Add a **Reference / Note** if available.
3. Click **Record Payment Settlement**. Confirm the new receipt appears and the balance decreases by the recorded payment. A ₹500 payment on a ₹1,232.01 balance leaves ₹732.01.

If the payment is rejected, confirm the account and enter a positive amount in rupees. If the starting balance already looks wrong, compare the account and receipts before recording another payment. New settlements use the stored starting totals.

For request formats and status codes, see the [API reference](api-reference.md). For how stock and credit changes are recorded, see [architecture](architecture.md).
