import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { requirePlanner } from "@/lib/auth";
import { plannerCalibration } from "@/lib/calibrate";
import { predictEvent } from "@/lib/predict";
import { reminderStatus } from "@/lib/reminders";
import { Badge, Card, SectionTitle, Stat, buttonClass } from "@/app/ui/kit";

export const metadata: Metadata = { title: "Home · WedCount" };

// The planner's home: what's coming up across every wedding, what needs doing, and the latest replies.
export default function HomePage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <Suspense fallback={<p className="text-muted">Loading your home…</p>}>
        <Home />
      </Suspense>
    </main>
  );
}

const DAY = 24 * 60 * 60 * 1000;
const ist = (d: Date, opts: Intl.DateTimeFormatOptions) => d.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", ...opts });
const istDay = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
const inDays = (d: Date, now: Date) => {
  const days = Math.round((new Date(istDay(d)).getTime() - new Date(istDay(now)).getTime()) / DAY);
  return days <= 0 ? "Today" : days === 1 ? "Tomorrow" : `In ${days} days`;
};
const greeting = (now: Date) => {
  const h = Number(ist(now, { hour: "numeric", hour12: false }));
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
};
const LABEL: Record<string, string> = { attending: "Coming", maybe: "Maybe", declined: "Can't come" };

