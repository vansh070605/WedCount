import { docBody, findDoc } from "@/lib/docs";

// One doc as raw Markdown: /llms/architecture.md
export async function GET(_req: Request, ctx: RouteContext<"/llms/[file]">) {
  const { file } = await ctx.params;
  const doc = file.endsWith(".md") ? findDoc(file.slice(0, -3)) : undefined;
  if (!doc) return new Response("Not found\n", { status: 404 });
  return new Response(docBody(doc.slug), { headers: { "content-type": "text/markdown; charset=utf-8" } });
}
