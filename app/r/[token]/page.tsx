import { Suspense } from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { deadlineText, invitedEvents, isEventOpen } from "@/lib/rsvp";
import { calendarUrl, coupleNames, functionTone, initials, mapsUrl, themeOf } from "@/lib/invitation";
import { saveRsvp } from "@/app/actions";
import { RsvpForm, type EventAnswer } from "@/app/ui/rsvp-form";
import { Countdown, ScratchCard } from "@/app/ui/invite-bits";
import { CoupleArt, Diya, Divider, Garland, MandalaCorner } from "@/app/ui/ornaments";

export default function RsvpPage(props: PageProps<"/r/[token]">) {
  return (
    <Suspense fallback={<p className="py-20 text-center text-muted">Opening your invitation…</p>}>
      <Invitation params={props.params} />
    </Suspense>
  );
}

const ist = (d: Date, opts: Intl.DateTimeFormatOptions) => d.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", ...opts });
const script = "font-[family-name:var(--font-script)] font-normal";
const MAIN = /wedding|shaadi|vivah|pheras|muhurtham|nikah|anand karaj/i;

// A one-time shower of marigold petals when the invitation opens (see .petal in globals.css).
const PETALS = [
  [6, 0, 30, 12], [16, 300, -20, 9], [27, 120, 40, 14], [38, 520, -30, 10], [49, 60, 25, 13], [58, 380, -40, 9],
  [67, 180, 35, 12], [76, 640, -25, 11], [85, 240, 30, 14], [93, 460, -35, 10], [21, 820, 20, 8], [72, 900, -15, 9],
];
function Petals() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {PETALS.map(([left, delay, dx, size], i) => (
        <svg
          key={i}
          viewBox="0 0 10 16"
          className="petal absolute -top-6"
          style={{ left: `${left}%`, width: size, "--d": `${delay}ms`, "--dx": `${dx}px`, "--spin": `${i % 2 ? -1 : 1}turn` } as React.CSSProperties}
        >
          <ellipse cx="5" cy="8" rx="4.2" ry="7.5" fill={i % 3 ? "#f6b52a" : "#ef8f12"} />
        </svg>
      ))}
    </div>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] font-semibold tracking-[0.3em] text-[var(--inv-gold)] uppercase">{children}</p>;
}

