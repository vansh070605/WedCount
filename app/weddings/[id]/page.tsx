import Link from "next/link";
import { Suspense } from "react";
import { prisma } from "@/lib/db";
import { requireOwnedWedding, requirePlanner } from "@/lib/auth";
import { addEvent, addGuest, importGuests, markSent, recordActual } from "@/app/actions";
import {
  ActualCountForm,
  AddEventForm,
  AddGuestForm,
  CopyLinkButton,
  ImportGuestsForm,
  WhatsAppSendButton,
} from "@/app/ui/forms";
import { Badge, Card, PageHeader, SectionTitle, Stat, buttonClass } from "@/app/ui/kit";
import { CountUp } from "@/app/ui/count-up";
import { SectionTabs } from "@/app/ui/section-tabs";
import { appUrl, inviteLink, inviteMessage, reminderMessage, whatsappUrl } from "@/lib/invite";
import { REMIND_EVERY_DAYS, ago, missingEvents, reminderStatus } from "@/lib/reminders";
import { countHeadcount } from "@/lib/headcount";
import { errorPct, predictEvent } from "@/lib/predict";
import { plannerCalibration } from "@/lib/calibrate";

export default function WeddingPage(props: PageProps<"/weddings/[id]">) {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <Suspense fallback={<p className="text-muted">Loading wedding…</p>}>
        <Wedding params={props.params} />
      </Suspense>
    </main>
  );
}

const ist = (d: Date, opts: Intl.DateTimeFormatOptions) =>
  d.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", ...opts });
const signed = (pct: number) => (pct > 0 ? `+${pct}%` : `${pct}%`);
const th = "px-4 py-3 text-xs font-medium tracking-wide text-muted uppercase";
const td = "px-4 py-3";

// Short per-function reply for the guest list.
function Reply({ r }: { r: { status: string; vegCount: number; nonVegCount: number } | undefined }) {
  if (!r) return <span className="text-muted">—</span>;
  const people = r.vegCount + r.nonVegCount;
  if (r.status === "attending") return <Badge tone="ok">{people} coming</Badge>;
  if (r.status === "maybe") return <Badge tone="gold">maybe {people}</Badge>;
  return <Badge>can&apos;t come</Badge>;
}

