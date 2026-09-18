import { chatCompletion, type ChatMessage, type ToolCall, type ToolDefinition } from "@/lib/nebius";
import { tavilyExtract, tavilySearch } from "@/lib/tavily";

const MAX_STEPS = 6;
const MAX_EXTRACT_URLS = 3;

const SYSTEM_PROMPT = `You write short, sourced research briefs.
Always call web_search before answering any question that depends on current, public, or factual information.
After search, call web_extract on the 1–3 most relevant URLs so you read the actual pages, not only snippets.
Write in the user's language. Structure the brief as:
1. Direct answer in 2–4 sentences.
2. Key facts as short bullets, each ending with a citation like [1].
3. Uncertainties / disagreements between sources, if any.
Cite only sources returned by the tools, in the order they appear, using [1], [2], [3]. Never invent URLs. Never use special tokens like 【 or †.`;

const TOOLS: ToolDefinition[] = [
  {
    type: "function",
    function: {
      name: "web_search",
      description: "Search the live web via Tavily. Prefer this first.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "A focused search query." },
          country: {
            type: "string",
            description: "Optional ISO country bias, e.g. sweden.",
          },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "web_extract",
      description: "Fetch full page text from one or more URLs via Tavily Extract.",
      parameters: {
        type: "object",
        properties: {
          urls: {
            type: "array",
            items: { type: "string" },
            description: "Up to 3 https URLs from search results.",
          },
        },
        required: ["urls"],
      },
    },
  },
];

export interface AgentSource {
  title: string;
  url: string;
}

export interface AgentStep {
  tool: string;
  input: string;
  resultCount: number;
}

export interface AgentResult {
  answer: string;
  sources: AgentSource[];
  steps: AgentStep[];
  model: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface WebSearchArgs {
  query: string;
  country?: string;
}

interface WebExtractArgs {
  urls: string[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseWebSearchArgs(raw: string): WebSearchArgs {
  const parsed: unknown = JSON.parse(raw);
  if (!isRecord(parsed) || typeof parsed.query !== "string") {
    throw new Error(`web_search called with invalid arguments: ${raw}`);
  }
  const country = typeof parsed.country === "string" ? parsed.country : undefined;
  return { query: parsed.query, country };
}

function parseWebExtractArgs(raw: string): WebExtractArgs {
  const parsed: unknown = JSON.parse(raw);
  if (!isRecord(parsed) || !Array.isArray(parsed.urls)) {
    throw new Error(`web_extract called with invalid arguments: ${raw}`);
  }
  const urls = parsed.urls.filter((url): url is string => typeof url === "string" && url.startsWith("http"));
  if (urls.length === 0) {
    throw new Error("web_extract requires at least one http(s) URL");
  }
  return { urls: urls.slice(0, MAX_EXTRACT_URLS) };
}

function upsertSource(sources: AgentSource[], title: string, url: string): number {
  const existing = sources.findIndex((source) => source.url === url);
  if (existing >= 0) {
    if (!sources[existing].title) {
      sources[existing] = { title, url };
    }
    return existing + 1;
  }
  sources.push({ title, url });
  return sources.length;
}

function uniqueUrls(urls: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const url of urls) {
    let key = url;
    try {
      const parsed = new URL(url);
      key = `${parsed.origin}${parsed.pathname}`;
    } catch {
      continue;
    }
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(url);
  }
  return out;
}

function extractPayload(response: Awaited<ReturnType<typeof tavilyExtract>>, sources: AgentSource[]) {
  return {
    results: response.results.map((result) => {
      const host = new URL(result.url).hostname.replace(/^www\./, "");
      const ref = upsertSource(sources, host, result.url);
      return { ref, url: result.url, content: result.raw_content.slice(0, 8000) };
    }),
    failed: response.failed_results,
  };
}

async function runToolCall(
  call: ToolCall,
  sources: AgentSource[],
): Promise<{ step: AgentStep; extraSteps: AgentStep[]; toolContent: string }> {
  if (call.function.name === "web_search") {
    const { query, country } = parseWebSearchArgs(call.function.arguments);
    const response = await tavilySearch(query, {
      maxResults: 5,
      country,
      searchDepth: "basic",
    });
    const payload = response.results.map((result) => {
      const ref = upsertSource(sources, result.title, result.url);
      return { ref, title: result.title, url: result.url, content: result.content };
    });
    const extractUrls = uniqueUrls(response.results.map((result) => result.url)).slice(0, 2);
    const extracted =
      extractUrls.length > 0 ? extractPayload(await tavilyExtract(extractUrls), sources) : { results: [], failed: [] };
    return {
      step: { tool: "web_search", input: query, resultCount: response.results.length },
      extraSteps:
        extractUrls.length > 0
          ? [{ tool: "web_extract", input: extractUrls.join(", "), resultCount: extracted.results.length }]
          : [],
      toolContent: JSON.stringify({ results: payload, extracted }),
    };
  }

  if (call.function.name === "web_extract") {
    const { urls } = parseWebExtractArgs(call.function.arguments);
    const extracted = extractPayload(await tavilyExtract(urls), sources);
    return {
      step: { tool: "web_extract", input: urls.join(", "), resultCount: extracted.results.length },
      extraSteps: [],
      toolContent: JSON.stringify(extracted),
    };
  }

  throw new Error(`Model requested unknown tool: ${call.function.name}`);
}

export async function runAgent(question: string): Promise<AgentResult> {
  const messages: ChatMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: question },
  ];
  const steps: AgentStep[] = [];
  const sources: AgentSource[] = [];
  const usage = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };

  for (let i = 0; i < MAX_STEPS; i++) {
    const completion = await chatCompletion({ messages, tools: TOOLS, temperature: 0.2 });
    if (completion.usage) {
      usage.prompt_tokens += completion.usage.prompt_tokens;
      usage.completion_tokens += completion.usage.completion_tokens;
      usage.total_tokens += completion.usage.total_tokens;
    }
    const message = completion.choices[0]?.message;
    if (!message) {
      throw new Error("Token Factory returned no choices");
    }

    if (!message.tool_calls?.length) {
      return { answer: message.content ?? "", sources, steps, model: completion.model, usage };
    }

    messages.push({ role: "assistant", content: message.content, tool_calls: message.tool_calls });
    for (const call of message.tool_calls) {
      const { step, extraSteps, toolContent } = await runToolCall(call, sources);
      steps.push(step, ...extraSteps);
      messages.push({
        role: "tool",
        tool_call_id: call.id,
        content: toolContent,
      });
    }
  }

  throw new Error(`Agent did not finish within ${MAX_STEPS} steps`);
}
