import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizePhone, parseGuestCsv, validateGuest } from "./guests";
import { hashPassword, verifyPassword } from "./password";

test("normalizePhone accepts common Indian formats", () => {
  for (const raw of ["9876543210", "98765 43210", "+91 98765-43210", "919876543210", "09876543210"])
    assert.equal(normalizePhone(raw), "+919876543210", raw);
});

test("normalizePhone rejects non-mobile or wrong-length numbers", () => {
  for (const raw of ["", "12345", "5876543210", "98765432101", "+1 415 555 0100"])
    assert.equal(normalizePhone(raw), null, raw);
});

test("validateGuest defaults relation and lowercases side", () => {
  assert.deepEqual(validateGuest({ name: " Sharma Uncle ", phone: "9876543210", side: "Bride", relation: "" }), {
    name: "Sharma Uncle",
    phone: "+919876543210",
    side: "bride",
    relation: "other",
  });
  assert.match(validateGuest({ name: "A", phone: "9876543210", side: "both" }) as string, /side/);
});

test("parseGuestCsv reads rows in any column order", () => {
  const { guests, errors } = parseGuestCsv("phone,name,side\r\n98765 43210,Priya,bride\n\n91234 56789,Rohit,GROOM\n");
  assert.deepEqual(errors, []);
  assert.deepEqual(
    guests.map((g) => [g.name, g.phone, g.side]),
    [
      ["Priya", "+919876543210", "bride"],
      ["Rohit", "+919123456789", "groom"],
    ],
  );
});

test("parseGuestCsv reports bad rows by number and duplicate phones", () => {
  const { guests, errors } = parseGuestCsv(
    "name,phone,side\nPriya,9876543210,bride\nBad,123,bride\nCopy,+91 98765 43210,groom",
  );
  assert.equal(guests.length, 1);
  assert.equal(errors.length, 2);
  assert.match(errors[0], /^Row 3:/);
  assert.match(errors[1], /^Row 4: duplicate/);
});

test("parseGuestCsv rejects missing header columns", () => {
  assert.deepEqual(parseGuestCsv("name,side\nPriya,bride").errors, ["Header is missing: phone"]);
  assert.deepEqual(parseGuestCsv("  \n").errors, ["File is empty"]);
});

test("password hash verifies only the right password", async () => {
  const stored = await hashPassword("correct horse");
  assert.equal(await verifyPassword("correct horse", stored), true);
  assert.equal(await verifyPassword("wrong horse", stored), false);
  assert.equal(await verifyPassword("x", "garbage"), false);
});
