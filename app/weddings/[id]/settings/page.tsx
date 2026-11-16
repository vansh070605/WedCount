import { Suspense } from "react";
import { requireOwnedWedding, requirePlanner } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { istDate } from "@/lib/rsvp";
import { deleteWedding, saveInviteTemplate, updateWedding } from "@/app/actions";
import { CreateWeddingForm, DeleteButton, InviteTemplateForm } from "@/app/ui/forms";
import { BackLink } from "@/app/ui/kit";

export default function WeddingSettingsPage(props: PageProps<"/weddings/[id]/settings">) {
  return (
    <main className="stagger mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10 sm:px-6">
      <Suspense fallback={<p className="text-muted">Loading wedding…</p>}>
        <Settings params={props.params} />
      </Suspense>
    </main>
  );
}

async function Settings({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const planner = await requirePlanner();
  const wedding = await requireOwnedWedding(planner.id, id);
  const counts = await prisma.wedding.findUniqueOrThrow({
    where: { id },
    select: {
      _count: { select: { events: true, guests: true } },
      events: { orderBy: { startsAt: "asc" }, select: { name: true } },
      guests: { orderBy: { name: "asc" }, take: 1, select: { name: true } },
    },
  });
  const { events, guests } = counts._count;

  return (
    <>
      <header>
        <BackLink href={`/weddings/${id}`} label={wedding.name} />
        <h1 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">Wedding settings</h1>
        <p className="mt-1 text-sm text-muted">Guests see the new name, city and deadline the next time they open their invite.</p>
      </header>

      <section className="rounded-card border border-line bg-surface p-5 shadow-card sm:p-6">
        <CreateWeddingForm
          action={updateWedding.bind(null, id)}
          wedding={{
            name: wedding.name,
            city: wedding.city,
            rsvpDeadline: wedding.rsvpDeadline ? istDate(wedding.rsvpDeadline) : "",
          }}
        />
      </section>

      <section className="rounded-card border border-line bg-surface p-5 shadow-card sm:p-6">
        <h2 className="mb-1 text-xl font-semibold">WhatsApp invite message</h2>
        <p className="mb-5 text-sm text-muted">
          What guests receive when you tap Send. Each guest&apos;s message lists only the functions they&apos;re invited to.
        </p>
        <InviteTemplateForm
          action={saveInviteTemplate.bind(null, id)}
          current={wedding.inviteTemplate}
          sample={{
            guestName: counts.guests[0]?.name ?? "Sharma Uncle",
            weddingName: wedding.name,
            functions: counts.events.map((e) => e.name),
            deadline: wedding.rsvpDeadline,
          }}
        />
      </section>

      <section className="rounded-card border border-danger/30 bg-surface p-5 sm:p-6">
        <h2 className="mb-1 text-xl font-semibold">Delete this wedding</h2>
        <p className="mb-4 text-sm text-muted">
          Deletes {wedding.name} with its {events} function{events === 1 ? "" : "s"}, {guests} guest{guests === 1 ? "" : "s"}{" "}
          and every reply. Invite links already sent stop working. This can&apos;t be undone.
        </p>
        <DeleteButton
          action={deleteWedding.bind(null, id)}
          label="Delete wedding"
          confirmText={`Delete ${wedding.name}, ${guests} guests and all their replies? This can't be undone.`}
        />
      </section>
    </>
  );
}
