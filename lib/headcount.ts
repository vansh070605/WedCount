type Reply = { eventId: string; status: string; vegCount: number; nonVegCount: number };
type Event = { id: string; name: string };

export type Party = { replies: number; veg: number; nonVeg: number; people: number };
export type EventCount = {
  eventId: string;
  name: string;
  attending: Party;
  maybe: Party;
  declined: number; // guests (invites), not people
  noReply: number; // guests with no answer for this event
};

const empty = (): Party => ({ replies: 0, veg: 0, nonVeg: 0, people: 0 });

// Per-event totals for the planner and caterer. `guests` is every guest of the wedding with their replies.
export function countHeadcount(events: Event[], guests: { rsvps: Reply[] }[]): EventCount[] {
  return events.map((e) => {
    const c: EventCount = { eventId: e.id, name: e.name, attending: empty(), maybe: empty(), declined: 0, noReply: 0 };
    for (const g of guests) {
      const r = g.rsvps.find((r) => r.eventId === e.id);
      if (!r) c.noReply++;
      else if (r.status === "declined") c.declined++;
      else if (r.status === "attending" || r.status === "maybe") {
        const p = c[r.status];
        p.replies++;
        p.veg += r.vegCount;
        p.nonVeg += r.nonVegCount;
        p.people += r.vegCount + r.nonVegCount;
      }
    }
    return c;
  });
}

// One CSV cell. Quotes when needed, and defuses leading = + - @ so Excel won't run it as a formula.
export function csvCell(value: string | number | null | undefined): string {
  let s = value == null ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export const csvRow = (cells: (string | number | null | undefined)[]) => cells.map(csvCell).join(",");
