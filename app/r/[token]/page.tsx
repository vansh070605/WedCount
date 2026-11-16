import { Suspense } from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { invitedEvents, isEventOpen } from "@/lib/rsvp";
import { saveRsvp } from "@/app/actions";
import { RsvpForm, type EventAnswer } from "@/app/ui/rsvp-form";
import { Mark } from "@/app/ui/brand";

export default function RsvpPage(props: PageProps<"/r/[token]">) {
  return (
    <main className="relative flex-1">
      <div className="stagger relative mx-auto flex w-full max-w-xl flex-col gap-8 px-4 py-10 sm:py-14">
        <Suspense fallback={<p className="text-center text-muted">Loading your invite…</p>}>
          <Rsvp params={props.params} />
        </Suspense>
      </div>
    </main>
  );
}

const ist = (d: Date, opts: Intl.DateTimeFormatOptions) =>
  d.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", ...opts });

async function Rsvp({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const guest = await prisma.guest.findUnique({
    where: { token },
    select: {
      name: true,
      rsvps: true,
      invitations: { select: { eventId: true } },
      wedding: {
        select: { name: true, city: true, rsvpDeadline: true, events: { orderBy: { startsAt: "asc" } } },
      },
    },
  });
  if (!guest) notFound();

  const { wedding } = guest;
  const now = new Date();
  const mine = invitedEvents(guest, wedding.events);
  const events: EventAnswer[] = mine.map((e) => {
    const r = guest.rsvps.find((r) => r.eventId === e.id);
    return {
      id: e.id,
      name: e.name,
      when: ist(e.startsAt, { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }),
      venue: e.venue,
      status: r?.status ?? "",
      veg: r?.vegCount ?? 0,
      nonVeg: r?.nonVegCount ?? 0,
      arrival: r?.arrivalTime ? ist(r.arrivalTime, { hour: "2-digit", minute: "2-digit", hour12: false }) : "",
      names: r?.names ?? [],
      open: isEventOpen(e, wedding.rsvpDeadline, now),
    };
  });
  const anyOpen = events.some((e) => e.open);

  return (
    <>
      {/* The invitation itself: who, where, and every function this guest is invited to. */}
      <section className="rounded-card border border-line bg-surface px-6 py-8 text-center shadow-lift sm:px-10">
        <Mark className="mx-auto size-10" />
        <p className="mt-5 text-sm text-muted">Namaste {guest.name},</p>
        <p className="mt-1 text-sm font-medium text-brand">You&apos;re invited to</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-balance sm:text-5xl">{wedding.name}</h1>
        {wedding.city && <p className="mt-2 text-muted">{wedding.city}</p>}

        {mine.length > 0 && (
          <ol className="mt-7 divide-y divide-line border-y border-line text-left">
            {mine.map((e) => (
              <li key={e.id} className="flex items-baseline justify-between gap-4 py-3">
                <div>
                  <p className="font-semibold">{e.name}</p>
                  {e.venue && <p className="text-sm text-muted">{e.venue}</p>}
                </div>
                <p className="shrink-0 text-right text-sm text-muted tabular-nums">
                  {ist(e.startsAt, { weekday: "short", day: "numeric", month: "short" })}
                  <br />
                  {ist(e.startsAt, { hour: "numeric", minute: "2-digit" })}
                </p>
              </li>
            ))}
          </ol>
        )}

        <p className="mt-5 text-sm text-muted">
          {!anyOpen
            ? "Replies are closed."
            : wedding.rsvpDeadline
              ? `Please reply by ${ist(wedding.rsvpDeadline, { day: "numeric", month: "long" })}.`
              : "Please reply before each function's day."}
        </p>
      </section>

      {events.length === 0 ? (
        <p className="text-center text-muted">The family hasn&apos;t added the functions yet. Check back soon.</p>
      ) : (
        <RsvpForm action={saveRsvp.bind(null, token)} events={events} guestName={guest.name} />
      )}
      <p className="text-center text-xs text-muted">Sent with WedCount · Only you can see this invite</p>
    </>
  );
}
