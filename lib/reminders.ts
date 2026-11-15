const DAY = 24 * 60 * 60 * 1000;
// Don't nudge the same guest more often than this. Indian families notice spam.
export const REMIND_EVERY_DAYS = 2;

export type ReminderStatus =
  | "complete" // replied for every function
  | "not-invited" // planner never sent the invite
  | "closed" // deadline passed, nothing to remind
  | "recent" // contacted in the last REMIND_EVERY_DAYS
  | "due"; // invited, still missing replies, quiet long enough

type Guest = { invitedAt: Date | null; remindedAt: Date | null; rsvps: { eventId: string }[] };

export const missingEvents = <E extends { id: string }>(guest: Pick<Guest, "rsvps">, events: E[]) =>
  events.filter((e) => !guest.rsvps.some((r) => r.eventId === e.id));

export function reminderStatus(
  guest: Guest,
  events: { id: string }[],
  deadline: Date | null,
  now = new Date(),
): ReminderStatus {
  if (missingEvents(guest, events).length === 0) return "complete";
  if (!guest.invitedAt) return "not-invited";
  if (deadline && now > deadline) return "closed";
  const last = Math.max(guest.invitedAt.getTime(), guest.remindedAt?.getTime() ?? 0);
  return now.getTime() - last < REMIND_EVERY_DAYS * DAY ? "recent" : "due";
}

export function ago(d: Date, now = new Date()) {
  const days = Math.floor((now.getTime() - d.getTime()) / DAY);
  return days <= 0 ? "today" : days === 1 ? "yesterday" : `${days} days ago`;
}
