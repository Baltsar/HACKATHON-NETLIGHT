import type {
  ArtifactKind,
  Audience,
  ConfidenceLabel,
  Grade,
  HookType,
  PathId,
} from "@/lib/schema";

export const GRADE_COPY: Record<Grade, { stamp: string; meaning: string }> = {
  worst: { stamp: "Worst", meaning: "Seconds 0–4 lose the room." },
  bad: { stamp: "Bad", meaning: "They stay. They do not care." },
  usable: { stamp: "Usable", meaning: "Holds. Does not win." },
  good: { stamp: "Good", meaning: "The claim lands before second 4." },
  best: { stamp: "Best", meaning: "Cold open. No greeting, no stack." },
};

export const CONFIDENCE_COPY: Record<ConfidenceLabel, string> = {
  dom: "We would bet this grade.",
  osaker: "Could flip with one more extract.",
  gissning: "Not enough signal to trust the grade.",
};

export const PATH_COPY: Record<PathId, string> = {
  presence_pip: "Face in the corner",
  voice_over_runtime: "Screen + your voice",
  film_yourself: "Film yourself",
  generate: "Generate the spot",
};

export const PATH_EXECUTE: Record<PathId, string> = {
  presence_pip: "CapCut",
  voice_over_runtime: "Screen Studio",
  film_yourself: "iPhone + CapCut",
  generate: "Higgsfield, then CapCut",
};

export const MISSING_CHIP: Record<string, string> = {
  "extract a product mechanic": "Public extract",
  "≥2 live hook references (Tavily Pass B)": "Live category hooks",
  "pick audience (not default hackathon_jury)": "Pick audience",
  "existing cut or transcript": "Paste 0–10 transcript",
  "more than a one-liner": "More than a one-liner",
  "a real product surface, not idea-only": "A real surface",
  "evidence citation for each rubric score": "Citations",
};

export function chipLabel(missing: string): string {
  return MISSING_CHIP[missing] ?? missing;
}

export const KIND_COPY: Record<ArtifactKind, string> = {
  url: "URL",
  repo: "Repo",
  notes: "Notes",
  deck_text: "Deck text",
  video_url: "Video URL",
  transcript: "Transcript",
};

export const AUDIENCE_COPY: Record<Audience, string> = {
  hackathon_jury: "Hackathon jury",
  yc_application: "YC application",
  yc_demo_day: "YC Demo Day",
  vc: "VC",
  product_hunt: "Product Hunt",
  social: "Social",
  promo_feed: "Promo feed",
};

export const HOOK_TYPE_COPY: Record<HookType, string> = {
  problem_slam: "Problem slam",
  statistical_shock: "Statistical shock",
  outcome_first: "Outcome first",
  what_if: "What if",
  live_trace: "Live trace",
};
