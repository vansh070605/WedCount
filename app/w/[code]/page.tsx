import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { coupleNames, themeOf } from "@/lib/invitation";
import { joinWedding } from "@/app/actions";
import { JoinForm } from "@/app/ui/forms";
import { Diya, Divider, Garland } from "@/app/ui/ornaments";

export const metadata: Metadata = { title: "You're invited", robots: { index: false } };

// The wedding's shared invite link: a guest says who they are, then gets their own invitation to reply on.
export default function JoinPage(props: PageProps<"/w/[code]">) {
  return (
    <Suspense fallback={<p className="py-20 text-center text-muted">Opening the invitation…</p>}>
      <Join params={props.params} />
    </Suspense>
  );
}

const script = "font-[family-name:var(--font-script)] font-normal";
const ist = (d: Date, opts: Intl.DateTimeFormatOptions) => d.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", ...opts });

async function Join({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const wedding = await prisma.wedding.findUnique({
    where: { joinCode: code },
    include: { events: { orderBy: { startsAt: "asc" }, select: { id: true, name: true, startsAt: true } } },
  });
  if (!wedding) notFound();
  const couple = coupleNames(wedding);

  return (
    <div data-invite={themeOf(wedding.theme)} className="min-h-svh flex-1">
      <section className="relative overflow-hidden bg-[var(--inv-deep)] px-6 pt-14 pb-14 text-center text-[var(--inv-on-deep)]">
        <Garland id="toran-join" className="absolute inset-x-0 top-0 h-7 w-full" />
        <div className="mx-auto flex max-w-xl flex-col items-center">
          <div className="inv-in flex w-full items-start justify-between text-[var(--inv-gold)]">
            <Diya className="size-9" />
            <Diya className="size-9" />
          </div>
          <p className="inv-in mt-2 text-sm italic opacity-85">You&apos;re invited to celebrate</p>
          <h1 className={`${script} inv-in mt-5 text-5xl leading-tight sm:text-6xl`} style={{ "--d": "200ms" } as React.CSSProperties}>
            {couple ? `${couple[0]} & ${couple[1]}` : wedding.name}
          </h1>
          {wedding.city && <p className="mt-4 text-xs tracking-[0.3em] uppercase opacity-80">{wedding.city}</p>}
          <Divider className="inv-draw mt-6 w-56 text-[var(--inv-gold)]" />
        </div>
      </section>

      <main className="mx-auto flex max-w-md flex-col gap-8 px-5 py-12">
        {wedding.events.length > 0 && (
          <ul className="flex flex-col gap-2 text-center">
            {wedding.events.map((e) => (
              <li key={e.id} className="text-sm">
                <span className="font-semibold">{e.name}</span>
                <span className="text-muted"> · {ist(e.startsAt, { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</span>
              </li>
            ))}
          </ul>
        )}
        <section className="rounded-2xl border border-[var(--inv-gold)]/50 bg-white/80 p-6">
          <h2 className="mb-1 font-display text-2xl font-semibold">Tell the family who you are</h2>
          <p className="mb-5 text-sm text-muted">
            Next you&apos;ll see your invitation and can reply. Bookmark that page to change your reply later.
          </p>
          <JoinForm action={joinWedding.bind(null, code)} />
        </section>
      </main>
    </div>
  );
}
