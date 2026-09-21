# Källan

**Work in progress.** This product is unfinished and will change while it is being built. APIs, grades, copy, and the desk itself are not stable. Do not treat a run as a final verdict.

A director for the first 10 seconds. Paste a URL, repo, or notes. NVIDIA Nemotron on **Nebius Token Factory** looks at the live web with **Tavily** (search *and* extract), grades whether seconds 0–4 lose a jury, shows its own confidence, and tells you which camera to use. It refuses to flatter a bad cut.

Built for the [Nebius x NVIDIA Global AI Hackathon](https://nebiusglobalaihackathon.devpost.com/) (Builders & Brews Stockholm, 18 Sep 2026 · Devpost 30 Oct 2026). Track: Best Apps and Agents.

Repo: [Baltsar/HACKATHON-NETLIGHT](https://github.com/Baltsar/HACKATHON-NETLIGHT). The product is **Källan**. The GitHub name stays HACKATHON-NETLIGHT.

License: [MIT](./LICENSE).

**Live (WIP, password gated):** https://kallan-delta.vercel.app

The password is not in this repo. Pushes to `main` deploy on Vercel.

## Stack (required for this track)

| Piece | Where | What it does |
| --- | --- | --- |
| **Nebius Token Factory** | `src/lib/nebius.ts` | All inference. OpenAI-compatible `https://api.tokenfactory.nebius.com/v1`. |
| **NVIDIA Nemotron Super** | `nvidia/nemotron-3-super-120b-a12b` | Writes the director JSON. Does *not* set confidence. |
| **NVIDIA Nemotron Lightning** | `nvidia/Nemotron-3_5-Lightning` | Rewrites the hook to ≤8 words. |
| **Tavily Search** | `POST /search`, `time_range=month` | Pass B: how this category opened in the last 30 days. |
| **Tavily Extract** | `POST /extract` | Pass A: the actual page/README, not a snippet guess. |

Execute is a **copy promptpack** button. There is no OAuth into Higgsfield, YouTube, CapCut, GitHub, or Lovable.

## What it does today

1. You paste an artifact and pick an audience.
2. Tavily extract (this project) then Tavily search (category hooks).
3. Super writes grade, worst, avoid, four beats, two cameras.
4. The backend overwrites confidence (`dom` / `osäker` / `gissning`).
5. You copy a promptpack into Screen Studio, CapCut, or Higgsfield *yourself*.

`POST /api/agent` is the Netlight starter brief. The product path is `POST /api/direct`.

## Run locally

Node 22 (`.nvmrc`) and pnpm.

```bash
nvm use
pnpm install
cp .env.example .env.local   # NEBIUS_API_KEY, TAVILY_API_KEY, SITE_PASSWORD
pnpm dev
```

UI: http://localhost:3456 (password page if `SITE_PASSWORD` is set).

```bash
curl -s http://localhost:3456/api/health
curl -s http://localhost:3456/api/stack
curl -s http://localhost:3456/api/direct \
  -H 'content-type: application/json' \
  -d '{"artifact":{"kind":"notes","value":"Hi we used Next and Nemotron"},"audience":"hackathon_jury"}'
```

Agents working in this folder: read `AGENTS.md`, `HANDOVER.md`, and `stack.json` first. Secrets stay in `.env.local`. Never commit them.

| Name | Required | Default |
| --- | --- | --- |
| `NEBIUS_API_KEY` | yes | |
| `TAVILY_API_KEY` | yes | |
| `SITE_PASSWORD` | yes on Vercel | omit locally to skip the gate |
| `NEBIUS_MODEL` | no | `nvidia/nemotron-3-super-120b-a12b` |
| `NEBIUS_FAST_MODEL` | no | `nvidia/Nemotron-3_5-Lightning` |
| `NEBIUS_BASE_URL` | no | `https://api.tokenfactory.nebius.com/v1` |

## Not this repo

A video factory. A Higgsfield wrapper. A prompt marketplace. Fine-tunes before 30 Oct.

## License

[MIT](./LICENSE) © 2026 Gustaf Garnow.
