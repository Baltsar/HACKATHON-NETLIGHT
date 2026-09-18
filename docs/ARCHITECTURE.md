# Källan — architecture lock

Verdict-first director for the first 10 seconds.
Not a video factory. Not a Higgsfield wrapper.

Updated: 2026-09-18

---

## One sentence

Källan eats whatever you have, grades the first 10 seconds against a fixed rubric, shows its confidence, and recommends two cameras (shoot vs generate) without flattering a bad cut.

---

## Product lock

| Is | Is not |
|---|---|
| Anti-sycophantic verdict engine | RepoClip / ShowDemo factory |
| Director: grammar + path + cost | Camera: Higgsfield / Remotion / CapCut |
| Taste = rubric + Tavily refs + few-shots | Fine-tuned black box |
| One optional execute button | Smorgasbord of 4 vendors |

Hackathon track: **Best Apps and Agents**.
Must show live Token Factory (Nemotron) + Tavily.
Best Use of Tavily = $3k if extract is visible in the verdict.

---

## Criteria: good vs bad

Two separate scores. Never collapse them.

- `grade` = how good the 10s *would be / is*
- `confidence` = how sure *we* are

### Grade scale (anchors, not 1–10)

| Grade | Means |
|---|---|
| **worst** | Logo/greeting first. No claim by 8s. Fake surface. Mute-fail. |
| **bad** | Claim exists but late (>6.5s wild median) or wrong grammar. |
| **usable** | Outcome by 5s, one action, readable mute. Craft sloppy. |
| **good** | Claim on screen by 4s, cold open, real surface by 8s, right grammar. |
| **best** | All of good + hold ≥1s on claim + path cost honest + jury can repeat the sentence. Rare. |

### Rubric (score 0–2 each). Jury vs promo weights differ.

| Attribute | Jury / pitch | Promo / feed | Pass | Auto-fail |
|---|---|---|---|---|
| Clarity by 5s | 30% | 20% | Outcome a 12-year-old gets | Stack-flex, "hi we built" |
| Claim on screen by 4s | 25% | 15% | Text carries. Beat wild median 6.5s | Logo, title card |
| Product truth | 25% | 10% | Real UI / run / terminal by 8s | CGI laptop spokesperson, generated UI |
| Mute-readable | 15% | 20% | ≤8 words/beat, ≥2s dwell | VO-only hook |
| Grammar fit | 5% | 35% | Style = what the product is | Kinetic type on a shoe. Ad film on an agent |

Sum < 6/10 → force `hybrid` + rewrite `hook_claim`.
Each 0–2 **must** cite evidence (url, timestamp, README line). No evidence → confidence cap 0.40.

### Kill list

- Logo or name before second 3
- "Hi, I'm [name] and today…"
- Empty loading UI
- Feature list / slideshow (Devpost)
- Fake spokesperson holding a laptop for an agent tool
- Text <2s dwell or >12 words/beat
- Hook the body cannot pay

### Hook types (pick ONE)

`problem_slam` | `statistical_shock` | `outcome_first` | `what_if` | `live_trace`

Hackathon default: `outcome_first` + live tool-trace in the same 10s.

---

## User input

### Required (one artifact + audience)

```
{
  artifact: { kind: "url" | "repo" | "deck_text" | "video_url" | "transcript" | "notes",
              value: string },
  audience: "hackathon_jury" | "vc" | "product_hunt" | "social"
}
```

Minimum viable paste: a URL **or** a repo **or** pasted deck/transcript. Audience may default to `hackathon_jury` but then confidence takes a hit.

### Optional (raises confidence, never required)

| Field | Why |
|---|---|
| `one_liner` | Overrides extract if they already know the sentence |
| `will_appear` | `face` / `hands` / `voice_only` / `none` |
| `existing_cut_url` | Grade the actual 10s, not a hypothetical |
| `stage` | `idea` / `built` / `has_assets` / `has_cut` |
| `constraints.length` | 10s hook vs 3 min slot |

Missing fields **lower confidence**. They do not block a verdict.
One-liner only → confidence cap 0.45 and UI label **gissning**.

### Normalized brief (all adapters land here)

```
{
  kind, stage, audience,
  mechanic,           // one sentence, zero adjectives
  surface_truth,      // real UI? physical? idea-only?
  existing_assets[],
  will_appear
}
```

