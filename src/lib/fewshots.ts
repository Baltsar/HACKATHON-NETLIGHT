import { readFileSync } from "node:fs";
import path from "node:path";
import type { Audience, Grade, PathId } from "@/lib/schema";

export interface Fewshot {
  id: string;
  audience: Audience;
  input: string;
  grade: Grade;
  claim_s?: number | null;
  product_truth?: number;
  recommended_path: PathId;
  why: string;
}

const GRADES: readonly Grade[] = ["worst", "bad", "usable", "good", "best"];
const PATHS: readonly PathId[] = [
  "presence_pip",
  "voice_over_runtime",
  "film_yourself",
  "generate",
];

function isFewshot(value: unknown): value is Fewshot {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const row = value as Partial<Fewshot>;
  return (
    typeof row.id === "string" &&
    typeof row.audience === "string" &&
    typeof row.input === "string" &&
    typeof row.grade === "string" &&
    GRADES.includes(row.grade) &&
    typeof row.recommended_path === "string" &&
    PATHS.includes(row.recommended_path) &&
    typeof row.why === "string"
  );
}

export function loadFewshots(): readonly Fewshot[] {
  const file = path.join(process.cwd(), "data/fewshots.json");
  const rows: unknown = JSON.parse(readFileSync(file, "utf8"));
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error("data/fewshots.json is empty");
  }
  for (const row of rows) {
    if (!isFewshot(row)) {
      throw new Error("data/fewshots.json has an unknown label — do not rewrite, fix the file");
    }
  }
  return rows;
}
