import { readFileSync } from "node:fs";
import path from "node:path";
import { isGreetingCopy } from "./intake.ts";
import type { Audience, Grade, HookType, PathId, PathOption, WillAppear } from "./schema";

export interface AudienceWeight {
  default_path?: PathId;
  forbid_generate_when?: string;
  generate?: string;
}

export interface PathPolicyInput {
  draft: PathId;
  isGreeting: boolean;
  audience: Audience;
  willAppear: WillAppear;
  agentTool: boolean;
  sourceText: string;
}

export function loadAudienceWeights(): Record<string, AudienceWeight> {
  const file = path.join(process.cwd(), "data/audience-weights.json");
  return JSON.parse(readFileSync(file, "utf8")) as Record<string, AudienceWeight>;
}

export function looksLikeTalkingHeads(text: string): boolean {
  return /\b(talking.?heads?|founders talking|campus.?job|kinetic type|b-?roll|ugc avatar|voice clone)\b/i.test(
    text,
  );
}

export function isYcFoundersAudience(audience: Audience): boolean {
  return audience === "yc_application" || audience === "yc_demo_day";
}

export function humanPath(willAppear: string, fallback: PathId): PathOption {
  const id: PathId =
    willAppear === "none" || willAppear === "voice_only"
      ? fallback === "film_yourself"
        ? "film_yourself"
        : "voice_over_runtime"
      : willAppear === "face"
        ? fallback === "film_yourself"
          ? "film_yourself"
          : "presence_pip"
        : fallback;
  if (id === "voice_over_runtime") {
    return {
      id,
      cost: "0 tokens",
      truth: 2,
      stack: ["Screen Studio / OBS", "their voice", "Captions"],
      why: "Jury sees the real runtime. Voice carries the claim without a fake face.",
    };
  }
  if (id === "film_yourself") {
    return {
      id,
      cost: "0 tokens, ~20 min",
      truth: 2,
      stack: ["iPhone", "window light", "CapCut"],
      why: "Founders talking. Nothing else for this audience.",
    };
  }
  return {
    id: "presence_pip",
    cost: "0 tokens",
    truth: 2,
    stack: ["8s screen", "2s face-in-corner", "CapCut captions"],
    why: "Hackathon default: live surface first, two seconds of a human who ran it.",
  };
}

export function generatePath(): PathOption {
  return {
    id: "generate",
    cost: "~60 cr / 15s",
    truth: 0,
    stack: ["Higgsfield Marketing Studio", "CapCut"],
    why: "Only if nobody will shoot and the product is physical / feed.",
  };
}

export function overlayGrade(input: {
  draft: Grade;
  isGreeting: boolean;
  audience: Audience;
  sourceText: string;
  outcomeClaim?: string;
  hasCutOrTranscript?: boolean;
}): Grade {
  if (input.isGreeting || isGreetingCopy(input.sourceText)) {
    return "worst";
  }
  if (input.audience === "yc_application" && /kinetic|b-?roll|music and/i.test(input.sourceText)) {
    return "worst";
  }
  if (/\b(higgsfield|ugc avatar).{0,40}\b(agent|tool)\b/i.test(input.sourceText)) {
    return "worst";
  }
  const claim = input.outcomeClaim?.trim() ?? "";
  if (
    claim &&
    !isGreetingCopy(claim) &&
    !/kinetic|b-?roll/i.test(claim) &&
    (input.draft === "worst" || input.draft === "bad")
  ) {
    return "usable";
  }
  if (input.draft === "best" && input.hasCutOrTranscript === false) {
    return "good";
  }
  return input.draft;
}

export function overlayHookType(input: {
  draft: HookType;
  isGreeting: boolean;
  audience: Audience;
  agentTool: boolean;
}): HookType {
  if (input.isGreeting) {
    return "outcome_first";
  }
  if (input.audience === "hackathon_jury" && input.agentTool) {
    return input.draft === "live_trace" || input.draft === "outcome_first" ? input.draft : "live_trace";
  }
  if (input.audience === "yc_demo_day") {
    return input.draft === "statistical_shock" ? input.draft : "outcome_first";
  }
  return input.draft;
}

export function overlayRecommendedPath(input: PathPolicyInput): PathId {
  const weights = loadAudienceWeights()[input.audience] ?? {};
  const generateForbidden = weights.generate === "forbidden";
  const yc = isYcFoundersAudience(input.audience);
  const talkingHeads = looksLikeTalkingHeads(input.sourceText);

  if (yc || generateForbidden) {
    return "film_yourself";
  }
  if (input.isGreeting) {
    return "voice_over_runtime";
  }
  if (input.agentTool && weights.forbid_generate_when === "agent_or_tool") {
    return input.willAppear === "face" ? "presence_pip" : "voice_over_runtime";
  }
  if (talkingHeads && input.audience === "hackathon_jury") {
    return "voice_over_runtime";
  }
  if (input.draft === "generate" && (input.agentTool || generateForbidden)) {
    return humanPath(input.willAppear, (weights.default_path as PathId | undefined) ?? "presence_pip").id;
  }
  return input.draft;
}

export function twoPaths(recommended: PathId, human: PathOption, allowGenerate: boolean): PathOption[] {
  const generate = generatePath();
  if (!allowGenerate) {
    const other: PathOption =
      human.id === "film_yourself" ? humanPath("none", "voice_over_runtime") : humanPath("face", "film_yourself");
    const first = recommended === other.id ? other : human;
    const second = first.id === human.id ? other : human;
    return [first, second];
  }
  if (recommended === "generate") {
    return [generate, human];
  }
  const lead = human.id === recommended ? human : { ...human, id: recommended };
  return [lead, generate];
}
