import { Suspense } from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requirePlanner } from "@/lib/auth";
import { deleteGuest, updateGuest } from "@/app/actions";
import { AddGuestForm, DeleteButton } from "@/app/ui/forms";
import { BackLink } from "@/app/ui/kit";

export default function EditGuestPage(props: PageProps<"/weddings/[id]/guests/[guestId]">) {
  return (
    <main className="stagger mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10 sm:px-6">
      <Suspense fallback={<p className="text-muted">Loading guest…</p>}>
        <EditGuest params={props.params} />
      </Suspense>
    </main>
  );
}

async function EditGuest({ params }: { params: Promise<{ id: string; guestId: string }> }) {
  const { id, guestId } = await params;
  const planner = await requirePlanner();
  // Scoped to this planner and this wedding, so other planners' guests 404.
  const guest = await prisma.guest.findFirst({
    where: { id: guestId, weddingId: id, wedding: { plannerId: planner.id } },
    include: { wedding: { select: { name: true } }, _count: { select: { rsvps: true } } },
  });
  if (!guest) notFound();

  return (
    <>
      <header>
        <BackLink href={`/weddings/${id}`} label={guest.wedding.name} />
        <h1 className="mt-5 font-display text-3xl font-semibold tracking-tight sm:text-4xl">Edit {guest.name}</h1>
        <p className="text-sm text-muted">
          Their invite link stays the same, so links you already sent keep working.
        </p>
      </header>

      <section className="rounded-card border border-line bg-surface p-5 shadow-card sm:p-6">
        <AddGuestForm action={updateGuest.bind(null, guest.id)} guest={guest} />
      </section>

      <section className="rounded-card border border-danger/30 bg-surface p-5 sm:p-6">
        <h2 className="mb-1 font-display text-xl font-semibold">Remove from guest list</h2>
        <p className="mb-4 text-sm text-muted">
          Deletes {guest.name}, their {guest._count.rsvps} saved repl{guest._count.rsvps === 1 ? "y" : "ies"}, and
          their invite link. This can&apos;t be undone.
        </p>
        <DeleteButton
          action={deleteGuest.bind(null, guest.id)}
          label="Delete guest"
          confirmText={`Delete ${guest.name} and their ${guest._count.rsvps} replies? This can't be undone.`}
        />
      </section>
    </>
  );
}
