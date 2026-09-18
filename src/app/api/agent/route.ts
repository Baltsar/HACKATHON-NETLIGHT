import { runAgent, type AgentResult } from "@/lib/agent";
import { logAgentEvent, redactSecrets } from "@/lib/log";

export const maxDuration = 60;

interface AgentRequestBody {
  question: string;
}

function isAgentRequestBody(value: unknown): value is AgentRequestBody {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as AgentRequestBody).question === "string" &&
    (value as AgentRequestBody).question.trim().length > 0
  );
}

export async function POST(request: Request): Promise<Response> {
  const startedAt = Date.now();
  const runId = crypto.randomUUID();
  const body: unknown = await request.json().catch(() => null);
  if (!isAgentRequestBody(body)) {
    return Response.json({ error: "Body must be { question: string }" }, { status: 400 });
  }

  const question = body.question.trim();
  try {
    const result: AgentResult = await runAgent(question);
    await logAgentEvent({
      runId,
      ok: true,
      ms: Date.now() - startedAt,
      question,
      model: result.model,
      steps: result.steps,
      sources: result.sources,
      usage: result.usage,
      answer: result.answer,
    });
    return Response.json(result);
  } catch (error: unknown) {
    const message: string = redactSecrets(error instanceof Error ? error.message : String(error));
    console.error("[api/agent]", message);
    await logAgentEvent({
      runId,
      ok: false,
      ms: Date.now() - startedAt,
      question,
      error: message,
    });
    return Response.json({ error: message }, { status: 500 });
  }
}
