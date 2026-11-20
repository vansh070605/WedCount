import { test } from "node:test";
import assert from "node:assert/strict";
import { clientIp, limitKey } from "./ratelimit";

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
