export type Grade = "worst" | "bad" | "usable" | "good" | "best";

export type ConfidenceLabel = "dom" | "osaker" | "gissning";

export type ArtifactKind = "url" | "repo" | "deck_text" | "video_url" | "transcript" | "notes";

export type Audience =
  | "hackathon_jury"
  | "yc_application"
  | "yc_demo_day"
  | "vc"
  | "product_hunt"
  | "social"
  | "promo_feed";

export type Stage = "idea" | "built" | "has_assets" | "has_cut";

export type WillAppear = "face" | "hands" | "voice_only" | "none";

export type HookType =
  | "problem_slam"
  | "statistical_shock"
  | "outcome_first"
  | "what_if"
  | "live_trace";

export type PathId = "presence_pip" | "voice_over_runtime" | "film_yourself" | "generate";

export interface Artifact {
  kind: ArtifactKind;
  value: string;
}

export interface DirectRequest {
  artifact: Artifact;
  audience?: Audience;
  one_liner?: string;
  note?: string;
  will_appear?: WillAppear;
  existing_cut_url?: string;
  stage?: Stage;
  constraints?: { length?: "hook_10s" | "slot_3min" };
}

export interface NormalizedBrief {
  kind: ArtifactKind;
  stage: Stage;
  audience: Audience;
  audience_defaulted: boolean;
  mechanic: string;
  surface_truth: string;
  existing_assets: string[];
  will_appear: WillAppear;
}

export interface Because {
  source: string;
  quote: string;
  url?: string;
}

export interface ShotBeat {
  start: number;
  end: number;
  action: string;
}

export interface PathOption {
  id: PathId;
  cost: string;
  truth: 0 | 1 | 2;
  stack: string[];
  why: string;
}

export interface DirectorVerdict {
  grade: Grade;
  confidence: number;
  confidence_label: ConfidenceLabel;
  missing: string[];
  because: Because[];
  worst: string;
  avoid: string;
  hook_claim: string;
  hook_type: HookType;
  shotlist: [ShotBeat, ShotBeat, ShotBeat, ShotBeat];
  paths: PathOption[];
  recommended_path: PathId;
  why_not_the_other: string;
  promptpack: string;
}

export interface TavilyRow {
  pass: "A" | "B";
  title: string;
  url: string;
  quote: string;
}

export interface DirectResponse extends DirectorVerdict {
  tavilyRows: TavilyRow[];
}

const ARTIFACT_KINDS: readonly ArtifactKind[] = [
  "url",
  "repo",
  "deck_text",
  "video_url",
  "transcript",
  "notes",
];

const AUDIENCES: readonly Audience[] = [
  "hackathon_jury",
  "yc_application",
  "yc_demo_day",
  "vc",
  "product_hunt",
  "social",
  "promo_feed",
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function isDirectRequest(value: unknown): value is DirectRequest {
  if (!isRecord(value) || !isRecord(value.artifact)) {
    return false;
  }
  const kind = value.artifact.kind;
  const artifactValue = value.artifact.value;
  if (
    typeof kind !== "string" ||
    !ARTIFACT_KINDS.includes(kind as ArtifactKind) ||
    typeof artifactValue !== "string" ||
    artifactValue.trim().length === 0
  ) {
    return false;
  }
  if (value.audience !== undefined) {
    if (typeof value.audience !== "string" || !AUDIENCES.includes(value.audience as Audience)) {
      return false;
    }
  }
  if (value.one_liner !== undefined && typeof value.one_liner !== "string") {
    return false;
  }
  if (value.note !== undefined && typeof value.note !== "string") {
    return false;
  }
  return true;
}
