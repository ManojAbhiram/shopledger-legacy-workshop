# ShopLedger

ShopLedger is an internal point-of-sale app for a wholesale and retail shop. Staff can place cash, UPI, and khata sales, track sellable stock, print GST invoices, record customer repayments, and review inventory and tax figures. Khata is the shop's store-credit ledger.

## Run locally

Use Node.js 22 and npm from the repository root.

```shell
npm install
npm start
```

Open [localhost:3000](http://localhost:3000). Set `PORT` to change the listening port. The browser UI is served directly by Express and needs no build step.

Checkout, cancellation, and settlements write to `data/db.json`. Follow the [practice checkout tutorial](docs/getting-started.md) for a safe way to try those actions in a separate copy.

## Documentation

| Read | Use it to |
| --- | --- |
| [Getting started](docs/getting-started.md) | Start a practice copy, place an order, print its invoice, and confirm stock restoration. |
| [Daily workflows](docs/workflows.md) | Work the sales counter, filter and cancel orders, and record khata payments. |
| [API reference](docs/api-reference.md) | Look up endpoints, request fields, status codes, and response shapes. |
| [Architecture](docs/architecture.md) | Trace checkout, find each module, and understand the datastore and invoice reconciliation. |
| [Contributor rules](AGENTS.md) | Check the repository's working rules and development commands. |

## Develop and test

```shell
node --test
```

The tests use Node's built-in runner and in-memory fixtures for invoice reconciliation, inventory, order dates, and khata settlements. To run one suite, use `node --test test/inventory.test.js`. The manifest's `npm test` script is still a placeholder.

The server entry point is `server.js`, HTTP handlers live in `routes/`, and shared logic lives in `lib/`. Browser assets are in `public/`. See the [module map](docs/architecture.md#module-map) for file-level ownership.
