import { runDirect, parseDirectBody, wantsDirectStream, type DirectEvent } from "@/lib/direct";
import { logAgentEvent, redactSecrets } from "@/lib/log";

export const maxDuration = 120;

export async function POST(request: Request): Promise<Response> {
  const startedAt = Date.now();
  const runId = crypto.randomUUID();
  const raw: unknown = await request.json().catch(() => null);
  const body = parseDirectBody(raw);
  if (!body) {
    return Response.json({ error: "Body must be { artifact: { kind, value }, audience? }" }, { status: 400 });
  }

  if (!wantsDirectStream(request)) {
    try {
      const verdict = await runDirect(body);
      return Response.json(verdict);
    } catch (error: unknown) {
      const message = redactSecrets(error instanceof Error ? error.message : String(error));
      console.error("[api/direct]", message);
      await logAgentEvent({
        runId,
        route: "direct",
        ok: false,
        ms: Date.now() - startedAt,
        error: message,
      });
      return Response.json({ error: message }, { status: 500 });
    }
  }

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      const send = (event: DirectEvent): void => {
        controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      };
      try {
        await runDirect(body, send);
      } catch (error: unknown) {
        const message = redactSecrets(error instanceof Error ? error.message : String(error));
        console.error("[api/direct]", message);
        send({ type: "error", message });
        await logAgentEvent({
          runId,
          route: "direct",
          ok: false,
          ms: Date.now() - startedAt,
          error: message,
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
