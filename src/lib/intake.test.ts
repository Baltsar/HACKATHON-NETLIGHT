import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isGreetingCopy, looksLikeAgentTool, normalizeIntake } from "./intake.ts";

describe("intake", () => {
  it("marks the greeting fixture as worst-bound signals", () => {
    const result = normalizeIntake({
      artifact: { kind: "notes", value: "Hi we are team X we used Next and Nemotron" },
      audience: "hackathon_jury",
    });
    assert.equal(result.isGreeting, true);
    assert.equal(result.onlyOneLiner, true);
    assert.equal(result.stageIdeaNoSurface, true);
    assert.equal(result.audiencePicked, true);
    assert.equal(result.brief.audience_defaulted, false);
  });

  it("does not treat a github url as a one-liner guess", () => {
    const result = normalizeIntake({
      artifact: { kind: "url", value: "https://github.com/Baltsar/HACKATHON-NETLIGHT" },
      audience: "hackathon_jury",
    });
    assert.equal(result.onlyOneLiner, false);
    assert.equal(result.isGreeting, false);
    assert.equal(looksLikeAgentTool(result.brief.existing_assets.join(" "), result.brief.kind), true);
  });

  it("detects greeting copy", () => {
    assert.equal(isGreetingCopy("Hi we are team X we built an AI platform"), true);
    assert.equal(isGreetingCopy("Paste a repo. We tell you if second 4 loses."), false);
  });
});
