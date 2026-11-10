# WedCount

WhatsApp-based guest RSVP and headcount prediction for Indian wedding planners.

## Status
Day 2: data model (Prisma + SQLite) with seed data.

## Run locally
```bash
cp .env.example .env
npm install
npm run db:migrate   # creates prisma/dev.db and seeds demo data
npm run dev
```
Open http://localhost:3000

## Build and lint
```bash
npm run build
npm run lint
```

## Data model
- **Wedding** has many **Events** (haldi, sangeet, wedding) and many **Guests**.
- **Rsvp** is one guest's answer for one event: status, veg and non-veg counts, arrival time.
- Headcount = vegCount + nonVegCount. No RSVP row means the guest has not replied.
- Each guest has a secret `token` for their personal invite link.
