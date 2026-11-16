import "server-only";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// The project's documentation lives as Markdown in docs/. The same files are rendered at /docs for people and
// served raw at /llms.txt, /llms-full.txt and /llms/<slug>.md for AI agents, so there is one source of truth.
export const DOCS = [
  { slug: "agents", title: "Agent guide", summary: "Start here if you are an AI agent: read order, rules, and how to make decisions in this repo." },
  { slug: "requirements", title: "Requirements", summary: "Who WedCount is for, what it must do, and the constraints every change must respect." },
  { slug: "features", title: "Features", summary: "Every shipped feature, how it behaves, and where it lives in the code." },
  { slug: "architecture", title: "Architecture", summary: "System design: Next.js on Vercel, Prisma on Neon Postgres, data model, request flows, security." },
  { slug: "decision", title: "Decision log", summary: "Architecture decisions with context, the choice, and its consequences." },
  { slug: "playbook", title: "Playbook", summary: "Step-by-step procedures: run locally, ship a change, migrate the database, deploy, run a real wedding." },
  { slug: "hacks", title: "Hacks and shortcuts", summary: "Deliberate shortcuts in the code, their limits, and when to replace them." },
  { slug: "tips", title: "Tips", summary: "Practical tips for planners using WedCount and developers working on it." },
] as const;

export type Doc = (typeof DOCS)[number];

// Read once at module scope: the files ship with the build and never change per request.
const dir = join(process.cwd(), "docs");
const bodies = new Map<string, string>(DOCS.map((d) => [d.slug, readFileSync(join(dir, `${d.slug}.md`), "utf8")]));

export const findDoc = (slug: string) => DOCS.find((d) => d.slug === slug);
export const docBody = (slug: string) => bodies.get(slug) ?? "";
