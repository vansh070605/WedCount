import Link from "next/link";
import { Suspense } from "react";
import { prisma } from "@/lib/db";
import { requireOwnedWedding, requirePlanner } from "@/lib/auth";
import { addEvent, addGuest, importGuests, markSent } from "@/app/actions";
import { AddEventForm, AddGuestForm, CopyLinkButton, ImportGuestsForm, WhatsAppSendButton } from "@/app/ui/forms";
import { appUrl, inviteLink, inviteMessage, reminderMessage, whatsappUrl } from "@/lib/invite";
import { REMIND_EVERY_DAYS, ago, missingEvents, reminderStatus } from "@/lib/reminders";
import { countHeadcount } from "@/lib/headcount";

export default function WeddingPage(props: PageProps<"/weddings/[id]">) {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10">
      <Suspense fallback={<p className="text-zinc-500">Loading wedding…</p>}>
        <Wedding params={props.params} />
      </Suspense>
    </main>
  );
}

const ist = (d: Date, opts: Intl.DateTimeFormatOptions) =>
  d.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", ...opts });
const card = "rounded-lg border border-zinc-200 p-5 dark:border-zinc-800";
const muted = "text-sm text-zinc-600 dark:text-zinc-400";

// Short per-event reply for the guest list, e.g. "3 coming", "maybe 2", "no".
function replyLabel(r: { status: string; vegCount: number; nonVegCount: number } | undefined) {
  if (!r) return "—";
  const people = r.vegCount + r.nonVegCount;
  if (r.status === "attending") return `${people} coming`;
  if (r.status === "maybe") return `maybe ${people}`;
  return "no";
}

