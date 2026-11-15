export const STATUSES = ["attending", "maybe", "declined"] as const;
export type Status = (typeof STATUSES)[number];
export const MAX_PARTY = 20;

export type EventInfo = { id: string; name: string; startsAt: Date };
export type RsvpInput = {
  eventId: string;
  status: Status;
  vegCount: number;
  nonVegCount: number;
  arrivalTime: Date | null;
};

// Calendar date of an instant in India, as YYYY-MM-DD.
export const istDate = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

// Open until the end of the deadline instant; no deadline means always open.
export const isRsvpOpen = (deadline: Date | null, now = new Date()) => !deadline || now <= deadline;

const count = (raw: string) => (/^\d{1,3}$/.test(raw.trim()) ? Number(raw.trim()) : NaN);

// Form fields per event: status_<id>, veg_<id>, nonveg_<id>, arrival_<id> (HH:MM, optional).
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
      rsvps.push({ eventId: e.id, status, vegCount: 0, nonVegCount: 0, arrivalTime: null });
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

    const hhmm = get(`arrival_${e.id}`).trim();
    if (hhmm && !/^([01]\d|2[0-3]):[0-5]\d$/.test(hhmm)) {
      errors.push(`${e.name}: arrival time looks wrong.`);
      continue;
    }
    // shortcut: arrival is assumed on the event's own date, so a 01:00 arrival for a late-night event lands
    // on the wrong day; fine while it's only a hint for the caterer, revisit if used for scheduling.
    const arrivalTime = hhmm ? new Date(`${istDate(e.startsAt)}T${hhmm}:00+05:30`) : null;

    rsvps.push({ eventId: e.id, status, vegCount: veg, nonVegCount: nonVeg, arrivalTime });
  }
  return { rsvps, errors };
}
