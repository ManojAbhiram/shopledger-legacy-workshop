# ShopLedger API reference

The browser and API run on the same Express server. The examples use `http://localhost:3000`. Send `Content-Type: application/json` with JSON request bodies. Amounts are in Indian rupees. Order and settlement dates are stored and returned as `DD/MM/YYYY`.

## Endpoints

| Method and path | Inputs | Success response |
| --- | --- | --- |
| `GET /api/products` | Optional `category` and `search` strings | `200` with a product array. Category matching is case-insensitive. Search checks name, SKU, and HSN. Omit category or use `all` to see every category. |
| `GET /api/coupons` | None | `200` with active coupon definitions. |
| `POST /api/pricing/preview` | `items` array of `{ id, qty }` and optional `coupon` | `200` with `{ totals, couponStatus }`. Unknown products and nonpositive quantities are skipped. An invalid coupon returns a failed `couponStatus` and totals calculated without the discount. Preview does not enforce stock or write data. |
| `GET /api/orders` | Optional `status`, `search`, `from`, and `to` | `200` with orders sorted by date descending, then ID descending. Search matches order ID, customer name, or coupon. Date boundaries are inclusive and accept `YYYY-MM-DD` or `DD/MM/YYYY`. The default status is `all`. |
| `GET /api/orders/:id` | Order ID | `200` with the saved order, or `404` if absent. |
| `POST /api/orders` | Order request described below | `201` with the saved order. See the validation results below. |
| `POST /api/orders/:id/cancel` | Order ID and optional JSON `reason` | `200` with the cancelled order. Returns `400` for an absent or already-cancelled order. |
| `GET /api/customers` | None | `200` with `{ customers, settlements }`. The response includes up to 25 recent settlements. |
| `POST /api/customers/:id/settle` | Customer ID, `amount`, optional `mode` and `note` | `201` with `{ ok, settlement, customer }`. Returns `400` for an unknown customer or an invalid settlement. |
| `GET /api/reports/dashboard` | None | `200` with `{ shop, summary, recentAudit }`. Includes up to 12 audit entries. |
| `GET /api/reports/gst-reconciliation` | None | `200` with `{ totalChecked, mismatchCount, totalDelta, rows }`. Cancelled orders are excluded. |
| `GET /api/admin/export` | `key` query parameter matching the configured admin key | `200` with the datastore contents, or `403` for a missing or incorrect key. |
| `GET /orders/:id/invoice` | Order ID | `200` with printable HTML, or `404` with a plain-text message. This route lives outside `/api`. |

The API returns `{ error }` for handled order and settlement failures. See the [router source](../routes/) for the exact messages.

## Place an order

```json
{
  "items": [{ "id": 1, "qty": 1 }],
  "customer": "Walk-in",
  "paymentMode": "cash",
  "status": "completed",
  "coupon": "SAVE10"
}
```

| Field | Type and behavior |
| --- | --- |
| `items` | Nonempty array of product IDs and quantities. The server uses the stored catalog price. It parses `qty` as a base-10 integer and substitutes `1` for missing, unparsable, or nonpositive values. |
| `customer` | Optional name. Defaults to `Walk-in`. A matched `customerId` supplies the registered name. |
| `customerId` | Optional customer ID. Required for `khata`, the store-credit payment mode. |
| `paymentMode` | Optional string, lowercased on save. The UI offers `cash`, `upi`, and `khata`. The default is `cash`. |
| `status` | Optional string. The UI submits `completed` or `pending`. The default is `completed`. Both statuses commit stock. |
| `coupon` | Optional code, trimmed and uppercased. The coupon must be enabled and its minimum subtotal must be met. |

An empty cart, unknown product, rejected coupon, or missing khata customer ID returns `400`. Insufficient sellable stock, an unknown khata account, or an exceeded khata credit limit returns `409`. A saved order includes its `id`, `date`, customer details, `paymentMode`, `status`, `items`, `coupon`, `subtotal`, `discount`, `tax`, and `total`. Cancellation also sets `cancelledAt` and `cancelReason`.

## Key response fields

- **Products** include `id`, `sku`, `name`, `category`, `unit`, `hsn`, `gstPercent`, `price`, `stock`, `reserved`, `sellable`, and `reorderLevel`. Sellable stock is the greater of zero and physical stock minus reserved stock.
- **Coupons** include `code`, `type`, `value`, `minOrder`, `maxDiscount`, and `description`. Preview returns `couponStatus.valid` and a discount or an error message.
- **Preview totals** include `subtotal`, `discount`, `taxable`, `tax`, `cgst`, `sgst`, `total`, and `lines`. Each line includes `id`, `name`, `hsn`, `gstPercent`, `gross`, `discount`, `taxable`, `tax`, and `net`.
- **Customers** include identity and account fields such as `creditLimit`, `openingBalance`, `totalBilled`, `totalSettled`, and calculated `balance`. Each settlement records its ID, customer, date, amount, mode, and note. Submit `amount` as a number or numeric string that rounds to a positive, finite amount at two decimal places. The defaults are `upi` for mode and `Khata settlement` for note.
- **Dashboard** includes stored sales totals for noncancelled orders, order counts, total khata receivable, inventory counts and valuation, and reconciliation counts. Pending orders contribute to the sales totals.
- **Reconciliation** compares billed total and tax against a calculation under current rules. Each row identifies the order and includes saved `ledger*` figures, recalculated `invoice*` figures, a signed total `delta`, and `matched`. `totalDelta` sums absolute total differences, so a tax-only mismatch can increase `mismatchCount` while adding zero to `totalDelta`.

## Read-only examples

Enter these in a browser while the local server is running.

```text
http://localhost:3000/api/products?search=GRN-001
http://localhost:3000/api/orders?from=2022-01-01&to=2022-03-31
http://localhost:3000/api/reports/gst-reconciliation
```

For actions in the browser, see [daily workflows](workflows.md). For the datastore and configuration, see [architecture](architecture.md).
