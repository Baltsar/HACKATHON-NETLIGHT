# Källan

> A sourced live brief for people who need the web, not a vibe. Built for the [Nebius x NVIDIA Global AI Hackathon](https://nebiusglobalaihackathon.devpost.com/) at Builders & Brews Stockholm (Sep 18 2026). Repo: [Baltsar/HACKATHON-NETLIGHT](https://github.com/Baltsar/HACKATHON-NETLIGHT) (product name stays **Källan**).

Chat answers without sources are cheap. Källan makes NVIDIA Nemotron look things up on the live web with Tavily, read the actual pages, and write a short brief you can check.

The next product cut is an anti-sycophantic first-10-seconds director. Read `HANDOVER.md` and `docs/ARCHITECTURE.md` before changing that path.

## How it uses Nebius, NVIDIA and Tavily

| Piece | Where | What it does |
|---|---|---|
| **Nebius Token Factory** | `src/lib/nebius.ts` | All LLM inference runs through the Token Factory OpenAI-compatible API (`https://api.tokenfactory.nebius.com/v1`). |
| **NVIDIA Nemotron Super** | `NEBIUS_MODEL` (default `nvidia/nemotron-3-super-120b-a12b`) | Plans tool calls, then writes the brief with inline citations. |
| **Tavily Search** | `web_search` in `src/lib/agent.ts` | Finds current pages. |
| **Tavily Extract** | `web_extract` in `src/lib/agent.ts` | Pulls full page text so the model is not guessing from snippets. |

Request flow: `POST /api/agent` → Nemotron (tools) → Tavily `/search` → Tavily `/extract` → Nemotron → brief + sources.

## Run it locally

Requirements: Node 20.9+ (`.nvmrc` pins 22) and pnpm.

```bash
nvm use
pnpm install
cp .env.example .env.local   # add NEBIUS_API_KEY and TAVILY_API_KEY
pnpm dev
```

Open http://localhost:3456 and ask something that needs fresh sources.

The same folder is the source of truth for Cursor, Claude Desktop, and ChatGPT/Codex. Read `AGENTS.md` and `stack.json` first. Every brief is appended to `logs/agent.jsonl` (gitignored). Secrets stay in `.env.local` — never copy them into MCP configs.

```bash
curl -s http://localhost:3456/api/health
curl -s http://localhost:3456/api/stack
curl -s http://localhost:3456/api/logs
pnpm ask "What is Nebius Token Factory in one sentence?"
```

Claude Desktop can attach Tavily via `scripts/tavily-mcp.sh` (sources `.env.local`). See `mcp.example.json`.

Check which models your key can reach, with context length and pricing:

```bash
curl -s -H "Authorization: Bearer $NEBIUS_API_KEY" "https://api.tokenfactory.nebius.com/v1/models?verbose=true"
```

## Environment variables

| Name | Required | Default |
|---|---|---|
| `NEBIUS_API_KEY` | yes | |
| `TAVILY_API_KEY` | yes | |
| `NEBIUS_MODEL` | no | `nvidia/nemotron-3-super-120b-a12b` |
| `NEBIUS_BASE_URL` | no | `https://api.tokenfactory.nebius.com/v1` |

## License

[MIT](./LICENSE)
