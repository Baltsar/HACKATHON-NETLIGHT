import { readFileSync } from "node:fs";
import path from "node:path";
import { scoreConfidence } from "@/lib/confidence";
import { normalizeIntake, looksLikeAgentTool } from "@/lib/intake";
import { logAgentEvent, redactSecrets } from "@/lib/log";
import { classifyDirector, DEFAULT_SHOTLIST, rewriteHook, type DirectorDraft } from "@/lib/nemotron";
import { isDirectRequest, type DirectResponse, type PathId, type PathOption, type TavilyRow } from "@/lib/schema";
import { runTavilyPasses } from "@/lib/tavily-pass";

export const maxDuration = 120;

interface AudienceWeight {
  default_path?: PathId;
  forbid_generate_when?: string;
  generate?: string;
}

function loadAudienceWeights(): Record<string, AudienceWeight> {
  const file = path.join(process.cwd(), "data/audience-weights.json");
  return JSON.parse(readFileSync(file, "utf8")) as Record<string, AudienceWeight>;
}

function humanPath(willAppear: string, fallback: PathId): PathOption {
  const id: PathId =
    willAppear === "none" || willAppear === "voice_only"
      ? "voice_over_runtime"
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

function generatePath(): PathOption {
  return {
    id: "generate",
    cost: "~60 cr / 15s",
    truth: 0,
    stack: ["Higgsfield Marketing Studio", "CapCut"],
    why: "Only if nobody will shoot and the product is physical / feed.",
  };
}

function twoPaths(recommended: PathId, human: PathOption, allowGenerate: boolean): PathOption[] {
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
  return [human.id === recommended ? human : { ...human, id: recommended }, generate];
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
    ...rows.filter((row) => row.pass === "B" && /demo|hook|video|jury|pitch|10\s*s/i.test(`${row.title} ${row.quote}`)),
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

export async function POST(request: Request): Promise<Response> {
  const startedAt = Date.now();
  const runId = crypto.randomUUID();
  const body: unknown = await request.json().catch(() => null);
  if (!isDirectRequest(body)) {
    return Response.json({ error: "Body must be { artifact: { kind, value }, audience? }" }, { status: 400 });
  }

  try {
    const intake = normalizeIntake(body);
    const passes = await runTavilyPasses(intake.brief, body.artifact).catch(() => ({
      rows: [] as TavilyRow[],
      extractFoundMechanic: false,
      extractText: "",
      hookRefCount: 0,
    }));

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

    let recommended: PathId = draft.recommended_path;
    if (intake.isGreeting) {
      recommended = "voice_over_runtime";
    } else if (agentTool && weights.forbid_generate_when === "agent_or_tool") {
      recommended = human.id;
    } else if (!allowGenerate && recommended === "generate") {
      recommended = human.id;
    }

    const hook_claim = intake.isGreeting
      ? "Show the outcome, not the stack."
      : await rewriteHook(draft.hook_claim);
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

    const grade = intake.isGreeting ? "worst" : draft.grade;
    const worst = intake.isGreeting
      ? "Greeting + stack in the first seconds. No claim, no product surface."
      : draft.worst;
    const avoid = intake.isGreeting ? "Do not open with hi / we used Next and Nemotron." : draft.avoid;
    const promptpack =
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
      hook_type: intake.isGreeting ? "outcome_first" : draft.hook_type,
      shotlist: asShotlist(grade === "worst" ? DEFAULT_SHOTLIST : draft.shotlist),
      paths: paths.slice(0, 2),
      recommended_path: recommended,
      why_not_the_other: agentTool
        ? "Generate is a fake surface. An agent tool needs a live run the jury can distrust."
        : draft.why_not_the_other,
      promptpack,
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

    return Response.json(verdict);
  } catch (error: unknown) {
    const message = redactSecrets(error instanceof Error ? error.message : String(error));
    console.error("[api/direct]", message);
    await logAgentEvent({
      runId,
      route: "direct",
      ok: false,
      ms: Date.now() - startedAt,
      error: message,
    });
    return Response.json({ error: message }, { status: 500 });
  }
}
