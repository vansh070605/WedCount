import { test } from "node:test";
import assert from "node:assert/strict";
import { inviteLink, inviteMessage, whatsappUrl } from "./invite";

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
  assert.match(text, /by 1 December:\nhttps:\/\/wedcount\.app\/r\/abc\n/);
  assert.doesNotMatch(inviteMessage({ guestName: "A", weddingName: "B", link: "L", deadline: null }), / by /);
});

test("whatsappUrl uses digits only and encodes text, including & and newlines", () => {
  const url = whatsappUrl("+919876543210", "Priya & Rohit\nhttps://x.app/r/a?b");
  assert.equal(url, "https://wa.me/919876543210?text=Priya%20%26%20Rohit%0Ahttps%3A%2F%2Fx.app%2Fr%2Fa%3Fb");
});
