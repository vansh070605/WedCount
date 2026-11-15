import { prisma } from "@/lib/db";

// The only gate between a planner and another planner's guest list: every lookup is scoped by plannerId.
// Kept free of Next.js imports so lib/owned.dbtest.ts can run it against a real database.

export const findOwnedWedding = (plannerId: string, weddingId: string) =>
  prisma.wedding.findFirst({ where: { id: weddingId, plannerId } });

export const findOwnedEvent = (plannerId: string, eventId: string) =>
  prisma.event.findFirst({ where: { id: eventId, wedding: { plannerId } }, select: { weddingId: true } });

export const findOwnedGuest = (plannerId: string, guestId: string) =>
  prisma.guest.findFirst({ where: { id: guestId, wedding: { plannerId } }, select: { weddingId: true } });
