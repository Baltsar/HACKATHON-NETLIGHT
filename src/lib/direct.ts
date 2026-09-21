import { scoreConfidence } from "@/lib/confidence";
import type { DirectEvent } from "@/lib/direct-events";
import { looksLikeAgentTool, normalizeIntake } from "@/lib/intake";
import { logAgentEvent } from "@/lib/log";
import { classifyDirector, DEFAULT_SHOTLIST, rewriteHook, type DirectorDraft } from "@/lib/nemotron";
import { isDirectRequest, type DirectRequest, type DirectResponse, type PathId, type TavilyRow } from "@/lib/schema";
import { runTavilyPasses } from "@/lib/tavily-pass";
import {
  humanPath,
  loadAudienceWeights,
  overlayGrade,
  overlayHookType,
  overlayRecommendedPath,
  twoPaths,
  withPasteInto,
} from "@/lib/verdict";

export type { DirectEvent, DirectStep } from "@/lib/direct-events";

export function wantsDirectStream(request: Request): boolean {
  const accept = request.headers.get("accept") ?? "";
  return accept.includes("application/x-ndjson") || accept.includes("text/event-stream");
}

function asShotlist(beats: DirectorDraft["shotlist"]): DirectResponse["shotlist"] {
  const filled = DEFAULT_SHOTLIST.map((fallback, index) => beats[index] ?? fallback);
  return [filled[0], filled[1], filled[2], filled[3]];
}

function mergeBecause(draft: DirectorDraft, rows: TavilyRow[]): DirectResponse["because"] {
  const allowed = new Set(rows.map((row) => row.url));
  const cited = draft.because.filter((row) => !row.url || allowed.has(row.url));
  const seen = new Set(cited.map((row) => row.url).filter((url): url is string => Boolean(url)));
  const prefer = [
    ...rows.filter((row) => row.pass === "A"),
    ...rows.filter((row) => row.pass === "B" && /demo|hook|video|jury|pitch|10\s*s|launch/i.test(`${row.title} ${row.quote}`)),
    ...rows.filter((row) => row.pass === "B"),
  ];
  for (const row of prefer) {
    if (cited.length >= 4) {
      break;
    }
    if (!row.url.startsWith("http") || seen.has(row.url)) {
      continue;
    }
    seen.add(row.url);
    cited.push({ source: row.pass === "A" ? "tavily_extract" : "tavily_search", quote: row.quote, url: row.url });
  }
  return cited;
}

function earlyChips(input: {
  hasCutOrTranscript: boolean;
  stageIdeaNoSurface: boolean;
  onlyOneLiner: boolean;
}): string[] {
  const chips: string[] = [];
  if (!input.hasCutOrTranscript) {
    chips.push("existing cut or transcript");
  }
  if (input.stageIdeaNoSurface) {
    chips.push("a real product surface, not idea-only");
  }
  if (input.onlyOneLiner) {
    chips.push("more than a one-liner");
  }
  return chips;
}

async function tick(): Promise<void> {
  await new Promise<void>((resolve) => {
    setImmediate(resolve);
  });
}

