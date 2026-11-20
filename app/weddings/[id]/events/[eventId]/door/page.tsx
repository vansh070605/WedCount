import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requirePlanner } from "@/lib/auth";
import { isInvited } from "@/lib/rsvp";
import { doorOpen } from "@/lib/checkin";
import { nameKey } from "@/lib/guests";
import { checkInGuest } from "@/app/actions";
import { Badge, BackLink, buttonClass, inputClass } from "@/app/ui/kit";

export const metadata: Metadata = { title: "Door list · WedCount" };

// Check guests in at the door on the day: one tap per person. The total becomes the function's actual turnout.
export default function DoorPage(props: PageProps<"/weddings/[id]/events/[eventId]/door">) {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-10 sm:px-6">
      <Suspense fallback={<p className="text-muted">Loading the door list…</p>}>
        <Door params={props.params} searchParams={props.searchParams} />
      </Suspense>
    </main>
  );
}

const ORDER = { attending: 0, maybe: 1, none: 2, declined: 3 } as const;
const LABEL = { attending: "Coming", maybe: "Maybe", none: "No reply", declined: "Can't come" } as const;

async function Door({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; eventId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ id, eventId }, sp] = await Promise.all([params, searchParams]);
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const planner = await requirePlanner();
  const event = await prisma.event.findFirst({
    where: { id: eventId, weddingId: id, wedding: { plannerId: planner.id } },
    include: { wedding: { select: { name: true } } },
  });
  if (!event) notFound();

  const guests = await prisma.guest.findMany({
    where: { weddingId: id },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      invitations: { select: { eventId: true } },
      rsvps: { where: { eventId }, select: { status: true, vegCount: true, nonVegCount: true, names: true } },
      arrivals: { where: { eventId }, select: { people: true } },
    },
  });
  const rows = guests
    .filter((g) => isInvited(g, eventId))
    .map((g) => {
      const r = g.rsvps[0];
      const status = (r?.status ?? "none") as keyof typeof ORDER;
      return { ...g, status, party: r ? r.vegCount + r.nonVegCount : 0, names: r?.names ?? [], here: g.arrivals[0]?.people ?? 0 };
    })
    .sort((a, b) => ORDER[a.status] - ORDER[b.status] || a.name.localeCompare(b.name));

  // Search the guest and everyone named in their reply, ignoring case, spaces and dots.
  const key = nameKey(q);
  const shown = key ? rows.filter((g) => [g.name, ...g.names].some((n) => nameKey(n).includes(key))) : rows;
  const arrived = rows.reduce((n, g) => n + g.here, 0);
  const coming = rows.filter((g) => g.status === "attending").reduce((n, g) => n + g.party, 0);
  const open = doorOpen(event);
  const day = event.startsAt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", weekday: "long", day: "numeric", month: "long" });

  return (
    <>
      <header>
        <BackLink href={`/weddings/${id}/events/${eventId}`} label={event.name} />
        <p className="mt-5 text-xs font-semibold tracking-[0.2em] text-gold uppercase">{event.wedding.name}</p>
        <h1 className="mt-1 font-display text-4xl font-semibold tracking-tight sm:text-5xl">Door list</h1>
        <p className="mt-2 text-sm text-muted">
          Tap + for each person who arrives. The total is saved as {event.name}&apos;s actual turnout.
        </p>
      </header>

      <div className="sticky top-20 z-10 flex flex-wrap items-center justify-between gap-3 rounded-card border border-line bg-surface/95 p-4 shadow-card backdrop-blur">
        <p className="text-sm text-muted">
          <span className="font-display text-3xl font-semibold text-brand tabular-nums">{arrived}</span> arrived of{" "}
          <span className="font-semibold text-ink tabular-nums">{coming}</span> who said Coming
        </p>
        <form className="flex w-full gap-2 sm:w-auto" role="search">
          <input name="q" defaultValue={q} placeholder="Find a guest" aria-label="Find a guest" className={inputClass} />
          <button className={buttonClass("secondary")}>Find</button>
        </form>
      </div>

      {!open && <p className="rounded-card border border-gold/40 bg-paper p-4 text-sm">Check-in opens on {day}.</p>}

      {shown.length === 0 ? (
        <p className="text-muted">{q ? `No guest matches "${q}".` : "No guests are invited to this function."}</p>
      ) : (
        <ul className="divide-y divide-line rounded-card border border-line bg-surface">
          {shown.map((g) => (
            <li key={g.id} className="flex items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="font-medium">{g.name}</p>
                <p className="mt-0.5 flex flex-wrap items-center gap-2 text-sm text-muted">
                  <Badge tone={g.status === "attending" ? "ok" : g.status === "maybe" ? "gold" : "muted"}>{LABEL[g.status]}</Badge>
                  {g.party > 0 && <span>Party of {g.party}</span>}
                </p>
                {g.names.length > 0 && <p className="mt-1 truncate text-sm text-muted">{g.names.join(", ")}</p>}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <form action={checkInGuest.bind(null, eventId, g.id, -1)}>
                  <button
                    disabled={!open || g.here === 0}
                    aria-label={`One fewer from ${g.name}'s party`}
                    className={buttonClass("secondary", "lg", "w-12 px-0")}
                  >
                    −
                  </button>
                </form>
                <span className="w-8 text-center text-xl font-semibold tabular-nums" aria-label={`${g.here} arrived`}>
                  {g.here}
                </span>
                <form action={checkInGuest.bind(null, eventId, g.id, 1)}>
                  <button disabled={!open} aria-label={`One more from ${g.name}'s party`} className={buttonClass("primary", "lg", "w-12 px-0")}>
                    +
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
