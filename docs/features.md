# Features

| | |
|---|---|
| Purpose | Every shipped feature, how it behaves, and where its code lives |
| Read when | Before building something, to check whether it already exists |

## Accounts and sessions

- **Sign up and log in** with email and password (minimum 8 characters). Emails are stored lower-case. Code: `signup`, `login`, `logout` in `app/actions.ts`.
- **Sessions** last 30 days in an httpOnly cookie. The database stores only the SHA-256 of the token, and expired sessions are cleaned up at each login. Code: `lib/auth.ts`.
- **Account page** (`/account`) shows the planner's name and email and deletes the account with everything in it. Deletion asks for the password, so an open laptop is not enough. Code: `deleteAccount` in `app/actions.ts`.
- **Signup limit**: at most 5 signup attempts per network per hour. Only a SHA-256 of the client address is stored, in the `RateLimit` table. One atomic SQL statement counts each attempt, so parallel requests can't slip past the limit. Code: `hit` in `lib/ratelimit.ts`, `allow` in `app/actions.ts`.
- **Password reset**: "Forgot your password?" on the login page emails a one-time link (`/reset-password/<token>`, 256 random bits, 30 minutes). Only its SHA-256 is stored. Using it sets the new password, clears any login lockout, signs out every other device and logs in. The request form replies the same way whether or not the email has an account, and is limited to 5 requests per network per hour. Email goes through Resend. Code: `requestPasswordReset`, `resetPassword` in `app/actions.ts`, `lib/reset.ts`, `lib/mail.ts`.
- **Login lockout**: after 5 wrong passwords the account pauses for 15 minutes. The state lives in the database so it holds across serverless instances, and every failure shows the same message so nobody can tell which emails exist. Code: `lib/lockout.ts`.

## Home

- **`/home`** is where a planner lands after logging in, and where the WedCount logo leads: a greeting with the next function, totals across every wedding (weddings, guests, replied, reminders due), **Coming up** (next functions with expected turnout), **Needs your attention** (invites to send, reminders due, weddings missing functions or guests, each with a button), and **Latest replies**. A new planner sees a four-step setup checklist instead. Code: `app/home/page.tsx`.
- Public pages (landing, docs, legal) show **Open WedCount** instead of Log in when the visitor is logged in (`app/ui/header-auth.tsx`).

## Weddings, functions and guests

- **Weddings** have a name, city and optional RSVP deadline. The dashboard (`/dashboard`) lists them with reply progress and the next function. Edit or delete a wedding at `/weddings/[id]/settings`; deleting removes its functions, guests and replies, and invite links stop working. Code: `updateWedding`, `deleteWedding` in `app/actions.ts`.
- **No past dates**: date pickers start at today (India time), and the server refuses a new or changed function time that has passed, or an RSVP deadline before today. Editing a function that already happened keeps its date. Code: `minPickDate`, `pastProblem` in `lib/rsvp.ts`.
- **Functions** (Haldi, Sangeet, ...) have a name, start time and venue. Add on the wedding page, edit or delete at `/weddings/[id]/events/[eventId]`.
- **Guests** have a name, phone, side (bride or groom) and relation (family, friend, colleague, other). Add one at a time, or import a CSV. Edit or delete at `/weddings/[id]/guests/[guestId]`.
- **Invited to**: each guest can be invited to only some functions (tick them when adding or editing). No ticks stored means every function, so functions added later include the guest. Guests not invited to a function never count, get asked, or get reminded for it. Code: `Invitation` model, `isInvited`/`invitedEvents` in `lib/rsvp.ts`.
- **Duplicate guests**: a second guest with the same name (ignoring case, spaces and dots) is refused unless the planner ticks "Different person, same name"; CSV import has the same check with an "Allow guests with the same name" box. The same phone number is never allowed twice. Code: `nameKey` in `lib/guests.ts`.
- **Phone numbers** are normalised to `+91XXXXXXXXXX`, so `98765 43210` and `+91-98765-43210` are the same guest. A wedding cannot hold the same phone twice. Code: `normalizePhone` in `lib/guests.ts`.
- **CSV import** follows RFC 4180 (quoted names with commas work). If any row is invalid nothing is imported, and each error names its line. Guests already on the list are skipped. Code: `parseCsv`, `parseGuestCsv` in `lib/guests.ts`.