async function Home() {
  const planner = await requirePlanner();
  const now = new Date();
  const [weddings, latest, calibration] = await Promise.all([
    prisma.wedding.findMany({
      where: { plannerId: planner.id },
      orderBy: { createdAt: "desc" },
      include: {
        events: { orderBy: { startsAt: "asc" } },
        guests: {
          select: {
            relation: true,
            invitedAt: true,
            remindedAt: true,
            rsvps: { select: { eventId: true, status: true, vegCount: true, nonVegCount: true } },
            invitations: { select: { eventId: true } },
          },
        },
      },
    }),
    prisma.rsvp.findMany({
      where: { guest: { wedding: { plannerId: planner.id } } },
      orderBy: { updatedAt: "desc" },
      take: 8,
      select: {
        id: true,
        status: true,
        vegCount: true,
        nonVegCount: true,
        updatedAt: true,
        guest: { select: { name: true } },
        event: { select: { name: true, wedding: { select: { id: true, name: true } } } },
      },
    }),
    plannerCalibration(planner.id),
  ]);

  const first = planner.name.split(" ")[0];

  // A new planner: a short checklist instead of empty numbers.
  if (weddings.length === 0)
    return (
      <div className="flex flex-col gap-8">
        <header className="rise">
          <p className="text-sm font-medium text-brand">{greeting(now)}, {first}</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">Let&apos;s set up your first wedding</h1>
        </header>
        <Card>
          <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Create the wedding", "Name, city and the date replies close."],
              ["Add its functions", "Haldi, Sangeet, Wedding… with times and venues."],
              ["Add guests", "One by one or from the family's spreadsheet."],
              ["Send invites", "Guest by guest on WhatsApp, from your own number."],
            ].map(([t, d], i) => (
              <li key={t} className="border-t-2 border-line pt-4 first:border-ink">
                <p className="text-sm font-medium text-muted tabular-nums">0{i + 1}</p>
                <p className="mt-1 font-semibold">{t}</p>
                <p className="mt-1 text-sm text-muted">{d}</p>
              </li>
            ))}
          </ol>
          <Link href="/dashboard#new" className={buttonClass("primary", "lg", "mt-8")}>
            Create a wedding
          </Link>
        </Card>
      </div>
    );

  // Totals across every wedding.
  const guests = weddings.flatMap((w) => w.guests.map((g) => ({ g, w })));
  const status = guests.map(({ g, w }) => reminderStatus(g, w.events, w.rsvpDeadline, now));
  const count = (s: string) => status.filter((x) => x === s).length;
  const repliedPct = guests.length ? Math.round((count("complete") / guests.length) * 100) : 0;

  // The next functions across weddings, with their expected turnout.
  const upcoming = weddings
    .flatMap((w) => w.events.filter((e) => e.startsAt > now).map((e) => ({ e, w })))
    .sort((a, b) => a.e.startsAt.getTime() - b.e.startsAt.getTime())
    .slice(0, 5)
    .map(({ e, w }) => ({ e, w, p: predictEvent(e.id, w.guests, calibration.factor) }));

  const activeWeddings = weddings.filter((w) => w.events.some((e) => e.startsAt > now)).length;

  // Per wedding: invites still to send and reminders due.
  const todo = weddings
    .map((w) => {
      const s = w.guests.map((g) => reminderStatus(g, w.events, w.rsvpDeadline, now));
      return {
        w,
        notInvited: s.filter((x) => x === "not-invited").length,
        due: s.filter((x) => x === "due").length,
        noFunctions: w.events.length === 0,
        noGuests: w.guests.length === 0,
      };
    })
    .filter((t) => t.notInvited || t.due || t.noFunctions || t.noGuests);

  return (
    <div className="flex flex-col gap-8">
      <header className="rise flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-brand">
            {greeting(now)}, {first}
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
            {upcoming.length ? `${upcoming[0].e.name} for ${upcoming[0].w.name} is ${inDays(upcoming[0].e.startsAt, now).toLowerCase()}` : "Your weddings at a glance"}
          </h1>
          <p className="mt-2 text-sm text-muted">{ist(now, { weekday: "long", day: "numeric", month: "long" })}</p>
        </div>
        <div className="flex w-full gap-2 sm:w-auto">
          <Link href="/dashboard" className={buttonClass("secondary", "md", "flex-1 sm:flex-none")}>
            All weddings
          </Link>
          <Link href="/dashboard#new" className={buttonClass("primary", "md", "flex-1 sm:flex-none")}>
            New wedding
          </Link>
        </div>
      </header>

      <div className="rise grid grid-cols-2 gap-4 [--d:120ms] lg:grid-cols-4">
        <Stat label="Weddings" value={weddings.length} sub={`${activeWeddings} with functions coming up`} />
        <Stat label="Guests" value={guests.length} sub={`${count("not-invited")} not invited yet`} />
        <Stat label="Replied to all" value={`${repliedPct}%`} sub={`${count("complete")} of ${guests.length} guests`} />
        <Stat label="Reminders due" value={count("due")} sub="quiet for 2+ days" tone="gold" />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Card>
          <SectionTitle title="Coming up" hint="The next functions across your weddings, with the expected turnout." />
          {upcoming.length === 0 ? (
            <p className="rounded-xl bg-sunken p-4 text-sm text-muted">No functions coming up. Add them from a wedding&apos;s page.</p>
          ) : (
            <ul className="divide-y divide-line">
              {upcoming.map(({ e, w, p }) => (
                <li key={e.id}>
                  <Link href={`/weddings/${w.id}`} className="group flex items-center gap-4 py-3.5">
                    <div className="flex w-14 shrink-0 flex-col items-center rounded-lg border border-line bg-paper py-1.5">
                      <span className="text-[11px] font-medium text-muted uppercase">{ist(e.startsAt, { month: "short" })}</span>
                      <span className="text-lg leading-none font-semibold tabular-nums">{ist(e.startsAt, { day: "numeric" })}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium group-hover:text-brand">
                        {e.name} <span className="font-normal text-muted">· {w.name}</span>
                      </p>
                      <p className="truncate text-sm text-muted">
                        {inDays(e.startsAt, now)} · {ist(e.startsAt, { hour: "numeric", minute: "2-digit" })}
                        {e.venue && ` · ${e.venue}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-brand tabular-nums">{p.expected}</p>
                      <p className="text-xs text-muted tabular-nums">
                        {p.low}–{p.high}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <SectionTitle title="Needs your attention" />
          {todo.length === 0 ? (
            <p className="rounded-xl bg-sunken p-4 text-sm text-muted">All caught up. Every guest is invited and nobody needs a reminder.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {todo.map(({ w, notInvited, due, noFunctions, noGuests }) => (
                <li key={w.id} className="rounded-xl border border-line bg-paper p-4">
                  <p className="font-medium">{w.name}</p>
                  <p className="mt-0.5 text-sm text-muted">
                    {noFunctions
                      ? "Add its functions first."
                      : noGuests
                        ? "Add guests to start sending invites."
                        : [notInvited && `${notInvited} not invited`, due && `${due} reminder${due === 1 ? "" : "s"} due`].filter(Boolean).join(" · ")}
                  </p>
                  <Link
                    href={noFunctions || noGuests ? `/weddings/${w.id}` : `/weddings/${w.id}/invite${notInvited ? "" : "?mode=remind"}`}
                    className={buttonClass("secondary", "sm", "mt-3")}
                  >
                    {noFunctions || noGuests ? "Open wedding" : notInvited ? "Send invites" : "Send reminders"}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card>
        <SectionTitle title="Latest replies" hint="The newest answers from guests, across your weddings." />
        {latest.length === 0 ? (
          <p className="rounded-xl bg-sunken p-4 text-sm text-muted">No replies yet. They appear here as guests answer.</p>
        ) : (
          <ul className="divide-y divide-line">
            {latest.map((r) => {
              const people = r.vegCount + r.nonVegCount;
              return (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="font-medium">
                      {r.guest.name}{" "}
                      <span className="font-normal text-muted">
                        · {r.event.name}, {r.event.wedding.name}
                      </span>
                    </p>
                    <p className="text-xs text-muted">{ist(r.updatedAt, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</p>
                  </div>
                  <Badge tone={r.status === "attending" ? "ok" : r.status === "maybe" ? "gold" : "muted"}>
                    {LABEL[r.status] ?? r.status}
                    {r.status !== "declined" && ` · ${people}`}
                  </Badge>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
