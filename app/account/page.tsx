import { Suspense } from "react";
import type { Metadata } from "next";
import { requirePlanner } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { deleteAccount } from "@/app/actions";
import { AppHeader } from "@/app/ui/brand";
import { DeleteAccountForm } from "@/app/ui/forms";
import { PageHeader } from "@/app/ui/kit";

export const metadata: Metadata = { title: "Account · WedCount" };

export default function AccountPage() {
  return (
    <>
      <AppHeader />
      <main className="stagger mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10 sm:px-6">
        <Suspense fallback={<p className="text-muted">Loading account…</p>}>
          <Account />
        </Suspense>
      </main>
    </>
  );
}

async function Account() {
  const planner = await requirePlanner();
  const weddings = await prisma.wedding.count({ where: { plannerId: planner.id } });

  return (
    <>
      <PageHeader back={{ href: "/dashboard", label: "All weddings" }} title="Account" />

      <section className="rounded-card border border-line bg-surface p-5 shadow-card sm:p-6">
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted">Name</dt>
            <dd className="mt-0.5 font-medium">{planner.name}</dd>
          </div>
          <div>
            <dt className="text-muted">Email</dt>
            <dd className="mt-0.5 font-medium">{planner.email}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-card border border-danger/30 bg-surface p-5 sm:p-6">
        <h2 className="mb-1 text-xl font-semibold">Delete account</h2>
        <p className="mb-4 text-sm text-muted">
          Deletes your account and your {weddings} wedding{weddings === 1 ? "" : "s"}, with every function, guest and reply in
          them. Invite links already sent stop working. This can&apos;t be undone.
        </p>
        <DeleteAccountForm action={deleteAccount} />
      </section>
    </>
  );
}
