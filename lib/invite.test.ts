import { test } from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_INVITE_TEMPLATE, inviteLink, inviteMessage, templateProblem, whatsappUrl } from "./invite";

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
  assert.match(text, /by 1 December, 1:30\s?am:\nhttps:\/\/wedcount\.app\/r\/abc\n/i);
  // The usual end-of-day deadline shows only the date.
  const eod = inviteMessage({ guestName: "A", weddingName: "B", link: "L", deadline: new Date("2026-12-01T23:59:59+05:30") });
  assert.match(eod, /by 1 December:\nL/);
  assert.match(inviteMessage({ guestName: "A", weddingName: "B", link: "L", deadline: null }), /as soon as you can/);
});

test("whatsappUrl uses digits only and encodes text, including & and newlines", () => {
  const url = whatsappUrl("+919876543210", "Priya & Rohit\nhttps://x.app/r/a?b");
  assert.equal(url, "https://wa.me/919876543210?text=Priya%20%26%20Rohit%0Ahttps%3A%2F%2Fx.app%2Fr%2Fa%3Fb");
});

test("inviteMessage names only the guest's functions and fills a custom template", () => {
  const base = { guestName: "Neha", weddingName: "Priya & Rohit", link: "L", deadline: null };
  assert.match(inviteMessage({ ...base, functions: ["Sangeet", "Reception"] }), /for the Sangeet and Reception/);
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
