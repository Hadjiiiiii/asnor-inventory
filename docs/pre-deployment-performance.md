# Pre-deployment performance benchmark

## Safety and current status

The local `.env` contains the existing US-East Neon connection. Do not use it for Preview, schema setup, synthetic data, or route benchmarks. Provision separate staging databases for the US-East comparison and the selected Southeast Asia region; keep production environment variables and the active database untouched.

Neon region availability is organization-specific. Before creating the SEA database, query `GET https://console.neon.tech/api/v2/regions?org_id=<your-org-id>` and choose Singapore if available, otherwise the nearest supported region. The local benchmark helpers read `BENCHMARK_DATABASE_URL` from the ignored `.env.benchmark.local`, reject Production, and refuse an endpoint with the same host as the active `DATABASE_URL`.

Remote benchmarking is pending Vercel access and isolated staging URLs. No Preview deployment has been created, and no database was contacted or changed by the local production build.

## Prepare isolated benchmark databases

1. Create two non-production Neon projects/databases, one in the current US-East region and one in the nearest supported SEA region. Do not branch from, clone, or point at the active production database for this benchmark.
2. Put only the staging connection string in `.env.benchmark.local`:

   ```dotenv
   BENCHMARK_DATABASE_URL="postgresql://..."
   ```

3. For each staging database, run `npm run benchmark:db:push`, then `npm run benchmark:seed`. The seeder creates 1,000 products and 100,000 synthetic SELL transactions in idempotent batches. It never deletes rows. The scripts reject a missing target, the active database host, and Vercel Production.
4. Create separate Vercel Preview project configurations for the two database/compute pairings. Set each Preview `DATABASE_URL` to its matching staging database only, protect Preview deployments, and use a staging-only account. Never copy Production environment variables into Preview.
5. Verify the current Vercel Function region in project settings. Deploy Preview builds using that region for the US-East baseline, and `sin1` for Singapore; omit `--prod`:

   ```sh
   vercel deploy --regions <current-us-east-function-region>
   vercel deploy --regions sin1
   ```

   Vercel recommends placing functions near their data source. The `--regions` option configures the deployment's function region; it does not change static asset delivery.

## Measurements and release gate

Capture a local build baseline with `npm test` and `/usr/bin/time -p npm run build`. Initial baseline on this machine was 6.66 seconds for Prisma generation plus the production build; the final build after changes was 7.41 seconds. These are single wall-clock observations, not a route-speed result; the font-download/network state and the small sample make their difference inconclusive. The successful final build reported 3.1 seconds for compilation and completed TypeScript validation.

For each Preview pairing, run mobile Lighthouse five times each on the authenticated Dashboard, Inventory, and Add Product routes. Record each run and the median; require median Performance ≥90 for all three routes. Use the same device/network throttling, account, browser, and dataset on both pairings.

Track Core Web Vitals against the “good” thresholds (LCP ≤2.5s, INP ≤200ms, CLS ≤0.1). Enable Vercel Speed Insights in each Vercel project; the app only renders its collector when `VERCEL_ENV=preview`. Speed Insights reports Preview and Production environments when enabled, so keep project access restricted during this benchmark.

For each region, collect 100 timings per route/action (cold entry and warm in-app navigation separately) before calculating p50 and p95. Five Lighthouse runs are the score gate; they are not enough samples for a useful server-action p95. Record at least these measurements:

| Pairing | Route/action | Cold p50/p95 | Warm p50/p95 | Lighthouse median | LCP / INP / CLS | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Local production | Dashboard | pending | pending | pending | pending | Staging DB required |
| US-East Preview | Dashboard / Inventory / Add Product | pending | pending | pending | pending | Isolated US-East DB |
| SEA Preview | Dashboard / Inventory / Add Product | pending | pending | pending | pending | Isolated SEA DB |

Establish the server-action p95 ceiling from the first valid staging baseline before comparing the SEA candidate. Do not set a latency pass/fail number in advance of that baseline. Verify product creation, inventory filtering, and immediate visibility after a change in both Preview setups.

The dashboard change reduces application/database round trips and removes raw historical sale rows from the Node.js process. Do not add indexes until `EXPLAIN (ANALYZE, BUFFERS)` on the synthetic staging dataset shows a useful plan improvement. Keep inventory, current price, stock, and transaction reads uncached; only consider caching reference data after measured evidence.

Production deployment or data migration is out of scope for this phase. Before any later migration, back up the active database and re-run the release checks.
