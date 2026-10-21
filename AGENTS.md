<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# AGENTS.md: ASNOR Inventory
Shared rules for Codex, Claude Code (via CLAUDE.md) and Antigravity (via GEMINI.md).
Use the handoff protocol below when switching tools.

## Stack
- Next.js (App Router) + TypeScript, Prisma + Postgres (Neon), NextAuth, Cloudinary, deployed on Vercel

## Commands
- Install: `npm ci` · Dev: `npm run dev` · Test: `npm test` · Lint: `npm run lint` · Typecheck: `npm run typecheck` · Build: `npm run build`
- CI (`.github/workflows/ci.yml`) runs lint, typecheck, test and build on every push to main.

## Rules
- Secrets live in `.env` (never commit, never paste values here). See `.env.example`.
- Don't push or deploy unless the ticket says so.

## Handoff protocol
1. Tickets are small: ≤ ~1 h of agent work, 3–6 numbered steps in TASKS.md. Bigger? Split it before starting.
2. Checkpoint after EVERY step: tick its box in TASKS.md, rewrite HANDOFF.md,
   `git commit -m "wip(T<n>): step <k>/<N> <what>"`.
3. `handoff` keyword: when the user types `handoff`, stop, write HANDOFF.md, commit.
   Reply with this handoff resume prompt:
   > Read AGENTS.md, TASKS.md and HANDOFF.md, then run `git log --oneline -8` and `git status`. Continue ticket T<n> from the first unchecked step. Don't redo checked steps. Keep checkpointing per AGENTS.md.
4. One tool per ticket. Parallel tools work on different tickets, each in its own worktree.
5. Finishing: squash the wip commits into one clean commit, reset HANDOFF.md to the empty template, mark the ticket ✅.
