import { readFileSync } from "node:fs";
import path from "node:path";
import { loadFewshots } from "@/lib/fewshots";
import { chatCompletion } from "@/lib/nebius";
import { env } from "@/lib/env";
import { isCleanHook } from "@/lib/hook";
import type {
  Because,
  DirectorVerdict,
  Grade,
  HookType,
  NormalizedBrief,
  PathId,
  PathOption,
  ShotBeat,
  TavilyRow,
} from "@/lib/schema";

const GRADES: readonly Grade[] = ["worst", "bad", "usable", "good", "best"];
const HOOKS: readonly HookType[] = [
  "problem_slam",
  "statistical_shock",
  "outcome_first",
  "what_if",
  "live_trace",
];
const PATHS: readonly PathId[] = ["presence_pip", "voice_over_runtime", "film_yourself", "generate"];

export const DEFAULT_SHOTLIST: DirectorVerdict["shotlist"] = [
  { start: 0, end: 0.8, action: "Claim on screen. No logo." },
  { start: 0.8, end: 4, action: "Hold the claim. Start the real surface." },
  { start: 4, end: 8, action: "One live action that pays the claim." },
  { start: 8, end: 10, action: "2s face or hands pip, or keep the runtime." },
];

const DRAFT_SCHEMA: Record<string, unknown> = {
  type: "object",
  additionalProperties: false,
  required: [
    "grade",
    "because",
    "worst",
    "avoid",
    "hook_claim",
    "hook_type",
    "shotlist",
    "paths",
    "recommended_path",
    "why_not_the_other",
    "promptpack",
  ],
  properties: {
    grade: { type: "string", enum: [...GRADES] },
    because: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["source", "quote"],
        properties: {
          source: { type: "string" },
          quote: { type: "string" },
          url: { type: "string" },
        },
      },
    },
    worst: { type: "string" },
    avoid: { type: "string" },
    hook_claim: { type: "string" },
    hook_type: { type: "string", enum: [...HOOKS] },
    shotlist: {
      type: "array",
      minItems: 4,
      maxItems: 4,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["start", "end", "action"],
        properties: {
          start: { type: "number" },
          end: { type: "number" },
          action: { type: "string" },
        },
      },
    },
    paths: {
      type: "array",
      minItems: 2,
      maxItems: 2,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "cost", "truth", "stack", "why"],
        properties: {
          id: { type: "string", enum: [...PATHS] },
          cost: { type: "string" },
          truth: { type: "integer", enum: [0, 1, 2] },
          stack: { type: "array", items: { type: "string" } },
          why: { type: "string" },
        },
      },
    },
    recommended_path: { type: "string", enum: [...PATHS] },
    why_not_the_other: { type: "string" },
    promptpack: { type: "string" },
  },
};

export interface DirectorDraft {
  grade: Grade;
  because: Because[];
  worst: string;
  avoid: string;
  hook_claim: string;
  hook_type: HookType;
  shotlist: ShotBeat[];
  paths: PathOption[];
  recommended_path: PathId;
  why_not_the_other: string;
  promptpack: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseJsonObject(raw: string): unknown {
  const trimmed = raw.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1));
    }
    throw new Error("Nemotron did not return JSON");
  }
}

function asGrade(value: unknown): Grade {
  return typeof value === "string" && GRADES.includes(value as Grade) ? (value as Grade) : "bad";
}

function asHook(value: unknown): HookType {
  return typeof value === "string" && HOOKS.includes(value as HookType)
    ? (value as HookType)
    : "outcome_first";
}

function asPath(value: unknown): PathId {
  return typeof value === "string" && PATHS.includes(value as PathId)
    ? (value as PathId)
    : "presence_pip";
}

function asBecause(value: unknown): Because[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.flatMap((row) => {
    if (!isRecord(row) || typeof row.source !== "string" || typeof row.quote !== "string") {
      return [];
    }
    return [
      {
        source: row.source,
        quote: row.quote,
        url: typeof row.url === "string" ? row.url : undefined,
      },
    ];
  });
}

function asShotlist(value: unknown): ShotBeat[] {
  if (!Array.isArray(value)) {
    return [...DEFAULT_SHOTLIST];
  }
  return value.slice(0, 4).map((row, index) => {
    const fallback = DEFAULT_SHOTLIST[index];
    if (!isRecord(row) || typeof row.action !== "string") {
      return fallback;
    }
    return {
      start: typeof row.start === "number" ? row.start : fallback.start,
      end: typeof row.end === "number" ? row.end : fallback.end,
      action: row.action,
    };
  });
}

function asPaths(value: unknown): PathOption[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.slice(0, 2).flatMap((row) => {
    if (!isRecord(row) || typeof row.why !== "string") {
      return [];
    }
    const truth = row.truth;
    return [
      {
        id: asPath(row.id),
        cost: typeof row.cost === "string" ? row.cost : "unknown",
        truth: truth === 0 || truth === 1 || truth === 2 ? truth : 1,
        stack: Array.isArray(row.stack) ? row.stack.filter((item) => typeof item === "string") : [],
        why: row.why,
      },
    ];
  });
}

