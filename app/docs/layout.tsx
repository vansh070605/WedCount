import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/app/ui/brand";
import { DOCS } from "@/lib/docs";

export default function DocsLayout({ children }: LayoutProps<"/docs">) {
  return (
    <>
      <SiteHeader section="Docs" />
      <div className="mx-auto grid w-full max-w-6xl flex-1 grid-cols-1 gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:py-14">
        <nav aria-label="Documentation" className="lg:sticky lg:top-24 lg:self-start">
          <ul className="no-scrollbar flex gap-1 overflow-x-auto text-sm lg:flex-col">
            <li className="shrink-0">
              <Link href="/docs" className="block rounded-md px-3 py-1.5 text-muted hover:bg-sunken hover:text-ink">
                Overview
              </Link>
            </li>
            {DOCS.map((d) => (
              <li key={d.slug} className="shrink-0">
                <Link href={`/docs/${d.slug}`} className="block rounded-md px-3 py-1.5 text-muted hover:bg-sunken hover:text-ink">
                  {d.title}
                </Link>
              </li>
            ))}
            <li className="mt-3 hidden border-t border-line pt-3 lg:block">
              <a href="/llms.txt" className="block rounded-md px-3 py-1.5 font-mono text-xs text-muted hover:bg-sunken hover:text-ink">
                llms.txt
              </a>
            </li>
          </ul>
        </nav>
        <main className="min-w-0">{children}</main>
      </div>
      <SiteFooter />
    </>
  );
}
