# Release notes: 13 October 2026

A pass over the sale flow, the Contacts and Users screens, the dashboard, and serial/IMEI visibility.
No database migration is required.

## Highlights

- **One way to sell.** "Mark as sold" and "Record Sale" are now the same dialog, backed by the same
  atomic, race-safe server action.
- **Profit at the moment of the sale.** The dialog previews profit as you type the price and shows the
  result when you confirm.
- **Undo.** A sale can be reversed from the confirmation panel for 10 minutes, as long as nothing else
  has been recorded for that product.
- **Dashboard leads with today.** Today's sales and a restocking list come first.
- **Serial number and IMEI read as the unit's name tag** in the inventory list, product page and sale dialog.

## Sales

- New single sale dialog, opened from an inventory row, the product page, or Transactions → Record Sale.
  Transactions starts with a product search over name, serial number and IMEI (Enter picks the top match,
  so a barcode scanner works).
- Customer, date and notes sit behind "Add customer, date or notes". Accessories get a quantity field.
- Live profit line. A sale below cost needs a second confirmation press.
- Confirmation panel shows what it sold for and the profit or loss, with Undo sale, Sell another and Done.
- Undo restores the exact previous status, selling price and stock, and removes the transaction.
- The default sale date is the local calendar day (it was UTC, which could be the wrong day late in the evening).
- Esc and the backdrop no longer close the dialog while a request is in flight.

## Contacts and Users

- Server actions return readable errors instead of throwing, and validate and trim input.
- Users: you cannot change your own role or delete yourself; passwords over bcrypt's 72-byte limit are refused;
  duplicate emails are caught even when two creates race.
- Deleting a contact or user, and changing a role, use a confirmation dialog with errors shown inside it
  (native `confirm()` is gone). Focus lands on Cancel.
- Forms keep your input on failure, show errors beside the field, and move focus to it.
- Search, filters, role selects, icon buttons and pagination have accessible names; touch targets are 44px.
- Transactions, Contacts and Users show a stacked list below 768px instead of a sideways-scrolling table.
- Invalid `?page=` values fall back to page 1.

## Dashboard

- Order: Today's sales and Needs restocking, then this month's Sales and Profit, then Devices in stock and
  Stock value, then the chart beside Recent transactions.
- Needs restocking lists accessories whose quantity is below their low-stock alert.
- Clearer labels: "Devices in stock", "Stock value" (listed price of unsold devices), "Sales this month"
  (compared with all of last month), "Profit this month" (sale price minus purchase cost).
- The two cards that open a daily breakdown say so.

## Inventory and product page

- Serial number and IMEI get their own mono line; search placeholder names them.
- Empty search results offer "Clear filters" (keeps Units/Accessories).
- "Potential profit" reads "Profit" once a unit is sold.

## Shared components

- Dialogs trap Tab and return focus to the control that opened them.
- Toasts no longer announce twice; the login error is announced to screen readers.
- Chart colors use the design tokens. One page-size constant drives every list.

## Behavior changes to be aware of

- **Unknown cost means unknown profit.** A sale of a unit with no purchase price now records no profit
  (it used to record the full sale price as profit). Dashboard profit totals may be lower for such units.
- The default transaction note "Marked as sold from inventory" is no longer added.
- `createSellTransaction` was removed; sales go through `markProductAsSold`.
- `/api/transactions/data` now also returns brand, status, condition, serial number, IMEI and purchase price
  to signed-in users (the same data the inventory list shows).

## Known limitations

- Not exercised in a browser or on a phone for this release; verification was type-check, lint, unit tests
  (20) and a production build.
- Undo is available only from the confirmation panel, not from transaction history.
- Record Purchase is unchanged and still has its older error handling.
- Sales growth compares this month so far with all of last month, so it reads low early in the month.
- Devices with no selling price count as $0 in Stock value.
- Demo credentials are still shown on the login page.
- A deleted user's existing session stays valid until it expires (JWT sessions).
