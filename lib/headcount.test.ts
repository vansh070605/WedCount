import { test } from "node:test";
import assert from "node:assert/strict";
import { countHeadcount, csvCell, csvRow } from "./headcount";

const events = [
  { id: "e1", name: "Sangeet" },
  { id: "e2", name: "Wedding" },
];
const r = (eventId: string, status: string, vegCount = 0, nonVegCount = 0) => ({ eventId, status, vegCount, nonVegCount });

test("countHeadcount splits coming, maybe, declined and no reply per event", () => {
  const guests = [
    { rsvps: [r("e1", "attending", 2, 1), r("e2", "attending", 1, 0)] },
    { rsvps: [r("e1", "maybe", 0, 2), r("e2", "declined")] },
    { rsvps: [r("e1", "attending", 1, 1)] }, // no answer for e2
    { rsvps: [] }, // never replied
  ];
  const [sangeet, wedding] = countHeadcount(events, guests);

  assert.deepEqual(sangeet.attending, { replies: 2, veg: 3, nonVeg: 2, people: 5 });
  assert.deepEqual(sangeet.maybe, { replies: 1, veg: 0, nonVeg: 2, people: 2 });
  assert.equal(sangeet.declined, 0);
  assert.equal(sangeet.noReply, 1);

  assert.deepEqual(wedding.attending, { replies: 1, veg: 1, nonVeg: 0, people: 1 });
  assert.equal(wedding.declined, 1);
  assert.equal(wedding.noReply, 2);
});

test("countHeadcount handles a wedding with no guests", () => {
  const [sangeet] = countHeadcount(events, []);
  assert.equal(sangeet.attending.people, 0);
  assert.equal(sangeet.noReply, 0);
});

test("csvCell quotes commas, quotes and newlines", () => {
  assert.equal(csvCell("Rambagh Lawns, Jaipur"), '"Rambagh Lawns, Jaipur"');
  assert.equal(csvCell('The "big" day'), '"The ""big"" day"');
  assert.equal(csvCell(null), "");
  assert.equal(csvRow(["a", 1, "b,c"]), 'a,1,"b,c"');
});

test("csvCell defuses spreadsheet formulas", () => {
  assert.equal(csvCell("=HYPERLINK(\"x\")"), "\"'=HYPERLINK(\"\"x\"\")\"");
  assert.equal(csvCell("+91 98765"), "'+91 98765");
  assert.equal(csvCell(-5), "'-5");
});

test("countHeadcount ignores guests for functions they aren't invited to", () => {
  const evs = [{ id: "a", name: "Haldi" }, { id: "b", name: "Reception" }];
  const [haldi, reception] = countHeadcount(evs, [
    { rsvps: [], invitations: [{ eventId: "b" }] }, // colleague: Reception only, no reply yet
    { rsvps: [] }, // family: everything
  ]);
  assert.equal(haldi.noReply, 1);
  assert.equal(reception.noReply, 2);
});
