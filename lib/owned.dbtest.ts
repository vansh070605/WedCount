// Runs against a real, throwaway Postgres schema: `npm run test:db` (see scripts/test-db.mjs).
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "./db";
import { findOwnedEvent, findOwnedGuest, findOwnedWedding } from "./owned";

let alice: string, bob: string, wedding: string, event: string, guest: string;

before(async () => {
  alice = (await prisma.planner.create({ data: { email: "alice@test.test", name: "Alice", passwordHash: "x" } })).id;
  bob = (await prisma.planner.create({ data: { email: "bob@test.test", name: "Bob", passwordHash: "x" } })).id;
  const w = await prisma.wedding.create({
    data: {
      plannerId: alice,
      name: "Alice's wedding",
      events: { create: { name: "Sangeet", startsAt: new Date("2026-12-10T19:00:00+05:30") } },
      guests: { create: { name: "Guest", phone: "+919876543210", side: "bride", relation: "family", token: "t1" } },
    },
    include: { events: true, guests: true },
  });
  wedding = w.id;
  event = w.events[0].id;
  guest = w.guests[0].id;
});

after(() => prisma.$disconnect());

test("the owner can reach their wedding, its functions and guests", async () => {
  assert.equal((await findOwnedWedding(alice, wedding))?.id, wedding);
  assert.equal((await findOwnedEvent(alice, event))?.weddingId, wedding);
  assert.equal((await findOwnedGuest(alice, guest))?.weddingId, wedding);
});

test("another planner gets nothing back for the same ids", async () => {
  assert.equal(await findOwnedWedding(bob, wedding), null);
  assert.equal(await findOwnedEvent(bob, event), null);
  assert.equal(await findOwnedGuest(bob, guest), null);
});

test("made-up ids return nothing", async () => {
  assert.equal(await findOwnedWedding(alice, "nope"), null);
  assert.equal(await findOwnedGuest(alice, "nope"), null);
});
