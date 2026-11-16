# Agent guide

**Read this first if you are an AI agent** (Claude Code, Codex, Cursor, or any other agent) working on WedCount. It tells you what to read, which rules are fixed, and how to make and record decisions without asking a human for every step.

| | |
|---|---|
| Purpose | Operating manual for AI agents in this repository |
| Read when | Before your first change in a session |
| Source of truth | `docs/*.md` in the repo. The same files are served at `/docs`, `/llms.txt`, `/llms-full.txt` and `/llms/<slug>.md` |

## Read order

1. **This file.** Rules and decision protocol.
2. [Requirements](requirements.md): who the product is for, and the constraints no change may break.
3. [Architecture](architecture.md): how the system fits together and where each concern lives.
4. [Decision log](decision.md): why things are the way they are. Do not re-open a decision without new information.
5. [Features](features.md): what already exists, so you reuse it instead of rebuilding it.
6. [Playbook](playbook.md): exact procedures for running, testing, migrating and deploying.
7. [Hacks](hacks.md) and [Tips](tips.md): known shortcuts and traps.

Also read `node_modules/next/dist/docs/` before writing Next.js code. This is Next.js 16 with Cache Components turned on, and its APIs differ from older versions (see the block at the top of `AGENTS.md`).

## Hard rules

These are not up for judgement. If a task seems to need one of them broken, stop and ask the human.

1. **Guest data is private.** A guest's invite token is their only credential. Never log it, never put guest ids in URLs, never return another planner's data. Every planner query goes through `lib/owned.ts` or filters by `plannerId`.
2. **Never weaken auth.** Passwords stay hashed with scrypt (`lib/password.ts`). Only `sha256(token)` of a session is stored. The login lockout stays (`lib/lockout.ts`).
3. **Never run destructive database commands against a shared or production database.** That includes `prisma migrate reset`, `db push --force-reset` and `DROP`. Local `npx prisma dev` data and the `wedcount_test` schema are the only places you may wipe.
4. **Schema changes go through migrations** (`npm run db:migrate -- --name <what>`). Never edit an applied migration.
5. **Keep the server action fallback** on forms (`action={formAction}` alongside `onSubmit`). Guests on slow phones tap before hydration.
6. **Light theme only.** Use the tokens in `app/globals.css` and the components in `app/ui/kit.tsx`. No raw Tailwind palette colours (`zinc-`, `rose-`, ...), no emoji in the UI, no decorative effects (cursor trails, particles, glows).
7. **Tests stay green.** `npm test`, `npm run test:db`, `npm run lint` and `npm run build` must pass before you open a PR.
8. **Git workflow.** One feature branch per piece of work, a PR with what, why and how it was tested. Merge with `gh pr merge <n> --merge`. Never delete branches. Never push to `main` directly.

## How to make a decision

Most choices can be made without a human. Use this order and stop at the first that answers the question:

1. **Is it already decided?** Search [decision.md](decision.md). If an entry covers it, follow it.
2. **Does the codebase already do it?** Reuse the existing helper, component or pattern ([features.md](features.md) lists where things live).
3. **Is it a requirement?** If [requirements.md](requirements.md) says so, it wins over convenience.
4. **Pick the smallest change that fully works**, using the platform (Next.js, Prisma, Postgres) before adding a dependency.
5. **Record it.** If the choice will matter to the next person (a new dependency, a schema shape, a trade-off), add an entry to [decision.md](decision.md) in the same PR.

Ask the human instead when the choice:

- spends money or creates an account (Vercel, Neon, WhatsApp Cloud API, email providers),
- touches production data or secrets,
- changes what guests or planners see in a way the requirements do not cover,
- reverses an entry in the decision log.

## Where things live

| Concern | Location |
|---|---|
| Pages and routes | `app/` (App Router) |
| Server actions (all writes) | `app/actions.ts` |
| Pure domain logic and its tests | `lib/*.ts`, `lib/*.test.ts` |
| Ownership checks | `lib/owned.ts`, `lib/auth.ts` |
| Data model and migrations | `prisma/schema.prisma`, `prisma/migrations/` |
| Design tokens and components | `app/globals.css`, `app/ui/kit.tsx`, `app/ui/brand.tsx` |
| These docs | `docs/*.md`, listed in `lib/docs.ts` |

## Adding or changing a doc

1. Edit or add the Markdown file in `docs/`.
2. If it is a new file, add it to the `DOCS` list in `lib/docs.ts`. That publishes it at `/docs/<slug>`, `/llms/<slug>.md` and in `/llms.txt`.
3. Keep each doc's table at the top (purpose, read when) so agents can decide quickly whether to read it.
