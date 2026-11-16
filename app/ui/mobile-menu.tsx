"use client";

import Link from "next/link";

// Phone-only menu for the landing page. A native <details> so it opens even before JavaScript loads;
// the click handler closes it after a link is chosen.
export function MobileMenu({ links }: { links: [href: string, label: string][] }) {
  return (
    <details className="group md:hidden">
      <summary
        aria-label="Menu"
        className="press flex size-9 cursor-pointer list-none items-center justify-center rounded-lg text-ink hover:bg-sunken [&::-webkit-details-marker]:hidden"
      >
        <svg viewBox="0 0 24 24" aria-hidden className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path className="group-open:hidden" d="M4 7h16M4 12h16M4 17h16" />
          <path className="hidden group-open:block" d="M6 6l12 12M18 6 6 18" />
        </svg>
      </summary>
      <nav
        aria-label="Main"
        onClick={(e) => {
          if ((e.target as HTMLElement).closest("a")) e.currentTarget.parentElement?.removeAttribute("open");
        }}
        className="absolute inset-x-0 top-16 border-b border-line bg-surface px-4 pt-2 pb-4 shadow-lift"
      >
        <ul className="flex flex-col">
          {links.map(([href, label]) => (
            <li key={href} className="border-b border-line last:border-0">
              <Link href={href} className="block py-3 text-[15px] font-medium text-ink">
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </details>
  );
}
