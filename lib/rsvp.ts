export const STATUSES = ["attending", "maybe", "declined"] as const;
export type Status = (typeof STATUSES)[number];
export const MAX_PARTY = 20;
export const MAX_NAME = 60;

export type EventInfo = { id: string; name: string; startsAt: Date };
export type RsvpInput = {
  eventId: string;
  status: Status;
  vegCount: number;
  nonVegCount: number;
  arrivalTime: Date | null;
  names: string[];
};

// Calendar date of an instant in India, as YYYY-MM-DD.
// "18 November" for an end-of-day deadline, "18 November, 6:00 pm" when the planner set a time.
export function deadlineText(d: Date) {
  const day = d.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "long" });
  const hm = d.toLocaleTimeString("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  return hm === "23:59" ? day : `${day}, ${d.toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "numeric", minute: "2-digit" })}`;
}

export const istDate = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

// Earliest date a planner may pick (date inputs' min). An edit keeps an existing earlier date allowed.
export const minPickDate = (now = new Date(), current?: Date | null) => {
  const today = istDate(now);
  const existing = current ? istDate(current) : null;
  return existing && existing < today ? existing : today;
};

// Refuses a new or changed date that has already passed. `previous` is the stored value when editing.
export function pastProblem(when: Date | null, what: "deadline" | "function", now = new Date(), previous?: Date | null) {
  if (!when || (previous && when.getTime() === previous.getTime())) return null;
  if (when > now) return null;
  return what === "deadline"
    ? "The RSVP deadline can't be in the past. Pick today or a later date."
    : "That date and time have already passed. Pick a future date for this function.";
}

// Open until the end of the deadline instant; no deadline means always open.
export const isRsvpOpen = (deadline: Date | null, now = new Date()) => !deadline || now <= deadline;

// Replies for a function close when its day begins in India (midnight IST), so nobody answers on or after the day.
export const closesAt = (e: { startsAt: Date }) => new Date(`${istDate(e.startsAt)}T00:00:00+05:30`);

// A guest can still answer for this function: before the wedding's deadline and before the function's day.
export const isEventOpen = (e: { startsAt: Date }, deadline: Date | null, now = new Date()) =>
  isRsvpOpen(deadline, now) && now < closesAt(e);

// The deadline must fall before the day of the first function, or guests could reply after it has happened.
export function deadlineProblem(deadline: Date | null, events: { name: string; startsAt: Date }[]): string | null {
  if (!deadline || events.length === 0) return null;
  const first = events.reduce((a, b) => (a.startsAt <= b.startsAt ? a : b));
  if (deadline < closesAt(first)) return null;
  const day = first.startsAt.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short" });
  return `The RSVP deadline must be before ${first.name} on ${day}, the first function.`;
}

// Functions a guest is invited to. No invitation rows means every function.
type Invited = { invitations?: { eventId: string }[] };
export const isInvited = (g: Invited, eventId: string) =>
  !g.invitations?.length || g.invitations.some((i) => i.eventId === eventId);
export const invitedEvents = <E extends { id: string }>(g: Invited, events: E[]) => events.filter((e) => isInvited(g, e.id));

// One name per line; blank lines ignored, inner spaces collapsed.
export const parseNames = (raw: string) =>
  raw.split(/\r?\n/).map((n) => n.trim().replace(/\s+/g, " ")).filter(Boolean);

const count = (raw: string) => (/^\d{1,3}$/.test(raw.trim()) ? Number(raw.trim()) : NaN);

// Form fields per event: status_<id>, veg_<id>, nonveg_<id>, arrival_<id> (HH:MM, optional), names_<id> (one per line).
// Only events passed in are read, so a guest can't write answers for another wedding's events.
export function parseRsvpForm(events: EventInfo[], get: (key: string) => string) {
  const rsvps: RsvpInput[] = [];
  const errors: string[] = [];

  for (const e of events) {
    const status = get(`status_${e.id}`) as Status;
    if (!STATUSES.includes(status)) {
      errors.push(`${e.name}: tell us if you're coming.`);
      continue;
    }
    if (status === "declined") {
      rsvps.push({ eventId: e.id, status, vegCount: 0, nonVegCount: 0, arrivalTime: null, names: [] });
      continue;
    }

    const veg = count(get(`veg_${e.id}`) || "0");
    const nonVeg = count(get(`nonveg_${e.id}`) || "0");
    if (isNaN(veg) || isNaN(nonVeg)) {
      errors.push(`${e.name}: number of people must be a whole number.`);
      continue;
    }
    if (veg + nonVeg < 1) {
      errors.push(`${e.name}: add at least 1 person (veg or non-veg).`);
      continue;
    }
    if (veg + nonVeg > MAX_PARTY) {
      errors.push(`${e.name}: at most ${MAX_PARTY} people per invite. Ask the family if you're bringing more.`);
      continue;
    }

    const people = veg + nonVeg;
    const names = parseNames(get(`names_${e.id}`));
    if (names.some((n) => n.length > MAX_NAME)) {
      errors.push(`${e.name}: a name is longer than ${MAX_NAME} characters.`);
      continue;
    }
    // Coming needs a name for every person, so the family knows exactly who to expect. Maybe can leave gaps.
    if (status === "attending" && names.length !== people) {
      errors.push(
        `${e.name}: add the names of all ${people} ${people === 1 ? "person" : "people"} coming, one per line (you have ${names.length}).`,
      );
      continue;
    }
    if (names.length > people) {
      errors.push(`${e.name}: ${names.length} names for ${people} ${people === 1 ? "person" : "people"}. Fix the count or the names.`);
      continue;
    }

    const hhmm = get(`arrival_${e.id}`).trim();
    if (hhmm && !/^([01]\d|2[0-3]):[0-5]\d$/.test(hhmm)) {
      errors.push(`${e.name}: arrival time looks wrong.`);
      continue;
    }
    const arrivalTime = hhmm ? arrivalAt(e.startsAt, hhmm) : null;

    rsvps.push({ eventId: e.id, status, vegCount: veg, nonVegCount: nonVeg, arrivalTime, names });
  }
  return { rsvps, errors };
}

// A guest types only a clock time. Take the one nearest the function's start, so 01:00 for a 21:00 Sangeet
// is the night after, not 20 hours early.
export function arrivalAt(startsAt: Date, hhmm: string) {
  const sameDay = new Date(`${istDate(startsAt)}T${hhmm}:00+05:30`);
  const DAY = 24 * 60 * 60 * 1000;
  const gap = sameDay.getTime() - startsAt.getTime();
  if (gap < -DAY / 2) return new Date(sameDay.getTime() + DAY);
  if (gap > DAY / 2) return new Date(sameDay.getTime() - DAY);
  return sameDay;
}
