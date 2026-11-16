# WedCount: instructions for AI agents

Read [`docs/agents.md`](docs/agents.md) before your first change. It gives the read order, the hard rules, and how to make and record decisions. All project knowledge lives in [`docs/`](docs):

| File | What it answers |
|---|---|
| [docs/agents.md](docs/agents.md) | How to work in this repo, rules, decision protocol |
| [docs/requirements.md](docs/requirements.md) | Who it is for and what it must do |
| [docs/architecture.md](docs/architecture.md) | How the system is built and deployed |
| [docs/decision.md](docs/decision.md) | Why things are the way they are |
| [docs/features.md](docs/features.md) | What exists and where its code lives |
| [docs/playbook.md](docs/playbook.md) | Step-by-step procedures |
| [docs/hacks.md](docs/hacks.md) | Known shortcuts and their limits |
| [docs/tips.md](docs/tips.md) | Practical tips |

On a running deployment the same files are served at `/llms.txt`, `/llms-full.txt` and `/llms/<slug>.md`.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
