import { test } from "node:test";
import assert from "node:assert/strict";
import { HOUR, clientIp, limitKey, nextWindow } from "./ratelimit";

const t0 = new Date("2026-11-16T10:00:00Z");
const at = (ms: number) => new Date(t0.getTime() + ms);

test("first action opens a window", () => {
  assert.deepEqual(nextWindow(null, t0, 5, HOUR), { allowed: true, reset: true, count: 1, windowStart: t0 });
});

test("actions count up to the limit, then stop", () => {
  let row = { count: 1, windowStart: t0 };
  for (let i = 2; i <= 5; i++) {
    const n = nextWindow(row, at(i * 1000), 5, HOUR);
    assert.equal(n.allowed, true);
    assert.equal(n.count, i);
    row = { count: n.count, windowStart: n.windowStart };
  }
  assert.equal(nextWindow(row, at(10_000), 5, HOUR).allowed, false);
});

test("a new window starts once the old one has passed", () => {
  const n = nextWindow({ count: 5, windowStart: t0 }, at(HOUR), 5, HOUR);
  assert.equal(n.allowed, true);
  assert.equal(n.reset, true);
  assert.equal(n.count, 1);
});

test("keys hide the IP and differ per action", () => {
  const k = limitKey("signup", "1.2.3.4");
  assert.match(k, /^[0-9a-f]{64}$/);
  assert.ok(!k.includes("1.2.3.4"));
  assert.notEqual(k, limitKey("login", "1.2.3.4"));
});

test("client IP is the first forwarded address", () => {
  assert.equal(clientIp(new Headers({ "x-forwarded-for": "9.9.9.9, 10.0.0.1" })), "9.9.9.9");
  assert.equal(clientIp(new Headers({ "x-real-ip": "8.8.8.8" })), "8.8.8.8");
  assert.equal(clientIp(new Headers()), "local");
});
