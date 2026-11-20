# Decision log

| | |
|---|---|
| Purpose | Why things are the way they are. One entry per decision that would be expensive to reverse |
| Read when | Before changing a dependency, the data model, auth, or deployment |

Each entry has a status: **Accepted** (in force), **Superseded** (replaced by a later entry), or **Proposed** (not yet in force). To change an accepted decision, add a new entry that supersedes it; never rewrite history.

Template:

```text
## D<n>. <Title>
Status · Date
Context: what forced a choice.
Decision: what we chose.
Consequences: what gets easier, what gets harder, and when to revisit.
```

## D1. One Next.js app, no separate API

Accepted · 2026-11-10

**Context.** A single developer, a small team of users, and server-rendered pages that mostly read data.
**Decision.** Next.js App Router with Server Components for reads and Server Actions for writes. No REST or GraphQL layer.
**Consequences.** Less code and one deploy. A mobile app or third-party integration would need an API later; add route handlers then.

## D2. WhatsApp deep links instead of the WhatsApp Cloud API

Accepted · 2026-11-12

**Context.** Indian families trust messages from a known number, and the Cloud API needs Meta business verification, templates and per-message fees.
**Decision.** Build `wa.me` links that open WhatsApp with the message typed; the planner taps send.
**Consequences.** Free and trusted. No delivery receipts, and the planner taps once per guest. Revisit when a planner has more than about 500 guests or asks for automatic reminders.

## D3. Own email and password auth

Accepted · 2026-11-11

**Context.** Planners need accounts; the data is small and the threat model is ordinary.
**Decision.** scrypt hashes (Node built-in), database sessions storing only `sha256(token)`, lockout after 5 failures, stored in the database so it works across serverless instances.
**Consequences.** No vendor and no extra cost. Password reset and email verification are missing until an email provider is added. Revisit if social login or teams are needed: Neon Auth or Auth.js would then be cheaper than building it.

## D4. Guest token as the only guest credential

Accepted · 2026-11-12

**Context.** Guests will not sign up.
**Decision.** Each guest gets a 128-bit random token in their link. Guest ids are never exposed.
**Consequences.** Anyone with the link can answer for that guest, which matches how invites work. A leaked link affects one guest only.

## D5. Prediction with fixed show rates and a calibration factor

Accepted · 2026-11-14

**Context.** No historical data exists yet, but "sum of Coming" is known to overcount.
**Decision.** Per-party Bernoulli model with show rates by answer and relation, a 90% range, and a per-planner calibration factor from recorded turnout, damped with +100 and capped to 0.5 – 1.5.
**Consequences.** Simple, explainable, testable. The show rates are assumptions; the first real wedding is the first out-of-sample test. Revisit after five recorded weddings.

## D6. SQLite in development

Superseded by D8 · 2026-11-10

**Context.** Fastest way to start.
**Decision.** Prisma on a local SQLite file.
**Consequences.** SQLite cannot run on Vercel and differs from Postgres in types and locking.

## D7. Light theme, neutral design system, no decorative motion

Superseded by D13 · 2026-11-16

**Context.** The earlier design used a pink accent, emoji icons, a cursor trail, drifting petals and a pinned scroll story. It read as a demo, not a product.
**Decision.** Light theme only. Neutral greys, ink for primary actions, one blue accent, Geist for all text. Motion limited to hover states and short scroll reveals that are off under reduced motion. GSAP removed.
**Consequences.** Smaller bundle and calmer UI. Anything decorative now needs a reason in this log.

## D8. Postgres on Neon, deployed on Vercel

Accepted · 2026-11-16

**Context.** Going live needs a hosted database that works with serverless functions. The developer does not want Docker locally.
**Decision.** Prisma with `provider = "postgresql"`. Neon in production through the Vercel integration: `DATABASE_URL` is the pooled URL for the app, `DATABASE_URL_UNPOOLED` the direct URL for migrations. Locally, `npx prisma dev` runs a Postgres-compatible server without Docker. SQLite migrations were replaced by a single Postgres baseline (`0_init`).
**Consequences.** Same engine in every environment, free tier to start, branch-per-preview possible. The local server accepts one connection at a time, so local URLs set `connection_limit=1` and `pgbouncer=true` (see [Hacks](hacks.md)).

## D9. Docs as Markdown, served to people and agents

Accepted · 2026-11-16

