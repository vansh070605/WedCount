import { test } from "node:test";
import assert from "node:assert/strict";
import { RESET_MINUTES, hashToken, isUsable, newResetToken, resetEmail, resetExpiry } from "./reset";

test("tokens are long, random and hashed for storage", () => {
  const a = newResetToken();
  assert.ok(a.length >= 43);
  assert.notEqual(a, newResetToken());
  assert.match(hashToken(a), /^[0-9a-f]{64}$/);
  assert.notEqual(hashToken(a), a);
});

test("a link works until it expires or is used", () => {
  const now = new Date("2026-11-16T10:00:00Z");
  const expiresAt = resetExpiry(now);
  assert.equal(expiresAt.getTime() - now.getTime(), RESET_MINUTES * 60 * 1000);
  assert.equal(isUsable({ expiresAt, usedAt: null }, now), true);
  assert.equal(isUsable({ expiresAt, usedAt: now }, now), false);
  assert.equal(isUsable({ expiresAt, usedAt: null }, expiresAt), false);
  assert.equal(isUsable(null, now), false);
});

test("the email carries the link and escapes the name in HTML", () => {
  const link = "https://wedcount.vercel.app/reset-password/abc";
  const m = resetEmail({ name: "<b>Priya</b>", link });
  assert.ok(m.text.includes(link));
  assert.ok(m.html.includes(link));
  assert.ok(!m.html.includes("<b>Priya</b>"));
});
