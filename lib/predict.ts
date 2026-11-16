// Expected turnout per function, from RSVPs plus how reliable each kind of answer usually is.
//
// Each guest's party (everyone on one invite) either comes or doesn't, with probability p:
//   Coming -> their stated count, Maybe -> their stated count, No reply -> the event's average party size,
//   Can't come -> 0.
// Expected people = sum(n * p). Spread = sqrt(sum(n^2 * p * (1 - p))), and the range is +/- 1.645 spreads
// (about 90% if the parties are independent).
// A calibration factor learned from the planner's past functions then scales the result.

import { RELATIONS } from "@/lib/guests";
import { isInvited } from "@/lib/rsvp";

type Relation = (typeof RELATIONS)[number];
type Answer = "attending" | "maybe" | "noReply";

// Starting assumptions until the planner records real turnout. Not measured data: family shows up more
// reliably than colleagues, and a silent invite is far less likely to come than a "maybe".
export const SHOW_RATE: Record<Answer, Record<Relation, number>> = {
  attending: { family: 0.95, friend: 0.85, colleague: 0.75, other: 0.8 },
  maybe: { family: 0.6, friend: 0.45, colleague: 0.3, other: 0.4 },
  noReply: { family: 0.35, friend: 0.2, colleague: 0.1, other: 0.15 },
};
export const DEFAULT_PARTY = 2;
const Z90 = 1.645;

type Reply = { eventId: string; status: string; vegCount: number; nonVegCount: number };
export type PredictGuest = { relation: string; rsvps: Reply[]; invitations?: { eventId: string }[] };
export type Prediction = { expected: number; low: number; high: number };

const rel = (r: string): Relation => (RELATIONS.includes(r as Relation) ? (r as Relation) : "other");

export function predictEvent(eventId: string, allGuests: PredictGuest[], factor = 1): Prediction {
  const guests = allGuests.filter((g) => isInvited(g, eventId)); // only guests invited to this function can come
  const replies = guests.map((g) => g.rsvps.find((r) => r.eventId === eventId));
  const sizes = replies.filter((r) => r && r.status !== "declined").map((r) => r!.vegCount + r!.nonVegCount);
  const avgParty = sizes.length ? sizes.reduce((a, b) => a + b, 0) / sizes.length : DEFAULT_PARTY;

  let mean = 0;
  let variance = 0;
  guests.forEach((g, i) => {
    const r = replies[i];
    if (r?.status === "declined") return;
    const answer: Answer = !r ? "noReply" : r.status === "maybe" ? "maybe" : "attending";
    const n = r ? r.vegCount + r.nonVegCount : avgParty;
    const p = SHOW_RATE[answer][rel(g.relation)];
    mean += n * p;
    variance += n * n * p * (1 - p);
  });

  const expected = mean * factor;
  const spread = Math.sqrt(variance) * factor;
  return {
    expected: Math.round(expected),
    low: Math.max(0, Math.round(expected - Z90 * spread)),
    high: Math.round(expected + Z90 * spread),
  };
}

// How far off the base model has been for this planner: actual / predicted, pulled toward 1 when there is
// little history (PRIOR_PEOPLE acts like that many people of "the model was right"), and capped.
const PRIOR_PEOPLE = 100;
export function calibrationFactor(past: { predicted: number; actual: number }[]) {
  const predicted = past.reduce((s, x) => s + x.predicted, 0);
  const actual = past.reduce((s, x) => s + x.actual, 0);
  const factor = (actual + PRIOR_PEOPLE) / (predicted + PRIOR_PEOPLE);
  return Math.min(1.5, Math.max(0.5, factor));
}

// Signed error as a share of what actually happened: +10% means we over-predicted by 10%.
export const errorPct = (predicted: number, actual: number) =>
  actual === 0 ? (predicted === 0 ? 0 : 100) : Math.round(((predicted - actual) / actual) * 100);
