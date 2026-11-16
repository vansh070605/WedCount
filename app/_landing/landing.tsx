// Marketing page. Plain server-rendered HTML: the product's own UI is the picture, motion is limited to
// the shared hover states and the CSS scroll reveals in globals.css.
import Link from "next/link";
import type { ReactNode } from "react";
import { SiteFooter, Wordmark } from "@/app/ui/brand";
import { ButtonLink } from "@/app/ui/kit";
import { MobileMenu } from "@/app/ui/mobile-menu";
import { HeaderAuth } from "@/app/ui/header-auth";
import { CoupleArt, Divider, Garland } from "@/app/ui/ornaments";

// One example wedding, used consistently across every mock on the page.
const EXAMPLE = {
  couple: "Priya & Rohit",
  rows: [
    { fn: "Haldi", coming: 86, veg: 61, nonVeg: 25, maybe: 14, noReply: 22, expected: 84, low: 76, high: 92 },
    { fn: "Sangeet", coming: 230, veg: 141, nonVeg: 89, maybe: 41, noReply: 38, expected: 212, low: 196, high: 228 },
    { fn: "Wedding", coming: 312, veg: 198, nonVeg: 114, maybe: 36, noReply: 52, expected: 289, low: 270, high: 308 },
  ],
};

const NAV: [href: string, label: string][] = [
  ["#features", "Features"],
  ["#how", "How it works"],
  ["#prediction", "Expected turnout"],
];

const steps = [
  { title: "Add guests and functions", body: "Type them in or import the family's spreadsheet. Add Haldi, Sangeet, Wedding and Reception with times and venues." },
  { title: "Invite on WhatsApp", body: "One tap opens WhatsApp with each guest's personal link already typed, sent from your own number." },
  { title: "Guests reply per function", body: "Coming, Maybe or Can't come for each function, with party size, veg or non-veg, and arrival time." },
  { title: "Give the caterer one number", body: "Live totals per function, an expected turnout with a likely range, and a CSV that opens in Excel." },
];

// 24px stroke icons, drawn in currentColor.
const icon = (d: ReactNode) => (
  <svg viewBox="0 0 24 24" aria-hidden className="size-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    {d}
  </svg>
);

const features = [
  {
    icon: icon(<><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>),
    title: "Every function, separately",
    body: "Haldi and Reception aren't the same crowd. Replies and counts are kept per function.",
  },
  {
    icon: icon(<><circle cx="12" cy="12" r="9" /><path d="M12 3v9l7.8 4.5" /></>),
    title: "Veg and non-veg split",
    body: "Each reply carries its own veg and non-veg count, so the menu is planned from real numbers.",
  },
  {
    icon: icon(<><path d="M6 16v-5a6 6 0 1 1 12 0v5l2 2H4z" /><path d="M10 20a2 2 0 0 0 4 0" /></>),
    title: "Reminders that don't nag",
    body: "See who hasn't replied and nudge them in one tap, at most once every two days.",
  },
  {
    icon: icon(<path d="M3 20h18M6 16v-5M11 16V6M16 16v-8" />),
    title: "Predictions that learn",
    body: "Record real turnout after each function and future estimates adjust to your guests.",
  },
  {
    icon: icon(<><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5M12 11v6M9 14l3 3 3-3" /></>),
    title: "Caterer-ready export",
    body: "One CSV per wedding: expected people, range, and the food split for every function.",
  },
  {
    icon: icon(<><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>),
    title: "Private by default",
    body: "Each guest sees only their own invite. Planners see only their own weddings.",
  },
];

function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="text-sm font-medium text-brand">{children}</p>;
}

function H2({ children }: { children: ReactNode }) {
  return <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight text-balance sm:text-5xl sm:leading-[1.05]">{children}</h2>;
}

