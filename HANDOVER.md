# Källan — handover for Cursor / Codex / Astra

Read this file first. Then `docs/ARCHITECTURE.md`.
Do not invent a video factory. Do not wrap Higgsfield.
Do not add product OAuth (Higgsfield / YouTube / CapCut / GitHub / Lovable). Execute = copy promptpack.
OpenCode / Cursor / Codex are *our* harness, not a Källan feature. Next slice is `POST /api/direct`.

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

## First prompt to paste into Codex 5

```
Implement Slice 1 and Slice 2 only from HANDOVER.md.
Read docs/ARCHITECTURE.md and data/fewshots.json first.
Next.js app router if the repo is empty.
No UI. No Higgsfield. No video pipeline.
Do not change few-shot labels.
Stop when Tavily + Nemotron clients compile and confidence.ts has tests.
```

## First prompt to paste into Astra (after Slice 3 is green)

```
Write director/system.md from docs/ARCHITECTURE.md.
Anti-sycophantic. Forbidden phrases listed in ARCHITECTURE.
Audience switch: hackathon_jury vs yc_application vs yc_demo_day.
Output must match lib/schema.ts exactly.
Do not add new product features.
```

## Definition of done for tonight

Paste a URL. See Tavily rows. Get a hard JSON verdict with confidence < 1. Copy a promptpack. No MP4 required.
