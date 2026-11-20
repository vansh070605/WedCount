import { test } from "node:test";
import assert from "node:assert/strict";
import { arrivalAt, deadlineText, minPickDate, pastProblem, closesAt, deadlineProblem, invitedEvents, isEventOpen, isRsvpOpen, istDate, parseNames, parseRsvpForm } from "./rsvp";

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
      status_e1: "attending", veg_e1: "2", nonveg_e1: "1", arrival_e1: "19:30", names_e1: "Ramesh Sharma\n\n  Sunita   Sharma \nAarav",
      status_e2: "declined", veg_e2: "5", arrival_e2: "20:00",
    }),
  );
  assert.deepEqual(errors, []);
  assert.deepEqual(rsvps[0], {
    eventId: "e1", status: "attending", vegCount: 2, nonVegCount: 1,
    arrivalTime: new Date("2026-12-10T19:30:00+05:30"),
    names: ["Ramesh Sharma", "Sunita Sharma", "Aarav"],
  });
  // Declined ignores counts and arrival even if the browser sent them.
  assert.deepEqual(rsvps[1], { eventId: "e2", status: "declined", vegCount: 0, nonVegCount: 0, arrivalTime: null, names: [] });
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

test("Coming needs one name per person; Maybe may leave names out but not add extra", () => {
  const coming = parseRsvpForm([events[0]], form({ status_e1: "attending", veg_e1: "2", names_e1: "Only One" }));
  assert.match(coming.errors[0], /names of all 2 people/);
  const maybe = parseRsvpForm([events[0]], form({ status_e1: "maybe", veg_e1: "2", names_e1: "Only One" }));
  assert.deepEqual(maybe.errors, []);
  assert.deepEqual(maybe.rsvps[0].names, ["Only One"]);
  const extra = parseRsvpForm([events[0]], form({ status_e1: "maybe", veg_e1: "1", names_e1: "A\nB" }));
  assert.match(extra.errors[0], /2 names for 1 person/);
});

test("parseNames splits lines, trims and drops blanks", () => {
  assert.deepEqual(parseNames(" A  B \r\n\n C "), ["A B", "C"]);
});

test("replies for a function close when its day begins in India", () => {
  const sangeet = events[0]; // 10 Dec, 7 pm IST
  assert.deepEqual(closesAt(sangeet), new Date("2026-12-10T00:00:00+05:30"));
  assert.equal(isEventOpen(sangeet, null, new Date("2026-12-09T23:59:00+05:30")), true);
  assert.equal(isEventOpen(sangeet, null, new Date("2026-12-10T00:00:00+05:30")), false);
  // The wedding deadline still closes everything earlier.
  assert.equal(isEventOpen(sangeet, new Date("2026-12-01T23:59:59+05:30"), new Date("2026-12-05T10:00:00+05:30")), false);
});

test("the RSVP deadline must fall before the first function's day", () => {
  assert.equal(deadlineProblem(new Date("2026-12-09T23:59:59+05:30"), events), null);
  assert.match(deadlineProblem(new Date("2026-12-10T23:59:59+05:30"), events)!, /before Sangeet/);
  assert.equal(deadlineProblem(null, events), null);
  assert.equal(deadlineProblem(new Date("2030-01-01"), []), null);
});

test("no invitation rows means every function; rows limit it", () => {
  assert.deepEqual(invitedEvents({}, events).map((e) => e.id), ["e1", "e2"]);
  assert.deepEqual(invitedEvents({ invitations: [{ eventId: "e2" }] }, events).map((e) => e.id), ["e2"]);
});

test("past dates are refused for new or changed values, and stay allowed when unchanged", () => {
  const now = new Date("2026-11-17T12:00:00+05:30");
  assert.equal(pastProblem(new Date("2026-11-17T18:00:00+05:30"), "function", now), null);
  assert.match(pastProblem(new Date("2026-11-16T18:00:00+05:30"), "function", now)!, /already passed/);
  assert.match(pastProblem(new Date("2026-11-16T23:59:59+05:30"), "deadline", now)!, /can't be in the past/);
  // Today's end-of-day deadline is still in the future.
  assert.equal(pastProblem(new Date("2026-11-17T23:59:59+05:30"), "deadline", now), null);
  const old = new Date("2025-02-14T19:00:00+05:30");
  assert.equal(pastProblem(old, "function", now, old), null);
  assert.equal(pastProblem(null, "deadline", now), null);
});

test("date pickers start today in India, or earlier when editing an older value", () => {
  const now = new Date("2026-11-16T20:00:00Z"); // already the 17th in India
  assert.equal(minPickDate(now), "2026-11-17");
  assert.equal(minPickDate(now, new Date("2025-02-14T19:00:00+05:30")), "2025-02-14");
  assert.equal(minPickDate(now, new Date("2026-12-10T19:00:00+05:30")), "2026-11-17");
});

test("arrival time lands on the day nearest the function", () => {
  const sangeet = new Date("2026-12-10T21:00:00+05:30");
  assert.deepEqual(arrivalAt(sangeet, "20:30"), new Date("2026-12-10T20:30:00+05:30"));
  assert.deepEqual(arrivalAt(sangeet, "01:00"), new Date("2026-12-11T01:00:00+05:30"));
  const haldi = new Date("2026-12-10T01:00:00+05:30");
  assert.deepEqual(arrivalAt(haldi, "23:30"), new Date("2026-12-09T23:30:00+05:30"));
});

test("deadlineText shows a time only when the planner set one", () => {
  assert.equal(deadlineText(new Date("2026-11-18T23:59:59+05:30")), "18 November");
  assert.match(deadlineText(new Date("2026-11-18T18:00:00+05:30")), /^18 November, 6:00\s?pm$/i);
});
