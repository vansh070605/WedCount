import { test } from "node:test";
import assert from "node:assert/strict";
import { calendarUrl, coupleNames, functionTone, initials, mapsUrl, parseMapLink, themeOf } from "./invitation";

test("themeOf falls back to royal for unknown values", () => {
  assert.equal(themeOf("sindoor"), "sindoor");
  assert.equal(themeOf("neon"), "royal");
  assert.equal(themeOf(null), "royal");
});

test("functionTone recognises common function names", () => {
  assert.equal(functionTone("Haldi"), "#e0a800");
  assert.equal(functionTone("Mehndi night"), "#3f7d3a");
  assert.equal(functionTone("Shaadi"), "#b3122e");
  assert.equal(functionTone("Puja"), null);
});

test("coupleNames prefers explicit names, then splits the wedding name", () => {
  assert.deepEqual(coupleNames({ name: "X", brideName: "Priyanka", groomName: "Sanjeev" }), ["Priyanka", "Sanjeev"]);
  assert.deepEqual(coupleNames({ name: "Demo: Priya & Rohit" }), ["Priya", "Rohit"]);
  assert.deepEqual(coupleNames({ name: "Ananya weds Kabir" }), ["Ananya", "Kabir"]);
  assert.equal(coupleNames({ name: "Sharma family wedding" }), null);
});

test("initials for the seal", () => {
  assert.equal(initials({ name: "Priya & Rohit" }), "PR");
  assert.equal(initials({ name: "Sharma family wedding" }), "SH");
});

test("mapsUrl searches venue and city", () => {
  assert.equal(mapsUrl("Rambagh Lawns", "Jaipur"), "https://www.google.com/maps/search/?api=1&query=Rambagh%20Lawns%2C%20Jaipur");
});

test("parseMapLink takes Google Maps links only", () => {
  assert.deepEqual(parseMapLink(" https://maps.app.goo.gl/AbC123 "), { url: "https://maps.app.goo.gl/AbC123" });
  assert.ok("url" in parseMapLink("https://www.google.com/maps/place/Radisson+Blu/@12.9,80.2,17z"));
  assert.ok("url" in parseMapLink("https://goo.gl/maps/xyz"));
  for (const bad of ["maps.app.goo.gl/x", "http://maps.app.goo.gl/x", "https://evil.com/maps", "https://www.google.com/search?q=x", "https://maps.app.goo.gl.evil.com/x", "javascript:alert(1)"])
    assert.ok("error" in parseMapLink(bad), bad);
});

test("calendarUrl builds a 3-hour Google Calendar event in UTC", () => {
  const url = new URL(calendarUrl({ name: "Haldi", startsAt: new Date("2026-11-22T18:00:00+05:30"), venue: "Radisson Blu" }, "A & B"));
  assert.equal(url.searchParams.get("dates"), "20261122T123000Z/20261122T153000Z");
  assert.equal(url.searchParams.get("location"), "Radisson Blu");
  assert.equal(url.searchParams.get("text"), "Haldi · A & B");
});