Adapters today: URL, repo (README raw), pasted text/deck.
Video = transcript or first-10s captions. Native `.key` later (export PDF).

---

## Confidence (must be visible)

```
start 0.50
+0.20  extract found a mechanic
+0.15  Tavily Pass B returned ≥2 hook refs
+0.10  user picked audience (not defaulted)
+0.10  existing cut or transcript present
-0.25  only a one-liner
-0.20  stage=idea and no product surface
cap 0.95
```

UI always shows:

- `confidence` as %
- `missing[]` — what would raise it
- `because[]` — evidence used
- label: `dom` (≥0.70) / `osäker` (0.45–0.69) / `gissning` (<0.45)

Never hide uncertainty behind pretty type.

---

## Architecture

```
Intake → Normalize → Retrieve → Verdict → Paths
```

```
[dropzone]        page.tsx
    ↓
[normalize]       lib/intake.ts
    ↓
[Tavily A+B]      lib/tavily.ts     // visible rows in UI
    ↓
[Nemotron]        lib/nemotron.ts   // Super classify, Lightning rewrite hook
    ↓
[Director JSON]   lib/schema.ts
    ↓
[desk]            grade + confidence + worst + avoid + 4 beats + two paths
```

### Models

```
BASE     = https://api.tokenfactory.nebius.com/v1
CLASSIFY = nvidia/nemotron-3-super-120b-a12b
ULTRA    = nvidia/Nemotron-3-Ultra-550b-a55b   // recording / README claim
FAST     = nvidia/Nemotron-3_5-Lightning       // ≤8 word hook rewrite
```

No fine-tune before 30 Oct. Taste is prompt + few-shots + Tavily month.

### Frontend is a director desk, not a chat

1. Dropzone (url / repo / paste)
2. Live Tavily queries popping
3. 3 extract rows
4. Verdict card: grade, confidence, worst, avoid, hook_claim
5. Four beats
6. Two paths with cost
7. Copy promptpack

Design (you) owns type, color, motion. Backend contract stays this JSON.

---

## Paths (director, not Higgsfield-feature)

Same brief. Two cameras. Cost is part of the verdict.

| Path | When | Stack people actually use | Cost | Truth |
|---|---|---|---|---|
| `presence_pip` | Hackathon default. Camera-shy | 8s screen + 2s face-in-corner, or hands + VO. CapCut captions | 0 tokens | 2 |
| `voice_over_runtime` | Refuse face | Screen Studio / Kite / OBS + their voice | 0 tokens | 2 |
| `film_yourself` | Want founder energy | iPhone + window light + CapCut | 0 tokens, ~20 min | 2 |
| `generate` | Physical product / feed, no one will shoot | Higgsfield Marketing Studio `ugc`/`tv_spot`/`product_showcase` → CapCut | ~60 cr / 15s | 0–1 |

Always show generate **and** a human path.
Recommend one. Say why the other loses.

For *this* product and *this* jury: default `presence_pip` or `voice_over_runtime`.
Higgsfield avatar "using" Källan = `product_truth = 0`.

Presence ≠ talking-head ad. Jury needs to know a human ran the tool. Two seconds of face or hands is enough. Fake avatar is absence wearing a face.

---

## Output schema (contract)

See also earlier director JSON. Required extras:

```
grade                worst|bad|usable|good|best
confidence          0–0.95
confidence_label    dom|osaker|gissning
missing[]           strings
because[]           {source, quote, url?}
worst               one observable failure
avoid               wrong treatment in plain language
hook_claim          ≤8 words
shotlist            4 beats: 0–0.8 / 0.8–4 / 4–8 / 8–10
paths[]             {id, cost, truth, stack[], why}
recommended_path
why_not_the_other
```

---

## What ships when

**Today / this weekend**

- Paste URL/repo/text → visible Tavily → hard JSON verdict + confidence
- Two paths + copy promptpack
- No MP4 factory, no Playwright, no token ledger

**30 Oct Devpost**

- Owned Remotion 10s hook in-app (dogfood)
- Higgsfield as optional generate-path, not default
- Devpost video: 0–10s = Källan's own hook. 10–70s = live director loop. 70–100s = Nemotron + Tavily + Token Factory

Credits: TF $150 = brain. Cloud $150 = reserve. Lovable = shell / landing output node.
