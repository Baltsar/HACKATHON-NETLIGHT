# Källan — research log

Working notes so nothing from the 2026-09-18 lock gets lost.

---

## Pain points (how people actually work)

### 1. Camera aversion

Founders and hackathon teams do not want to be on camera.
Demo day still demands a video. This hackathon says: if the first 10 seconds fail, judges will not deep-dive.

Tension:
- They want absence (no face, no performance).
- Jury wants presence (a human built this, not a wrapper).

Wrong fix: AI spokesperson. Looks like every other generated submission. Kills `product_truth`.

Right fix: **presence without a talking-head ad**
- 8s real runtime + 2s face-in-corner
- Hands + screen + voiceover (Nicola Milan: film 10s of work, dump VO on top)
- Kinetic type + live Tavily trace as the "face" of an agent product

### 2. Demo is cumbersome

Current founder loop 2026:

```
idea → Claude/Cursor brief → Higgsfield OR Kite/phone OR Screen Studio → CapCut → post
```

Pain is the step *before* the middle box: they do not know which camera, which first sentence, whether the cut will lose at second 5.

Tools they open:

| Job | Tool |
|---|---|
| Assemble / captions | CapCut (default, 200M+) |
| SaaS screen that looks expensive | Kite, Screen Studio |
| Cinematic / UGC without a crew | Higgsfield Marketing Studio |
| Code-motion | Cursor + Remotion + ShotCraft |
| Talking-head edit | Descript |
| Voice | Own voice first, ElevenLabs if they refuse to speak |

Källan does not replace CapCut. It picks the middle box and writes seconds 0–4.

### 3. Factory tools flatten taste

RepoClip, ShowDemo, DemoMaster, Cortex, RepoStudio = GitHub → script → capture/stills → TTS.
Always the same grammar. Never asks "should this have been kinetic type".
That is the gap.

### 4. Sycophancy

People rate flattering tools higher and trust them less after the fact.
Källan forbids "great start", "solid foundation". Every grade points at an observable.

---

## Jury / promo numbers we are using

- ElevenHacks: 5-second rule — outcome sentence, not stack. Official guide.
- AngelHack: judges score the video first. ~30s to form an opinion.
- Advids 22-video audit: 19/22 cold open (no logo in first 3s). Median first claim 6.5s. Beat that.
- Arcade +14% completion: *narrated interactive demos vs silent*, not "put VO on everything". Feed is mute. Text first.
- Devpost: no slideshow. Video first. ≤3 min YouTube with audio. Must name Token Factory + Nemotron.
- Higgsfield ~60 credits / 15s. One hook, not a campaign.

---

## Competitors (do not copy)

| Actor | Job | Picks grammar? |
|---|---|---|
| Higgsfield Marketing Studio | URL → 9–15s ad, 9 modes | You pick mode. They render. |
| RepoClip | GitHub → ~60s narrated | No |
| ShowDemo / DemoMaster / Cortex / RepoStudio | Hackathon clones of the factory | No |
| Kite / Screen Studio / Ultramock | Screen / 3D device | One grammar: mockup |
| PitchGrade etc. | Deck critique | Wrong object |
| Hook graders for YouTube shorts | Social hooks | Wrong object |

Nobody grades first-10s pitch/demo *and* picks visual grammar from url/repo/deck/video.

---

## Taste agent: train vs retrieve

Do **not** fine-tune before 30 Oct.

- How the model behaves → system prompt + 8–12 graded few-shots
- What is winning this month → Tavily Pass B `time_range: month`

Token Factory has SFT. Dataset does not exist. Trends rot in weights. Jury wants to *see* the citation.

---

## Token donation idea

Not possible as imagined.

- No gift-credits API
- Hackathon / research credits are non-transferable
- Do not share API keys

Legal shapes:
1. BYOK — user pastes their TF key
2. Our pot — we burn our $150 with a rate limit
3. Share the verdict JSON, not tokens

Do not write "donate tokens" in the README.

---

## Hackathon constraints that drive code

- Runtime call to Token Factory **must** happen and be visible
- NVIDIA open model (Nemotron Super for classify)
- Public repo + README that names Nemotron + TF + Tavily
- Video ≤3 min, audio on, explains the stack
- Token Factory storage FI→FR 21 Sep 2026 — call the API live, do not cache storage assumptions
- Toloka $50 + Tendem $50 (Nebius AI Builder, claim by 4 Nov 2026): golden sets / human fallback. Not product OAuth. Fine-tune still after 30 Oct.

---

## Open questions (do not block build)

- Public repo name vs product name (Källan)
- Whether Lovable is the public face or Next stays
- Video ingest depth (captions vs Whisper) after the desk works
