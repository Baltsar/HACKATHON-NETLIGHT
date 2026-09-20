import type {
  ArtifactKind,
  Audience,
  DirectRequest,
  NormalizedBrief,
  Stage,
  WillAppear,
} from "@/lib/schema";

const GREETING =
  /\b(hi|hello|hey)\b[\s\S]{0,80}\b(we are|we're|i am|i'm|today|we used|we built|my name)\b/i;
const STACK_FLEX = /\bwe used\b.+\b(next|nemotron|react|python)\b/i;
const AGENT_OR_TOOL =
  /\b(agent|tool|cli|api|director|verdict|tavily|nemotron|next\.?js|github|repo|runtime)\b/i;

export interface IntakeResult {
  brief: NormalizedBrief;
  audiencePicked: boolean;
  onlyOneLiner: boolean;
  stageIdeaNoSurface: boolean;
  hasCutOrTranscript: boolean;
  isGreeting: boolean;
  sourceText: string;
}

function firstSentence(text: string): string {
  const trimmed = text.replace(/\s+/g, " ").trim();
  const match = trimmed.match(/^(.+?[.!?])\s/);
  return (match?.[1] ?? trimmed).slice(0, 180);
}

export function isGreetingCopy(text: string): boolean {
  return GREETING.test(text) || STACK_FLEX.test(text);
}

export function looksLikeAgentTool(text: string, kind: ArtifactKind): boolean {
  if (kind === "repo") {
    return true;
  }
  return AGENT_OR_TOOL.test(text);
}

function inferStage(request: DirectRequest, greeting: boolean, hasUrl: boolean): Stage {
  if (request.stage) {
    return request.stage;
  }
  if (request.existing_cut_url || request.artifact.kind === "transcript" || request.artifact.kind === "video_url") {
    return "has_cut";
  }
  if (greeting || request.artifact.kind === "notes" || request.artifact.kind === "deck_text") {
    return "idea";
  }
  if (hasUrl || request.artifact.kind === "repo" || request.artifact.kind === "url") {
    return "built";
  }
  return "idea";
}

function inferSurface(kind: ArtifactKind, greeting: boolean, hasUrl: boolean): string {
  if (greeting) {
    return "idea-only; greeting and stack, no product surface";
  }
  if (kind === "notes" || kind === "deck_text") {
    return "pasted text only; no live surface confirmed";
  }
  if (kind === "transcript" || kind === "video_url") {
    return "existing cut or captions; grade the tape";
  }
  if (hasUrl || kind === "repo" || kind === "url") {
    return "public URL/repo; surface still unproven until extract";
  }
  return "unknown surface";
}

export function artifactHttpUrl(kind: ArtifactKind, value: string): string | null {
  const trimmed = value.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  if (kind === "repo" || /^[\w.-]+\/[\w.-]+$/.test(trimmed)) {
    return `https://github.com/${trimmed}`;
  }
  return null;
}

function mechanicFromArtifact(request: DirectRequest, greeting: boolean, httpUrl: string | null): string {
  if (request.one_liner?.trim()) {
    return request.one_liner.trim();
  }
  if (greeting) {
    return "";
  }
  if (httpUrl) {
    try {
      const parsed = new URL(httpUrl);
      if (parsed.hostname.replace(/^www\./, "") === "github.com") {
        return parsed.pathname.split("/").filter(Boolean).slice(0, 2).join("/");
      }
      return parsed.hostname.replace(/^www\./, "");
    } catch {
      return firstSentence(request.artifact.value);
    }
  }
  return firstSentence(request.artifact.value);
}

export function normalizeIntake(request: DirectRequest): IntakeResult {
  const note = request.note?.trim() ?? "";
  const sourceText = [request.artifact.value, note, request.one_liner ?? ""].filter(Boolean).join("\n");
  const greeting = isGreetingCopy(sourceText);
  const httpUrl = artifactHttpUrl(request.artifact.kind, request.artifact.value);
  const audience: Audience = request.audience ?? "hackathon_jury";
  const audiencePicked = request.audience !== undefined;
  const will_appear: WillAppear = request.will_appear ?? "none";
  const stage = inferStage(request, greeting, Boolean(httpUrl));
  const wordCount = sourceText.trim().split(/\s+/).filter(Boolean).length;
  const thinNotes =
    (request.artifact.kind === "notes" || request.artifact.kind === "deck_text") && !httpUrl;
  const onlyOneLiner = greeting || (thinNotes && wordCount <= 40 && !request.existing_cut_url);
  const stageIdeaNoSurface = stage === "idea" && (greeting || thinNotes || !httpUrl);
  const hasCutOrTranscript =
    Boolean(request.existing_cut_url) ||
    request.artifact.kind === "transcript" ||
    request.artifact.kind === "video_url";

  const mechanic = mechanicFromArtifact(request, greeting, httpUrl);

  return {
    brief: {
      kind: request.artifact.kind,
      stage,
      audience,
      audience_defaulted: !audiencePicked,
      mechanic,
      surface_truth: inferSurface(request.artifact.kind, greeting, Boolean(httpUrl)),
      existing_assets: [httpUrl, request.existing_cut_url].filter((value): value is string => Boolean(value)),
      will_appear,
    },
    audiencePicked,
    onlyOneLiner,
    stageIdeaNoSurface,
    hasCutOrTranscript,
    isGreeting: greeting,
    sourceText,
  };
}
