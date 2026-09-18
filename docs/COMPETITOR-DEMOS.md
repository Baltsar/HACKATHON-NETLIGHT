# Competitor demo openings — knowledge pack

Not a new actor sweep. How they open *their own* demos.
Feed these as few-shots / avoid-list. Slice 3 still ships.

Updated: 2026-09-18

## Pattern table

| Actor | Their 0–10s | Grammar they sell | Trap if Källan copies it |
|---|---|---|---|
| **Pitchstage.ai** | Tagline on site: “You built it. We’ll launch it.” Hero is *their own* generated film. Visible shotlist (“slow push-in 2.4s”). Input: screenshots + one sentence. | Narrated launch film + carousel. Voice clone. | Looks like a launch agency. Jury cannot evaluate a runtime. |
| **Kite (YC S23)** | Dogfoods itself. PH clip = a Kite video of Kite. Record screen → 3D MacBook → auto zoom on cursor → kinetic type. Founder X: “I took this screen recording and turned it into a full product demo in 20 minutes.” | Apple-ad screen rec. 3D device. | Gorgeous mockup, zero tool-trace. Fine for PH. Weak for this jury. |
| **Hera Launch (YC S25)** | Their doctrine: value obvious in **first 5 seconds** via motion type + UI cards. Input = one prompt. No footage required. Output is *editable code motion*, not a locked MP4. | Opinionated kinetic / UI motion | Pretty type with no live Nemotron call. |
| **Demosmith** | URL in → agent clicks the product → VO + captions → MP4 in ~10 min. Their catalog demos are Notion / Cal.com / Airbnb *tours*. | Autonomous screen tour | Login→dashboard factory. Product tour ≠ 10s claim. |
| **RepoClip** | Paste GitHub → Gemini reads README → Nano Banana stills + TTS → optional Kling. Claims “30 sec average time developers spend evaluating a tool.” | Illustrated explainer, not live UI | README-cinema. No runtime. Same factory as ShowDemo. |
| **Higgsfield Marketing Studio** | Demo genre: “one link, nine ads.” Hooks library. Typical UGC open = extreme close-up face, then product. Seedance under the hood. | Synthetic UGC / TV spot | product_truth 0 for an agent. Official anti-pattern for YC application too. |
| **Arcade / Storylane** | Interactive demo. Arcade +14% was *narrated vs silent interactive*, not “put VO on everything.” | Click-through, not a film | Wrong object for a 10s YouTube slot. |

## What their openings teach the engine

Shared (steal):
- No logo in first 3s (PH 2026 playbooks: 3–8s to decide, mute autoplay)
- Problem or outcome in one sentence before feature tour
- Captions burned in
- They dogfood: Pitchstage site *is* Pitchstage output; Kite PH *is* Kite

Do not steal:
- Their default grammar as *our* default
- Face-hook UGC for an agent product
- README → stills → TTS
- 9-mode ad spray

## Källan contrast (one line each)

- vs Pitchstage: they finish the film; we judge whether second 0–4 will lose
- vs Kite: they beautify a recording; we say if you should have recorded
- vs Hera: they pick kinetic by default; we pick kinetic only when the product is type/motion
- vs Demosmith/RepoClip: they always tour; we may refuse the tour
- vs Higgsfield: they are the camera; we say whether that camera is a lie

## Few-shot rows to add later

```
{id:"pitchstage-self", audience:"promo_feed", grade:"good", grammar:"narrated_launch",
 why:"Claim on screen immediately. Site is the demo."}
{id:"kite-self-ph", audience:"promo_feed", grade:"good", grammar:"device_mockup",
 why:"Dogfood. Product surface is the recording."}
{id:"kite-as-hackathon", audience:"hackathon_jury", grade:"usable",
 why:"Pretty 3D laptop, no runtime evidence. Raise product_truth."}
{id:"repoclip-factory", audience:"hackathon_jury", grade:"bad",
 why:"README stills + TTS. Cannot evaluate the app."}
{id:"higgsfield-ugc-agent", audience:"hackathon_jury", grade:"worst",
 why:"Face close-up selling a tool. product_truth 0."}
```

## Scope lock

This file is the knowledge base increment. Do not start a 15-day actor hunt.
Next code step remains POST /api/direct.
