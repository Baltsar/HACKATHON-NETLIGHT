// Getters are lazy so `next build` succeeds without secrets; a missing key only fails the request that needs it.
function requireEnv(name: string): string {
  const value: string | undefined = process.env[name];
  if (!value) {
    throw new Error(`Missing env var ${name}. Copy .env.example to .env.local and fill it in.`);
  }
  return value;
}

export const env = {
  get nebiusApiKey(): string {
    return requireEnv("NEBIUS_API_KEY");
  },
  get nebiusBaseUrl(): string {
    return process.env.NEBIUS_BASE_URL ?? "https://api.tokenfactory.nebius.com/v1";
  },
  get nebiusModel(): string {
    return process.env.NEBIUS_MODEL ?? "nvidia/nemotron-3-super-120b-a12b";
  },
  get tavilyApiKey(): string {
    return requireEnv("TAVILY_API_KEY");
  },
};
