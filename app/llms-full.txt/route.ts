import { DOCS, docBody } from "@/lib/docs";

// Every doc concatenated, for agents that want the whole context in one request.
export async function GET() {
  const body = DOCS.map((d) => `<!-- docs/${d.slug}.md -->\n\n${docBody(d.slug).trim()}\n`).join("\n---\n\n");
  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8" } });
}
