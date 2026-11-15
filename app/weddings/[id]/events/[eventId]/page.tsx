import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requirePlanner } from "@/lib/auth";
import { istDate } from "@/lib/rsvp";
import { deleteEvent, updateEvent } from "@/app/actions";
import { AddEventForm, DeleteButton } from "@/app/ui/forms";

export default function EditEventPage(props: PageProps<"/weddings/[id]/events/[eventId]">) {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10">
      <Suspense fallback={<p className="text-zinc-500">Loading function…</p>}>
        <EditEvent params={props.params} />
      </Suspense>
    </main>
  );
}

async function EditEvent({ params }: { params: Promise<{ id: string; eventId: string }> }) {
  const { id, eventId } = await params;
  const planner = await requirePlanner();
  const event = await prisma.event.findFirst({
    where: { id: eventId, weddingId: id, wedding: { plannerId: planner.id } },
    include: { wedding: { select: { name: true } }, _count: { select: { rsvps: true } } },
  });
  if (!event) notFound();

  const time = event.startsAt.toLocaleTimeString("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });

  return (
    <>
      <header>
        <Link href={`/weddings/${id}`} className="text-sm text-zinc-600 underline dark:text-zinc-400">
          ← {event.wedding.name}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Edit {event.name}</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Guests see the new name, time and venue the next time they open their invite.
        </p>
      </header>

      <section className="rounded-lg border border-zinc-200 p-5 dark:border-zinc-800">
        <AddEventForm
          action={updateEvent.bind(null, event.id)}
          event={{ name: event.name, date: istDate(event.startsAt), time, venue: event.venue }}
        />
      </section>

      <section className="rounded-lg border border-red-200 p-5 dark:border-red-900">
        <h2 className="mb-1 font-semibold">Delete this function</h2>
        <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
          Deletes {event.name} and the {event._count.rsvps} repl{event._count.rsvps === 1 ? "y" : "ies"} guests gave for
          it{event.actualCount != null && ", including the recorded turnout"}. This can&apos;t be undone.
        </p>
        <DeleteButton
          action={deleteEvent.bind(null, event.id)}
          label="Delete function"
          confirmText={`Delete ${event.name} and ${event._count.rsvps} guest replies for it? This can't be undone.`}
        />
      </section>
    </>
  );
}
