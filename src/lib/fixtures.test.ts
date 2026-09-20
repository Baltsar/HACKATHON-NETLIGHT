import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { scoreConfidence } from "./confidence.ts";
import { hookInventedMetrics, isCleanHook } from "./hook.ts";
import { looksLikeAgentTool, normalizeIntake } from "./intake.ts";
import { overlayGrade, overlayHookType, overlayRecommendedPath } from "./verdict.ts";

describe("slice 5 fixtures", () => {
  it("A greeting+stack → worst and gissning", () => {
    const intake = normalizeIntake({
      artifact: { kind: "notes", value: "Hi we are team X we used Next and Nemotron" },
      audience: "hackathon_jury",
    });
    const scored = scoreConfidence({
      extractFoundMechanic: false,
      hookRefCount: 2,
      audiencePicked: intake.audiencePicked,
      hasCutOrTranscript: intake.hasCutOrTranscript,
      onlyOneLiner: intake.onlyOneLiner,
      stageIdeaNoSurface: intake.stageIdeaNoSurface,
    });
    assert.equal(intake.isGreeting, true);
    assert.equal(overlayGrade({ draft: "good", isGreeting: true, audience: "hackathon_jury", sourceText: intake.sourceText }), "worst");
    assert.ok(scored.confidence < 0.45);
    assert.equal(scored.confidence_label, "gissning");
    assert.equal(
      overlayRecommendedPath({
        draft: "generate",
        isGreeting: true,
        audience: "hackathon_jury",
        willAppear: "none",
        agentTool: true,
        sourceText: intake.sourceText,
      }),
      "voice_over_runtime",
    );
  });

  it("B YC talking-heads must not recommend generate", () => {
    const sourceText = "Campus-Job-style talking heads. Founders talking to camera with kinetic type and B-roll.";
    const path = overlayRecommendedPath({
      draft: "generate",
      isGreeting: false,
      audience: "yc_application",
      willAppear: "face",
      agentTool: false,
      sourceText,
    });
    assert.notEqual(path, "generate");
    assert.equal(path, "film_yourself");
    assert.equal(
      overlayGrade({ draft: "good", isGreeting: false, audience: "yc_application", sourceText: "Kinetic type promo with music and B-roll" }),
      "worst",
    );
  });

  it("C agent one-liner + live URL never recommends generate and prefers live_trace", () => {
    const intake = normalizeIntake({
      artifact: { kind: "url", value: "https://docs.tavily.com" },
      audience: "hackathon_jury",
      one_liner: "Paste a repo. We tell you if the first 10s will lose.",
    });
    const agentTool = looksLikeAgentTool(`${intake.brief.mechanic} director verdict tavily nemotron`, intake.brief.kind);
    const path = overlayRecommendedPath({
      draft: "generate",
      isGreeting: false,
      audience: "hackathon_jury",
      willAppear: "none",
      agentTool,
      sourceText: intake.sourceText,
    });
    const hook = overlayHookType({
      draft: "what_if",
      isGreeting: false,
      audience: "hackathon_jury",
      agentTool: true,
    });
    assert.equal(intake.onlyOneLiner, false);
    assert.notEqual(path, "generate");
    assert.ok(hook === "live_trace" || hook === "outcome_first");
    assert.equal(
      overlayGrade({
        draft: "worst",
        isGreeting: false,
        audience: "hackathon_jury",
        sourceText: intake.sourceText,
        outcomeClaim: intake.brief.mechanic,
      }),
      "usable",
    );
  });
});

describe("lightning must not invent metrics", () => {
  it("rejects percents and dollars that are not in the extract", () => {
    assert.equal(hookInventedMetrics("40% reduction in pilot", "Paste a repo. We grade second 4."), true);
    assert.equal(hookInventedMetrics("Coffee at the door in 12 minutes", "Coffee at the door in 12 minutes."), false);
    assert.equal(isCleanHook("40% reduction in pilot", "no numbers here"), false);
    assert.equal(isCleanHook("I cannot paste a repository or provide code.", "Paste a repo."), false);
    assert.equal(isCleanHook("Paste. See if the cut loses.", "Paste a repo. We tell you if the first 10s will lose."), true);
  });
});

describe("director prompt", () => {
  it("loads prompts/director.md", () => {
    const text = readFileSync(path.join(process.cwd(), "prompts/director.md"), "utf8");
    assert.match(text, /Kill list/);
    assert.match(text, /never recommend `generate`/i);
  });
});
