import { appendFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";

const AGENT_LOG = "agent.jsonl";

export function resolveLogDir(): string {
  // Vercel lambdas unpack to read-only /var/task. Only /tmp is writable.
  return process.env.VERCEL ? path.join("/tmp", "kallan-logs") : path.join(process.cwd(), "logs");
}

export function redactSecrets(text: string): string {
  return text
    .replace(/tvly-[A-Za-z0-9_-]+/g, "tvly-[redacted]")
    .replace(/v1\.[A-Za-z0-9._+-]+/g, "v1.[redacted]")
    .replace(/Bearer\s+\S+/gi, "Bearer [redacted]");
}

export async function logAgentEvent(record: Record<string, unknown>): Promise<void> {
  const line = `${JSON.stringify({ ts: new Date().toISOString(), ...record })}\n`;
  try {
    const dir = resolveLogDir();
    await mkdir(dir, { recursive: true });
    await appendFile(path.join(dir, AGENT_LOG), line, "utf8");
  } catch {
    // A log miss must never 500 a director run.
  }
}

export async function readAgentEvents(limit = 20): Promise<unknown[]> {
  try {
    const raw = await readFile(path.join(resolveLogDir(), AGENT_LOG), "utf8");
    const lines = raw.trim().split("\n").filter(Boolean);
    return lines.slice(-Math.max(1, Math.min(limit, 100))).map((line) => JSON.parse(line) as unknown);
  } catch {
    return [];
  }
}
