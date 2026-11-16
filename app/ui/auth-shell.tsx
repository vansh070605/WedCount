import type { ReactNode } from "react";
import { Wordmark } from "@/app/ui/brand";

// Two-panel layout for login and signup: the form, and on wide screens a brand panel showing the product.
export function AuthShell({ title, sub, children, footer }: { title: string; sub: string; children: ReactNode; footer: ReactNode }) {
  return (
    <div className="grid min-h-svh flex-1 lg:grid-cols-2">
      <div className="flex flex-col px-4 py-6 sm:px-10">
        <Wordmark />
        <main className="stagger mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 py-12">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
            <p className="mt-2 text-muted">{sub}</p>
          </div>
          <div className="rounded-card border border-line bg-surface p-6 shadow-card">{children}</div>
          <p className="text-sm text-muted">{footer}</p>
        </main>
      </div>

      <aside aria-hidden className="relative hidden overflow-hidden border-l border-line bg-sunken lg:block">
        <div className="relative flex h-full flex-col items-center justify-center gap-8 p-12">
          <div className="w-full max-w-sm rounded-card border border-line bg-surface p-6 shadow-lift">
            <p className="text-center text-lg font-semibold">Sangeet</p>
            <p className="text-center text-xs text-muted">Thu 10 Dec, 7:00 pm · Rambagh Lawns</p>
            <div className="my-5 h-px bg-line" />
            <p className="text-center text-[13px] font-medium text-muted">Expected</p>
            <p className="text-center text-6xl font-semibold tracking-tight text-ink tabular-nums">212</p>
            <p className="text-center text-sm text-muted">likely 196–228</p>
            <div className="mt-6 grid grid-cols-3 gap-2 text-center text-sm">
              {[
                ["Coming", "230"],
                ["Maybe", "41"],
                ["No reply", "38"],
              ].map(([k, v]) => (
                <div key={k} className="rounded-lg bg-sunken p-2">
                  <p className="text-[11px] text-muted">{k}</p>
                  <p className="font-semibold">{v}</p>
                </div>
              ))}
            </div>
          </div>
          <p className="max-w-xs text-center text-lg leading-snug font-medium text-ink">One expected number per function, for your caterer.</p>
        </div>
      </aside>
    </div>
  );
}
