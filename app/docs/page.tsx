import type { Metadata } from "next";
import Link from "next/link";
import { DOCS } from "@/lib/docs";

export const metadata: Metadata = { title: "Documentation · WedCount" };

export default function DocsIndex() {
  return (
    <>
      <p className="text-sm font-medium text-brand">Documentation</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight">WedCount docs</h1>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">
        How the product works, how it is built, and how to change it safely. Written for planners, engineers and AI agents
        alike: every page is also available as plain Markdown.
      </p>
      <ul className="mt-10 grid gap-4 sm:grid-cols-2">
        {DOCS.map((d) => (
          <li key={d.slug}>
            <Link href={`/docs/${d.slug}`} className="lift block h-full rounded-card border border-line bg-surface p-5 shadow-card">
              <p className="font-semibold">{d.title}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{d.summary}</p>
            </Link>
          </li>
        ))}
      </ul>
      <div className="mt-10 rounded-card border border-line bg-sunken p-5 text-sm leading-relaxed text-muted">
        <p className="font-semibold text-ink">For AI agents</p>
        <p className="mt-1">
          Start with <a className="font-mono text-ink underline" href="/llms.txt">/llms.txt</a> for an index, or fetch{" "}
          <a className="font-mono text-ink underline" href="/llms-full.txt">/llms-full.txt</a> for every document in one file. In
          the repository the same files live in <code className="font-mono text-ink">docs/</code>, and{" "}
          <code className="font-mono text-ink">AGENTS.md</code> at the root points to them.
        </p>
      </div>
    </>
  );
}
