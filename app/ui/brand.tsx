import Link from "next/link";
import { logout } from "@/app/actions";
import { buttonClass } from "@/app/ui/kit";

// Marigold mark: a ring of petals, drawn so it stays crisp at any size.
export function Mark({ className = "size-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={className}>
      {Array.from({ length: 8 }, (_, i) => (
        <ellipse key={i} cx="16" cy="7.5" rx="3.6" ry="6.5" fill="var(--gold)" opacity={i % 2 ? 0.75 : 1} transform={`rotate(${i * 45} 16 16)`} />
      ))}
      <circle cx="16" cy="16" r="5" fill="var(--brand)" />
    </svg>
  );
}

export function Wordmark({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="group flex items-center gap-2 font-display text-xl font-semibold tracking-tight">
      <Mark className="size-7 transition-transform duration-500 group-hover:rotate-90" />
      <span>
        Wed<span className="text-brand">Count</span>
      </span>
    </Link>
  );
}

// Top bar for logged-in pages.
export function AppHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Wordmark href="/dashboard" />
        <nav className="flex items-center gap-2 text-sm">
          <Link href="/dashboard" className={buttonClass("ghost", "sm")}>
            Weddings
          </Link>
          <form action={logout}>
            <button className={buttonClass("secondary", "sm")}>Log out</button>
          </form>
        </nav>
      </div>
    </header>
  );
}
