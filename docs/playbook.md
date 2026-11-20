# Playbook

| | |
|---|---|
| Purpose | Exact, ordered procedures for the jobs that come up again and again |
| Read when | You are about to run, change, migrate, deploy or operate WedCount |

## 1. Run locally

Needs Node 20 or newer. No Docker.

```bash
npm install
cp .env.example .env
npx prisma dev --name wedcount --detach
npx prisma migrate deploy
npx prisma db seed
npm run dev
```

1. `prisma dev` prints a `postgres://` URL. If its port differs from the one in `.env`, update both `DATABASE_URL` and `DATABASE_URL_UNPOOLED`, keeping `127.0.0.1` and the extra parameters.
2. Open http://localhost:3000 and log in with the local demo account: `demo@wedcount.test` / `demo-planner-123`.
3. After a reboot, start the database again with `npx prisma dev --name wedcount --detach`.

## 2. Ship a change

1. Branch from `main`, named after the feature: `git checkout -b feat/<what>`.
2. Make the change. Reuse `lib/` helpers and `app/ui/kit.tsx` components.
3. Update the docs in the same branch if behaviour, data or a decision changed.
4. Run every check:

```bash
npm test
npm run test:db
npm run lint
npm run build
```

5. Check the change in a browser at desktop width and at 390 px.
6. Push and open a PR describing what changed, why, and how it was tested. GitHub Actions (`.github/workflows/ci.yml`) runs the same four checks against a fresh Postgres on every PR and push to `main`.
7. Merge with `gh pr merge <number> --merge`. Do not delete the branch.

## 3. Change the database schema

1. Edit `prisma/schema.prisma`.
2. Create and apply the migration locally:

```bash
npm run db:migrate -- --name <short_description>
```

   If that fails with `P3006 ... no schema has been selected` (the local `prisma dev` server cannot host Prisma's shadow database), write the migration from the difference between the local database and the schema instead, then apply it:

```bash
mkdir prisma/migrations/<timestamp>_<short_description>
npx prisma migrate diff --from-url "$DATABASE_URL_UNPOOLED" --to-schema-datamodel prisma/schema.prisma --script > prisma/migrations/<timestamp>_<short_description>/migration.sql
npx prisma migrate deploy
```

3. Restart `npm run dev`; the running server keeps the old Prisma client.
4. Commit the schema and the new folder under `prisma/migrations/`.
5. Production applies it on the next deploy (the `vercel-build` script runs `prisma migrate deploy`, see section 4).

Never edit a migration that has been applied anywhere. Never run `prisma migrate reset` against Neon.

## 4. Deploy (Vercel + Neon)

First time only:

1. In Vercel, import the GitHub repository as a new project (framework: Next.js).
2. In the project, open **Storage → Create Database → Neon** and connect it to the project. This creates the Neon database and adds its connection strings as environment variables.
3. In **Settings → Environment Variables**, check that the integration added `DATABASE_URL` (pooled, host contains `-pooler`) and `DATABASE_URL_UNPOOLED` (direct), then add:
   - `APP_URL`: the public URL, for example `https://wedcount.vercel.app`.
   - `RESEND_API_KEY` (mark it Sensitive): from resend.com, **API Keys → Create API Key**, permission "Sending access".
   - `MAIL_FROM` (optional until you own a domain): `WedCount <no-reply@your-domain>`.
4. Deploy. Vercel runs the `vercel-build` script from `package.json` (`prisma migrate deploy && next build`), so migrations apply before each build.
5. After the first deploy, open `/signup` and create the first real account.

Every later deploy: merge to `main`. Vercel builds, applies pending migrations, and promotes.

## 5. Run a real wedding

1. Create the wedding with its RSVP deadline (end of that day in IST).
2. Add every function with date, time and venue before inviting anyone.
3. Import guests from the family's sheet (`name,phone,side,relation`). Fix any line the import reports and import again.
4. Send invites with the WhatsApp button, one guest at a time. The guest list shows who has not been sent one.
5. Every two days, open **Reminders** and send the ones that are due.
6. Three days before each function, download the caterer CSV and share the **Expected** column and range, not the Coming count.
7. The day after each function, enter how many people actually came. This calibrates the next wedding.

## 6. When something breaks

1. Reproduce it. Note the URL, the account, and what you expected.
2. Check Vercel **Logs** for the request, and the Neon dashboard for connection or storage limits.
3. If a deploy caused it, use **Instant Rollback** in Vercel to the previous deployment, then fix forward on a branch.
4. If data is wrong, do not edit it by hand in production. Restore from a Neon branch at a point before the problem, or write a migration.
5. Add a test that fails without the fix, then fix it.
