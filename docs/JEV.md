# Jev (TypeSafe) — optional scorer, not the brain

Jev is TypeSafe's System One model (launched mid-Sep 2026). It does **not** write text. You give it state + typed questions (choice / score / noul). It returns calibrated probabilities in ~70–500ms. Input $0.042/MTok, output free. API: `POST https://api.typesafe.ai/v1/systemone`. Early access / waitlist as of 17 Sep 2026. **Not on Token Factory.**

## Use here

Good fit for the *meters*, not for `because[]` or the 10s rewrite.

```
state:     transcript_0_10 + on_screen_text + mechanic
questions: claim_by_4s choice yes|no
           product_truth score 0|1|2
           mute_readable choice yes|no
           greeting_open choice yes|no
           grammar_fit choice kinetic|live_trace|mockup|ad|talking_head
```

Nemotron Super still writes the verdict prose and the shotlist. Jev can overwrite numeric meters the same way `confidence.ts` overwrites confidence — backend truth, not a prompt vibe.

## Do not

- Replace Super with Jev. Track requires visible Nemotron + Token Factory.
- Block Slice 3 on the TypeSafe waitlist.
- Send Jev raw video. Text state only.
- Treat Jev as a second director. It is a typed if-statement.

## If no key

Skip. Rubric + Super JSON + `confidence.ts` is enough. Steal the *question shape* even without the API: never ask "rate this pitch", ask atoms.
