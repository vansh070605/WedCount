# WedCount

WhatsApp-based guest RSVP and headcount prediction for Indian wedding planners.

## Status
Day 5: planners send each guest their invite on WhatsApp in one click.

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

## Sending invites
- Each guest row has a **WhatsApp** button. It opens WhatsApp (app or web) to that guest's number with the invite message and their personal link already typed. The planner presses send.
- **Copy link** copies just the link, for SMS or email.
- Links use `APP_URL` from `.env`. In production the app refuses to start sending links if `APP_URL` is missing, so guests never get a `localhost` link.

## Security notes
- Passwords hashed with scrypt (Node built-in). Sessions stored server-side; DB keeps only a SHA-256 of the cookie token.
- Every wedding query is scoped to the logged-in planner; other planners' weddings return 404.
