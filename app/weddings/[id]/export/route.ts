import { prisma } from "@/lib/db";
import { getPlanner } from "@/lib/auth";
import { countHeadcount, csvRow } from "@/lib/headcount";
import { predictEvent } from "@/lib/predict";
import { plannerCalibration } from "@/lib/calibrate";

// Caterer sheet: one row per function with people and veg / non-veg split.
export async function GET(_req: Request, ctx: RouteContext<"/weddings/[id]/export">) {
  const { id } = await ctx.params;
  const planner = await getPlanner();
  if (!planner) return new Response("Log in first.", { status: 401 });

  const wedding = await prisma.wedding.findFirst({
    where: { id, plannerId: planner.id },
    include: {
      events: { orderBy: { startsAt: "asc" } },
      guests: { select: { relation: true, rsvps: true } },
    },
  });
  // Same 404 for "not yours" and "doesn't exist", so ids can't be probed.
  if (!wedding) return new Response("Not found.", { status: 404 });

  const counts = countHeadcount(wedding.events, wedding.guests);
  const { factor } = await plannerCalibration(planner.id);
  const ist = (d: Date, opts: Intl.DateTimeFormatOptions) =>
    d.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", ...opts });

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

  const filename = `${wedding.name.replace(/[^\w-]+/g, "-").replace(/^-+|-+$/g, "") || "wedding"}-headcount.csv`;
  // BOM so Excel opens UTF-8 (names in Hindi, ₹, etc.) correctly.
  return new Response("﻿" + lines.join("\r\n") + "\r\n", {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