async function Invitation({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const guest = await prisma.guest.findUnique({
    where: { token },
    select: {
      name: true,
      rsvps: true,
      invitations: { select: { eventId: true } },
      wedding: {
        select: {
          name: true,
          city: true,
          rsvpDeadline: true,
          theme: true,
          brideName: true,
          groomName: true,
          brideParents: true,
          groomParents: true,
          blessing: true,
          events: { orderBy: { startsAt: "asc" } },
        },
      },
    },
  });
  if (!guest) notFound();

  const { wedding } = guest;
  const now = new Date();
  const mine = invitedEvents(guest, wedding.events);
  const couple = coupleNames(wedding);
  const next = mine.find((e) => e.startsAt > now);
  const main = mine.find((e) => MAIN.test(e.name)) ?? next ?? mine[0];
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
    <div data-invite={themeOf(wedding.theme)} className="min-h-svh flex-1">
      {/* Cover: tap the seal to open. A checkbox, so it works before JavaScript has loaded. */}
      <input type="checkbox" id="open-invite" className="peer sr-only" aria-label="Open the invitation" />
      <label
        htmlFor="open-invite"
        className="invite-cover fixed inset-0 z-50 flex cursor-pointer flex-col items-center justify-center gap-8 px-6 text-center text-[var(--inv-on-deep)]"
      >
        {/* Two doors meeting in the middle; they swing apart when the seal is tapped. */}
        <span aria-hidden className="door door-l absolute inset-y-0 left-0 w-1/2 bg-[var(--inv-deep)]">
          <MandalaCorner className="absolute top-10 left-3 size-20 text-[var(--inv-gold)] opacity-60" />
          <span className="absolute inset-y-0 right-0 w-px bg-[var(--inv-gold)]/40" />
        </span>
        <span aria-hidden className="door door-r absolute inset-y-0 right-0 w-1/2 bg-[var(--inv-deep)]">
          <MandalaCorner className="absolute top-10 right-3 size-20 -scale-x-100 text-[var(--inv-gold)] opacity-60" />
        </span>
        <Garland id="toran-cover" className="cover-garland absolute inset-x-0 top-0 h-7 w-full" />
        <span className="cover-content relative flex flex-col items-center gap-8">
        <p className={`${script} text-3xl text-[var(--inv-gold)]`}>An invitation awaits</p>
        <span
          className="seal flex size-28 items-center justify-center rounded-full border-4 border-[var(--inv-gold)] shadow-2xl"
          style={{ background: "radial-gradient(circle at 35% 30%, #c2352f, #7c0f15 70%)" }}
        >
          <span className={`${script} text-4xl text-[#f6dfa0]`}>{initials(wedding)}</span>
        </span>
        <p className="text-xs font-semibold tracking-[0.35em] uppercase opacity-80">Tap the seal</p>
        <p className="text-sm opacity-70">for {guest.name}</p>
        </span>
      </label>
      <noscript>
        <style>{".invite-cover{display:none}"}</style>
      </noscript>

      <main>
        {/* Names */}
        <section className="relative overflow-hidden bg-[var(--inv-deep)] px-6 pt-14 pb-16 text-center text-[var(--inv-on-deep)]">
          <Garland id="toran-hero" className="absolute inset-x-0 top-0 h-7 w-full" />
          <Petals />
          <div className="mx-auto flex max-w-xl flex-col items-center">
            <div className="inv-in flex w-full items-start justify-between text-[var(--inv-gold)]">
              <Diya className="size-9" />
              <Diya className="size-9" />
            </div>
            <p className="inv-in mt-2 max-w-md text-sm italic opacity-85" style={{ "--d": "120ms" } as React.CSSProperties}>
              {wedding.blessing || "With the blessings of our families, we invite you to celebrate with us"}
            </p>
            {couple ? (
              <h1 className={`${script} mt-6 flex flex-col items-center leading-[0.95]`}>
                <span className="inv-in text-6xl sm:text-7xl" style={{ "--d": "260ms" } as React.CSSProperties}>
                  {couple[0]}
                </span>
                <span className="inv-in my-2 text-3xl text-[var(--inv-gold)]" style={{ "--d": "520ms" } as React.CSSProperties}>
                  weds
                </span>
                <span className="inv-in text-6xl sm:text-7xl" style={{ "--d": "700ms" } as React.CSSProperties}>
                  {couple[1]}
                </span>
              </h1>
            ) : (
              <h1 className={`${script} mt-6 text-5xl sm:text-6xl`}>{wedding.name}</h1>
            )}
            {wedding.city && (
              <p className="inv-in mt-6 text-xs tracking-[0.3em] uppercase opacity-80" style={{ "--d": "950ms" } as React.CSSProperties}>
                {wedding.city}
              </p>
            )}
            <Divider className="inv-draw mt-6 w-56 text-[var(--inv-gold)]" />
          </div>
        </section>

        <div className="mx-auto flex max-w-xl flex-col items-center gap-14 px-5 py-14 text-center">
          <p className="text-sm">
            Namaste <span className="font-semibold">{guest.name}</span>, you&apos;re warmly invited.
          </p>

          {/* Families */}
          {(wedding.brideParents || wedding.groomParents) && couple && (
            <section className="reveal relative w-full rounded-2xl border border-[var(--inv-gold)]/50 bg-white/70 px-6 py-10">
              <MandalaCorner className="absolute top-2 left-2 size-12 text-[var(--inv-gold)]" />
              <MandalaCorner className="absolute top-2 right-2 size-12 -scale-x-100 text-[var(--inv-gold)]" />
              <MandalaCorner className="absolute bottom-2 left-2 size-12 -scale-y-100 text-[var(--inv-gold)]" />
              <MandalaCorner className="absolute right-2 bottom-2 size-12 -scale-100 text-[var(--inv-gold)]" />
              <Eyebrow>We joyfully invite you to the wedding of</Eyebrow>
              <p className={`${script} mt-5 text-5xl text-[var(--brand)]`}>{couple[0]}</p>
              {wedding.brideParents && <p className="mt-2 text-sm opacity-80">daughter of {wedding.brideParents}</p>}
              <p className={`${script} my-3 text-2xl text-[var(--inv-gold)]`}>with</p>
              <p className={`${script} text-5xl text-[var(--brand)]`}>{couple[1]}</p>
              {wedding.groomParents && <p className="mt-2 text-sm opacity-80">son of {wedding.groomParents}</p>}
            </section>
          )}

          {/* The couple and the countdown */}
          {next && (
            <section className="reveal flex flex-col items-center gap-6">
              <CoupleArt className="float w-52" />
              <p className={`${script} text-4xl text-[var(--brand)]`}>Counting down to {next.name}</p>
              <Countdown to={next.startsAt.toISOString()} initialDays={Math.max(0, Math.floor((next.startsAt.getTime() - now.getTime()) / 86400000))} />
            </section>
          )}

          {/* Scratch to reveal the big day */}
          {main && (
            <section className="reveal w-full">
              <Eyebrow>Scratch the gold to reveal the date</Eyebrow>
              <div className="mt-5">
                <ScratchCard>
                  <p className={`${script} text-3xl text-[var(--brand)]`}>Save the date</p>
                  <p className="mt-2 font-display text-3xl font-semibold">{ist(main.startsAt, { day: "numeric", month: "long", year: "numeric" })}</p>
                  <p className="mt-1 text-sm opacity-75">
                    {ist(main.startsAt, { weekday: "long" })} · {main.name} · {ist(main.startsAt, { hour: "numeric", minute: "2-digit" })}
                  </p>
                </ScratchCard>
              </div>
            </section>
          )}

          {/* Schedule */}
          {mine.length > 0 && (
            <section className="w-full">
              <Eyebrow>The celebrations</Eyebrow>
              <ol className="mt-6 flex flex-col gap-4 text-left">
                {mine.map((e) => {
                  const tone = functionTone(e.name) ?? "var(--brand)";
                  return (
                    <li
                      key={e.id}
                      className="reveal lift relative overflow-hidden rounded-2xl border border-[var(--inv-gold)]/50 bg-white shadow-sm"
                    >
                      <div className="h-1.5" style={{ background: tone }} />
                      <MandalaCorner className="pointer-events-none absolute top-1.5 right-0 size-24 -scale-x-100 opacity-[0.07]" />
                      <div className="flex items-start gap-4 p-5">
                        <div
                          className="flex w-16 shrink-0 flex-col items-center rounded-xl py-2 text-white shadow-sm"
                          style={{ background: tone }}
                        >
                          <span className="text-[10px] font-semibold tracking-wider uppercase opacity-90">{ist(e.startsAt, { weekday: "short" })}</span>
                          <span className="text-3xl leading-none font-semibold">{ist(e.startsAt, { day: "numeric" })}</span>
                          <span className="text-[10px] font-semibold tracking-wider uppercase opacity-90">{ist(e.startsAt, { month: "short" })}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-display text-2xl leading-tight font-semibold" style={{ color: tone }}>
                            {e.name}
                          </p>
                          <p className="mt-1.5 flex items-center gap-1.5 text-sm opacity-80">
                            <svg viewBox="0 0 20 20" aria-hidden className="size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.6">
                              <circle cx="10" cy="10" r="7" />
                              <path d="M10 6v4l2.5 2" strokeLinecap="round" />
                            </svg>
                            {ist(e.startsAt, { weekday: "long" })} · {ist(e.startsAt, { hour: "numeric", minute: "2-digit" })}
                          </p>
                          {e.venue && (
                            <p className="mt-1 flex items-center gap-1.5 text-sm font-medium">
                              <svg viewBox="0 0 20 20" aria-hidden className="size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.6">
                                <path d="M10 17.5s5.5-5 5.5-9.5a5.5 5.5 0 0 0-11 0c0 4.5 5.5 9.5 5.5 9.5Z" />
                                <circle cx="10" cy="8" r="2" />
                              </svg>
                              {e.venue}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 border-t border-dashed border-[var(--inv-gold)]/40 px-5 py-3">
                        {(e.mapUrl || e.venue) && (
                          <a
                            href={e.mapUrl ?? mapsUrl(e.venue!, wedding.city)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="press inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-xs font-semibold tracking-wide text-white uppercase"
                            style={{ background: tone }}
                          >
                            Directions
                            <svg viewBox="0 0 20 20" aria-hidden className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M7 13 13 7M8 7h5v5" />
                            </svg>
                          </a>
                        )}
                        <a
                          href={calendarUrl(e, wedding.name)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="press inline-flex h-9 items-center rounded-full border px-4 text-xs font-semibold tracking-wide uppercase"
                          style={{ borderColor: tone, color: tone }}
                        >
                          Add to calendar
                        </a>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>
          )}

          {/* RSVP */}
          <section className="w-full text-left">
            <div className="text-center">
              <Eyebrow>Kindly reply</Eyebrow>
              <p className={`${script} mt-3 text-4xl text-[var(--brand)]`}>Will you join us?</p>
              <p className="mt-2 text-sm opacity-75">
                {!anyOpen
                  ? "Replies are closed."
                  : wedding.rsvpDeadline
                    ? `Please reply by ${deadlineText(wedding.rsvpDeadline)}.`
                    : "Please reply before each function's day."}
              </p>
            </div>
            <div className="mt-6">
              {events.length === 0 ? (
                <p className="text-center opacity-75">The family hasn&apos;t added the functions yet. Check back soon.</p>
              ) : (
                <RsvpForm action={saveRsvp.bind(null, token)} events={events} guestName={guest.name} />
              )}
            </div>
          </section>
        </div>

        <footer className="bg-[var(--inv-deep)] px-6 py-10 text-center text-[var(--inv-on-deep)]">
          <Divider className="mx-auto w-48 text-[var(--inv-gold)]" />
          <p className={`${script} mt-4 text-3xl`}>{couple ? `${couple[0]} & ${couple[1]}` : wedding.name}</p>
          <p className="mt-3 text-xs opacity-60">Sent with WedCount · Only you can see this invite</p>
        </footer>
      </main>
    </div>
  );
}
