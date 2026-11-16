import { DOCS } from "@/lib/docs";
import { appUrl } from "@/lib/invite";

// llms.txt (https://llmstxt.org): an index of the docs that AI agents can fetch and follow.
export async function GET() {
  const base = appUrl();
  const body = [
    "# WedCount",
    "",
    "> WhatsApp RSVPs and an expected headcount for every function of an Indian wedding. Next.js 16 on Vercel, Prisma on Neon Postgres.",
    "",
    "Agents: read the Agent guide first. It sets the read order, the rules, and how to record decisions.",
    "",
    "## Docs",
    "",
    ...DOCS.map((d) => `- [${d.title}](${base}/llms/${d.slug}.md): ${d.summary}`),
    "",
    "## Optional",
    "",
    `- [All docs in one file](${base}/llms-full.txt)`,
    "",
  ].join("\n");
  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8" } });
}
