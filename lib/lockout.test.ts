import { test } from "node:test";
import assert from "node:assert/strict";
import { LOCK_MINUTES, MAX_FAILED_LOGINS, afterFailure, isLocked } from "./lockout";

const now = new Date("2026-11-20T12:00:00Z");

test("isLocked only while lockedUntil is in the future", () => {
  assert.equal(isLocked(null, now), false);
  assert.equal(isLocked(new Date(now.getTime() + 1000), now), true);
  assert.equal(isLocked(new Date(now.getTime() - 1000), now), false);
});

test("afterFailure locks on the 5th wrong try and resets the count", () => {
  // failedLogins passed in is the count after this failure was added.
  for (let n = 1; n < MAX_FAILED_LOGINS; n++) assert.deepEqual(afterFailure(n, now), { failedLogins: n, lockedUntil: null });
  const locked = afterFailure(MAX_FAILED_LOGINS, now);
  assert.equal(locked.failedLogins, 0);
  assert.equal(locked.lockedUntil!.getTime() - now.getTime(), LOCK_MINUTES * 60 * 1000);
});