**Context.** AI agents do much of the work on this repo and need the same context a new engineer would.
**Decision.** All project knowledge lives in `docs/*.md`. The app renders them at `/docs` and serves them raw at `/llms.txt`, `/llms-full.txt` and `/llms/<slug>.md`. `AGENTS.md` at the root points agents to `docs/agents.md`.
**Consequences.** One source of truth that is versioned with the code. Docs must be updated in the same PR as the behaviour they describe.

## D10. Database and functions in Singapore

Accepted · 2026-11-16

**Context.** Guests and planners are in India. Neon offers no Mumbai region on the Vercel integration's free plan, and Vercel runs functions in Washington (`iad1`) by default, an ocean away from the data.
**Decision.** Neon project in Singapore (`aws-ap-southeast-1`); functions pinned to `sin1` in `vercel.json`, so every query stays inside one region.
**Consequences.** Low latency from India. Revisit if Neon adds Mumbai or the user base moves.

## D11. Password reset through Resend, called over plain HTTP

Accepted · 2026-11-16

**Context.** Planners who forget their password were locked out for good. Sending email needs a provider; the developer chose Resend.
**Decision.** One-time links (256-bit token, hashed in the database, 30 minutes, single use) emailed through Resend's REST API with `fetch`, not the Resend SDK: one call does not justify a dependency. Using a link signs out every other device.
**Consequences.** Works with only `RESEND_API_KEY` set. Until a domain is verified in Resend, its shared sender `onboarding@resend.dev` only delivers to the Resend account owner's own address, so other planners will not receive reset email. Revisit by buying a domain, verifying it in Resend and setting `MAIL_FROM`.

## D12. Replies close before the function's day; invitations default to every function

Accepted · 2026-11-17

**Context.** Testers could RSVP after a function had happened, could add the same person twice, and the planner could not invite colleagues to the Reception alone or see who exactly was coming.
**Decision.** A function stops taking replies at midnight IST at the start of its day, in addition to the wedding deadline, and the deadline must fall before the first function's day. Per-function invitations are rows in `Invitation`; no rows means every function, so the common case stores nothing and new functions include existing guests. Coming requires one name per person. Same-name guests need an explicit override.
**Consequences.** Same-day replies are no longer possible, which matches how caterers work. Counting code must always respect invitations (`isInvited`), which is covered by unit tests in headcount, predict and reminders.

## D13. A wedding look: festive invitation, warm planner pages

Accepted · 2026-11-17

**Context.** Testers wanted the product to feel like a wedding, and the guest link to feel like a real invitation (a reference: a sealed, gold-on-royal-blue invite with a countdown and a scratch-to-reveal date). D7's neutral look read as generic.
**Decision.** Guest invitations get a full festive treatment in four themes chosen per wedding, with our own SVG ornaments (marigold garland, diyas, mandala corners, lotus divider, a drawn couple) instead of photos or copied art. Planner pages stay light and usable but warm: ivory, maroon actions, marigold accents, Cormorant Garamond headings, a garland under the header, and a colour per function. Motion makes it feel alive but always ends: the invitation's doors swing open, names rise in, marigold petals fall once, diya flames flicker, the countdown ticks and the date pops when scratched; planner pages fade between routes (React `<ViewTransition>`), numbers count up when they come into view and the header garland drops in; headlines reveal word by word (on load for page titles, on scroll for section titles), cards ease in with a stagger, and the landing's product preview, bars and step lines animate on scroll. Scroll effects use CSS scroll timelines, so unsupported browsers just show the content. Still no emoji, cursor effects or looping particles, and everything rests under reduced motion.
**Consequences.** Two more web fonts (Cormorant Garamond, Great Vibes). The invite stays usable without JavaScript. A couple photo would need image storage; revisit if planners ask.

## D14. A shared invite link next to personal links

Accepted · 2026-11-20

**Context.** Planners asked to send one link to a WhatsApp group instead of typing every guest in.
**Decision.** Each wedding can have one shared link (`Wedding.joinCode`, null when off). Guests add themselves with name, number and side, then get a normal personal link. Personal links stay the only credential for a guest's reply: the shared link can only create new guests, and refuses a number already on the list.
**Consequences.** Anyone the link is forwarded to can join, so it can be replaced or turned off. Self-added guests are invited to every function and counted with the "other" show rates, which predicts slightly less accurately than a relation the planner chose.

