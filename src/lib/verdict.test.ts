import assert from "node:assert/strict";
import test from "node:test";
import { pasteIntoInstruction, withPasteInto } from "./verdict.ts";

test("paste-into names the camera, not a login", () => {
  assert.match(pasteIntoInstruction("voice_over_runtime"), /Screen Studio/);
  assert.match(pasteIntoInstruction("voice_over_runtime"), /Do not open Higgsfield/);
  assert.match(pasteIntoInstruction("generate"), /Higgsfield/);
});

test("withPasteInto prefixes unless the pack already says paste into", () => {
  const wrapped = withPasteInto("film_yourself", "0–0.8 claim on screen.", "Show the outcome");
  assert.match(wrapped, /iPhone/);
  assert.match(wrapped, /Show the outcome/);
  const already = withPasteInto("generate", "Paste into Higgsfield Marketing Studio.\nHook: X", "X");
  assert.equal(already.startsWith("Paste into Higgsfield"), true);
});
