import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireOwnedWedding, requirePlanner } from "@/lib/auth";
import { appUrl, inviteLink, inviteMessage, reminderMessage, whatsappUrl } from "@/lib/invite";
import { invitedEvents } from "@/lib/rsvp";
import { missingEvents, reminderStatus } from "@/lib/reminders";
import { markSent } from "@/app/actions";
import { WhatsAppSendButton } from "@/app/ui/forms";
import { Badge, BackLink, WhatsAppBubble, buttonClass } from "@/app/ui/kit";

export const metadata: Metadata = { title: "Send invites · WedCount" };

// One guest at a time: send, and the next one appears. Two queues: first invites, and reminders that are due.
export default function InviteQueuePage(props: PageProps<"/weddings/[id]/invite">) {
  return (
    <main className="stagger mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-10 sm:px-6">
      <Suspense fallback={<p className="text-muted">Loading guests…</p>}>
        <Queue params={props.params} searchParams={props.searchParams} />
      </Suspense>
    </main>
  );
}

const ist = (d: Date, opts: Intl.DateTimeFormatOptions) => d.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", ...opts });

async function Queue({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const mode = sp.mode === "remind" ? "remind" : "invite";
  const skip = Math.max(0, Number(sp.skip) || 0);

  const planner = await requirePlanner();
  const wedding = await requireOwnedWedding(planner.id, id);
  const [events, guests] = await Promise.all([
    prisma.event.findMany({ where: { weddingId: id }, orderBy: { startsAt: "asc" } }),
    prisma.guest.findMany({
      where: { weddingId: id },
      orderBy: { name: "asc" },
      include: { rsvps: { select: { eventId: true } }, invitations: { select: { eventId: true } } },
    }),
  ]);
  const now = new Date();
  const toInvite = guests.filter((g) => !g.invitedAt);
  const toRemind = guests.filter((g) => reminderStatus(g, events, wedding.rsvpDeadline, now) === "due");
  const list = mode === "invite" ? toInvite : toRemind;
  const guest = list.length ? list[skip % list.length] : null;
  const base = appUrl();
  const tab = (m: string, label: string, n: number) => (
    <Link
      href={`/weddings/${id}/invite?mode=${m}`}
      aria-current={mode === m ? "page" : undefined}
      className="press inline-flex h-9 items-center gap-2 rounded-lg px-3.5 text-sm font-medium text-muted hover:text-ink aria-[current]:bg-ink aria-[current]:text-white"
    >
      {label} <span className="tabular-nums opacity-70">{n}</span>
    </Link>
  );

  let body = null;
  if (guest) {
    const fns = invitedEvents(guest, events);
    const link = inviteLink(guest.token, base);
    const text =
      mode === "invite"
        ? inviteMessage({
            guestName: guest.name,
            weddingName: wedding.name,
            link,
            deadline: wedding.rsvpDeadline,
            functions: fns,
            template: wedding.inviteTemplate,
          })
        : reminderMessage({
            guestName: guest.name,
            weddingName: wedding.name,
            link,
            deadline: wedding.rsvpDeadline,
            missing: missingEvents(guest, events).map((e) => e.name),
          });
    body = (
      <section className="rounded-card border border-line bg-surface p-5 shadow-card sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-2xl font-semibold tracking-tight">{guest.name}</p>
            <p className="mt-0.5 text-sm text-muted capitalize">
              {guest.side} · {guest.relation} · <span className="font-mono normal-case">{guest.phone}</span>
            </p>
          </div>
          <p className="text-sm text-muted tabular-nums">
            {(skip % list.length) + 1} of {list.length}
          </p>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {fns.map((e) => (
            <Badge key={e.id}>
              {e.name} · {ist(e.startsAt, { day: "numeric", month: "short" })}
            </Badge>
          ))}
        </div>
        <WhatsAppBubble text={text} className="mt-5" />
        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          <WhatsAppSendButton
            href={whatsappUrl(guest.phone, text)}
            label={mode === "invite" ? "Send invite on WhatsApp" : "Send reminder on WhatsApp"}
            ariaLabel={`Send to ${guest.name} on WhatsApp`}
            onSend={markSent.bind(null, guest.id, mode === "invite" ? "invite" : "reminder")}
            size="lg"
          />
          <Link href={`/weddings/${id}/invite?mode=${mode}&skip=${skip + 1}`} className={buttonClass("secondary", "lg")}>
            Skip for now
          </Link>
        </div>
        <p className="mt-3 text-xs text-muted">
          WhatsApp opens with the message typed. Send it there, then come back: the next guest is already here.
        </p>
      </section>
    );
  } else if (events.length === 0 || guests.length === 0) {
    body = (
      <section className="rounded-card border border-line bg-surface p-6 text-center shadow-card">
        <p className="text-lg font-semibold">Nothing to send yet.</p>
        <p className="mt-1 text-sm text-muted">
          Invites list each guest&apos;s functions, so add {events.length === 0 ? "a function" : ""}
          {events.length === 0 && guests.length === 0 ? " and " : ""}
          {guests.length === 0 ? "your guests" : ""} first.
        </p>
        <Link
          href={`/weddings/${id}#${events.length === 0 ? "functions" : "add"}`}
          className={buttonClass("primary", "md", "mt-5")}
        >
          {events.length === 0 ? "Add a function" : "Add guests"}
        </Link>
      </section>
    );
  } else {
    body = (
      <section className="rounded-card border border-line bg-surface p-6 text-center shadow-card">
        <p className="text-lg font-semibold">{mode === "invite" ? "Everyone has been invited." : "No reminders are due."}</p>
        <p className="mt-1 text-sm text-muted">
          {mode === "invite"
            ? "New guests you add will show up here."
            : "Guests are reminded at most every two days, and only for functions still open for replies."}
        </p>
        <Link href={`/weddings/${id}`} className={buttonClass("secondary", "md", "mt-5")}>
          Back to {wedding.name}
        </Link>
      </section>
    );
  }

  return (
    <>
      <header>
        <BackLink href={`/weddings/${id}`} label={wedding.name} />
        <h1 className="mt-5 font-display text-4xl font-semibold tracking-tight sm:text-5xl">Send invites</h1>
        <p className="mt-1 text-sm text-muted">
          One guest at a time. Edit the message in{" "}
          <Link href={`/weddings/${id}/settings`} className="draw font-medium text-brand">
            Settings
          </Link>
          .
        </p>
      </header>
      <nav aria-label="Queue" className="flex gap-1">
        {tab("invite", "Not invited yet", toInvite.length)}
        {tab("remind", "Reminders due", toRemind.length)}
      </nav>
      {body}
    </>
  );
}
