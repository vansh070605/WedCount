import { Suspense } from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { isRsvpOpen } from "@/lib/rsvp";
import { saveRsvp } from "@/app/actions";
import { RsvpForm, type EventAnswer } from "@/app/ui/rsvp-form";
import { Mark } from "@/app/ui/brand";

export default function RsvpPage(props: PageProps<"/r/[token]">) {
  return (
    <main className="relative flex-1">
      <div className="stagger relative mx-auto flex w-full max-w-xl flex-col gap-8 px-4 py-12">
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
      wedding: {
        select: { name: true, city: true, rsvpDeadline: true, events: { orderBy: { startsAt: "asc" } } },
      },
    },
  });
  if (!guest) notFound();

  const { wedding } = guest;
  const open = isRsvpOpen(wedding.rsvpDeadline);
  const events: EventAnswer[] = wedding.events.map((e) => {
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
    };
  });

  return (
    <>
      <header className="flex flex-col items-center text-center">
        <Mark className="size-10" />
        <p className="mt-5 text-sm text-muted">Namaste {guest.name},</p>
        <p className="mt-1 text-sm font-medium text-brand">You&apos;re invited to</p>
        <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight sm:text-5xl">{wedding.name}</h1>
        <span aria-hidden className="mt-5 h-px w-16 bg-line" />
        <p className="mt-4 text-sm text-muted">
          {wedding.city}
          {wedding.rsvpDeadline &&
            ` · ${open ? "Please reply by" : "Replies closed on"} ${ist(wedding.rsvpDeadline, { dateStyle: "medium" })}`}
        </p>
      </header>

      {events.length === 0 ? (
        <p className="text-center text-muted">The family hasn&apos;t added the functions yet. Check back soon.</p>
      ) : (
        <RsvpForm action={saveRsvp.bind(null, token)} events={events} open={open} />
      )}
      <p className="text-center text-xs text-muted">Sent with WedCount · Only you can see this invite</p>
    </>
  );
}
