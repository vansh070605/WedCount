# Architecture

| | |
|---|---|
| Purpose | How WedCount is built and deployed, and why each part is where it is |
| Read when | Before changing data, auth, routing or deployment |

## Overview

WedCount is one Next.js 16 application (App Router, React 19, TypeScript) deployed on **Vercel**, with **Postgres on Neon** accessed through **Prisma 6**. There is no separate API server: pages are React Server Components that read the database directly, and every write is a **Server Action**.

```text
 Guest's phone (WhatsApp link)          Planner's browser
            │                                   │
            ▼                                   ▼
 ┌─────────────────────────── Vercel ───────────────────────────┐
 │  Next.js 16 (App Router, Cache Components)                    │
 │                                                               │
 │  /r/[token]        guest RSVP page      ─┐                    │
 │  /dashboard        planner's weddings    │  Server Components │
 │  /weddings/[id]    headcount, guests     │  read via Prisma   │
 │  /docs, /llms.txt  documentation        ─┘                    │
 │                                                               │
 │  app/actions.ts    Server Actions: every write                │
 │  /weddings/[id]/export   route handler: caterer CSV           │
 │                                                               │
 │  lib/*             pure logic: rsvp, headcount, predict, ...  │
 └───────────────────────────────┬───────────────────────────────┘
                                 │ Prisma Client (pooled URL)
                                 ▼
                    ┌──────── Neon Postgres ────────┐
                    │ Planner Session Wedding Event │
                    │ Guest Rsvp                    │
                    └───────────────────────────────┘

 WhatsApp: the app never sends messages. It builds wa.me links and the
 planner's own phone sends them.
```

## Layers

| Layer | Location | Rule |
|---|---|---|
| Routes and UI | `app/**/page.tsx`, `app/ui/` | Server Components by default; client components only for interaction (`"use client"` in `app/ui/forms.tsx`, `rsvp-form.tsx`, `section-tabs.tsx`) |
| Writes | `app/actions.ts` | Every mutation is a Server Action that checks the session and ownership first |
| Domain logic | `lib/*.ts` | Pure functions with unit tests; no framework imports except where noted (`auth.ts`, `owned.ts`, `calibrate.ts` use Prisma) |
| Data | `prisma/schema.prisma` | Constraints live in the schema (unique keys, cascades), not only in code |

## Data model

```text
Planner 1──* Session            (sessions die with the planner)
Planner 1──* Wedding 1──* Event
                     1──* Guest 1──* Rsvp *──1 Event
```

| Model | Key fields | Invariants |
|---|---|---|
| Planner | `email` unique, `passwordHash`, `failedLogins`, `lockedUntil` | email stored lower-case |
| Session | `id` = sha256(cookie token), `expiresAt` | raw token never stored |
| Wedding | `plannerId`, `name`, `city`, `rsvpDeadline` | always read through the owner |
| Event | `weddingId`, `name`, `startsAt`, `venue`, `actualCount` | `actualCount` feeds calibration |
| Guest | `weddingId`, `phone`, `side`, `relation`, `token` unique, `invitedAt`, `remindedAt`, `reminderCount` | `(weddingId, phone)` unique; token is 128 random bits |
| Rsvp | `guestId`, `eventId`, `status`, `vegCount`, `nonVegCount`, `arrivalTime` | `(guestId, eventId)` unique; people = veg + non-veg; no row means no reply |

All foreign keys cascade on delete, so removing a wedding removes its functions, guests and replies.

## Request flows

### Guest replies

1. Guest opens `/r/<token>` from WhatsApp. The page looks the guest up by token (unique index) and renders their functions and current answers.
2. The form posts to the `saveRsvp` Server Action, which validates input (`parseRsvpForm` in `lib/rsvp.ts`), checks the deadline in IST, and upserts every function's answer in one transaction.
3. The planner's wedding page reads the new rows on the next render.

### Planner views a wedding

1. `/weddings/[id]` reads the session cookie (`getPlanner`), then loads the wedding only if it belongs to that planner (`findOwnedWedding`). Anything else is a 404, so ids cannot be probed.
2. Counts, reminder states and predictions are computed in `lib/` from the loaded rows. The calibration factor comes from the planner's past functions with recorded turnout.

### Authentication

- `signup` hashes the password with scrypt (`lib/password.ts`) and creates a session.
- `login` checks the lockout, verifies the hash in constant time, and on success resets the failure counter and creates a session.
- A session is a random token in an httpOnly, SameSite=Lax cookie; the database holds `sha256(token)` with a 30-day expiry.

## Rendering and caching

Cache Components is on (`next.config.ts`). Pages that read cookies or the database render inside `<Suspense>`, so the static shell streams first. Docs pages are prerendered at build from `docs/*.md` (`generateStaticParams`), read once at module scope in `lib/docs.ts`.

## Environments

| | Database | How to get it |
|---|---|---|
| Local | Postgres from `npx prisma dev` (runs locally, no Docker) | [Playbook: run locally](playbook.md) |
| Tests | A throwaway `wedcount_test` schema in the local database | `npm run test:db` creates and drops it |
| Preview and production | Neon Postgres in Singapore; Vercel functions pinned to `sin1` next to it (`vercel.json`) | Vercel + Neon integration, see [Playbook: deploy](playbook.md) |

### Environment variables

| Name | Used for |
|---|---|
| `DATABASE_URL` | Prisma at runtime. On Neon: the **pooled** connection string (host contains `-pooler`) |
| `DATABASE_URL_UNPOOLED` | Prisma migrations. On Neon: the **direct** connection string |
| `APP_URL` | Base URL in guest invite links. Required in production; the app refuses to start sending localhost links |
| `SUPPORT_EMAIL` | Optional contact address shown on `/privacy` and `/terms` |

## Security model

- **Authorization is ownership.** Every planner-side read and write is filtered by `plannerId`, centrally in `lib/owned.ts` and `requireOwnedWedding`. A database test proves another planner gets nothing.
- **Guests are authorised by token only**, and the token is never derived from the guest id.
- **Abuse limits**: login lockout; party size capped at 20 per function; CSV import validated before any write.
- **Output safety**: React escapes all text; the caterer CSV neutralises formula prefixes (`=`, `+`, `-`, `@`); docs HTML comes only from files in this repo.

## Testing

| Command | What it covers |
|---|---|
| `npm test` | Unit tests for every pure module in `lib/` |
| `npm run test:db` | Ownership scoping against a real Postgres schema |
| `npm run lint` | ESLint with the Next.js config |
| `npm run build` | Type check and production build, including prerendering |
