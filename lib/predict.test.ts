import { test } from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_PARTY, SHOW_RATE, calibrationFactor, errorPct, predictEvent } from "./predict";

const reply = (status: string, vegCount: number, nonVegCount = 0) => ({ eventId: "e1", status, vegCount, nonVegCount });

test("predictEvent weights each answer by its show rate", () => {
  const guests = [
    { relation: "family", rsvps: [reply("attending", 4)] }, // 4 * 0.95 = 3.8
    { relation: "colleague", rsvps: [reply("maybe", 2)] }, // 2 * 0.3 = 0.6
    { relation: "friend", rsvps: [reply("declined", 0)] }, // 0
  ];
  assert.equal(predictEvent("e1", guests).expected, Math.round(4 * 0.95 + 2 * 0.3));
});

test("no-reply guests count at the event's average party size", () => {
  const guests = [
    { relation: "family", rsvps: [reply("attending", 3)] },
    { relation: "family", rsvps: [reply("attending", 1)] },
    { relation: "friend", rsvps: [] }, // avg party 2 * 0.2
  ];
  const p = predictEvent("e1", guests);
  assert.equal(p.expected, Math.round(3 * 0.95 + 1 * 0.95 + 2 * SHOW_RATE.noReply.friend));
});

test("with no replies at all, parties default to DEFAULT_PARTY", () => {
  const guests = Array.from({ length: 10 }, () => ({ relation: "family", rsvps: [] }));
  assert.equal(predictEvent("e1", guests).expected, Math.round(10 * DEFAULT_PARTY * SHOW_RATE.noReply.family));
});

test("range contains the estimate, never goes negative, and is zero-width when certain", () => {
  const guests = Array.from({ length: 50 }, (_, i) => ({
    relation: ["family", "friend", "colleague", "other"][i % 4],
    rsvps: i % 3 ? [reply(i % 2 ? "attending" : "maybe", 2, 1)] : [],
  }));
  const p = predictEvent("e1", guests);
  assert.ok(p.low <= p.expected && p.expected <= p.high);
  assert.ok(p.low >= 0);
  assert.deepEqual(predictEvent("e1", []), { expected: 0, low: 0, high: 0 });
});

test("unknown relation falls back to 'other'", () => {
  const a = predictEvent("e1", [{ relation: "neighbour", rsvps: [reply("attending", 10)] }]);
  assert.equal(a.expected, Math.round(10 * SHOW_RATE.attending.other));
});

test("calibration factor scales the prediction", () => {
  const guests = [{ relation: "family", rsvps: [reply("attending", 100)] }];
  assert.equal(predictEvent("e1", guests, 0.8).expected, Math.round(95 * 0.8));
});

test("calibrationFactor starts at 1, learns from history, and is capped", () => {
  assert.equal(calibrationFactor([]), 1);
  // Over-predicted 400 vs 300 actual: pulled toward 1 by the prior.
  assert.equal(calibrationFactor([{ predicted: 400, actual: 300 }]), 400 / 500);
  // Lots of history dominates the prior.
  const many = calibrationFactor(Array.from({ length: 20 }, () => ({ predicted: 200, actual: 150 })));
  assert.ok(many > 0.75 && many < 0.76);
  assert.equal(calibrationFactor([{ predicted: 100, actual: 10_000 }]), 1.5);
});

test("errorPct is signed and safe at zero", () => {
  assert.equal(errorPct(110, 100), 10);
  assert.equal(errorPct(90, 100), -10);
  assert.equal(errorPct(0, 0), 0);
  assert.equal(errorPct(5, 0), 100);
});

test("guests not invited to a function add nothing to its prediction", () => {
  const invitedElsewhere = { relation: "family", rsvps: [], invitations: [{ eventId: "other" }] };
  assert.deepEqual(predictEvent("e", [invitedElsewhere]), { expected: 0, low: 0, high: 0 });
});
