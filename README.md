# WedCount

WhatsApp-based guest RSVP and headcount prediction for Indian wedding planners.

## Status
Day 3: planner signup/login, create weddings, add guests by hand or CSV import.

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

## Security notes
- Passwords hashed with scrypt (Node built-in). Sessions stored server-side; DB keeps only a SHA-256 of the cookie token.
- Every wedding query is scoped to the logged-in planner; other planners' weddings return 404.
