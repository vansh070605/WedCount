# Hacks and shortcuts

| | |
|---|---|
| Purpose | Every deliberate shortcut in the code: what it is, its limit, and when to replace it |
| Read when | Something behaves oddly, or before scaling a part of the system |

A shortcut is fine while its limit is far away. Each entry says what would make it worth fixing.

## Local Postgres accepts one connection

`npx prisma dev` runs a single-session Postgres. Local URLs therefore use `127.0.0.1` (not `localhost`, which can resolve to IPv6 and fail), `connection_limit=1` and `pgbouncer=true` (no named prepared statements, which would collide between clients on the shared session).
**Symptom if wrong:** `P1001 Can't reach database server`, or `prepared statement "s0" already exists`.
**Fix now:** restart it: `npx prisma dev stop wedcount`, then `npx prisma dev --name wedcount --detach`.
**Replace when:** local work needs parallel connections. Use a Neon dev branch as `DATABASE_URL` instead.

## `prisma migrate dev` fails against the local server

`npx prisma dev` cannot host Prisma's shadow database, so `migrate dev` stops with `P3006`. A failed attempt can also leave the single session stuck (`migration persistence is not initialized`).
**Fix now:** restart the local server, then generate the migration with `prisma migrate diff --from-url` ([Playbook, section 3](playbook.md)).
**Replace when:** using a Neon dev branch locally, where `migrate dev` works normally.

## Dev server does not hot-reload `globals.css`

The Tailwind loader in `next.config.ts` caches the stylesheet.
**Fix now:** stop the dev server, delete `.next`, start it again.
**Replace when:** Next.js or `@tailwindcss/turbopack` fixes CSS invalidation for this loader setup.

## Restart after a Prisma migration

A running dev server keeps the old generated client in memory.
**Fix now:** restart `npm run dev` after every `db:migrate`. On Windows, `prisma generate` fails with `EPERM ... query_engine-windows.dll.node` while a dev server holds the file; stop it first.

## Calibration is per planner, not per family or city

`lib/calibrate.ts` uses all of a planner's recorded functions.
**Replace when:** planners run weddings in very different communities and the prediction error per wedding stays above 10%.

## Show rates are assumptions

The table in `lib/predict.ts` is a starting guess.
**Replace when:** five or more weddings have recorded turnout. Fit the rates per answer and relation from that data and add a decision entry.

## "Invited" means the planner tapped the button

`invitedAt` and `remindedAt` are set when the planner opens WhatsApp, not when the message is delivered.
**Replace when:** moving to the WhatsApp Cloud API, which reports delivery.

## Docs are read at module load

`lib/docs.ts` reads `docs/*.md` once when the module loads, and the pages are prerendered at build.
**Consequence:** changing a doc needs a rebuild (or a dev server reload) to show up.

## Account deletion is immediate

`deleteAccount` removes the planner and every wedding at once, with no grace period or export.
**Replace when:** real planners use it; add a CSV export of all weddings first and a 7-day undo window.

## No password reset

A planner who forgets their password cannot recover the account without a database change.
**Replace when:** the first real planner signs up. Add an email provider (Resend or similar), a reset-token table with expiry, and a decision entry.

## No-JavaScript form errors crash in `next dev` only

In development, when a planner form is submitted before JavaScript loads and the action returns an error, Next.js 16.4 throws `Invariant: Received an underlying cookies object that does not match either cookies or mutableCookies` while re-rendering the page. The production build (`npm run build && npm start`) renders the error message correctly.
**Fix now:** test the no-JavaScript path against a production build.
**Replace when:** a Next.js release fixes the dev invariant; then this entry can go.
