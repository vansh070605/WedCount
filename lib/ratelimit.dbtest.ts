// Runs against a real, throwaway Postgres schema: `npm run test:db` (see scripts/test-db.mjs).
import { after, test } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "./db";
import { HOUR, hit } from "./ratelimit";

after(() => prisma.$disconnect());

test("parallel hits never let more than the limit through", async () => {
  const results = await Promise.all(Array.from({ length: 12 }, () => hit("burst", 5, HOUR)));
  assert.equal(results.filter(Boolean).length, 5);
});

test("a new window starts once the old one has passed", async () => {
  const t0 = new Date("2026-11-16T10:00:00Z");
  for (let i = 0; i < 5; i++) assert.equal(await hit("window", 5, HOUR, t0), true);
  assert.equal(await hit("window", 5, HOUR, new Date(t0.getTime() + 1000)), false);
  assert.equal(await hit("window", 5, HOUR, new Date(t0.getTime() + HOUR)), true);
  assert.equal((await prisma.rateLimit.findUnique({ where: { key: "window" } }))?.count, 1);
});