function parseDraft(raw: unknown): DirectorDraft {
  if (!isRecord(raw)) {
    throw new Error("Nemotron JSON was not an object");
  }
  return {
    grade: asGrade(raw.grade),
    because: asBecause(raw.because),
    worst: typeof raw.worst === "string" ? raw.worst : "No claim by second 4.",
    avoid: typeof raw.avoid === "string" ? raw.avoid : "Greeting, logo, or fake surface first.",
    hook_claim: typeof raw.hook_claim === "string" ? raw.hook_claim : "Show the outcome first.",
    hook_type: asHook(raw.hook_type),
    shotlist: asShotlist(raw.shotlist),
    paths: asPaths(raw.paths),
    recommended_path: asPath(raw.recommended_path),
    why_not_the_other:
      typeof raw.why_not_the_other === "string"
        ? raw.why_not_the_other
        : "The other path hides the real surface.",
    promptpack: typeof raw.promptpack === "string" ? raw.promptpack : "",
  };
}

function fewshotBlock(): string {
  return loadFewshots()
    .map((row) => `${row.id} | ${row.audience} | ${row.grade} | ${row.recommended_path} | ${row.why}`)
    .join("\n");
}

const FALLBACK_SYSTEM = `You are Källan's director, not a hype machine.
Grade the first 10 seconds a jury would see. Never flatter a greeting, logo, or stack-flex.
confidence is computed later by the backend. Do not invent it.
Cite because[] only from the Tavily rows you were given. Never invent URLs.
shotlist must be exactly four beats: 0–0.8, 0.8–4, 4–8, 8–10.
For an agent or tool, do not recommend generate. For yc_application, recommend film_yourself.
hook_claim ≤ 8 words, outcome first. Do not invent metrics.`;

export function loadDirectorSystem(): string {
  try {
    const file = path.join(process.cwd(), "prompts/director.md");
    const text = readFileSync(file, "utf8").trim();
    return text.length > 0 ? text : FALLBACK_SYSTEM;
  } catch {
    return FALLBACK_SYSTEM;
  }
}

export function fallbackDraft(): DirectorDraft {
  return {
    grade: "bad",
    because: [],
    worst: "No claim by second 4.",
    avoid: "Greeting, logo, or fake surface first.",
    hook_claim: "Show the outcome first.",
    hook_type: "outcome_first",
    shotlist: [...DEFAULT_SHOTLIST],
    paths: [],
    recommended_path: "presence_pip",
    why_not_the_other: "Generate hides the real surface.",
    promptpack:
      "Outcome on screen by 0.8s. Live surface by 4s. One action by 8s. Two seconds of a human who ran it.",
  };
}

function draftFromContent(content: string): DirectorDraft | null {
  try {
    return parseDraft(parseJsonObject(content));
  } catch {
    return null;
  }
}

export async function classifyDirector(input: {
  brief: NormalizedBrief;
  sourceText: string;
  tavilyRows: TavilyRow[];
  extractText: string;
}): Promise<DirectorDraft> {
  const user = JSON.stringify({
    brief: input.brief,
    artifact: input.sourceText.slice(0, 1500),
    tavilyRows: input.tavilyRows,
    extract: input.extractText.slice(0, 4000),
    fewshots: fewshotBlock(),
  });
  const messages = [
    { role: "system" as const, content: loadDirectorSystem() },
    { role: "user" as const, content: user },
  ];

  try {
    const completion = await chatCompletion({
      messages,
      response_format: {
        type: "json_schema",
        json_schema: { name: "director_draft", schema: DRAFT_SCHEMA, strict: false },
      },
      temperature: 0.2,
      max_tokens: 2500,
    });
    const draft = draftFromContent(completion.choices[0]?.message.content ?? "");
    if (draft) {
      return draft;
    }
  } catch {
    // Token Factory json_schema is best-effort.
  }

  try {
    const completion = await chatCompletion({
      messages: [...messages, { role: "user", content: "Return only the JSON object. No markdown." }],
      temperature: 0.1,
      max_tokens: 2500,
    });
    const draft = draftFromContent(completion.choices[0]?.message.content ?? "");
    if (draft) {
      return draft;
    }
  } catch {
    // Overlay still returns a verdict; confidence comes from confidence.ts.
  }

  return fallbackDraft();
}

export function limitWords(text: string, max: number): string {
  return text
    .trim()
    .replace(/^["']|["']$/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, max)
    .join(" ");
}

export async function rewriteHook(claim: string, evidence = ""): Promise<string> {
  const first = claim.split(/[.!?]/).map((part) => part.trim()).find(Boolean) ?? claim;
  const fallback = limitWords(first, 8) || "Show the outcome first.";
  const grounded = `${evidence}\n${claim}`;
  try {
    const completion = await chatCompletion({
      model: env.nebiusFastModel,
      reasoning_effort: "none",
      messages: [
        {
          role: "system",
          content:
            "Return at most 8 words. Outcome first. No greeting. No stack. No analysis. Hook only. Do not invent metrics, percents, or dollar figures that are not in the source.",
        },
        { role: "user", content: fallback },
      ],
      temperature: 0.1,
      max_tokens: 24,
    });
    const rewritten = limitWords((completion.choices[0]?.message.content ?? "").replace(/^["']|["']$/g, ""), 8);
    if (isCleanHook(rewritten, grounded)) {
      return rewritten;
    }
  } catch {
    // Lightning is optional. Never leak reasoning into the verdict.
  }
  if (isCleanHook(fallback, grounded)) {
    return fallback;
  }
  return "Show the outcome first.";
}