async function Wedding({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const planner = await requirePlanner();
  const wedding = await requireOwnedWedding(planner.id, id);
  const [events, guests, calibration] = await Promise.all([
    prisma.event.findMany({ where: { weddingId: wedding.id }, orderBy: { startsAt: "asc" } }),
    prisma.guest.findMany({ where: { weddingId: wedding.id }, orderBy: { name: "asc" }, include: { rsvps: true } }),
    plannerCalibration(planner.id),
  ]);
  const counts = countHeadcount(events, guests);
  const predictions = events.map((e) => predictEvent(e.id, guests, calibration.factor));
  const base = appUrl();
  const now = new Date();
  const started = events.map((e, i) => ({ e, i })).filter(({ e }) => e.startsAt <= now);
  const statuses = guests.map((g) => ({ guest: g, status: reminderStatus(g, events, wedding.rsvpDeadline, now) }));
  const tally = (s: string) => statuses.filter((x) => x.status === s).length;
  const due = statuses.filter((x) => x.status === "due").map((x) => x.guest);
  const replied = tally("complete");
  const next = events.map((e, i) => ({ e, i })).find(({ e }) => e.startsAt > now);
  const sections: [string, string][] = [
    ["headcount", "Headcount"],
    ...(started.length ? [["turnout", "Turnout"] as [string, string]] : []),
    ...(events.length > 0 && guests.length > 0 ? [["reminders", "Reminders"] as [string, string]] : []),
    ["functions", "Functions"],
    ["guests", "Guests"],
    ["add", "Add guests"],
  ];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        back={{ href: "/dashboard", label: "All weddings" }}
        eyebrow={wedding.city ?? "Wedding"}
        title={wedding.name}
        sub={
          <>
            {guests.length} invites · {events.length} functions
            {wedding.rsvpDeadline && ` · RSVP by ${ist(wedding.rsvpDeadline, { dateStyle: "medium" })}`}
          </>
        }
        action={
          events.length > 0 && (
            <a href={`/weddings/${wedding.id}/export`} className={buttonClass("secondary", "md", "w-full sm:w-auto")}>
              ↓ Caterer CSV
            </a>
          )
        }
      />

      <div className="rise grid grid-cols-2 gap-4 [--d:120ms] lg:grid-cols-4">
        <Stat label="Invites" value={<CountUp value={guests.length} />} sub={`${tally("not-invited")} not sent yet`} />
        <Stat
          label="Replied to all"
          value={<CountUp value={events.length ? replied : 0} />}
          sub={guests.length && events.length ? `${Math.round((replied / guests.length) * 100)}% of invites` : "Waiting for functions"}
        />
        <Stat label="Due a reminder" value={<CountUp value={tally("due")} />} sub={`quiet for ${REMIND_EVERY_DAYS}+ days`} tone="gold" />
        <Stat
          label={next ? `Expected · ${next.e.name}` : "Expected"}
          value={next ? <CountUp value={predictions[next.i].expected} /> : "—"}
          sub={next ? `likely ${predictions[next.i].low}–${predictions[next.i].high}` : "No upcoming function"}
          tone="brand"
        />
      </div>

      <SectionTabs sections={sections} />

      <Card id="headcount" className="scroll-mt-32">
        <SectionTitle title="Headcount" hint="Coming and Maybe count people. Can't come and No reply count invites." />
        {events.length === 0 ? (
          <p className="text-muted">Add a function below to start counting.</p>
        ) : (
          <>
            <ul className="flex flex-col gap-3 sm:hidden">
              {counts.map((c, i) => (
                <li key={c.eventId} className="reveal-row rounded-xl border border-line bg-paper p-4">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="font-display text-lg font-semibold">{c.name}</p>
                    <p className="text-right">
                      <span className="font-display text-3xl font-semibold text-brand">
                        <CountUp value={predictions[i].expected} />
                      </span>
                      <span className="block text-xs text-muted tabular-nums">
                        expected · {predictions[i].low}–{predictions[i].high}
                      </span>
                    </p>
                  </div>
                  <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    {[
                      ["Coming", c.attending.people, `${c.attending.veg} veg · ${c.attending.nonVeg} non-veg`],
                      ["Maybe", c.maybe.people, "people"],
                      ["Can't come", c.declined, "invites"],
                      ["No reply", c.noReply, "invites"],
                    ].map(([k, v, sub]) => (
                      <div key={k} className="rounded-lg bg-sunken px-3 py-2">
                        <dt className="text-[11px] text-muted">{k}</dt>
                        <dd className="font-semibold tabular-nums">
                          {v} <span className="text-[11px] font-normal text-muted">{sub}</span>
                        </dd>
                      </div>
                    ))}
                  </dl>
                </li>
              ))}
            </ul>
            <div className="-mx-6 hidden overflow-x-auto sm:block">
              <table className="w-full text-left text-sm">
                <thead className="bg-sunken">
                  <tr>
                    <th className={th}>Function</th>
                    <th className={th}>Expected</th>
                    <th className={th}>Coming</th>
                    <th className={th}>Veg / Non-veg</th>
                    <th className={th}>Maybe</th>
                    <th className={th}>Can&apos;t come</th>
                    <th className={th}>No reply</th>
                  </tr>
                </thead>
                <tbody>
                  {counts.map((c, i) => (
                    <tr key={c.eventId} className="border-t border-line transition-colors hover:bg-sunken/60">
                      <td className={`${td} font-medium`}>{c.name}</td>
                      <td className={`${td} whitespace-nowrap`}>
                        <span className="font-display text-2xl font-semibold text-brand">
                          <CountUp value={predictions[i].expected} />
                        </span>{" "}
                        <span className="text-xs text-muted tabular-nums">
                          {predictions[i].low}–{predictions[i].high}
                        </span>
                      </td>
                      <td className={`${td} font-semibold tabular-nums`}>{c.attending.people}</td>
                      <td className={`${td} tabular-nums`}>
                        {c.attending.veg} / {c.attending.nonVeg}
                      </td>
                      <td className={`${td} tabular-nums`}>{c.maybe.people}</td>
                      <td className={`${td} tabular-nums`}>{c.declined}</td>
                      <td className={`${td} tabular-nums`}>{c.noReply}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <details className="mt-5 rounded-xl bg-sunken p-4 text-sm text-muted">
              <summary className="cursor-pointer font-medium text-ink">How &ldquo;Expected&rdquo; is worked out</summary>
              <p className="mt-2">
                Each reply is weighted by how often that kind of guest really turns up: a family &ldquo;Coming&rdquo; counts
                more than a colleague&apos;s, a &ldquo;Maybe&rdquo; counts for less, and a guest who never replied still
                counts a little at the average party size. The range is where the real number should land about 9 times out
                of 10.{" "}
                {calibration.events === 0
                  ? "These weights are starting assumptions. Record real turnout after each function and the predictions adjust to your guests."
                  : `Adjusted using real turnout from ${calibration.events} past function${calibration.events === 1 ? "" : "s"} (scaled by ${calibration.factor.toFixed(2)}).`}
              </p>
            </details>
          </>
        )}
      </Card>

      {started.length > 0 && (
        <Card id="turnout" className="scroll-mt-32">
          <SectionTitle
            title="Actual turnout"
            hint="After a function, enter how many people came. It shows how close the prediction was and improves the next ones."
          />
          <ul className="divide-y divide-line">
            {started.map(({ e, i }) => (
              <li key={e.id} className="reveal-row flex flex-wrap items-center justify-between gap-3 py-4">
                <div>
                  <p className="font-medium">{e.name}</p>
                  <p className="text-sm text-muted">
                    {e.actualCount == null
                      ? `Expected ${predictions[i].expected}. Not recorded yet.`
                      : `Came: ${e.actualCount} · Expected: ${predictions[i].expected} (${signed(errorPct(predictions[i].expected, e.actualCount))}) · Counting only "Coming": ${counts[i].attending.people} (${signed(errorPct(counts[i].attending.people, e.actualCount))})`}
                  </p>
                </div>
                <ActualCountForm action={recordActual.bind(null, e.id)} current={e.actualCount} eventName={e.name} />
              </li>
            ))}
          </ul>
        </Card>
      )}

      {events.length > 0 && guests.length > 0 && (
        <Card id="reminders" className="scroll-mt-32">
          <SectionTitle
            title="Reminders"
            hint={
              <>
                {tally("complete")} replied to everything · {tally("due")} due · {tally("recent")} contacted in the last{" "}
                {REMIND_EVERY_DAYS} days · {tally("not-invited")} not invited yet
                {tally("closed") > 0 && ` · ${tally("closed")} missed the deadline`}
              </>
            }
          />
          {due.length === 0 ? (
            <p className="rounded-xl bg-sunken p-4 text-sm text-muted">
              {tally("closed") > 0 ? "The RSVP deadline has passed, so reminders are off." : "Nobody needs a reminder right now."}
              {tally("not-invited") > 0 && " Send invites from the guest list below first."}
            </p>
          ) : (
            <ul className="divide-y divide-line">
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
                  <li key={g.id} className="reveal-row flex flex-wrap items-center justify-between gap-3 py-3">
                    <div>
                      <p className="font-medium">{g.name}</p>
                      <p className="text-sm text-muted">
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
        </Card>
      )}

      <Card id="functions" className="scroll-mt-32">
        <SectionTitle title={`Functions (${events.length})`} hint="Click a function to edit or delete it." />
        {events.length > 0 && (
          <ul className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((e) => (
              <li key={e.id}>
                <Link href={`/weddings/${wedding.id}/events/${e.id}`} className="spot lift block rounded-xl border border-line bg-paper p-4">
                  <p className="font-display text-lg font-semibold">{e.name}</p>
                  <p className="mt-1 text-sm text-muted">
                    {ist(e.startsAt, { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}
                  </p>
                  {e.venue && <p className="text-sm text-muted">{e.venue}</p>}
                </Link>
              </li>
            ))}
          </ul>
        )}
        <AddEventForm action={addEvent.bind(null, wedding.id)} />
      </Card>

      <Card id="guests" className="scroll-mt-32">
        <SectionTitle title={`Guest list (${guests.length})`} hint="Click a name to edit or remove a guest." />
        {guests.length === 0 ? (
          <p className="text-muted">No guests yet. Add them below or import a CSV.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-line sm:hidden">
            {guests.map((g) => {
              const link = inviteLink(g.token, base);
              const text = inviteMessage({ guestName: g.name, weddingName: wedding.name, link, deadline: wedding.rsvpDeadline });
              return (
                <li key={g.id} className="reveal-row py-4 first:pt-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link href={`/weddings/${wedding.id}/guests/${g.id}`} aria-label={`Edit ${g.name}`} className="font-medium">
                        {g.name}
                      </Link>
                      <p className="truncate text-xs text-muted capitalize">
                        {g.side} · {g.relation} · <span className="font-mono normal-case">{g.phone}</span>
                      </p>
                    </div>
                    <p className="shrink-0 text-xs text-muted">{g.invitedAt ? `Invited ${ago(g.invitedAt, now)}` : "Not invited"}</p>
                  </div>
                  {events.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1.5 text-xs">
                      {events.map((e) => (
                        <span key={e.id} className="flex items-center gap-1.5">
                          <span className="text-muted">{e.name}</span>
                          <Reply r={g.rsvps.find((r) => r.eventId === e.id)} />
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <WhatsAppSendButton
                      href={whatsappUrl(g.phone, text)}
                      label={g.invitedAt ? "Resend invite" : "Send on WhatsApp"}
                      ariaLabel={`Send invite to ${g.name} on WhatsApp`}
                      onSend={markSent.bind(null, g.id, "invite")}
                    />
                    <CopyLinkButton link={link} guestName={g.name} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        {guests.length > 0 && (
          <div className="-mx-6 hidden overflow-x-auto sm:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-sunken">
                <tr>
                  <th className={th}>Name</th>
                  <th className={th}>Phone</th>
                  <th className={th}>Side</th>
                  {events.map((e) => (
                    <th key={e.id} className={th}>
                      {e.name}
                    </th>
                  ))}
                  <th className={th}>Invite</th>
                </tr>
              </thead>
              <tbody>
                {guests.map((g) => {
                  const link = inviteLink(g.token, base);
                  const text = inviteMessage({ guestName: g.name, weddingName: wedding.name, link, deadline: wedding.rsvpDeadline });
                  return (
                    <tr key={g.id} className="border-t border-line transition-colors hover:bg-sunken/60">
                      <td className={td}>
                        <Link
                          href={`/weddings/${wedding.id}/guests/${g.id}`}
                          aria-label={`Edit ${g.name}`}
                          className="draw font-medium hover:text-brand"
                        >
                          {g.name}
                        </Link>
                      </td>
                      <td className={`${td} font-mono text-xs text-muted`}>{g.phone}</td>
                      <td className={`${td} capitalize`}>
                        {g.side} · {g.relation}
                      </td>
                      {events.map((e) => (
                        <td key={e.id} className={`${td} whitespace-nowrap`}>
                          <Reply r={g.rsvps.find((r) => r.eventId === e.id)} />
                        </td>
                      ))}
                      <td className={td}>
                        <div className="flex gap-2">
                          <WhatsAppSendButton
                            href={whatsappUrl(g.phone, text)}
                            label={g.invitedAt ? "Resend" : "WhatsApp"}
                            ariaLabel={`Send invite to ${g.name} on WhatsApp`}
                            onSend={markSent.bind(null, g.id, "invite")}
                          />
                          <CopyLinkButton link={link} guestName={g.name} />
                        </div>
                        <p className="mt-1 text-xs text-muted">{g.invitedAt ? `Invited ${ago(g.invitedAt, now)}` : "Not invited yet"}</p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div id="add" className="grid scroll-mt-32 gap-8 lg:grid-cols-2">
        <Card>
          <SectionTitle title="Add a guest" />
          <AddGuestForm action={addGuest.bind(null, wedding.id)} />
        </Card>
        <Card>
          <SectionTitle
            title="Import from CSV"
            hint={
              <>
                Header row: <code className="rounded bg-sunken px-1">name,phone,side,relation</code>. If any row is wrong,
                nothing is imported.
              </>
            }
          />
          <ImportGuestsForm action={importGuests.bind(null, wedding.id)} />
        </Card>
      </div>
    </div>
  );
}
