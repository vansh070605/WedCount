import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-6 px-4 py-16">
      <h1 className="text-4xl font-semibold tracking-tight">Know who&apos;s really coming.</h1>
      <p className="text-lg text-zinc-600 dark:text-zinc-400">
        WedCount collects RSVPs over WhatsApp for every function of an Indian wedding and gives your caterer one
        honest headcount.
      </p>
      <div className="flex gap-3">
        <Link href="/signup" className="rounded-md bg-rose-700 px-4 py-2 text-sm font-medium text-white hover:bg-rose-800">
          Get started
        </Link>
        <Link
          href="/login"
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium dark:border-zinc-700"
        >
          Log in
        </Link>
      </div>
    </main>
  );
}
