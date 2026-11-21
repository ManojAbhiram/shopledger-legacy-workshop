# Repository Guidelines

## Stack

ShopLedger runs on Node.js with Express 4, CommonJS modules, and `body-parser` for JSON requests. The browser UI uses plain HTML, CSS, and JavaScript. The app stores its data in a local JSON file.

## Module Map

- `server.js` serves the UI, mounts the API routers, and serves printable invoices. `config.js` holds the port, shop settings, GST rates, inventory defaults, and coupon rules.
- `public/` contains the point-of-sale UI, order register, khata ledger, and audit view.
- `routes/` contains the product, order, customer, and report routers.
- `lib/` handles orders, stock, pricing, tax, coupons, khata balances, invoices, reports, and dates. `lib/store.js` reads and writes `data/db.json`.

## Commands

- `npm install` installs the dependencies declared in `package.json`.
- `npm start` runs `node server.js` on port 3000 by default. Set `PORT` to use another port.
- `node --check routes/orders.js` checks JavaScript syntax without running the file. Substitute the path you changed.
- `npm test` is a placeholder that exits with an error. There is no build script.

## Contributor Rules

1. Write characterization tests that capture existing behavior before changing it.
2. Change only the module the ticket is about.
3. Tests must never read or write `data/db.json`. Use in-memory fixtures or a separate temporary file.
4. Add no dependencies.
