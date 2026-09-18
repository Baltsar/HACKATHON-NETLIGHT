# Build order

See root `HANDOVER.md`. This file is the file map only.

```
app/api/direct/route.ts    POST intake → verdict
app/page.tsx               ugly director desk
lib/schema.ts              DirectorVerdict
lib/confidence.ts          backend score, not the model
lib/tavily.ts              Pass A + B
lib/nemotron.ts            Super classify, Lightning rewrite
lib/intake.ts              normalize url|repo|text
director/system.md         prompt Astra writes after schema exists
data/fewshots.json         locked labels
data/audience-weights.json
```

Stack: Next.js + TF base `https://api.tokenfactory.nebius.com/v1` + Tavily.
Lovable = later public face, not the brain.
