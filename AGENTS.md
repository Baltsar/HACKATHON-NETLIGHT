<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Källan

Sourced live brief for the Nebius x NVIDIA Global AI Hackathon (Stockholm).

Any coding agent (Cursor, Claude Desktop, ChatGPT/Codex) should read this file and `stack.json` before changing code. Runtime logs live in `logs/agent.jsonl`. Secrets live only in `.env.local` (never commit, never paste into chat).

## Stack

| Layer | Choice | Code |
|---|---|---|
| App | Next.js 16 App Router, React 19, Tailwind 4 | `src/app/` |
| Inference | Nebius Token Factory, OpenAI Chat Completions | `src/lib/nebius.ts` |
| Model | `nvidia/nemotron-3-super-120b-a12b` | `NEBIUS_MODEL` |
| Search | Tavily `/search` | tool `web_search` |
| Extract | Tavily `/extract` | tool `web_extract` |
| Agent loop | max 6 steps | `src/lib/agent.ts` |
| Logs | JSONL, no secrets | `src/lib/log.ts` → `logs/agent.jsonl` |

## Run

```bash
nvm use
pnpm install
cp .env.example .env.local   # if keys are missing
pnpm exec next dev --port 3456
```

UI: http://localhost:3456

```bash
curl -s http://localhost:3456/api/health
curl -s http://localhost:3456/api/stack
curl -s http://localhost:3456/api/logs
curl -s http://localhost:3456/api/agent \
  -H 'content-type: application/json' \
  -d '{"question":"What is Nebius Token Factory in one sentence?"}'
```

`POST /api/agent` body: `{ "question": string }`. Response: `{ answer, sources, steps, model, usage }`.

## Hop between tools

1. Open this folder: `/Users/baltsar/Documents/Cursor/HACKATHON-NETLIGHT`
2. Read `AGENTS.md` + `HANDOVER.md` + `stack.json` + the last entries in `logs/agent.jsonl`
3. Use the same `.env.local`. Do not copy keys into MCP configs.
4. Tavily MCP (Cursor already has the remote server; Claude Desktop can use `scripts/tavily-mcp.sh` which sources `.env.local`)
5. Continue from the latest log line instead of rediscovering the product

## Delegate to Claude CLI and ChatGPT/Codex

Same folder, same `AGENTS.md`. Claude CLI uses the Claude subscription. Codex CLI uses the ChatGPT subscription (binary from Codex.app).

```bash
./scripts/delegate.sh status
./scripts/delegate.sh claude "implement the 10s hook director on top of Källan"
./scripts/delegate.sh codex  "patch src/lib/agent.ts so extract always runs after search"
```

First-time Claude CLI login (opens browser): `claude auth login --claudeai`

Codex is already logged in as ChatGPT. PATH: `~/.local/bin/codex` → Codex.app.

## Rules for this repo

- Keep inference on Token Factory and at least one NVIDIA Nemotron model.
- Keep a runtime Tavily call (search and extract). That is the prize path.
- Do not add SDKs unless they are required. Plain `fetch` is enough.
- Do not log API keys or raw extracted page dumps.
- Devpost needs a public GitHub repo, MIT license (already present), README that names Nemotron + Token Factory + Tavily, a demo URL, and a ≤3 min YouTube video. Deadline 30 Oct 2026.

