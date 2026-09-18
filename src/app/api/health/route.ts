export async function GET(): Promise<Response> {
  return Response.json({
    ok: Boolean(process.env.NEBIUS_API_KEY) && Boolean(process.env.TAVILY_API_KEY),
    nebius: Boolean(process.env.NEBIUS_API_KEY),
    tavily: Boolean(process.env.TAVILY_API_KEY),
    model: process.env.NEBIUS_MODEL ?? "nvidia/nemotron-3-super-120b-a12b",
  });
}
