import { appendFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";

const LOG_DIR = path.join(process.cwd(), "logs");
const AGENT_LOG = "agent.jsonl";

export function redactSecrets(text: string): string {
  return text
    .replace(/tvly-[A-Za-z0-9_-]+/g, "tvly-[redacted]")
    .replace(/v1\.[A-Za-z0-9._+-]+/g, "v1.[redacted]")
    .replace(/Bearer\s+\S+/gi, "Bearer [redacted]");
}

export async function logAgentEvent(record: Record<string, unknown>): Promise<void> {
  await mkdir(LOG_DIR, { recursive: true });
  const line = `${JSON.stringify({ ts: new Date().toISOString(), ...record })}\n`;
  await appendFile(path.join(LOG_DIR, AGENT_LOG), line, "utf8");
}

export async function readAgentEvents(limit = 20): Promise<unknown[]> {
  try {
    const raw = await readFile(path.join(LOG_DIR, AGENT_LOG), "utf8");
    const lines = raw.trim().split("\n").filter(Boolean);
    return lines.slice(-Math.max(1, Math.min(limit, 100))).map((line) => JSON.parse(line) as unknown);
  } catch {
    return [];
  }
}