export async function runDirect(
  body: DirectRequest,
  onEvent?: (event: DirectEvent) => void,
): Promise<DirectResponse> {
  const startedAt = Date.now();
  const runId = crypto.randomUUID();
  const emit = async (event: DirectEvent): Promise<void> => {
    onEvent?.(event);
    await tick();
  };

  const intake = normalizeIntake(body);
  await emit({ type: "status", step: "extract" });
  await emit({ type: "hints", chips: earlyChips(intake) });

  const passes = await runTavilyPasses(intake.brief, body.artifact, {
    onStatus: (step) => emit({ type: "status", step }),
    onQuery: (query) => emit({ type: "query", pass: "B", query }),
    onRow: (row) => emit({ type: "tavily", row }),
  }).catch(() => ({
    rows: [] as TavilyRow[],
    extractFoundMechanic: false,
    extractText: "",
    hookRefCount: 0,
  }));

  await emit({ type: "status", step: "classify" });

  const draft = await classifyDirector({
    brief: intake.brief,
    sourceText: intake.sourceText,
    tavilyRows: passes.rows,
    extractText: passes.extractText,
  });

  const weights = loadAudienceWeights()[intake.brief.audience] ?? {};
  const agentTool = looksLikeAgentTool(
    `${intake.brief.mechanic}\n${intake.brief.surface_truth}\n${passes.extractText}\n${intake.sourceText}`,
    intake.brief.kind,
  );
  const allowGenerate = weights.generate !== "forbidden";
  const fallbackHuman = (weights.default_path && weights.default_path !== "generate"
    ? weights.default_path
    : "presence_pip") as PathId;
  const human = humanPath(intake.brief.will_appear, fallbackHuman);
  const evidence = `${intake.sourceText}\n${intake.brief.mechanic}\n${passes.extractText}`;

  const recommended = overlayRecommendedPath({
    draft: draft.recommended_path,
    isGreeting: intake.isGreeting,
    audience: intake.brief.audience,
    willAppear: intake.brief.will_appear,
    agentTool,
    sourceText: intake.sourceText,
  });
  const grade = overlayGrade({
    draft: draft.grade,
    isGreeting: intake.isGreeting,
    audience: intake.brief.audience,
    sourceText: intake.sourceText,
    outcomeClaim: body.one_liner,
    hasCutOrTranscript: intake.hasCutOrTranscript,
  });
  const hook_type = overlayHookType({
    draft: draft.hook_type,
    isGreeting: intake.isGreeting,
    audience: intake.brief.audience,
    agentTool,
  });
  const hook_claim = intake.isGreeting
    ? "Show the outcome, not the stack."
    : await rewriteHook(body.one_liner?.trim() || draft.hook_claim, evidence);

  await emit({ type: "status", step: "score" });

  const because = mergeBecause(draft, passes.rows);
  const scored = scoreConfidence({
    extractFoundMechanic: passes.extractFoundMechanic,
    hookRefCount: passes.hookRefCount,
    audiencePicked: intake.audiencePicked,
    hasCutOrTranscript: intake.hasCutOrTranscript,
    onlyOneLiner: intake.onlyOneLiner,
    stageIdeaNoSurface: intake.stageIdeaNoSurface,
    hasEvidence: because.some((row) => Boolean(row.url)),
  });

  const paths = twoPaths(recommended, recommended === human.id ? human : { ...human, id: recommended }, allowGenerate);
  if (paths[0] && paths[0].id !== recommended) {
    paths.reverse();
  }

  const worst = intake.isGreeting
    ? "Greeting + stack in the first seconds. No claim, no product surface."
    : draft.worst;
  const avoid = intake.isGreeting ? "Do not open with hi / we used Next and Nemotron." : draft.avoid;
  const rawPack =
    draft.promptpack.trim() ||
    `Hook: ${hook_claim}\nPath: ${recommended}\n0–0.8 claim on screen. 0.8–4 hold it. 4–8 one live action. 8–10 two seconds of a human who ran it.\nAvoid: ${avoid}`;

  const verdict: DirectResponse = {
    grade,
    confidence: scored.confidence,
    confidence_label: scored.confidence_label,
    missing: scored.missing,
    because,
    worst,
    avoid,
    hook_claim,
    hook_type,
    shotlist: asShotlist(grade === "worst" ? DEFAULT_SHOTLIST : draft.shotlist),
    paths: paths.slice(0, 2),
    recommended_path: recommended,
    why_not_the_other:
      agentTool && recommended !== "generate"
        ? "Generate is a fake surface. An agent tool needs a live run the jury can distrust."
        : draft.why_not_the_other,
    promptpack: withPasteInto(recommended, rawPack, hook_claim),
    tavilyRows: passes.rows,
  };

  await logAgentEvent({
    runId,
    route: "direct",
    ok: true,
    ms: Date.now() - startedAt,
    grade: verdict.grade,
    confidence: verdict.confidence,
    confidence_label: verdict.confidence_label,
    recommended_path: verdict.recommended_path,
    tavilyRowCount: passes.rows.length,
    extractFoundMechanic: passes.extractFoundMechanic,
  });

  await emit({ type: "verdict", result: verdict });
  return verdict;
}

export function parseDirectBody(value: unknown): DirectRequest | null {
  return isDirectRequest(value) ? value : null;
}
