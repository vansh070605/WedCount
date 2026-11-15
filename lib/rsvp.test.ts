import { test } from "node:test";
import assert from "node:assert/strict";
import { isRsvpOpen, istDate, parseRsvpForm } from "./rsvp";

const events = [
  { id: "e1", name: "Sangeet", startsAt: new Date("2026-12-10T19:00:00+05:30") },
  { id: "e2", name: "Wedding", startsAt: new Date("2026-12-11T20:00:00+05:30") },
];
const form = (fields: Record<string, string>) => (key: string) => fields[key] ?? "";

test("istDate uses India's calendar, not UTC", () => {
  // 01:00 IST on the 11th is still the 10th in UTC.
  assert.equal(istDate(new Date("2026-12-11T01:00:00+05:30")), "2026-12-11");
});

test("isRsvpOpen allows up to the deadline and treats no deadline as open", () => {
  const deadline = new Date("2026-12-01T23:59:59+05:30");
  assert.equal(isRsvpOpen(deadline, new Date("2026-12-01T23:59:00+05:30")), true);
  assert.equal(isRsvpOpen(deadline, new Date("2026-12-02T00:00:00+05:30")), false);
  assert.equal(isRsvpOpen(null), true);
});

test("parseRsvpForm saves attending, declined and arrival time", () => {
  const { rsvps, errors } = parseRsvpForm(
    events,
    form({
      status_e1: "attending", veg_e1: "2", nonveg_e1: "1", arrival_e1: "19:30",
      status_e2: "declined", veg_e2: "5", arrival_e2: "20:00",
    }),
  );
  assert.deepEqual(errors, []);
  assert.deepEqual(rsvps[0], {
    eventId: "e1", status: "attending", vegCount: 2, nonVegCount: 1,
    arrivalTime: new Date("2026-12-10T19:30:00+05:30"),
  });
  // Declined ignores counts and arrival even if the browser sent them.
  assert.deepEqual(rsvps[1], { eventId: "e2", status: "declined", vegCount: 0, nonVegCount: 0, arrivalTime: null });
});

test("parseRsvpForm rejects missing answers, zero, too many, bad numbers and bad times", () => {
  const { rsvps, errors } = parseRsvpForm(
    [...events, { id: "e3", name: "Haldi", startsAt: events[0].startsAt }, { id: "e4", name: "Mehendi", startsAt: events[0].startsAt }, { id: "e5", name: "Reception", startsAt: events[0].startsAt }],
    form({
      status_e1: "maybe", veg_e1: "0", nonveg_e1: "0",
      status_e3: "attending", veg_e3: "15", nonveg_e3: "6",
      status_e4: "attending", veg_e4: "-1",
      status_e5: "attending", veg_e5: "1", arrival_e5: "25:00",
    }),
  );
  assert.equal(rsvps.length, 0);
  assert.deepEqual(errors.map((e) => e.split(":")[0]), ["Sangeet", "Wedding", "Haldi", "Mehendi", "Reception"]);
});

test("parseRsvpForm ignores fields for events not passed in", () => {
  const { rsvps } = parseRsvpForm([events[0]], form({ status_e1: "maybe", veg_e1: "1", status_other: "attending" }));
  assert.deepEqual(rsvps.map((r) => r.eventId), ["e1"]);
});
