# Tips

| | |
|---|---|
| Purpose | Practical advice that saves time, for planners and for developers |
| Read when | You use WedCount for a real wedding, or start working on the code |

## For planners

- **Add every function before inviting.** Guests answer for the functions that exist when they open the link. Functions added later show up for them too, but they may not come back to answer.
- **Import from the family's sheet.** Ask for one sheet with `name, phone, side, relation`. Relation matters: family turns up far more often than colleagues, and the expected count uses it.
- **One phone per household.** Invite the person who will answer for the family, and let them enter the party size. Two invites to one household double-count.
- **Give the caterer the Expected number and range, not Coming.** Coming is what people said; Expected is what usually happens.
- **Send reminders when they are due, not before.** The app spaces them at least two days apart so families do not feel chased.
- **Record real turnout the next day.** It takes a minute and makes the next wedding's estimate better.
- **Set the RSVP deadline a few days before the first function.** Caterers need a final number early.

## For developers

- **Pure logic goes in `lib/`, with a test next to it.** Pages and actions should only load data, call `lib/`, and render.
- **Use the kit.** `Button`, `ButtonLink`, `Card`, `Stat`, `Badge`, `PageHeader` and `inputClass` in `app/ui/kit.tsx` keep every screen consistent. New colours go in `app/globals.css` as tokens.
- **Check ownership with `lib/owned.ts`**, never with a hand-written `where`.
- **Test forms with JavaScript off.** Guests on slow phones submit before hydration; the server action fallback must work.
- **Use IST helpers** (`istDate` in `lib/rsvp.ts`) for any date a person reads. Server time on Vercel is UTC.
- **Run `npx next typegen` after adding a route**, so `PageProps<"/route">` and `RouteContext` types know about it.
- **Read the bundled Next.js docs** in `node_modules/next/dist/docs/` before using a Next.js API. Version 16 differs from older tutorials.
- **Seed is re-runnable.** `npx prisma db seed` wipes and recreates only the demo planner.
