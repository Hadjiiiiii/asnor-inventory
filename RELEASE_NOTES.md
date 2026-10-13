# Release notes

## v0.2.1: 13 October 2026

A review-and-fix pass over v0.2.0. No database migration is required.

**One setting to add:** `SHOP_TIMEZONE` (an IANA name such as `America/New_York`) in your host's environment.
Without it, "today" and "this month" keep following the server's clock, which is UTC on most hosts.

### Security

- **Revoked access now stops within about a minute.** A login token used to outlive the account for up to
  30 days, so a demoted admin could keep managing users and a deleted user could keep working. The account's
  role and existence are now re-read (cached for 60 seconds per server instance); a deleted user is signed
  out, and a role change or deletion takes effect at once on the instance that made it.

### Data safety

- **A contact with transaction history can no longer be deleted.** The check had been replaced by a database
  rule that does not exist for this relation, so the delete would have silently detached past sales.
- **Record Purchase is one atomic step.** The purchase record and the product's new cost and stock are saved
  together or not at all. It validates price, quantity, date and supplier, and returns errors instead of
  throwing.
- **Selling one accessory keeps a reservation** on the rest of the stock; status changes only when the
  last unit goes.

### Dates

- **Dashboard days and months follow the shop's calendar** (`SHOP_TIMEZONE`). An 8pm sale no longer lands in
  tomorrow's "Today".
- The monthly chart no longer drops sales made on the last day of a month, and "last month" now includes
  its last day, so the growth percentage and the chart agree with the Sales card.
- The Record Purchase date defaults to the local day.

### Smaller fixes

- The sale dialog opened from a row loads only customers, not the whole unsold stock.
- The Record Purchase dialog keeps errors inside it, tells you when products fail to load, and cannot be
  dismissed mid-request.
- Undo rules (10-minute window, latest transaction only) are a pure function with tests.
- The product search and the data hook now live in their own file (`product-picker.tsx`).

### Still limited

- Not exercised in a browser or on a phone; checked with type-check, lint, 28 unit tests, a production
  build and a plan-only check of the new dashboard SQL.
- The role re-check is cached per server instance, so on several instances a revocation can take up to a
  minute to reach all of them.
- Dates shown in the Transactions list still use the server's zone; only the dashboard follows `SHOP_TIMEZONE`.
- Undo is available only from the confirmation panel, not from transaction history.
- Devices with no selling price count as $0 in Stock value.
- Demo credentials are still shown on the login page.

## v0.2.0: 13 October 2026

A pass over the sale flow, the Contacts and Users screens, the dashboard, and serial/IMEI visibility.
No database migration is required.

### Highlights

- **One way to sell.** "Mark as sold" and "Record Sale" are now the same dialog, backed by the same
  atomic, race-safe server action.
- **Profit at the moment of the sale.** The dialog previews profit as you type the price and shows the
  result when you confirm.
- **Undo.** A sale can be reversed from the confirmation panel for 10 minutes, as long as nothing else
  has been recorded for that product.
- **Dashboard leads with today.** Today's sales and a restocking list come first.
- **Serial number and IMEI read as the unit's name tag** in the inventory list, product page and sale dialog.

### Sales

- New single sale dialog, opened from an inventory row, the product page, or Transactions → Record Sale.
  Transactions starts with a product search over name, serial number and IMEI (Enter picks the top match,
  so a barcode scanner works).
- Customer, date and notes sit behind "Add customer, date or notes". Accessories get a quantity field.
- Live profit line. A sale below cost needs a second confirmation press.
- Confirmation panel shows what it sold for and the profit or loss, with Undo sale, Sell another and Done.
- Undo restores the exact previous status, selling price and stock, and removes the transaction.
- The default sale date is the local calendar day (it was UTC, which could be the wrong day late in the evening).
- Esc and the backdrop no longer close the dialog while a request is in flight.

### Contacts and Users

- Server actions return readable errors instead of throwing, and validate and trim input.
- Users: you cannot change your own role or delete yourself; passwords over bcrypt's 72-byte limit are refused;
  duplicate emails are caught even when two creates race.
- Deleting a contact or user, and changing a role, use a confirmation dialog with errors shown inside it
  (native `confirm()` is gone). Focus lands on Cancel.
- Forms keep your input on failure, show errors beside the field, and move focus to it.
- Search, filters, role selects, icon buttons and pagination have accessible names; touch targets are 44px.
- Transactions, Contacts and Users show a stacked list below 768px instead of a sideways-scrolling table.
- Invalid `?page=` values fall back to page 1.

### Dashboard

- Order: Today's sales and Needs restocking, then this month's Sales and Profit, then Devices in stock and
  Stock value, then the chart beside Recent transactions.
- Needs restocking lists accessories whose quantity is below their low-stock alert.
- Clearer labels: "Devices in stock", "Stock value" (listed price of unsold devices), "Sales this month"
  (compared with all of last month), "Profit this month" (sale price minus purchase cost).
- The two cards that open a daily breakdown say so.

### Inventory and product page

- Serial number and IMEI get their own mono line; search placeholder names them.
- Empty search results offer "Clear filters" (keeps Units/Accessories).
- "Potential profit" reads "Profit" once a unit is sold.

### Shared components

- Dialogs trap Tab and return focus to the control that opened them.
- Toasts no longer announce twice; the login error is announced to screen readers.
- Chart colors use the design tokens. One page-size constant drives every list.

### Behavior changes to be aware of

- **Unknown cost means unknown profit.** A sale of a unit with no purchase price now records no profit
  (it used to record the full sale price as profit). Dashboard profit totals may be lower for such units.
- The default transaction note "Marked as sold from inventory" is no longer added.
- `createSellTransaction` was removed; sales go through `markProductAsSold`.
- `/api/transactions/data` now also returns brand, status, condition, serial number, IMEI and purchase price
  to signed-in users (the same data the inventory list shows).

### Known limitations

- Not exercised in a browser or on a phone for this release; verification was type-check, lint, unit tests
  (20) and a production build.
- Undo is available only from the confirmation panel, not from transaction history.
- Record Purchase is unchanged and still has its older error handling.
- Sales growth compares this month so far with all of last month, so it reads low early in the month.
- Devices with no selling price count as $0 in Stock value.
- Demo credentials are still shown on the login page.
- A deleted user's existing session stays valid until it expires (JWT sessions).
