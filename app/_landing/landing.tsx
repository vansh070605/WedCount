"use client";

// Marketing page. All motion lives in one useGSAP scope:
// - full motion only when the visitor hasn't asked for reduced motion (gsap.matchMedia);
// - every animated element is rendered in its final state on the server, so with reduced motion,
//   no JS or a failed script the page is complete and readable;
// - the pinned story runs on wide screens only; phones get the same steps stacked.

import { useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { Mark, Wordmark } from "@/app/ui/brand";
import { ButtonLink, Ornament } from "@/app/ui/kit";

gsap.registerPlugin(useGSAP, ScrollTrigger);

// One example wedding, used consistently across every mock on the page.
const EXAMPLE = {
  couple: "Priya & Rohit",
  rows: [
    { fn: "Haldi", coming: 86, veg: 61, nonVeg: 25, maybe: 14, noReply: 22, expected: 84, low: 76, high: 92 },
    { fn: "Sangeet", coming: 230, veg: 141, nonVeg: 89, maybe: 41, noReply: 38, expected: 212, low: 196, high: 228 },
    { fn: "Wedding", coming: 312, veg: 198, nonVeg: 114, maybe: 36, noReply: 52, expected: 289, low: 270, high: 308 },
  ],
};

const steps = [
  {
    title: "Add guests and functions",
    body: "Type them in or import the family's spreadsheet. Add Haldi, Sangeet, Wedding, Reception with times and venues.",
  },
  {
    title: "Invite on WhatsApp",
    body: "One tap opens WhatsApp with each guest's personal link already typed. It goes from your own number, so families trust it.",
  },
  {
    title: "Guests reply per function",
    body: "Coming, Maybe or Can't come for each function, how many people, veg or non-veg, and when they'll arrive.",
  },
  {
    title: "Your caterer gets one number",
    body: "Live totals per function, an expected turnout with a likely range, and a CSV the caterer can open in Excel.",
  },
];

const features = [
  { icon: "🗓️", title: "Every function, separately", body: "Haldi and Reception aren't the same crowd. Replies and counts are kept per function." },
  { icon: "🥗", title: "Veg and non-veg split", body: "Each reply carries its own veg and non-veg count, so the menu is planned from real numbers." },
  { icon: "🔔", title: "Reminders that don't nag", body: "See who hasn't replied and nudge them in one tap, never more than once every two days." },
  { icon: "📊", title: "Predictions that learn", body: "Record real turnout after each function and future estimates adjust to your guests." },
  { icon: "📄", title: "Caterer-ready export", body: "One CSV per wedding: expected people, range, and the food split for every function." },
  { icon: "🔒", title: "Private by default", body: "Each guest sees only their own invite. Planners see only their own weddings." },
];

function Petals() {
  // A few marigold petals drifting through the hero. Decorative, hidden under reduced motion.
  const petals = [
    { left: "8%", delay: "0s", dur: "14s", dx: "60px", size: 14 },
    { left: "22%", delay: "-6s", dur: "18s", dx: "-40px", size: 10 },
    { left: "47%", delay: "-3s", dur: "16s", dx: "30px", size: 12 },
    { left: "68%", delay: "-9s", dur: "20s", dx: "-70px", size: 16 },
    { left: "84%", delay: "-12s", dur: "15s", dx: "40px", size: 11 },
    { left: "93%", delay: "-2s", dur: "19s", dx: "-30px", size: 9 },
  ];
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {petals.map((p, i) => (
        <svg
          key={i}
          viewBox="0 0 10 16"
          className="petal absolute top-0"
          style={
            {
              left: p.left,
              width: p.size,
              animation: `drift ${p.dur} linear ${p.delay} infinite`,
              "--dx": p.dx,
              "--spin": `${(i % 2 ? -1 : 1) * (280 + i * 30)}deg`,
            } as React.CSSProperties
          }
        >
          <ellipse cx="5" cy="8" rx="4.2" ry="7.5" fill="var(--gold)" opacity="0.55" />
        </svg>
      ))}
    </div>
  );
}

