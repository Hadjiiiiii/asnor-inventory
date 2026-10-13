# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Owner and staff of a small tech-resale shop (phones, tablets, laptops, accessories), working at the counter or a desk, mostly on a laptop and sometimes on a tablet or phone. They are logging a device the moment it comes in, recording a buy or sell with a supplier or customer, looking up a unit by serial/IMEI, and checking what is in stock and what it earned. Two roles exist: ADMIN (can manage users) and STAFF.

## Product Purpose

ASNOR is the shop's system of record for stock and deals: what each device is, what it cost, what it sold for, and the profit on it. Success is that a unit can be found and recorded in seconds at the counter, and the owner can trust the stock count and margins without a spreadsheet.

## Positioning

Built for tech resale rather than generic retail stock: individual devices are tracked by serial number and IMEI with condition grading, battery health, defect flags and notes on parts salvaged from FOR_PARTS units, alongside quantity-based accessory stock. Profit is computed on every buy/sell transaction.

## Operating Context

- Buying from suppliers and selling to customers happens in person; each deal is a BUY or SELL transaction tied to a product and optionally a contact.
- Devices are photographed on intake (multiple images per product, one primary, stored on Cloudinary).
- Accessories are counted by quantity with an optional low-stock threshold; devices are individual units with status AVAILABLE, RESERVED or SOLD.
- Contacts are SUPPLIER, CUSTOMER or BOTH, each with a linked transaction history.
- Dashboard shows monthly sales and profit metrics, a monthly trend chart and low-stock alerts.

## Capabilities and Constraints

- Stack in place: Next.js 16 App Router, React 19, Tailwind CSS v4, Prisma 7 on PostgreSQL (Neon), Auth.js v5 credentials with JWT sessions, Recharts, deployed on Vercel. The project's `AGENTS.md` warns that this Next.js version differs from common knowledge; read `node_modules/next/dist/docs/` before writing framework code.
- Condition values in the schema are BRAND_NEW, SECONDHAND and FOR_PARTS. The README's New / Like New / Good / Fair / Parts list is out of date.
- Product types: DEVICE and ACCESSORY. Prices are decimal; currency is formatted as USD in en-US.
- Performance gate: median mobile Lighthouse Performance of 90 or more on the authenticated Dashboard, Inventory and Add Product routes (see `docs/pre-deployment-performance.md`). Core Web Vitals targets: LCP 2.5s or less, INP 200ms or less, CLS 0.1 or less.
- Undecided: whether the app is used heavily on a phone at the counter, and whether localisation or other currencies are needed.

## Brand Commitments

- Name: ASNOR, "Inventory System" as the product descriptor.
- The user confirmed the existing Claude-inspired look is a binding constraint: warm cream background, subtle warm borders, terracotta accent and Inter type, calm and professional. See the README Design System section and `src/app/globals.css` for the current tokens. Record, do not expand.

## Evidence on Hand

- Schema and seed data (`prisma/schema.prisma`, `prisma/seed.ts`) and README demo accounts are for demonstration only.
- No customers, testimonials, case studies, real business data, press or logo assets exist in the repo. Do not fabricate any.

## Product Principles

- Speed at the counter beats completeness: recording or finding a unit must take few steps and no hunting.
- Show the facts that decide a deal: condition, battery health, defects, cost, price and profit stay visible and unambiguous.
- Trust the numbers: stock status, quantities and profit must always agree with the recorded transactions.
- Calm over clever: a quiet, readable working tool that staff can use all day.
- Fast on modest hardware and networks, and held to the performance gate above.

## Accessibility & Inclusion

No product-specific standard was stated. Treat WCAG 2.2 AA as the working baseline for a tool used all day by staff, including keyboard use and readable contrast on the warm palette.
