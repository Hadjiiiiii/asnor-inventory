# TASKS
Format: ≤1 h each, 3–6 steps, done-criteria. Status: ⬜ ready · 🔒 claimed (<tool>, <worktree>) · ✅ done
Source: Day6&7.md, Track A (T2 runs in another thread, T4 is the user's).

## T0 ✅ Confirm Day 3 CI is green (claude-code, main checkout)
- [x] 1. Open github.com/Hadjiiiiii/asnor-inventory/actions. Find the run for `afdb476`.
- [x] 2. Green → tick Day 3 for real. Red → use `diagnosing-bugs` on the failing step, fix without weakening the check. (No push in this thread.)
Done when: the badge on the README shows "passing".
Result: run 39554503226 on afdb476, job `checks` = success (2026-10-21, 1m33s).

## T1 ✅ ASNOR README rewrite, test first · `tdd` then `code-review`
Seam under test: `README.md`, through a small docs test run by `npm test`.
- [x] 1. Red: add `src/test/readme.test.ts` (node:test) expecting the live URL `https://asnor-inventory.vercel.app`, a `docs/demo.gif` image link, a ```mermaid block and a "Demo login" section. Run `npm test`, confirm it fails.
- [x] 2. Top of README, under the badge: one-line pitch, Live demo link, GIF, "What's interesting here" line.
- [x] 3. Mermaid architecture: Browser → Next.js App Router on Vercel (sin1) → Auth.js → Prisma → Neon `asnor-demo` (Singapore); images → Cloudinary.
- [x] 4. Fix Setup to the Day 2 flow: `.env.demo.local` + `npm run demo:push` / `demo:seed` (env var names only). Keep the demo login table (admin/staff).
- [x] 5. Green: `npm test && npm run lint && npm run typecheck`. Run `code-review` on the diff since `afdb476`. Commit.
Done when: tests pass and the GitHub-rendered README shows pitch, GIF and diagram above the fold.
Result: 35/35 tests pass, lint 0 errors (1 old <img> warning), typecheck clean. code-review: fixed reset wording and Node version; open: confirm sin1 / Singapore regions match Vercel and Neon, GIF lands via T2.
Gotcha: the public demo hands out an Admin login. Say in the README that data resets; re-run `demo:seed` after showing it.

## T3 🔒 (claude-code, main checkout) Secret check before going public
- [ ] 1. `git ls-files | grep -Ei 'env|secret'` shows only `.env.example`.
- [ ] 2. Scan all history: `npx gitleaks detect --source . --log-opts="--all"` (or `git log -p --all | grep -Ei 'DATABASE_URL=|AUTH_SECRET=|CLOUDINARY_API_SECRET='`).
- [ ] 3. Anything found → stop. Rotate that secret first; don't flip the repo public.
- [ ] 4. Decide on untracked `.impeccable/critique/`: commit it or add to `.gitignore`. (Push is the user's call, not this thread.)
Done when: scan is clean and `git status` is clean.