```csv
name,phone,side,relation
Sharma Uncle,98765 43210,bride,family
"Sharma, Ramesh",+91 90000 11111,groom,friend
```

## Invites and reminders

- **Personal link** per guest: `/r/<token>`, where the token is 128 random bits. Code: `newGuestToken` in `lib/guests.ts`, `inviteLink` in `lib/invite.ts`.
- **Shared invite link** (`/w/<code>`, 128 random bits): one link per wedding, created on the wedding page (Add guests). A guest types their name, WhatsApp number and side, is added to the guest list (relation "other", invited to every function, marked as invited) and lands on their own `/r/<token>` invitation to reply. A number already on the list is refused, so nobody can take over another guest's reply. **New link** replaces the code and **Turn off** removes it; guests who already joined keep their own links. Limited to 20 joins per network per hour. Code: `setJoinLink`, `joinWedding` in `app/actions.ts`, `app/w/[code]/page.tsx`.
- **Send queue** (`/weddings/[id]/invite`): one guest at a time with their message, a big WhatsApp button and Skip; after sending, the next guest appears. Two tabs: Not invited yet, and Reminders due.
- **Your own invite message**: Settings has an editor with a live preview. Fill-ins: `{name}`, `{wedding}`, `{functions}` (only that guest's functions), `{replyBy}`, `{link}` (required). Code: `inviteMessage`, `templateProblem` in `lib/invite.ts`.
- **One-tap WhatsApp**: the button opens `wa.me` with the guest's number and a ready message containing their link and the deadline. The app records when the planner tapped (not proof of delivery). Code: `whatsappUrl`, `inviteMessage` in `lib/invite.ts`, `markSent` in `app/actions.ts`.
- **Reminders**: a guest is due a reminder when they were invited, still have unanswered functions, and have been quiet for at least 2 days since the last invite or reminder. The reminder names only the missing functions. Code: `lib/reminders.ts`, `reminderMessage` in `lib/invite.ts`.

## Guest RSVP page

- A full **wedding invitation**, in one of four themes the planner picks in Settings (Royal Blue & Gold, Sindoor Red & Gold, Mehendi Green & Gold, Ivory & Rose Gold):
  - a **tap-the-seal cover** with the couple's initials (a CSS checkbox, so it opens before JavaScript loads; skipped for reduced motion and no-JS);
  - the couple's names in script under a marigold garland and diyas, with an optional blessing line;
  - **families**: "daughter of … / son of …" when the parents' names are filled in;
  - a drawn couple under a floral arch, and a **live countdown** to the guest's next function;
  - a **scratch-the-gold card** revealing the main function's date (a Reveal button for keyboard users; plain date for reduced motion);
  - one card per function in its own colour (Haldi turmeric, Mehendi green, Sangeet purple, Wedding red…) with date, time, venue and **Open in Google Maps**.
  Opening plays once: the doors swing apart, the names rise in, petals fall; diya flames flicker and sections ease in on scroll. No login, no app. Code: `app/r/[token]/page.tsx`, `app/ui/ornaments.tsx`, `app/ui/invite-bits.tsx`, `lib/invitation.ts`.
- For each function: Coming, Maybe or Can't come; veg and non-veg counts (party size is their sum, up to 20); arrival time (taken on the day nearest the function, so 01:00 for a 21:00 Sangeet is that night); and the **names of everyone coming**, one per line. Coming needs exactly one name per person; Maybe may leave names out.
- Saves in one transaction, so a guest never ends up with half their functions saved. Answers can change until the earlier of the wedding's deadline and **midnight IST at the start of the function's day**; after that the function shows "Replies closed". The deadline itself must be before the first function's day, and a function can't be added on or before the deadline day. Code: `closesAt`, `isEventOpen`, `deadlineProblem` in `lib/rsvp.ts`.
- Works before JavaScript loads (server action fallback). Code: `app/r/[token]/page.tsx`, `app/ui/rsvp-form.tsx`, `lib/rsvp.ts`.

## Headcount and export

- **Per-function table** on the wedding page: Coming (replies and people), veg, non-veg, Maybe, Can't come, No reply, and Expected. Phones get cards instead of the table. Code: `countHeadcount` in `lib/headcount.ts`.
- **Who's coming**: per function, the names of everyone who said Coming. **Names CSV** (`/weddings/[id]/export?list=names`) gives one row per person per function, for the door list.
- **Caterer CSV** at `/weddings/[id]/export`: one row per function with expected people, range and the food split. Cells are protected against spreadsheet formula injection. Code: `app/weddings/[id]/export/route.ts`, `csvCell` in `lib/headcount.ts`.

## Door list (check-in on the day)

- **`/weddings/[id]/events/[eventId]/door`**, linked from each function's page and the Actual turnout section. Every guest invited to the function, Coming first, with their reply, party size and the names they gave. Tap **+** for each person who arrives and **−** to undo; a guest can never go below 0.
- Search (`?q=`) matches the guest and every name in their reply, ignoring case, spaces and dots, and works without JavaScript.
- Opens at midnight IST on the function's day. Each tap recomputes the function's **actual turnout** as the sum of check-ins in one SQL statement, so calibration needs no typing. A door check-in replaces a number typed by hand.
- Code: `Arrival` model, `checkIn`/`doorOpen` in `lib/checkin.ts`, `checkInGuest` in `app/actions.ts`.

## Expected turnout (prediction)

Each guest's party either comes or doesn't, with a probability that depends on their answer and relation:

| Show rate | Family | Friend | Colleague | Other |
|---|---|---|---|---|
| Coming | 0.95 | 0.85 | 0.75 | 0.80 |
| Maybe | 0.60 | 0.45 | 0.30 | 0.40 |
| No reply | 0.35 | 0.20 | 0.10 | 0.15 |

```text
expected = Σ size × p          (No reply uses the function's average party size, default 2)
range    = expected ± 1.645 × √( Σ size² × p × (1 − p) )     ≈ 90%, parties independent
```

**Calibration**: after a function the planner records how many came. Future predictions for that planner are multiplied by

```text
factor = (Σ actual + 100) / (Σ predicted + 100), capped to 0.5 – 1.5
```

The `+100` keeps one odd function from swinging everything. The page shows each recorded function's prediction error next to the naive "count only Coming" number. The show rates are **assumptions**, not measured data, and the page says so. Code: `lib/predict.ts`, `lib/calibrate.ts`.

## Documentation for people and agents

- `/docs` renders every file in `docs/`. `/llms.txt` indexes them for AI agents, `/llms-full.txt` returns them all in one file, and `/llms/<slug>.md` returns one as raw Markdown. Code: `lib/docs.ts`, `app/docs/`, `app/llms*/`.

## Sharing and icons

- Favicon (`app/icon.svg`), home-screen icon (`app/apple-icon.tsx`) and a 1200×630 share card (`app/opengraph-image.tsx`) shown when a WedCount link is pasted into WhatsApp, LinkedIn or X. Absolute URLs come from `APP_URL` via `metadataBase` in `app/layout.tsx`.

## Monitoring

- **Vercel Web Analytics and Speed Insights** (`app/layout.tsx`): cookieless page views and Core Web Vitals. Turn them on once in the Vercel project (Analytics and Speed Insights tabs); they do nothing elsewhere.
- **Server errors** are logged as one JSON line each by `instrumentation.ts` (`onRequestError`), with the route pattern only, never the real path, so guest tokens stay out of logs. Read them in Vercel under Logs.

## Legal pages

- `/privacy` and `/terms` describe what data is stored, why, and the rules of use. Linked from every page footer.