function HeadcountFrame() {
  // The product's real headcount table, as live HTML (not a screenshot).
  return (
    <div data-hero-frame className="relative rounded-[1.25rem] border border-line bg-surface p-2 shadow-lift">
      <div className="flex items-center gap-1.5 px-3 py-2">
        <span className="size-2.5 rounded-full bg-line" />
        <span className="size-2.5 rounded-full bg-line" />
        <span className="size-2.5 rounded-full bg-line" />
        <span className="ml-3 truncate rounded-full bg-sunken px-3 py-0.5 text-xs text-muted">wedcount.app/weddings/priya-rohit</span>
      </div>
      <div className="rounded-xl bg-paper p-4 sm:p-5">
        <div className="flex items-baseline justify-between gap-3">
          <p className="font-display text-lg font-semibold">{EXAMPLE.couple}</p>
          <p className="text-xs text-muted">Jaipur · RSVP by 1 Dec</p>
        </div>
        <div className="mt-4 overflow-hidden rounded-xl border border-line bg-surface">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-sunken text-muted">
              <tr>
                <th className="px-3 py-2 font-medium">Function</th>
                <th className="px-3 py-2 font-medium">Coming</th>
                <th className="hidden px-3 py-2 font-medium sm:table-cell">Veg / Non-veg</th>
                <th className="px-3 py-2 font-medium">Expected</th>
              </tr>
            </thead>
            <tbody>
              {EXAMPLE.rows.map((r) => (
                <tr key={r.fn} data-row className="border-t border-line">
                  <td className="px-3 py-2.5 font-medium">{r.fn}</td>
                  <td className="px-3 py-2.5 tabular-nums" data-count={r.coming}>
                    {r.coming}
                  </td>
                  <td className="hidden px-3 py-2.5 tabular-nums sm:table-cell">
                    {r.veg} / {r.nonVeg}
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="font-display text-base font-semibold text-brand tabular-nums" data-count={r.expected}>
                      {r.expected}
                    </span>{" "}
                    <span className="text-muted tabular-nums">
                      ({r.low}–{r.high})
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* WhatsApp reply bubble overlapping the frame: what the planner's day actually looks like. */}
      <div
        data-hero-bubble
        className="absolute -bottom-16 -left-6 hidden w-64 rounded-2xl rounded-bl-sm border border-line bg-surface p-3 text-xs shadow-lift sm:block"
      >
        <p className="flex items-center gap-1.5 font-medium text-wa">
          <span className="relative flex size-2">
            <span className="absolute inset-0 rounded-full bg-wa" style={{ animation: "pulse-dot 1.8s ease-in-out infinite" }} />
            <span className="relative size-2 rounded-full bg-wa" />
          </span>
          New reply · Sharma Uncle
        </p>
        <p className="mt-1 text-muted">Sangeet: Coming, 4 people (3 veg, 1 non-veg), arriving 7:30 pm</p>
      </div>
    </div>
  );
}

function Phone({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mx-auto w-[280px] rounded-[2.4rem] border border-line bg-ink p-2.5 shadow-lift">
      <div className="relative h-[520px] overflow-hidden rounded-[1.9rem] bg-paper">
        <div className="absolute top-2 left-1/2 z-10 h-5 w-24 -translate-x-1/2 rounded-full bg-ink" />
        {children}
      </div>
    </div>
  );
}

// The four story screens, stacked; the scroll timeline shows one at a time.
function StoryScreens() {
  const r = EXAMPLE.rows[1];
  return (
    <Phone>
      <div data-screen className="absolute inset-0 flex flex-col gap-3 bg-sunken p-4 pt-10">
        <p className="text-center text-xs font-semibold text-muted">Guest list · 46 guests</p>
        {["Sharma Uncle · family", "Neha Kapoor · friend", "Arjun Nair · colleague", "Kavya Iyer · friend", "Rahul Jain · family"].map((g) => (
          <div key={g} className="flex items-center justify-between rounded-xl bg-surface px-3 py-2.5 text-sm shadow-card">
            <span>{g}</span>
            <span className="rounded-full bg-wa px-2 py-0.5 text-[10px] font-medium text-white">WhatsApp</span>
          </div>
        ))}
        <div className="mt-auto rounded-xl border border-dashed border-line p-3 text-center text-xs text-muted">+ Import guests.csv</div>
      </div>

      <div data-screen className="absolute inset-0 flex flex-col bg-[#e9e2d7] p-4 pt-10 dark:bg-[#1f1915]">
        <p className="text-center text-xs font-semibold text-muted">Sharma Uncle</p>
        <div className="mt-4 ml-auto max-w-[88%] rounded-2xl rounded-br-sm bg-[#d8f3c6] p-3 text-[13px] leading-snug text-[#1f2a1a] shadow-card">
          Namaste Sharma Uncle! You&apos;re invited to {EXAMPLE.couple}.
          <br />
          <br />
          Please tell us which functions you&apos;ll attend and how many of you are coming by 1 December:
          <br />
          <span className="text-[#0b7a43] underline">wedcount.app/r/7Hq2…</span>
          <p className="mt-1 text-right text-[10px] text-[#1f2a1a]/60">10:42 ✓✓</p>
        </div>
        <div className="mt-3 max-w-[70%] rounded-2xl rounded-bl-sm bg-surface p-3 text-[13px] shadow-card">
          Will reply tonight beta 🙏
        </div>
      </div>

      <div data-screen className="absolute inset-0 flex flex-col gap-3 p-4 pt-10">
        <p className="text-center font-display text-lg font-semibold">You&apos;re invited</p>
        <Ornament className="px-6" />
        <div className="rounded-xl border border-line bg-surface p-3 shadow-card">
          <p className="font-display font-semibold">Sangeet</p>
          <p className="text-[11px] text-muted">Thu 10 Dec, 7:00 pm · Rambagh Lawns</p>
          <div className="mt-2 flex gap-1.5 text-[11px]">
            <span data-chip className="rounded-full bg-brand px-2.5 py-1 font-medium text-white">Coming</span>
            <span className="rounded-full border border-line px-2.5 py-1">Maybe</span>
            <span className="rounded-full border border-line px-2.5 py-1">Can&apos;t come</span>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-1.5 text-[11px]">
            <span className="rounded-lg bg-sunken px-2 py-1.5">Veg 3</span>
            <span className="rounded-lg bg-sunken px-2 py-1.5">Non-veg 1</span>
          </div>
        </div>
        <div className="rounded-xl border border-line bg-surface p-3 shadow-card">
          <p className="font-display font-semibold">Wedding</p>
          <div className="mt-2 flex gap-1.5 text-[11px]">
            <span className="rounded-full bg-brand px-2.5 py-1 font-medium text-white">Coming</span>
            <span className="rounded-full border border-line px-2.5 py-1">Maybe</span>
          </div>
        </div>
        <span className="mt-auto rounded-full bg-brand py-2.5 text-center text-sm font-medium text-white">Save my reply</span>
      </div>

      <div data-screen className="absolute inset-0 flex flex-col gap-3 p-4 pt-10">
        <p className="text-center text-xs font-semibold text-muted">Sangeet · headcount</p>
        <div className="rounded-xl border border-line bg-surface p-4 text-center shadow-card">
          <p className="text-xs text-muted">Expected</p>
          <p className="font-display text-6xl font-semibold text-brand tabular-nums" data-count={r.expected}>
            {r.expected}
          </p>
          <p className="text-xs text-muted">
            likely {r.low}–{r.high}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          {[
            ["Coming", r.coming],
            ["Maybe", r.maybe],
            ["Veg", r.veg],
            ["Non-veg", r.nonVeg],
          ].map(([k, v]) => (
            <div key={k} className="rounded-xl border border-line bg-surface p-3 shadow-card">
              <p className="text-[11px] text-muted">{k}</p>
              <p className="font-semibold tabular-nums">{v}</p>
            </div>
          ))}
        </div>
        <span className="mt-auto rounded-full border border-line py-2.5 text-center text-sm font-medium">Download for caterer</span>
      </div>
    </Phone>
  );
}

export function Landing() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // Hero: headline lines rise out of their masks, then the product frame and reply bubble.
        // Skipped when scripts arrive late (slow phone): the visitor is already reading the hero, and hiding it
        // to replay the entrance would look like a glitch.
        const intro = gsap.timeline({ defaults: { ease: "power3.out" } });
        intro
          .from("[data-hero-line]", { yPercent: 110, duration: 0.9, stagger: 0.09 })
          .from("[data-hero-fade]", { y: 16, opacity: 0, duration: 0.7, stagger: 0.08 }, "-=0.5")
          .from("[data-hero-frame]", { y: 60, opacity: 0, duration: 1.1 }, "-=0.7")
          .from("[data-row]", { x: -12, opacity: 0, duration: 0.5, stagger: 0.08 }, "-=0.6")
          .from("[data-hero-bubble]", { y: 24, scale: 0.9, opacity: 0, duration: 0.7, ease: "back.out(1.6)" }, "-=0.2");
        if (performance.now() > 1500) intro.progress(1); // late scripts: show the hero as it already is

        // Numbers count up from zero the first time they come into view.
        const late = performance.now() > 1500;
        gsap.utils.toArray<HTMLElement>("[data-count]").forEach((el) => {
          if (late && ScrollTrigger.isInViewport(el)) return; // already read on screen: don't reset it to 0
          const end = Number(el.dataset.count);
          const counter = { v: 0 };
          gsap.to(counter, {
            v: end,
            duration: 1.4,
            ease: "power2.out",
            onUpdate: () => (el.textContent = Math.round(counter.v).toString()),
            scrollTrigger: { trigger: el, start: "top 92%", once: true },
          });
        });

        // The problem in three numbers, scrubbed with the scroll: invited, said yes, came.
        gsap
          .timeline({ scrollTrigger: { trigger: "[data-problem]", start: "top 70%", end: "center 45%", scrub: 0.6 } })
          .from("[data-problem-num]", { y: 40, opacity: 0, stagger: 0.3 })
          .from("[data-problem-strike]", { scaleX: 0, transformOrigin: "left center", duration: 0.6 })
          .from("[data-problem-note]", { y: 20, opacity: 0 });

        // Section headings and blocks rise in as they enter.
        gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
          gsap.from(el, { y: 36, opacity: 0, duration: 0.9, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 85%" } });
        });

        // Feature cards arrive in a wave.
        gsap.set("[data-card]", { y: 40, opacity: 0 });
        ScrollTrigger.batch("[data-card]", {
          start: "top 88%",
          onEnter: (batch) => gsap.to(batch, { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: "power3.out" }),
          once: true,
        });

        // Prediction bars grow to their value.
        gsap.from("[data-bar]", {
          scaleX: 0,
          transformOrigin: "left center",
          duration: 1.2,
          stagger: 0.15,
          ease: "power3.out",
          scrollTrigger: { trigger: "[data-bars]", start: "top 75%" },
        });

      });

      // Pinned story: wide screens only. Each step of the scroll swaps the phone screen and lights its step.
      mm.add("(prefers-reduced-motion: no-preference) and (min-width: 1024px)", () => {
        const screens = gsap.utils.toArray<HTMLElement>("[data-screen]");
        const items = gsap.utils.toArray<HTMLElement>("[data-step]");
        gsap.set(screens.slice(1), { autoAlpha: 0, yPercent: 8 });
        gsap.set(items.slice(1), { opacity: 0.35 });
        gsap.set("[data-story-progress]", { scaleY: 1 / screens.length });

        const tl = gsap.timeline({
          scrollTrigger: { trigger: "[data-story]", start: "top top", end: `+=${screens.length * 70}%`, pin: true, scrub: 0.6 },
        });
        screens.forEach((screen, i) => {
          if (i === 0) return;
          tl.to(screens[i - 1], { autoAlpha: 0, yPercent: -8, duration: 0.5 }, i)
            .to(screen, { autoAlpha: 1, yPercent: 0, duration: 0.5 }, i)
            .to(items[i - 1], { opacity: 0.35, duration: 0.3 }, i)
            .to(items[i], { opacity: 1, duration: 0.3 }, i)
            .to("[data-story-progress]", { scaleY: (i + 1) / screens.length, duration: 0.5 }, i);
        });
        tl.from("[data-chip]", { scale: 0.6, duration: 0.3, ease: "back.out(2)" }, 2.2);
      });
    },
    { scope: root },
  );

  return (
    <div ref={root} className="flex flex-1 flex-col overflow-x-clip">
      <header className="sticky top-0 z-40 border-b border-line/60 bg-paper/80 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Wordmark />
          <nav className="flex items-center gap-2">
            <ButtonLink href="/login" variant="ghost" size="sm">
              Log in
            </ButtonLink>
            <ButtonLink href="/signup" size="sm">
              Start planning
            </ButtonLink>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative">
          <Petals />
          <div className="mx-auto grid min-h-[calc(100svh-4.5rem)] w-full max-w-6xl items-center gap-12 px-4 pt-10 pb-24 sm:px-6 lg:grid-cols-[1.1fr_1fr]">
            <div>
              <p data-hero-fade className="text-xs font-semibold tracking-[0.2em] text-gold uppercase">
                For Indian wedding planners
              </p>
              <h1 className="mt-4 font-display text-[2.5rem] leading-[1.05] font-semibold tracking-tight sm:text-5xl xl:text-[3.4rem]">
                {["WhatsApp RSVPs,", "an honest headcount", "for every function."].map((line, i) => (
                  <span key={line} className="block overflow-hidden pb-1 sm:whitespace-nowrap">
                    <span data-hero-line className="block">
                      {i === 1 ? (
                        <>
                          an <em className="text-brand not-italic">honest</em> headcount
                        </>
                      ) : (
                        line
                      )}
                    </span>
                  </span>
                ))}
              </h1>
              <p data-hero-fade className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
                Send each guest a personal link on WhatsApp. They reply for Haldi, Sangeet and Wedding separately, and you
                give the caterer one number per function, with a likely range.
              </p>
              <div data-hero-fade className="mt-8 flex flex-wrap gap-3">
                <ButtonLink href="/signup" size="lg">
                  Start planning a wedding
                </ButtonLink>
                <ButtonLink href="#how" variant="secondary" size="lg">
                  See how it works
                </ButtonLink>
              </div>
            </div>
            <HeadcountFrame />
          </div>
        </section>

        {/* The problem */}
        <section data-problem className="border-y border-line bg-surface">
          <div className="mx-auto w-full max-w-6xl px-4 py-24 sm:px-6">
            <h2 className="sr-only">The guest-count problem</h2>
            <div className="grid gap-10 text-center sm:grid-cols-3">
              {[
                ["400", "invited"],
                ["400", "said they'd come"],
                ["280", "actually came"],
              ].map(([n, label]) => (
                <div key={label} data-problem-num>
                  <p className="font-display text-7xl font-semibold tabular-nums sm:text-8xl">{n}</p>
                  <p className="mt-2 text-muted">{label}</p>
                </div>
              ))}
            </div>
            <div data-problem-note className="mx-auto mt-14 max-w-2xl text-center">
              <p className="font-display text-2xl leading-snug sm:text-3xl">
                The caterer still cooked for 400. That&apos;s{" "}
                <span className="relative inline-block whitespace-nowrap text-brand">
                  120 plates
                  <span data-problem-strike className="absolute top-1/2 left-0 h-[3px] w-full -rotate-2 rounded bg-brand" />
                </span>{" "}
                nobody ate.
              </p>
              <p className="mt-4 text-muted">
                &ldquo;Of course we&apos;ll come&rdquo; isn&apos;t a headcount. WedCount turns replies into a number you can
                plan food around.
              </p>
            </div>
          </div>
        </section>

        {/* How it works: pinned story on wide screens */}
        <section id="how" data-story className="relative">
          <div className="mx-auto grid min-h-svh w-full max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2">
            <div>
              <p className="text-xs font-semibold tracking-[0.2em] text-gold uppercase">How it works</p>
              <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-5xl">From invite to headcount</h2>
              <div className="relative mt-10 pl-8">
                <span className="absolute top-1 bottom-1 left-[11px] w-0.5 rounded bg-line" />
                <span
                  data-story-progress
                  className="absolute top-1 bottom-1 left-[11px] w-0.5 origin-top rounded bg-brand"
                />
                <ol className="flex flex-col gap-8">
                  {steps.map((s, i) => (
                    <li key={s.title} data-step className="relative">
                      <span className="absolute top-0.5 -left-8 flex size-6 items-center justify-center rounded-full border-2 border-brand bg-paper text-xs font-semibold text-brand">
                        {i + 1}
                      </span>
                      <p className="font-display text-xl font-semibold">{s.title}</p>
                      <p className="mt-1.5 max-w-md text-muted">{s.body}</p>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
            <div className="hidden lg:block">
              <StoryScreens />
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="border-t border-line bg-surface">
          <div className="mx-auto w-full max-w-6xl px-4 py-24 sm:px-6">
            <div data-reveal className="max-w-2xl">
              <p className="text-xs font-semibold tracking-[0.2em] text-gold uppercase">What planners get</p>
              <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-5xl">Built around how Indian weddings run</h2>
            </div>
            <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((f) => (
                <li key={f.title} data-card className="lift rounded-card border border-line bg-paper p-6">
                  <span aria-hidden className="flex size-11 items-center justify-center rounded-xl bg-gold-soft text-xl">
                    {f.icon}
                  </span>
                  <p className="mt-5 font-display text-lg font-semibold">{f.title}</p>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{f.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Prediction */}
        <section>
          <div className="mx-auto grid w-full max-w-6xl items-center gap-14 px-4 py-24 sm:px-6 lg:grid-cols-2">
            <div data-reveal>
              <p className="text-xs font-semibold tracking-[0.2em] text-gold uppercase">Expected turnout</p>
              <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
                &ldquo;Coming&rdquo; doesn&apos;t always mean coming
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-muted">
                Each reply is weighted by how reliably that kind of guest turns up. Family counts more than colleagues, a
                Maybe counts for less, and even silent invites count a little. Record real turnout after each function
                and the numbers adjust to your families.
              </p>
            </div>
            <div data-bars className="rounded-card border border-line bg-surface p-6 shadow-card sm:p-8">
              <p className="font-display text-lg font-semibold">Sangeet · {EXAMPLE.couple}</p>
              {(() => {
                const r = EXAMPLE.rows[1];
                const max = r.coming + r.maybe;
                const bars = [
                  { label: "Said Coming", value: r.coming, cls: "bg-line" },
                  { label: "Coming + Maybe", value: r.coming + r.maybe, cls: "bg-line" },
                  { label: "Expected", value: r.expected, cls: "bg-brand" },
                ];
                return (
                  <div className="mt-6 flex flex-col gap-5">
                    {bars.map((b) => (
                      <div key={b.label}>
                        <div className="flex justify-between text-sm">
                          <span className={b.cls === "bg-brand" ? "font-semibold text-brand" : "text-muted"}>{b.label}</span>
                          <span className="font-semibold tabular-nums">{b.value}</span>
                        </div>
                        <div className="mt-2 h-3 overflow-hidden rounded-full bg-sunken">
                          <div data-bar className={`h-full rounded-full ${b.cls}`} style={{ width: `${(b.value / max) * 100}%` }} />
                        </div>
                      </div>
                    ))}
                    <div className="relative mt-1 h-3 rounded-full bg-sunken">
                      <div
                        data-bar
                        className="absolute h-full rounded-full bg-gold/70"
                        style={{ left: `${(r.low / max) * 100}%`, width: `${((r.high - r.low) / max) * 100}%` }}
                      />
                    </div>
                    <p className="text-sm text-muted">
                      Likely range{" "}
                      <span className="font-semibold text-ink tabular-nums">
                        {r.low}–{r.high}
                      </span>
                    </p>
                  </div>
                );
              })()}
            </div>
          </div>
        </section>

        {/* For guests */}
        <section className="border-y border-line bg-surface">
          <div className="mx-auto grid w-full max-w-6xl items-center gap-14 px-4 py-24 sm:px-6 lg:grid-cols-[1fr_1.1fr]">
            <div data-reveal className="order-2 lg:order-1">
              <div className="jaali mx-auto max-w-sm rounded-card border border-line bg-paper p-6 shadow-lift">
                <p className="text-center text-sm text-muted">Namaste Sharma Uncle,</p>
                <p className="mt-1 text-center font-display text-2xl font-semibold">{EXAMPLE.couple}</p>
                <Ornament className="mt-4" />
                <div className="mt-5 rounded-xl border border-line bg-surface p-4">
                  <p className="font-display font-semibold">Wedding</p>
                  <p className="text-xs text-muted">Fri 11 Dec, 8:00 pm · Rambagh Lawns</p>
                  <div className="mt-3 flex gap-2 text-xs">
                    <span className="rounded-full bg-brand px-3 py-1.5 font-medium text-white">Coming</span>
                    <span className="rounded-full border border-line px-3 py-1.5">Maybe</span>
                    <span className="rounded-full border border-line px-3 py-1.5">Can&apos;t come</span>
                  </div>
                </div>
              </div>
            </div>
            <div data-reveal className="order-1 lg:order-2">
              <p className="text-xs font-semibold tracking-[0.2em] text-gold uppercase">For guests</p>
              <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
                An invite that feels like an invite
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-muted">
                No app, no login. Guests open their link from WhatsApp, tap Coming, Maybe or Can&apos;t come for each
                function, and can change their mind until the deadline. It works on any phone, even before the page
                fully loads.
              </p>
            </div>
          </div>
        </section>

        {/* Call to action */}
        <section className="relative overflow-hidden">
          <div className="jaali absolute inset-0 opacity-60" aria-hidden />
          <div className="relative mx-auto flex w-full max-w-6xl flex-col items-center px-4 py-28 text-center sm:px-6">
            <Mark className="size-12" />
            <h2 data-reveal className="mt-6 max-w-3xl font-display text-4xl font-semibold tracking-tight sm:text-6xl">
              Plan the food for the guests who&apos;ll actually come
            </h2>
            <div data-reveal className="mt-8 flex flex-wrap justify-center gap-3">
              <ButtonLink href="/signup" size="lg">
                Start planning a wedding
              </ButtonLink>
              <ButtonLink href="/login" variant="secondary" size="lg">
                Log in
              </ButtonLink>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-8 text-sm text-muted sm:px-6">
          <Wordmark />
          <p>Made in India, for Indian weddings.</p>
          <nav className="flex gap-4">
            <Link href="/login" className="draw hover:text-ink">
              Log in
            </Link>
            <Link href="/signup" className="draw hover:text-ink">
              Create account
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