async function Wedding({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const planner = await requirePlanner();
  const wedding = await requireOwnedWedding(planner.id, id);
  const [events, guests] = await Promise.all([
    prisma.event.findMany({ where: { weddingId: wedding.id }, orderBy: { startsAt: "asc" } }),
    prisma.guest.findMany({ where: { weddingId: wedding.id }, orderBy: { name: "asc" }, include: { rsvps: true } }),
  ]);
  const counts = countHeadcount(events, guests);
  const base = appUrl();
  const now = new Date();
  const statuses = guests.map((g) => ({ guest: g, status: reminderStatus(g, events, wedding.rsvpDeadline, now) }));
  const tally = (s: string) => statuses.filter((x) => x.status === s).length;
  const due = statuses.filter((x) => x.status === "due").map((x) => x.guest);

  return (
    <>
      <header>
        <Link href="/dashboard" className="text-sm text-zinc-600 underline dark:text-zinc-400">
          ← All weddings
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">{wedding.name}</h1>
        <p className={muted}>
          {wedding.city ?? "No city"} · {guests.length} invites
          {wedding.rsvpDeadline && ` · RSVP by ${ist(wedding.rsvpDeadline, { dateStyle: "medium" })}`}
        </p>
      </header>

      <section className={card}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold">Headcount</h2>
          {events.length > 0 && (
            <a
              href={`/weddings/${wedding.id}/export`}
              className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium hover:border-rose-600 dark:border-zinc-700"
            >
              Download for caterer (CSV)
            </a>
          )}
        </div>
        {events.length === 0 ? (
          <p className={muted}>Add a function below to start counting.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-zinc-600 dark:text-zinc-400">
                <tr>
                  <th className="py-2 pr-4 font-medium">Function</th>
                  <th className="py-2 pr-4 font-medium">Coming</th>
                  <th className="py-2 pr-4 font-medium">Veg / Non-veg</th>
                  <th className="py-2 pr-4 font-medium">Maybe</th>
                  <th className="py-2 pr-4 font-medium">Can&apos;t come</th>
                  <th className="py-2 font-medium">No reply</th>
                </tr>
              </thead>
              <tbody>
                {counts.map((c) => (
                  <tr key={c.eventId} className="border-t border-zinc-200 dark:border-zinc-800">
                    <td className="py-2 pr-4 font-medium">{c.name}</td>
                    <td className="py-2 pr-4 text-lg font-semibold">{c.attending.people}</td>
                    <td className="py-2 pr-4">
                      {c.attending.veg} / {c.attending.nonVeg}
                    </td>
                    <td className="py-2 pr-4">{c.maybe.people} people</td>
                    <td className="py-2 pr-4">{c.declined} invites</td>
                    <td className="py-2">{c.noReply} invites</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className={`mt-3 ${muted}`}>
              Coming and Maybe count people. Can&apos;t come and No reply count invites (one per guest row).
            </p>
          </div>
        )}
      </section>

      {events.length > 0 && guests.length > 0 && (
        <section className={card}>
          <h2 className="mb-1 font-semibold">Reminders</h2>
          <p className={`mb-4 ${muted}`}>
            {tally("complete")} replied to everything · {tally("due")} due a reminder · {tally("recent")} contacted in
            the last {REMIND_EVERY_DAYS} days · {tally("not-invited")} not invited yet
            {tally("closed") > 0 && ` · ${tally("closed")} missed the deadline`}
          </p>
          {due.length === 0 ? (
            <p className={muted}>
              {tally("closed") > 0
                ? "The RSVP deadline has passed, so reminders are off."
                : "Nobody needs a reminder right now."}
              {tally("not-invited") > 0 && " Send invites from the guest list below first."}
            </p>
          ) : (
            <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {due.map((g) => {
                const missing = missingEvents(g, events).map((e) => e.name);
                const text = reminderMessage({
                  guestName: g.name,
                  weddingName: wedding.name,
                  link: inviteLink(g.token, base),
                  deadline: wedding.rsvpDeadline,
                  missing,
                });
                return (
                  <li key={g.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                    <div>
                      <p className="font-medium">{g.name}</p>
                      <p className={muted}>
                        No reply for {missing.join(", ")} ·{" "}
                        {g.remindedAt
                          ? `reminded ${ago(g.remindedAt, now)} (${g.reminderCount}x)`
                          : `invited ${ago(g.invitedAt!, now)}`}
                      </p>
                    </div>
                    <WhatsAppSendButton
                      href={whatsappUrl(g.phone, text)}
                      label="Send reminder"
                      ariaLabel={`Send reminder to ${g.name} on WhatsApp`}
                      onSend={markSent.bind(null, g.id, "reminder")}
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}

      <section className={card}>
        <h2 className="mb-1 font-semibold">Functions ({events.length})</h2>
        {events.length > 0 && (
          <ul className={`mb-4 ${muted}`}>
            {events.map((e) => (
              <li key={e.id}>
                <span className="font-medium text-zinc-900 dark:text-zinc-100">{e.name}</span> ·{" "}
                {ist(e.startsAt, { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}
                {e.venue && ` · ${e.venue}`}
              </li>
            ))}
          </ul>
        )}
        <AddEventForm action={addEvent.bind(null, wedding.id)} />
      </section>

      <section className={card}>
        <h2 className="mb-4 font-semibold">Add a guest</h2>
        <AddGuestForm action={addGuest.bind(null, wedding.id)} />
      </section>

      <section className={card}>
        <h2 className="mb-1 font-semibold">Import from CSV</h2>
        <p className={`mb-4 ${muted}`}>
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
                  {events.map((e) => (
                    <th key={e.id} className="px-3 py-2 font-medium">
                      {e.name}
                    </th>
                  ))}
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
                      <td className="px-3 py-2 capitalize">
                        {g.side} · {g.relation}
                      </td>
                      {events.map((e) => (
                        <td key={e.id} className="px-3 py-2 whitespace-nowrap">
                          {replyLabel(g.rsvps.find((r) => r.eventId === e.id))}
                        </td>
                      ))}
                      <td className="px-3 py-2">
                        <div className="flex gap-2">
                          <WhatsAppSendButton
                            href={whatsappUrl(g.phone, text)}
                            label={g.invitedAt ? "Resend" : "WhatsApp"}
                            ariaLabel={`Send invite to ${g.name} on WhatsApp`}
                            onSend={markSent.bind(null, g.id, "invite")}
                          />
                          <CopyLinkButton link={link} guestName={g.name} />
                        </div>
                        <p className="mt-1 text-xs text-zinc-500">
                          {g.invitedAt ? `Invited ${ago(g.invitedAt, now)}` : "Not invited yet"}
                        </p>
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
