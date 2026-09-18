import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { confidence, confidenceLabel, scoreConfidence } from "./confidence.ts";
import { loadFewshots } from "./fewshots.ts";

describe("confidence", () => {
  it("caps a one-liner-only guess below 0.45", () => {
    assert.ok(confidence({ onlyOneLiner: true }) < 0.45);
    assert.equal(scoreConfidence({ onlyOneLiner: true }).confidence_label, "gissning");
  });

  it("starts at 0.50 and labels osaker with no bonuses", () => {
    const result = scoreConfidence({});
    assert.equal(result.confidence, 0.5);
    assert.equal(result.confidence_label, "osaker");
  });

  it("caps at 0.95 when every signal is present", () => {
    const result = scoreConfidence({
      extractFoundMechanic: true,
      hookRefCount: 2,
      audiencePicked: true,
      hasCutOrTranscript: true,
    });
    assert.equal(result.confidence, 0.95);
    assert.equal(result.confidence_label, "dom");
  });

  it("caps at 0.40 when rubric scores have no evidence", () => {
    const result = scoreConfidence({
      extractFoundMechanic: true,
      hookRefCount: 3,
      audiencePicked: true,
      hasEvidence: false,
    });
    assert.ok(result.confidence <= 0.4);
  });

  it("maps label thresholds", () => {
    assert.equal(confidenceLabel(0.44), "gissning");
    assert.equal(confidenceLabel(0.45), "osaker");
    assert.equal(confidenceLabel(0.69), "osaker");
    assert.equal(confidenceLabel(0.7), "dom");
  });
});

describe("fewshots", () => {
  it("loads locked labels without rewriting them", () => {
    const rows = loadFewshots();
    assert.equal(rows[0]?.id, "hackathon-greeting");
    assert.equal(rows[0]?.grade, "worst");
    assert.equal(rows.find((row) => row.id === "yc-application-kinetic")?.recommended_path, "film_yourself");
  });
});
