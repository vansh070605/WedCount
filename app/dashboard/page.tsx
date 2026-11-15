import Link from "next/link";
import { Suspense } from "react";
import { prisma } from "@/lib/db";
import { requirePlanner } from "@/lib/auth";
import { createWedding } from "@/app/actions";
import { CreateWeddingForm } from "@/app/ui/forms";

export default function DashboardPage() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-10">
      <Suspense fallback={<p className="text-zinc-500">Loading your weddings…</p>}>
        <Dashboard />
      </Suspense>
    </main>
  );
}

async function Dashboard() {
  const planner = await requirePlanner();
  const weddings = await prisma.wedding.findMany({
    where: { plannerId: planner.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { guests: true, events: true } } },
  });

  return (
    <>
      <header>
        <h1 className="font-display text-3xl font-semibold">Your weddings</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Namaste, {planner.name}</p>
      </header>

      <section className="rounded-lg border border-zinc-200 p-5 dark:border-zinc-800">
        <h2 className="mb-4 font-semibold">New wedding</h2>
        <CreateWeddingForm action={createWedding} />
      </section>

      {weddings.length === 0 ? (
        <p className="text-zinc-600 dark:text-zinc-400">No weddings yet. Create your first one above.</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {weddings.map((w) => (
            <li key={w.id}>
              <Link
                href={`/weddings/${w.id}`}
                className="block rounded-lg border border-zinc-200 p-4 hover:border-rose-600 dark:border-zinc-800"
              >
                <p className="font-medium">{w.name}</p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {w.city ?? "No city"} · {w._count.guests} guests · {w._count.events} events
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