// The product's real wedding screen, as live HTML (not a screenshot).
function ProductFrame() {
  const stats = [
    ["Invites", "412", "18 not sent yet"],
    ["Replied to all", "318", "77% of invites"],
    ["Due a reminder", "37", "quiet for 2+ days"],
    ["Expected · Sangeet", "212", "likely 196–228"],
  ];
  return (
    <div className="rounded-2xl border border-line bg-surface p-1.5 shadow-lift">
      <div className="flex items-center gap-1.5 px-3 py-2">
        <span className="size-2.5 rounded-full bg-line" />
        <span className="size-2.5 rounded-full bg-line" />
        <span className="size-2.5 rounded-full bg-line" />
        <span className="ml-3 truncate rounded-md bg-sunken px-3 py-0.5 text-xs text-muted">wedcount.app/weddings/priya-rohit</span>
      </div>
      <div className="rounded-xl border border-line bg-paper p-4 text-left sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-lg font-semibold tracking-tight">{EXAMPLE.couple}</p>
          <p className="text-xs text-muted">Jaipur · RSVP by 1 Dec</p>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map(([k, v, sub], i) => (
            <div key={k} className="rounded-lg border border-line bg-surface p-3">
              <p className="text-xs font-medium text-muted">{k}</p>
              <p className={`mt-1 text-2xl font-semibold tracking-tight tabular-nums ${i === 3 ? "text-brand" : ""}`}>{v}</p>
              <p className="text-[11px] text-muted">{sub}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 overflow-hidden rounded-lg border border-line bg-surface">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-sunken text-muted">
              <tr>
                <th className="px-3 py-2 font-medium">Function</th>
                <th className="px-3 py-2 font-medium">Coming</th>
                <th className="hidden px-3 py-2 font-medium sm:table-cell">Veg / Non-veg</th>
                <th className="hidden px-3 py-2 font-medium sm:table-cell">Maybe</th>
                <th className="hidden px-3 py-2 font-medium sm:table-cell">No reply</th>
                <th className="px-3 py-2 font-medium">Expected</th>
              </tr>
            </thead>
            <tbody>
              {EXAMPLE.rows.map((r) => (
                <tr key={r.fn} className="border-t border-line">
                  <td className="px-3 py-2.5 font-medium">{r.fn}</td>
                  <td className="px-3 py-2.5 tabular-nums">{r.coming}</td>
                  <td className="hidden px-3 py-2.5 tabular-nums sm:table-cell">
                    {r.veg} / {r.nonVeg}
                  </td>
                  <td className="hidden px-3 py-2.5 tabular-nums sm:table-cell">{r.maybe}</td>
                  <td className="hidden px-3 py-2.5 tabular-nums sm:table-cell">{r.noReply}</td>
                  <td className="px-3 py-2.5">
                    <span className="font-semibold text-brand tabular-nums">{r.expected}</span>{" "}
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
    </div>
  );
}

export function Landing() {
  const sangeet = EXAMPLE.rows[1];
  const max = sangeet.coming + sangeet.maybe;

  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur">
        <Garland className="garland-drop pointer-events-none absolute inset-x-0 -bottom-px h-3.5 w-full opacity-90" />
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-6 px-4 sm:px-6">
          <Wordmark />
          <nav aria-label="Main" className="hidden items-center gap-7 text-sm text-muted md:flex">
            {NAV.map(([href, label]) => (
              <Link key={href} href={href} className="hover:text-ink">
                {label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <HeaderAuth />
            <MobileMenu links={NAV} />
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="border-b border-line bg-[linear-gradient(to_bottom,var(--surface),var(--paper))]">
          <div className="mx-auto flex w-full max-w-6xl flex-col items-center px-4 pt-16 pb-16 text-center sm:px-6 sm:pt-24 sm:pb-20">
            <p className="rise inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-[13px] text-muted shadow-card">
              <span className="size-1.5 rounded-full bg-ok" />
              For Indian wedding planners
            </p>
            <h1 className="rise mt-6 max-w-4xl font-display text-[2.9rem] leading-[1.02] font-semibold tracking-[-0.01em] text-balance [--d:60ms] sm:text-7xl lg:text-[5.2rem]">
              WhatsApp RSVPs and an expected headcount for every function.
            </h1>
            <p className="rise mt-6 max-w-2xl text-lg leading-relaxed text-muted [--d:120ms]">
              Send each guest a personal link on WhatsApp. They reply for Haldi, Sangeet and Wedding separately, and you give
              the caterer one number per function, with a likely range.
            </p>
            <div className="rise mt-9 flex w-full flex-col justify-center gap-3 [--d:180ms] sm:w-auto sm:flex-row">
              <ButtonLink href="/signup" size="lg">
                Start planning a wedding
              </ButtonLink>
              <ButtonLink href="#how" variant="secondary" size="lg">
                See how it works
              </ButtonLink>
            </div>
            <p className="rise mt-5 text-[13px] text-muted [--d:220ms]">No app for guests · Sent from your own number · Free while in beta</p>
            <div className="rise mt-14 w-full max-w-5xl [--d:260ms]">
              <ProductFrame />
            </div>
          </div>
        </section>

        {/* The problem */}
        <section className="border-b border-line bg-surface">
          <div className="mx-auto grid w-full max-w-6xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_1.2fr] lg:items-center">
            <div className="reveal">
              <Eyebrow>The problem</Eyebrow>
              <H2>Everyone says yes. Not everyone comes.</H2>
              <p className="mt-5 text-lg leading-relaxed text-muted">
                Guest counts are still worked out on WhatsApp and gut feel. The caterer cooks for every &ldquo;of course
                we&apos;ll come&rdquo;, and the family pays for the plates nobody eats.
              </p>
            </div>
            <dl className="reveal grid grid-cols-2 overflow-hidden rounded-card border border-line sm:grid-cols-4">
              {[
                ["400", "invited", ""],
                ["400", "said they'd come", ""],
                ["280", "actually came", ""],
                ["120", "plates wasted", "text-danger"],
              ].map(([n, label, tone], i) => (
                <div key={label} className={`bg-paper p-5 ${i % 2 ? "border-l" : ""} ${i > 1 ? "border-t sm:border-t-0" : ""} ${i === 2 ? "sm:border-l" : ""} border-line`}>
                  <dt className="text-[13px] text-muted">{label}</dt>
                  <dd className={`mt-1 text-4xl font-semibold tracking-tight tabular-nums ${tone}`}>{n}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="scroll-mt-16 border-b border-line">
          <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
            <div className="reveal max-w-2xl">
              <Eyebrow>Features</Eyebrow>
              <H2>Built around how Indian weddings run</H2>
            </div>
            <ul className="mt-12 grid gap-px overflow-hidden rounded-card border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
              {features.map((f) => (
                <li key={f.title} className="reveal bg-surface p-7">
                  <span className="flex size-10 items-center justify-center rounded-lg border border-line bg-paper text-ink">{f.icon}</span>
                  <p className="mt-5 font-semibold">{f.title}</p>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{f.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="scroll-mt-16 border-b border-line bg-surface">
          <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
            <div className="reveal max-w-2xl">
              <Eyebrow>How it works</Eyebrow>
              <H2>From invite to headcount in four steps</H2>
            </div>
            <ol className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((s, i) => (
                <li key={s.title} className="reveal border-t-2 border-line pt-5 first:border-ink">
                  <p className="text-sm font-medium text-muted tabular-nums">0{i + 1}</p>
                  <p className="mt-2 font-semibold">{s.title}</p>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Prediction */}
        <section id="prediction" className="scroll-mt-16 border-b border-line">
          <div className="mx-auto grid w-full max-w-6xl items-center gap-14 px-4 py-20 sm:px-6 sm:py-24 lg:grid-cols-2">
            <div className="reveal">
              <Eyebrow>Expected turnout</Eyebrow>
              <H2>&ldquo;Coming&rdquo; doesn&apos;t always mean coming</H2>
              <p className="mt-5 text-lg leading-relaxed text-muted">
                Each reply is weighted by how reliably that kind of guest turns up. Family counts more than colleagues, a Maybe
                counts for less, and silent invites count a little. Record real turnout after each function and the numbers
                adjust to your families.
              </p>
              <Link href="/docs/features" className="draw mt-6 inline-block text-sm font-medium text-brand">
                Read how the model works
              </Link>
            </div>
            <div className="reveal rounded-card border border-line bg-surface p-6 shadow-card sm:p-8">
              <div className="flex items-baseline justify-between">
                <p className="font-semibold">Sangeet</p>
                <p className="text-xs text-muted">{EXAMPLE.couple}</p>
              </div>
              <div className="mt-6 flex flex-col gap-5">
                {[
                  { label: "Said Coming", value: sangeet.coming, bar: "bg-line" },
                  { label: "Coming + Maybe", value: sangeet.coming + sangeet.maybe, bar: "bg-line" },
                  { label: "Expected", value: sangeet.expected, bar: "bg-brand" },
                ].map((b) => (
                  <div key={b.label}>
                    <div className="flex justify-between text-sm">
                      <span className={b.bar === "bg-brand" ? "font-medium text-ink" : "text-muted"}>{b.label}</span>
                      <span className="font-semibold tabular-nums">{b.value}</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-sunken">
                      <div className={`h-full rounded-full ${b.bar}`} style={{ width: `${(b.value / max) * 100}%` }} />
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between border-t border-line pt-4 text-sm">
                  <span className="text-muted">Likely range (90%)</span>
                  <span className="font-semibold tabular-nums">
                    {sangeet.low}–{sangeet.high}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* For guests */}
        <section className="border-b border-line bg-surface">
          <div className="mx-auto grid w-full max-w-6xl items-center gap-14 px-4 py-20 sm:px-6 sm:py-24 lg:grid-cols-2">
            <div className="reveal order-2 lg:order-1">
              <div data-invite="royal" className="float mx-auto max-w-sm overflow-hidden rounded-[2rem] border-8 border-ink shadow-lift">
                <div className="relative bg-[var(--inv-deep)] px-6 pt-9 pb-8 text-center text-[var(--inv-on-deep)]">
                  <Garland id="toran-mock" className="absolute inset-x-0 top-0 h-5 w-full" />
                  <p className="text-xs italic opacity-80">With the blessings of our families</p>
                  <p className="mt-3 font-[family-name:var(--font-script)] text-5xl leading-none">Priya</p>
                  <p className="my-1 font-[family-name:var(--font-script)] text-2xl text-[var(--inv-gold)]">weds</p>
                  <p className="font-[family-name:var(--font-script)] text-5xl leading-none">Rohit</p>
                  <Divider className="mx-auto mt-4 w-40 text-[var(--inv-gold)]" />
                </div>
                <div className="flex justify-center bg-[var(--inv-paper)] pt-4">
                  <CoupleArt className="w-28" />
                </div>
                <div className="bg-[var(--inv-paper)] p-4">
                <div className="rounded-lg border border-line bg-surface p-4">
                  <p className="font-semibold">Wedding</p>
                  <p className="text-xs text-muted">Fri 11 Dec, 8:00 pm · Rambagh Lawns</p>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                    <span className="rounded-lg bg-[var(--brand)] py-2 text-center font-medium text-white">Coming</span>
                    <span className="rounded-lg border border-line py-2 text-center">Maybe</span>
                    <span className="rounded-lg border border-line py-2 text-center">Can&apos;t come</span>
                  </div>
                </div>
                </div>
              </div>
            </div>
            <div className="reveal order-1 lg:order-2">
              <Eyebrow>For guests</Eyebrow>
              <H2>An invitation, not a form</H2>
              <p className="mt-5 text-lg leading-relaxed text-muted">
                Guests tap a wax seal to open a real invitation: the couple, their families, a countdown, a gold card to scratch
                for the date, and every function with a map. Then they reply for each one. No app, no login, any phone.
              </p>
            </div>
          </div>
        </section>

        {/* Call to action */}
        <section className="bg-ink text-white">
          <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-8 px-4 py-20 sm:px-6 lg:flex-row lg:items-center">
            <div>
              <h2 className="max-w-2xl font-display text-4xl font-semibold tracking-tight text-balance sm:text-5xl sm:leading-[1.05]">
                Plan the food for the guests who will actually come.
              </h2>
              <p className="mt-4 text-white/70">Set up a wedding in minutes. Guests need nothing but WhatsApp.</p>
            </div>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <Link
                href="/signup"
                className="press inline-flex h-12 items-center justify-center rounded-lg bg-white px-6 font-medium text-ink hover:bg-white/90"
              >
                Create an account
              </Link>
              <Link
                href="/docs"
                className="press inline-flex h-12 items-center justify-center rounded-lg border border-white/25 px-6 font-medium text-white hover:bg-white/10"
              >
                Read the docs
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
