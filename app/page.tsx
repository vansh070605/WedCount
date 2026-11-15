import Link from "next/link";
import { Wordmark } from "@/app/ui/brand";

const steps = [
  { title: "Add your guests", body: "Type them in or import a CSV. Add each function: Haldi, Sangeet, Wedding, Reception." },
  { title: "Invite on WhatsApp", body: "One tap opens WhatsApp with a personal link ready to send, from your own number." },
  { title: "Get one honest number", body: "Guests reply per function. You see who's coming, what they eat, and how many will really turn up." },
];

const features = [
  { title: "Per-function RSVPs", body: "Coming, Maybe or Can't come for each function, with veg / non-veg counts and arrival time." },
  { title: "Gentle reminders", body: "See who hasn't replied, and nudge them in one tap. Never more than once every two days." },
  { title: "Caterer sheet", body: "Download a CSV per function with expected people and the veg / non-veg split." },
  { title: "Predictions that learn", body: "\"Coming\" doesn't always mean coming. Record real turnout and future estimates adjust to your guests." },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4">
        <Wordmark />
        <nav className="flex items-center gap-3 text-sm">
          <Link href="/login" className="font-medium text-zinc-700 hover:text-rose-700 dark:text-zinc-300">
            Log in
          </Link>
          <Link href="/signup" className="rounded-md bg-rose-700 px-3 py-1.5 font-medium text-white hover:bg-rose-800">
            Get started
          </Link>
        </nav>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-col gap-20 px-4 pt-10 pb-20">
        <section className="grid items-center gap-10 md:grid-cols-2">
          <div className="flex flex-col gap-5">
            <p className="text-sm font-medium tracking-wide text-amber-700 uppercase dark:text-amber-400">
              For Indian wedding planners
            </p>
            <h1 className="font-display text-4xl leading-tight font-semibold tracking-tight sm:text-5xl">
              Know who&apos;s <em className="text-rose-700 not-italic dark:text-rose-400">really</em> coming.
            </h1>
            <p className="text-lg text-zinc-600 dark:text-zinc-400">
              400 invited, 400 said yes, 280 showed up. WedCount collects RSVPs over WhatsApp for every function and
              gives your caterer one honest headcount, so nobody pays for 120 plates of paneer that nobody eats.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/signup" className="rounded-md bg-rose-700 px-5 py-2.5 font-medium text-white hover:bg-rose-800">
                Plan a wedding
              </Link>
              <Link
                href="/login"
                className="rounded-md border border-zinc-300 px-5 py-2.5 font-medium hover:border-rose-700 dark:border-zinc-700"
              >
                Log in
              </Link>
            </div>
          </div>

          {/* Product preview, drawn in HTML so it stays sharp and matches the real headcount table. */}
          <figure
            aria-label="Example headcount for a Sangeet"
            className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex items-baseline justify-between">
              <p className="font-display text-lg font-semibold">Sangeet</p>
              <p className="text-sm text-zinc-500">Sat, 7:00 pm · Rambagh Lawns</p>
            </div>
            <div className="mt-6 flex items-end gap-3">
              <p className="font-display text-6xl font-semibold text-rose-700 dark:text-rose-400">212</p>
              <p className="pb-2 text-sm text-zinc-600 dark:text-zinc-400">
                expected
                <br />
                likely 196–228
              </p>
            </div>
            <dl className="mt-6 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
              {[
                ["Coming", "230"],
                ["Veg / Non-veg", "141 / 89"],
                ["Maybe", "41"],
                ["No reply", "38"],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-zinc-500">{k}</dt>
                  <dd className="mt-0.5 text-base font-semibold">{v}</dd>
                </div>
              ))}
            </dl>
            <figcaption className="mt-6 border-t border-zinc-200 pt-4 text-xs text-zinc-500 dark:border-zinc-800">
              Example numbers. 230 said &ldquo;Coming&rdquo;, but not all of them will make it.
            </figcaption>
          </figure>
        </section>

        <section>
          <h2 className="font-display text-2xl font-semibold">How it works</h2>
          <ol className="mt-6 grid gap-6 md:grid-cols-3">
            {steps.map((s, i) => (
              <li key={s.title} className="flex gap-4">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-100 font-semibold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  {i + 1}
                </span>
                <div>
                  <p className="font-semibold">{s.title}</p>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section>
          <h2 className="font-display text-2xl font-semibold">What you get</h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {features.map((f) => (
              <li key={f.title} className="rounded-xl border border-zinc-200 p-5 dark:border-zinc-800">
                <p className="font-semibold">{f.title}</p>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{f.body}</p>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <footer className="border-t border-zinc-200 py-6 text-center text-sm text-zinc-500 dark:border-zinc-800">
        WedCount · Built in India, for Indian weddings
      </footer>
    </div>
  );
}
