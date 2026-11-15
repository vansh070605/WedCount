import Link from "next/link";
import { Suspense } from "react";
import { prisma } from "@/lib/db";
import { requireOwnedWedding, requirePlanner } from "@/lib/auth";
import { addGuest, importGuests } from "@/app/actions";
import { AddGuestForm, CopyLinkButton, ImportGuestsForm } from "@/app/ui/forms";
import { appUrl, inviteLink, inviteMessage, whatsappUrl } from "@/lib/invite";

export default function WeddingPage(props: PageProps<"/weddings/[id]">) {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-10">
      <Suspense fallback={<p className="text-zinc-500">Loading wedding…</p>}>
        <Wedding params={props.params} />
      </Suspense>
    </main>
  );
}

async function Wedding({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const planner = await requirePlanner();
  const wedding = await requireOwnedWedding(planner.id, id);
  const guests = await prisma.guest.findMany({ where: { weddingId: wedding.id }, orderBy: { name: "asc" } });
  const base = appUrl();

  return (
    <>
      <header>
        <Link href="/dashboard" className="text-sm text-zinc-600 underline dark:text-zinc-400">
          ← All weddings
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">{wedding.name}</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {wedding.city ?? "No city"}
          {wedding.rsvpDeadline &&
            ` · RSVP by ${wedding.rsvpDeadline.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium" })}`}
        </p>
      </header>

      <section className="rounded-lg border border-zinc-200 p-5 dark:border-zinc-800">
        <h2 className="mb-4 font-semibold">Add a guest</h2>
        <AddGuestForm action={addGuest.bind(null, wedding.id)} />
      </section>

      <section className="rounded-lg border border-zinc-200 p-5 dark:border-zinc-800">
        <h2 className="mb-1 font-semibold">Import from CSV</h2>
        <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
          First row must be a header: <code>name,phone,side,relation</code>. If any row is wrong, nothing is imported.
        </p>
        <ImportGuestsForm action={importGuests.bind(null, wedding.id)} />
      </section>

      <section>
        <h2 className="mb-3 font-semibold">Guest list ({guests.length})</h2>
        {guests.length === 0 ? (
          <p className="text-zinc-600 dark:text-zinc-400">No guests yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 dark:bg-zinc-900">
                <tr>
                  <th className="px-3 py-2 font-medium">Name</th>
                  <th className="px-3 py-2 font-medium">Phone</th>
                  <th className="px-3 py-2 font-medium">Side</th>
                  <th className="px-3 py-2 font-medium">Relation</th>
                  <th className="px-3 py-2 font-medium">Invite</th>
                </tr>
              </thead>
              <tbody>
                {guests.map((g) => {
                  const link = inviteLink(g.token, base);
                  const text = inviteMessage({
                    guestName: g.name,
                    weddingName: wedding.name,
                    link,
                    deadline: wedding.rsvpDeadline,
                  });
                  return (
                    <tr key={g.id} className="border-t border-zinc-200 dark:border-zinc-800">
                      <td className="px-3 py-2">{g.name}</td>
                      <td className="px-3 py-2 font-mono">{g.phone}</td>
                      <td className="px-3 py-2 capitalize">{g.side}</td>
                      <td className="px-3 py-2 capitalize">{g.relation}</td>
                      <td className="px-3 py-2">
                        <div className="flex gap-2">
                          <a
                            href={whatsappUrl(g.phone, text)}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`Send invite to ${g.name} on WhatsApp`}
                            className="rounded-md bg-green-700 px-2 py-1 text-xs font-medium text-white hover:bg-green-800"
                          >
                            WhatsApp
                          </a>
                          <CopyLinkButton link={link} guestName={g.name} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
