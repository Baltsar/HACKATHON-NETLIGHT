import { readFile } from "node:fs/promises";
import path from "node:path";

export async function GET(): Promise<Response> {
  const file = path.join(process.cwd(), "stack.json");
  const json = await readFile(file, "utf8");
  return new Response(json, {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}
