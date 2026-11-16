import "server-only";
import { prisma } from "@/lib/db";
import { calibrationFactor, predictEvent } from "@/lib/predict";

// Learns from every function this planner has recorded real turnout for, across all their weddings.
// shortcut: recomputes the base prediction from today's RSVPs each time; fine while replies are frozen after the
// deadline, store the prediction at event time if planners start editing replies afterwards.
export async function plannerCalibration(plannerId: string) {
  const past = await prisma.event.findMany({
    where: { actualCount: { not: null }, wedding: { plannerId } },
    select: {
      id: true,
      actualCount: true,
      wedding: { select: { guests: { select: { relation: true, rsvps: true, invitations: { select: { eventId: true } } } } } },
    },
  });
  const history = past.map((e) => ({
    predicted: predictEvent(e.id, e.wedding.guests).expected,
    actual: e.actualCount!,
  }));
  return { factor: calibrationFactor(history), events: history.length };
}
