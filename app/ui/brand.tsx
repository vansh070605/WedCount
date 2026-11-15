import Link from "next/link";
import { logout } from "@/app/actions";

export function Wordmark({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="font-display text-xl font-semibold tracking-tight">
      Wed<span className="text-rose-700 dark:text-rose-400">Count</span>
      <span aria-hidden className="ml-0.5 inline-block size-1.5 rounded-full bg-amber-500 align-super" />
    </Link>
  );
}

// Top bar for logged-in pages.
export function AppHeader() {
  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3">
        <Wordmark href="/dashboard" />
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/dashboard" className="font-medium text-zinc-700 hover:text-rose-700 dark:text-zinc-300">
            Weddings
          </Link>
          <form action={logout}>
            <button className="text-zinc-600 underline underline-offset-2 hover:text-rose-700 dark:text-zinc-400">
              Log out
            </button>
          </form>
        </nav>
      </div>
    </header>
  );
}
