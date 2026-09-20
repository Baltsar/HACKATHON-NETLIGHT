# Källan — handover for Cursor / Codex / Astra

Read this file first. Then `docs/ARCHITECTURE.md`.
Do not invent a video factory. Do not wrap Higgsfield.
Do not add product OAuth (Higgsfield / YouTube / CapCut / GitHub / Lovable). Execute = copy promptpack.
OpenCode / Cursor / Codex are *our* harness, not a Källan feature.

## When you sit down (20 Sep)

1. **Commit + push Slice 2–4** before any agent. Uncommitted: `intake.ts`, `tavily-pass.ts`, `nemotron.ts`, `src/app/api/direct`, ugly desk. Slice 1 is already on remote (`ddcca3a`).
2. Smoke: `pnpm test` + curl A (greeting → worst, confidence < 0.45) + curl B (Tavily URL in `because[]` / `tavilyRows`).
3. **Astra** writes `prompts/director.md` only. She does not touch `src/lib`.
4. **Codex Slice 5** — three fixtures as tests. Wire `prompts/director.md` into Super. Stop if fixture B recommends `generate`.
5. You taste-check. If the card flatters, the prompt is wrong.

Do not start ffmpeg, Remotion, Higgsfield API, Lovable, or OAuth.

## Product in one line

Anti-sycophantic director. Eats url / repo / text / (later) 10s of video. Grades whether second 0–4 will lose a hackathon jury. Shows confidence. Recommends two cameras. Refuses to flatter a bad cut.

## Enough to build?

Yes — backend + desk skeleton. No — not ffmpeg/VL, not Higgsfield-live, not fine-tune, not token-ledger, not premium UI.

## Not a one-shot prompt

One mega-prompt produces a RepoClip clone. Work in **sliced tasks**. One agent, one slice, commit, next slice.

Truth files (do not fork these in chat):
- `HANDOVER.md` — this file
- `docs/ARCHITECTURE.md` — lock
- `docs/RESEARCH.md` — why
- `data/fewshots.json` — taste

## Agent split (Pro on both — do not hop mid-file)

| Agent | Owns | Does not own |
|---|---|---|
| **Codex 5** | `src/lib/*`, `src/app/api/*`, schema, confidence, Tavily+Nemotron clients | Visual design, shadcn hunting, product OAuth |
| **Astra** | System prompt polish, copy, later UX pass | Rewriting lib after Codex shipped it |
| **Cursor Composer** | Wiring, env, running the first paste→JSON | Architecture arguments |
| **You** | Taste check, keys, later shadcn premium desk | Asking the model to "make it beautiful" before JSON is real |

If two agents touch the same file you will thrash. Serialize.

## Env (keys already in Cursor)

```
NEBIUS_API_KEY=
TAVILY_API_KEY=
TOKENFACTORY_BASE=https://api.tokenfactory.nebius.com/v1
NEMOTRON_CLASSIFY=nvidia/nemotron-3-super-120b-a12b
NEMOTRON_FAST=nvidia/Nemotron-3_5-Lightning
```

Do not put keys in client components.

## Slice order — stop after each green check

### Slice 1 — contract (Codex)
- `src/lib/schema.ts` — DirectorVerdict type from ARCHITECTURE
- `src/lib/confidence.ts` — backend overrides model confidence (formula in ARCHITECTURE)
- `data/fewshots.json` already exists; load it, do not rewrite labels
Check: `confidence({onlyOneLiner:true}) < 0.45`

### Slice 2 — clients (Codex)
- `src/lib/tavily.ts` — Pass A project extract, Pass B hooks `time_range=month`
- `src/lib/nemotron.ts` — Super + JSON schema, Lightning hook rewrite ≤8 words
Check: curl one Tavily + one Super call returns parseable JSON

### Slice 3 — route (Codex)
- `src/app/api/direct/route.ts` — intake → tavily → nemotron → confidence overlay → verdict
Check: POST `{artifact:{kind:"url",value:"https://github.com/Baltsar/kallan"}, audience:"hackathon_jury"}` returns grade + missing[] + paths[]

### Slice 4 — ugly desk (Composer)
- One page. Dropzone + audience select + "I will not appear on camera"
- Render: Tavily rows, grade, confidence label, worst, avoid, 4 beats, two paths, copy promptpack
- shadcn defaults only. No premium blocks yet.
Check: paste own repo, see a harsh card, not a chat

### Slice 5 — fixtures (Codex)
- Fixture A: greeting+stack text → worst
- Fixture B: Campus-Job-style talking heads + `audience=yc_application` → must NOT recommend Higgsfield
- Fixture C: own one-liner + live URL → usable/good + live_trace grammar
Check: B recommending generate = routing bug. Fix before UI.

### Not this weekend
ffmpeg 10s sampler, VL frames, Remotion render, Lovable landing, donate-tokens, LoRA.

## Prompt for Astra (now)

```
Write prompts/director.md from docs/ARCHITECTURE.md and data/fewshots.json.
Anti-sycophantic. Kill list from ARCHITECTURE.
Audience switch: hackathon_jury vs yc_application vs yc_demo_day vs promo_feed.
Output must match src/lib/schema.ts exactly.
confidence is computed later — never ask the model for it.
For agent/tools, never recommend generate.
Do not edit src/lib. Do not add product features.
```

## Prompt for Codex 5 (after Astra)

```
Slice 5 only. Read HANDOVER.md.
Wire prompts/director.md into src/lib/nemotron.ts.
Keep confidence.ts overwrite. Do not rewrite tavily.ts or /api/agent.
Add tests:
A notes greeting → grade worst, confidence < 0.45
B talking-heads + audience yc_application → recommended_path ≠ generate
C one_liner + public URL → recommended_path ≠ generate, hook_type live_trace or outcome_first
Lightning must not invent numbers absent from extract.
Stop when pnpm test passes. No UI. No OAuth.
```

## Definition of done for this week

Paste a URL. See Tavily rows. Get a hard JSON verdict with confidence < 1. Copy a promptpack. Three fixtures green. No MP4 required.
