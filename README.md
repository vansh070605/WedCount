# WedCount

WhatsApp-based guest RSVP and headcount prediction for Indian wedding planners.

## Status
Day 9: hardening before going live (login lockout, race-safe saves, error pages). Deploy and Postgres come next.

## Run locally
```bash
cp .env.example .env
npm install
npm run db:migrate   # creates prisma/dev.db and seeds demo data
npm run dev
```
Open http://localhost:3000

Demo login (local seed data only): `demo@wedcount.test` / `demo-planner-123`

## Build and lint
```bash
npm run build
npm run lint
npm test
```

## Data model
- **Wedding** has many **Events** (haldi, sangeet, wedding) and many **Guests**.
- **Rsvp** is one guest's answer for one event: status, veg and non-veg counts, arrival time.
- Headcount = vegCount + nonVegCount. No RSVP row means the guest has not replied.
- Each guest has a secret `token` for their personal invite link.

## Guest CSV format
```csv
name,phone,side,relation
Sharma Uncle,98765 43210,bride,family
College Friend,+91 90000 11111,groom,friend
```
- `side` is `bride` or `groom`. `relation` is `family`, `friend`, `colleague` or `other` (defaults to `other`).
- Phones are Indian mobiles in any common format; stored as `+91XXXXXXXXXX`.
- If any row is invalid, nothing is imported. Guests already on the list are skipped.

## Guest RSVP
- Each guest has a private link `/r/<token>`. The token is 128 random bits; it is the guest's only credential.
- Per function: Coming / Maybe / Can't come, veg and non-veg counts (max 20), optional arrival time (IST).
- Guests can change their reply until the wedding's RSVP deadline (end of that day, IST). After it, the page is read-only.

## Headcount
- Wedding page shows, per function: people **Coming** (with veg / non-veg split), people who said **Maybe**, and invites that said **Can't come** or haven't replied.
- Guest list shows each guest's reply per function.
- **Download for caterer (CSV)** gives one row per function with those numbers. Opens cleanly in Excel (UTF-8, formula-safe).
- Planners add functions (Haldi, Sangeet, ...) with date, time in IST and venue.

## Expected turnout
RSVPs overpromise: people say "Coming" and don't show, and some who never replied turn up. WedCount gives the caterer one number per function, with a range.

- **Model:** each guest's party comes or doesn't with a probability that depends on their answer and relation:

  | | Family | Friend | Colleague | Other |
  |---|---|---|---|---|
  | Coming | 0.95 | 0.85 | 0.75 | 0.80 |
  | Maybe | 0.60 | 0.45 | 0.30 | 0.40 |
  | No reply | 0.35 | 0.20 | 0.10 | 0.15 |

  Coming / Maybe use the stated party size; No reply uses the function's average party size; Can't come counts 0.
  Expected = sum(size x p). The range is +/- 1.645 standard deviations (about 90%), treating parties as independent.
- **These rates are starting assumptions, not measured data.** After each function the planner enters how many people actually came. The app then scales predictions by `(actual + 100) / (predicted + 100)` across all their past functions (capped 0.5 to 1.5), so a planner whose guests show up less than assumed gets lower numbers next time.
- **Accuracy is shown, not claimed:** for every recorded function the page compares the expected number and the naive "count only Coming" number against what really happened.
- The caterer CSV includes Expected, low and high.

## Reminders
- Clicking a WhatsApp invite or reminder button records the time (a click, not proof of delivery). The guest list shows "Invited today / 3 days ago" or "Not invited yet".
- The **Reminders** section lists guests who were invited, still haven't answered every function, and haven't been contacted in the last 2 days.
- The reminder message names the functions they haven't answered and the deadline.
- After the RSVP deadline, reminders switch off.

## Sending invites
- Each guest row has a **WhatsApp** button. It opens WhatsApp (app or web) to that guest's number with the invite message and their personal link already typed. The planner presses send.
- **Copy link** copies just the link, for SMS or email.
- Links use `APP_URL` from `.env`. In production the app refuses to start sending links if `APP_URL` is missing, so guests never get a `localhost` link.

## Security notes
- Passwords hashed with scrypt (Node built-in). Sessions stored server-side; DB keeps only a SHA-256 of the cookie token.
- Every wedding query is scoped to the logged-in planner; other planners' weddings return 404.
- Login pauses for 15 minutes after 5 wrong passwords (stored in the DB, so it holds across server instances). Every failure shows the same message, so nobody can tell which emails have accounts.
- Two requests saving the same email or phone at once get a clear message instead of a crash.
