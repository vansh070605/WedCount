import Link from "next/link";
import { Suspense } from "react";
import { prisma } from "@/lib/db";
import { requirePlanner } from "@/lib/auth";
import { createWedding } from "@/app/actions";
import { CreateWeddingForm } from "@/app/ui/forms";
import { Badge, Card, PageHeader, SectionTitle, buttonClass } from "@/app/ui/kit";
import { Mark } from "@/app/ui/brand";

export default function DashboardPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <Suspense fallback={<p className="text-muted">Loading your weddings…</p>}>
        <Dashboard />
      </Suspense>
    </main>
  );
}

const ist = (d: Date, opts: Intl.DateTimeFormatOptions) =>
  d.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", ...opts });

async function Dashboard() {
  const planner = await requirePlanner();
  const [weddings, repliedGuests] = await Promise.all([
    prisma.wedding.findMany({
      where: { plannerId: planner.id },
      orderBy: { createdAt: "desc" },
      include: {
        events: { select: { name: true, startsAt: true }, orderBy: { startsAt: "asc" } },
        _count: { select: { guests: true } },
      },
    }),
    // One query for every wedding: guests who answered at least one function.
    prisma.guest.findMany({
      where: { wedding: { plannerId: planner.id }, rsvps: { some: {} } },
      select: { weddingId: true },
    }),
  ]);
  const repliedBy = new Map<string, number>();
  for (const g of repliedGuests) repliedBy.set(g.weddingId, (repliedBy.get(g.weddingId) ?? 0) + 1);
  const now = new Date();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow={`Namaste, ${planner.name}`}
        title="Your weddings"
        sub={`${weddings.length} in your account`}
        action={
          <a href="#new" className={buttonClass("primary", "md", "w-full sm:w-auto")}>
            + New wedding
          </a>
        }
      />

      {weddings.length === 0 ? (
        <div className="rise flex flex-col items-center gap-3 rounded-card border border-dashed border-line px-6 py-14 text-center [--d:120ms]">
          <Mark className="size-12" />
          <p className="font-display text-2xl font-semibold">Your first wedding starts here</p>
          <p className="max-w-md text-muted">Create a wedding below, add its functions and guests, then send invites on WhatsApp.</p>
        </div>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {weddings.map((w) => {
            const next = w.events.find((e) => e.startsAt > now);
            const done = w.events.length > 0 && !next;
            const replied = repliedBy.get(w.id) ?? 0;
            const pct = w._count.guests ? Math.round((replied / w._count.guests) * 100) : 0;
            return (
              <li key={w.id} className="reveal">
                <Link href={`/weddings/${w.id}`} className="lift flex h-full flex-col rounded-card border border-line bg-surface p-6 shadow-card">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-display text-xl font-semibold">{w.name}</p>
                    {done ? <Badge>Done</Badge> : next ? <Badge tone="brand">Upcoming</Badge> : <Badge tone="gold">Setting up</Badge>}
                  </div>
                  <p className="mt-1 text-sm text-muted">{w.city ?? "No city"}</p>
                  <p className="mt-4 text-sm">
                    {next ? (
                      <>
                        Next: <span className="font-medium">{next.name}</span> ·{" "}
                        {ist(next.startsAt, { day: "numeric", month: "short" })}
                      </>
                    ) : (
                      <span className="text-muted">{w.events.length ? "All functions are over" : "No functions yet"}</span>
                    )}
                  </p>
                  <div className="mt-auto pt-6">
                    <div className="flex justify-between text-xs text-muted">
                      <span>
                        {replied} of {w._count.guests} guests replied
                      </span>
                      <span className="tabular-nums">{pct}%</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-sunken">
                      <div
                        className="h-full origin-left rounded-full bg-brand"
                        style={{ width: `${pct}%`, animation: "grow 900ms 200ms cubic-bezier(0.2,0.7,0.2,1) both" }}
                      />
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <Card id="new" className="scroll-mt-24">
        <SectionTitle title="New wedding" hint="You can add functions, guests and the RSVP deadline next." />
        <CreateWeddingForm action={createWedding} />
      </Card>
    </div>
  );
}
