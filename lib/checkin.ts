import { prisma } from "./db";
import { istDate } from "./rsvp";

// The door list opens at midnight IST on the function's day; guests can't be checked in a day early.
export const doorOpen = (e: { startsAt: Date }, now = new Date()) => istDate(now) >= istDate(e.startsAt);

// One more (step 1) or one fewer (step -1) person from this guest's party at the door, never below 0.
// The function's actualCount is then recomputed in one statement, so the recorded turnout always matches the door.
export async function checkIn(eventId: string, guestId: string, step: 1 | -1) {
  if (step === 1) {
    await prisma.arrival.upsert({
      where: { guestId_eventId: { guestId, eventId } },
      create: { guestId, eventId, people: 1 },
      update: { people: { increment: 1 } },
    });
  } else {
    await prisma.arrival.updateMany({ where: { guestId, eventId, people: { gt: 0 } }, data: { people: { decrement: 1 } } });
  }
  await prisma.$executeRaw`
    UPDATE "Event" SET "actualCount" = (SELECT COALESCE(SUM("people"), 0)::int FROM "Arrival" WHERE "eventId" = ${eventId})
    WHERE "id" = ${eventId}`;
}
