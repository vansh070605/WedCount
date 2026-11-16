import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { marked } from "marked";
import { DOCS, docBody, findDoc } from "@/lib/docs";

export function generateStaticParams() {
  return DOCS.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({ params }: PageProps<"/docs/[slug]">): Promise<Metadata> {
  const doc = findDoc((await params).slug);
  return { title: doc ? `${doc.title} · WedCount docs` : "WedCount docs", description: doc?.summary };
}

export default async function DocPage({ params }: PageProps<"/docs/[slug]">) {
  const { slug } = await params;
  const doc = findDoc(slug);
  if (!doc) notFound();
  // Our own Markdown from the repo, so rendering it as HTML is safe.
  // Links between docs are written as "features.md" so they also work on GitHub; point them at /docs here.
  const html = (await marked.parse(docBody(slug))).replace(/href="([a-z-]+)\.md"/g, 'href="/docs/$1"');
  return (
    <article>
      <div className="prose" dangerouslySetInnerHTML={{ __html: html }} />
      <p className="mt-12 border-t border-line pt-5 text-sm text-muted">
        Plain Markdown for agents:{" "}
        <a className="font-mono text-ink underline" href={`/llms/${slug}.md`}>
          /llms/{slug}.md
        </a>
      </p>
    </article>
  );
}
