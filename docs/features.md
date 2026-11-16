# Features

| | |
|---|---|
| Purpose | Every shipped feature, how it behaves, and where its code lives |
| Read when | Before building something, to check whether it already exists |

## Accounts and sessions

- **Sign up and log in** with email and password (minimum 8 characters). Emails are stored lower-case. Code: `signup`, `login`, `logout` in `app/actions.ts`.
- **Sessions** last 30 days in an httpOnly cookie. The database stores only the SHA-256 of the token, and expired sessions are cleaned up at each login. Code: `lib/auth.ts`.
- **Login lockout**: after 5 wrong passwords the account pauses for 15 minutes. The state lives in the database so it holds across serverless instances, and every failure shows the same message so nobody can tell which emails exist. Code: `lib/lockout.ts`.

## Weddings, functions and guests

- **Weddings** have a name, city and optional RSVP deadline. The dashboard (`/dashboard`) lists them with reply progress and the next function.
- **Functions** (Haldi, Sangeet, ...) have a name, start time and venue. Add on the wedding page, edit or delete at `/weddings/[id]/events/[eventId]`.
- **Guests** have a name, phone, side (bride or groom) and relation (family, friend, colleague, other). Add one at a time, or import a CSV. Edit or delete at `/weddings/[id]/guests/[guestId]`.
- **Phone numbers** are normalised to `+91XXXXXXXXXX`, so `98765 43210` and `+91-98765-43210` are the same guest. A wedding cannot hold the same phone twice. Code: `normalizePhone` in `lib/guests.ts`.
- **CSV import** follows RFC 4180 (quoted names with commas work). If any row is invalid nothing is imported, and each error names its line. Guests already on the list are skipped. Code: `parseCsv`, `parseGuestCsv` in `lib/guests.ts`.

```csv
name,phone,side,relation
Sharma Uncle,98765 43210,bride,family
"Sharma, Ramesh",+91 90000 11111,groom,friend
```

## Invites and reminders

- **Personal link** per guest: `/r/<token>`, where the token is 128 random bits. Code: `newGuestToken` in `lib/guests.ts`, `inviteLink` in `lib/invite.ts`.
- **One-tap WhatsApp**: the button opens `wa.me` with the guest's number and a ready message containing their link and the deadline. The app records when the planner tapped (not proof of delivery). Code: `whatsappUrl`, `inviteMessage` in `lib/invite.ts`, `markSent` in `app/actions.ts`.
- **Reminders**: a guest is due a reminder when they were invited, still have unanswered functions, and have been quiet for at least 2 days since the last invite or reminder. The reminder names only the missing functions. Code: `lib/reminders.ts`, `reminderMessage` in `lib/invite.ts`.

## Guest RSVP page

- Styled as an invitation; no login, no app.
- For each function: Coming, Maybe or Can't come; veg and non-veg counts (party size is their sum, up to 20); arrival time.
- Saves in one transaction, so a guest never ends up with half their functions saved. Can be changed until the deadline (end of that day in IST), then shown read only.
- Works before JavaScript loads (server action fallback). Code: `app/r/[token]/page.tsx`, `app/ui/rsvp-form.tsx`, `lib/rsvp.ts`.

## Headcount and export

- **Per-function table** on the wedding page: Coming (replies and people), veg, non-veg, Maybe, Can't come, No reply, and Expected. Phones get cards instead of the table. Code: `countHeadcount` in `lib/headcount.ts`.
- **Caterer CSV** at `/weddings/[id]/export`: one row per function with expected people, range and the food split. Cells are protected against spreadsheet formula injection. Code: `app/weddings/[id]/export/route.ts`, `csvCell` in `lib/headcount.ts`.

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

## Legal pages

- `/privacy` and `/terms` describe what data is stored, why, and the rules of use. Linked from every page footer.
