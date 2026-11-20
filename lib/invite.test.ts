import { test } from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_INVITE_TEMPLATE, inviteLink, inviteMessage, joinMessage, templateProblem, whatsappUrl } from "./invite";

test("inviteLink joins base and token without double slashes", () => {
  assert.equal(inviteLink("abc_-1", "https://wedcount.app"), "https://wedcount.app/r/abc_-1");
});

test("inviteMessage includes the link and the deadline as an IST date", () => {
  const text = inviteMessage({
    guestName: "Sharma Uncle",
    weddingName: "Priya & Rohit",
    link: "https://wedcount.app/r/abc",
    // 20:00 UTC on 30 Nov is already 1 Dec in India.
    deadline: new Date("2026-11-30T20:00:00Z"),
  });
  assert.match(text, /^Namaste Sharma Uncle!/);
  assert.match(text, /by 1 December, 1:30\s?am so we can plan for you:\nhttps:\/\/wedcount\.app\/r\/abc\n/i);
  // The usual end-of-day deadline shows only the date.
  const eod = inviteMessage({ guestName: "A", weddingName: "B", link: "L", deadline: new Date("2026-12-01T23:59:59+05:30") });
  assert.match(eod, /by 1 December so we can plan for you:\nL/);
  assert.doesNotMatch(eod, /\n\n\n/); // no functions: the empty schedule leaves no gap
  assert.match(inviteMessage({ guestName: "A", weddingName: "B", link: "L", deadline: null }), /as soon as you can/);
});

test("whatsappUrl uses digits only and encodes text, including & and newlines", () => {
  const url = whatsappUrl("+919876543210", "Priya & Rohit\nhttps://x.app/r/a?b");
  assert.equal(url, "https://wa.me/919876543210?text=Priya%20%26%20Rohit%0Ahttps%3A%2F%2Fx.app%2Fr%2Fa%3Fb");
});

test("inviteMessage names only the guest's functions and fills a custom template", () => {
  const base = { guestName: "Neha", weddingName: "Priya & Rohit", link: "L", deadline: null };
  const fns = [
    { name: "Sangeet", startsAt: new Date("2026-12-10T19:00:00+05:30"), venue: "Rambagh Lawns" },
    { name: "Reception", startsAt: new Date("2026-12-12T20:00:00+05:30") },
  ];
  assert.match(inviteMessage({ ...base, functions: fns, template: "Join us for {functions}: {link}" }), /for the Sangeet and Reception/);
  const text = inviteMessage({ ...base, functions: fns });
  assert.match(text, /\*Sangeet\*\nThu, 10 Dec, 7:00\s?pm · Rambagh Lawns\n\n\*Reception\*\nSat, 12 Dec, 8:00\s?pm\n/i);
  assert.equal(
    inviteMessage({ ...base, template: "Hi {name}, {wedding}! {unknown} {link}" }),
    "Hi Neha, Priya & Rohit! {unknown} L",
  );
});

test("templateProblem needs {link}, known placeholders and a sane length", () => {
  assert.equal(templateProblem(DEFAULT_INVITE_TEMPLATE), null);
  assert.match(templateProblem("Hi {name}")!, /\{link\}/);
  assert.match(templateProblem("{link} {guest}")!, /Unknown placeholder: \{guest\}/);
  assert.match(templateProblem("{link}" + "x".repeat(1000))!, /under 1000/);
});

test("joinMessage lists the functions and the shared link", () => {
  const text = joinMessage({
    weddingName: "Priya & Rohit",
    city: "Jaipur",
    link: "https://x.app/w/c",
    deadline: null,
    events: [{ name: "Haldi", startsAt: new Date("2026-12-10T10:00:00+05:30"), venue: "Family home" }],
  });
  assert.match(text, /^You're invited to celebrate \*Priya & Rohit\* in Jaipur!\n\n\*Haldi\*\nThu, 10 Dec, 10:00\s?am · Family home\n\nOpen your invitation and reply:\nhttps:\/\/x\.app\/w\/c$/i);
});
