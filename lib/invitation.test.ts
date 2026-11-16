import { test } from "node:test";
import assert from "node:assert/strict";
import { coupleNames, functionTone, initials, mapsUrl, themeOf } from "./invitation";

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
