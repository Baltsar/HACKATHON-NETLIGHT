import assert from "node:assert/strict";
import test from "node:test";
import { resolveLogDir } from "./log.ts";

test("local logs stay in the repo logs/ folder", () => {
  const prev = process.env.VERCEL;
  delete process.env.VERCEL;
  assert.match(resolveLogDir(), /logs$/);
  if (prev === undefined) {
    delete process.env.VERCEL;
  } else {
    process.env.VERCEL = prev;
  }
});

test("Vercel writes under /tmp, not /var/task", () => {
  const prev = process.env.VERCEL;
  process.env.VERCEL = "1";
  assert.equal(resolveLogDir(), "/tmp/kallan-logs");
  if (prev === undefined) {
    delete process.env.VERCEL;
  } else {
    process.env.VERCEL = prev;
  }
});
