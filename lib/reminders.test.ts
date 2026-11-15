import { test } from "node:test";
import assert from "node:assert/strict";
import { ago, missingEvents, reminderStatus } from "./reminders";
import { reminderMessage } from "./invite";

const events = [{ id: "e1" }, { id: "e2" }];
const now = new Date("2026-11-20T12:00:00+05:30");
const daysBefore = (n: number) => new Date(now.getTime() - n * 24 * 60 * 60 * 1000);
const guest = (o: Partial<{ invitedAt: Date | null; remindedAt: Date | null; rsvps: { eventId: string }[] }>) => ({
  invitedAt: null,
  remindedAt: null,
  rsvps: [],
  ...o,
});

test("reminderStatus: complete beats everything else", () => {
  const g = guest({ rsvps: [{ eventId: "e1" }, { eventId: "e2" }] });
  assert.equal(reminderStatus(g, events, daysBefore(1), now), "complete");
});

test("reminderStatus: never invited means invite first, not remind", () => {
  assert.equal(reminderStatus(guest({}), events, null, now), "not-invited");
});

test("reminderStatus: closed after the deadline", () => {
  assert.equal(reminderStatus(guest({ invitedAt: daysBefore(10) }), events, daysBefore(1), now), "closed");
});

test("reminderStatus: waits 2 days after the last invite or reminder", () => {
  assert.equal(reminderStatus(guest({ invitedAt: daysBefore(1) }), events, null, now), "recent");
  assert.equal(reminderStatus(guest({ invitedAt: daysBefore(2) }), events, null, now), "due");
  // A recent reminder resets the clock even if the invite is old.
  assert.equal(reminderStatus(guest({ invitedAt: daysBefore(9), remindedAt: daysBefore(1) }), events, null, now), "recent");
  // Partly replied guests still get nudged for the rest.
  assert.equal(reminderStatus(guest({ invitedAt: daysBefore(5), rsvps: [{ eventId: "e1" }] }), events, null, now), "due");
});

test("missingEvents keeps order and only unanswered events", () => {
  assert.deepEqual(missingEvents({ rsvps: [{ eventId: "e1" }] }, events), [{ id: "e2" }]);
});

test("ago reads naturally", () => {
  assert.equal(ago(now, now), "today");
  assert.equal(ago(daysBefore(1), now), "yesterday");
  assert.equal(ago(daysBefore(5), now), "5 days ago");
});

test("reminderMessage names the missing functions and the deadline", () => {
  const text = reminderMessage({
    guestName: "Sharma Uncle",
    weddingName: "Priya & Rohit",
    link: "https://x.app/r/abc",
    deadline: new Date("2026-12-01T23:59:59+05:30"),
    missing: ["Haldi", "Sangeet", "Wedding"],
  });
  assert.match(text, /reply for Haldi, Sangeet and Wedding yet/);
  assert.match(text, /by 1 December so we can plan the food:\nhttps:\/\/x\.app\/r\/abc$/);
  assert.match(reminderMessage({ guestName: "A", weddingName: "B", link: "L", deadline: null, missing: ["Haldi"] }), /reply for Haldi yet/);
});
