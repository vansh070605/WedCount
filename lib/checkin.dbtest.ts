// Runs against a real, throwaway Postgres schema: `npm run test:db` (see scripts/test-db.mjs).
import { after, test } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "./db";
import { checkIn, doorOpen } from "./checkin";

after(() => prisma.$disconnect());

test("door opens at midnight IST on the function's day", () => {
  const sangeet = { startsAt: new Date("2026-12-10T19:00:00+05:30") };
  assert.equal(doorOpen(sangeet, new Date("2026-12-09T23:59:00+05:30")), false);
  assert.equal(doorOpen(sangeet, new Date("2026-12-10T00:00:00+05:30")), true);
  assert.equal(doorOpen(sangeet, new Date("2026-12-11T02:00:00+05:30")), true);
});

test("check-ins add up to the function's turnout and never go below zero", async () => {
  const p = await prisma.planner.create({ data: { email: "door@test.test", name: "Door", passwordHash: "x" } });
  const w = await prisma.wedding.create({
    data: {
      plannerId: p.id,
      name: "W",
      events: { create: { name: "Sangeet", startsAt: new Date("2026-12-10T19:00:00+05:30") } },
      guests: {
        create: [
          { name: "A", phone: "+919000000001", side: "bride", relation: "family", token: "door-a" },
          { name: "B", phone: "+919000000002", side: "groom", relation: "friend", token: "door-b" },
        ],
      },
    },
    include: { events: true, guests: true },
  });
  const [e] = w.events;
  const [a, b] = w.guests;
  await Promise.all([checkIn(e.id, a.id, 1), checkIn(e.id, a.id, 1), checkIn(e.id, b.id, 1)]);
  await checkIn(e.id, b.id, -1);
  await checkIn(e.id, b.id, -1);
  const arrivals = await prisma.arrival.findMany({ where: { eventId: e.id }, orderBy: { guestId: "asc" } });
  assert.deepEqual(arrivals.map((r) => [r.guestId, r.people]).sort(), [[a.id, 2], [b.id, 0]].sort());
  assert.equal((await prisma.event.findUnique({ where: { id: e.id } }))?.actualCount, 2);
});
