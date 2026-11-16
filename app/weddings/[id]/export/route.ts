import { prisma } from "@/lib/db";
import { getPlanner } from "@/lib/auth";
import { countHeadcount, csvRow } from "@/lib/headcount";
import { predictEvent } from "@/lib/predict";
import { plannerCalibration } from "@/lib/calibrate";

// Caterer sheet: one row per function with people and veg / non-veg split.
// ?list=names instead gives one row per person coming, per function, for the door list.
export async function GET(req: Request, ctx: RouteContext<"/weddings/[id]/export">) {
  const { id } = await ctx.params;
  const planner = await getPlanner();
  if (!planner) return new Response("Log in first.", { status: 401 });

  const wedding = await prisma.wedding.findFirst({
    where: { id, plannerId: planner.id },
    include: {
      events: { orderBy: { startsAt: "asc" } },
      guests: { select: { name: true, phone: true, relation: true, rsvps: true, invitations: { select: { eventId: true } } } },
    },
  });
  // Same 404 for "not yours" and "doesn't exist", so ids can't be probed.
  if (!wedding) return new Response("Not found.", { status: 404 });

  const ist = (d: Date, opts: Intl.DateTimeFormatOptions) =>
    d.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", ...opts });
  const slug = wedding.name.replace(/[^\w-]+/g, "-").replace(/^-+|-+$/g, "") || "wedding";

  if (new URL(req.url).searchParams.get("list") === "names") {
    const rows = [csvRow(["Function", "Date", "Name", "Invite", "Phone", "Veg", "Non-veg", "Arriving"])];
    for (const e of wedding.events) {
      for (const g of wedding.guests) {
        const r = g.rsvps.find((r) => r.eventId === e.id && r.status === "attending");
        if (!r) continue;
        const people = r.vegCount + r.nonVegCount;
        // Replies saved before names were asked for: one row for the invite with the party size.
        const names = r.names.length ? r.names : [people > 1 ? `${g.name} +${people - 1}` : g.name];
        const arriving = r.arrivalTime ? ist(r.arrivalTime, { hour: "2-digit", minute: "2-digit", hour12: false }) : "";
        for (const n of names)
          rows.push(csvRow([e.name, ist(e.startsAt, { day: "2-digit", month: "short" }), n, g.name, g.phone, r.vegCount, r.nonVegCount, arriving]));
      }
    }
    return csv(rows, `${slug}-guest-names.csv`);
  }

  const counts = countHeadcount(wedding.events, wedding.guests);
  const { factor } = await plannerCalibration(planner.id);

  const lines = [
    csvRow([
      "Function", "Date", "Time (IST)", "Venue",
      "Expected", "Expected low", "Expected high",
      "Coming", "Coming veg", "Coming non-veg",
      "Maybe", "Maybe veg", "Maybe non-veg",
      "Can't come (invites)", "No reply (invites)",
    ]),
    ...wedding.events.map((e, i) => {
      const c = counts[i];
      const p = predictEvent(e.id, wedding.guests, factor);
      return csvRow([
        e.name,
        ist(e.startsAt, { day: "2-digit", month: "short", year: "numeric" }),
        ist(e.startsAt, { hour: "2-digit", minute: "2-digit", hour12: false }),
        e.venue,
        p.expected, p.low, p.high,
        c.attending.people, c.attending.veg, c.attending.nonVeg,
        c.maybe.people, c.maybe.veg, c.maybe.nonVeg,
        c.declined, c.noReply,
      ]);
    }),
  ];

  return csv(lines, `${slug}-headcount.csv`);
}

// BOM so Excel opens UTF-8 (names in Hindi, ₹, etc.) correctly.
function csv(lines: string[], filename: string) {
  return new Response("﻿" + lines.join("\r\n") + "\r\n", {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
