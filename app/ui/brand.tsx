import Link from "next/link";
import { logout } from "@/app/actions";
import { buttonClass } from "@/app/ui/kit";

// Logo mark: three rising bars, a headcount that firms up. Plain shapes so it stays crisp at any size.
export function Mark({ className = "size-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={className}>
      <rect width="32" height="32" rx="8" fill="var(--ink)" />
      <rect x="8" y="17" width="4" height="7" rx="1" fill="#fff" opacity="0.55" />
      <rect x="14" y="12.5" width="4" height="11.5" rx="1" fill="#fff" opacity="0.8" />
      <rect x="20" y="8" width="4" height="16" rx="1" fill="#8fb0ff" />
    </svg>
  );
}

export function Wordmark({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 text-[17px] font-semibold tracking-tight text-ink">
      <Mark className="size-7" />
      WedCount
    </Link>
  );
}

// Top bar for logged-in pages.
export function AppHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-paper">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Wordmark href="/dashboard" />
        <nav className="flex items-center gap-2 text-sm">
          <Link href="/dashboard" className={buttonClass("ghost", "sm", "max-sm:hidden")}>
            Weddings
          </Link>
          <Link href="/docs" className={buttonClass("ghost", "sm", "max-sm:hidden")}>
            Docs
          </Link>
          <Link href="/account" className={buttonClass("ghost", "sm")}>
            Account
          </Link>
          <form action={logout}>
            <button className={buttonClass("secondary", "sm")}>Log out</button>
          </form>
        </nav>
      </div>
    </header>
  );
}

const footerLinks: [heading: string, links: [href: string, label: string][]][] = [
  [
    "Product",
    [
      ["/#features", "Features"],
      ["/#how", "How it works"],
      ["/#prediction", "Expected turnout"],
      ["/signup", "Create an account"],
    ],
  ],
  [
    "Documentation",
    [
      ["/docs", "Overview"],
      ["/docs/features", "Features"],
      ["/docs/architecture", "Architecture"],
      ["/docs/playbook", "Playbook"],
      ["/llms.txt", "For AI agents"],
    ],
  ],
  [
    "Legal",
    [
      ["/privacy", "Privacy policy"],
      ["/terms", "Terms of service"],
    ],
  ],
];

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <Wordmark />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
            RSVPs on WhatsApp and an expected headcount for every function of an Indian wedding.
          </p>
        </div>
        {footerLinks.map(([heading, links]) => (
          <nav key={heading} aria-label={heading}>
            <p className="text-sm font-semibold text-ink">{heading}</p>
            <ul className="mt-4 flex flex-col gap-2.5 text-sm text-muted">
              {links.map(([href, label]) => (
                <li key={href}>
                  <Link href={href} className="draw hover:text-ink">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap justify-between gap-2 px-4 py-6 text-[13px] text-muted sm:px-6">
          <p>© 2026 WedCount. Built in India.</p>
          <p>Guest data is used only to plan the wedding it was collected for.</p>
        </div>
      </div>
    </footer>
  );
}

// Header for public pages (docs, legal).
export function SiteHeader({ section }: { section?: string }) {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-paper/90 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Wordmark />
          {section && <span className="hidden text-sm text-muted sm:inline">/ {section}</span>}
        </div>
        <div className="flex items-center gap-2">
          <Link href="/login" className={buttonClass("ghost", "sm")}>
            Log in
          </Link>
          <Link href="/signup" className={buttonClass("primary", "sm")}>
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}

// Page frame for the legal pages.
export function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  const contact = process.env.SUPPORT_EMAIL;
  return (
    <>
      <SiteHeader section="Legal" />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-12 sm:px-6 lg:py-16">
        <article className="prose">
          <p className="text-sm font-medium text-brand">Legal</p>
          <h1>{title}</h1>
          <p className="text-sm text-muted">Last updated {updated}</p>
          {children}
          <h2>Contact</h2>
          <p>
            {contact ? (
              <>
                Questions about this page: <a href={`mailto:${contact}`}>{contact}</a>.
              </>
            ) : (
              <>
                Guests can ask the family or planner who sent their invite to change or delete their details. Planners can edit
                or delete their guests, functions, weddings and account themselves in the app, and reset a forgotten password
                from the login page.
              </>
            )}
          </p>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
