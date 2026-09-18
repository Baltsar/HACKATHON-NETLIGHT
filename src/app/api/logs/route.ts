import { readAgentEvents } from "@/lib/log";

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const limit = Number(url.searchParams.get("limit") ?? "20");
  const events = await readAgentEvents(Number.isFinite(limit) ? limit : 20);
  return Response.json({ events });
}
