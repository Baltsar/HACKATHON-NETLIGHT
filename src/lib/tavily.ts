import { env } from "@/lib/env";

const TAVILY_API_URL = "https://api.tavily.com";

export type TavilySearchDepth = "basic" | "advanced" | "fast" | "ultra-fast";
export type TavilyTopic = "general" | "news" | "finance";

export interface TavilySearchOptions {
  searchDepth?: TavilySearchDepth;
  topic?: TavilyTopic;
  maxResults?: number;
  includeAnswer?: boolean | "basic" | "advanced";
  includeDomains?: string[];
  excludeDomains?: string[];
  timeRange?: "day" | "week" | "month" | "year";
  country?: string;
}

export interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
  raw_content?: string | null;
}

export interface TavilySearchResponse {
  query: string;
  answer?: string | null;
  results: TavilySearchResult[];
  response_time: number;
}

export interface TavilyExtractResult {
  url: string;
  raw_content: string;
}

export interface TavilyExtractResponse {
  results: TavilyExtractResult[];
  failed_results: Array<{ url: string; error: string }>;
}

async function tavilyPost<TResponse>(path: string, body: Record<string, unknown>): Promise<TResponse> {
  const res: Response = await fetch(`${TAVILY_API_URL}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.tavilyApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`Tavily ${path} failed (${res.status}): ${await res.text()}`);
  }
  return (await res.json()) as TResponse;
}

export async function tavilySearch(
  query: string,
  options: TavilySearchOptions = {},
): Promise<TavilySearchResponse> {
  return tavilyPost<TavilySearchResponse>("/search", {
    query,
    search_depth: options.searchDepth ?? "basic",
    topic: options.topic ?? "general",
    max_results: options.maxResults ?? 5,
    include_answer: options.includeAnswer ?? false,
    include_domains: options.includeDomains,
    exclude_domains: options.excludeDomains,
    time_range: options.timeRange,
    country: options.country,
  });
}

export async function tavilyExtract(urls: string[]): Promise<TavilyExtractResponse> {
  return tavilyPost<TavilyExtractResponse>("/extract", { urls, format: "markdown" });
}
