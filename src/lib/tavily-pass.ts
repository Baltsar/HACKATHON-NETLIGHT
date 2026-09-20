import { artifactHttpUrl, isGreetingCopy } from "@/lib/intake";
import type { Artifact, NormalizedBrief, TavilyRow } from "@/lib/schema";
import { tavilyExtract, tavilySearch } from "@/lib/tavily";

const QUOTE_CHARS = 220;
const EXTRACT_CHARS = 6000;

export interface TavilyPasses {
  rows: TavilyRow[];
  extractFoundMechanic: boolean;
  extractText: string;
  hookRefCount: number;
}

function clip(text: string, max: number): string {
  const compact = text.replace(/\s+/g, " ").trim();
  if (compact.length <= max) {
    return compact;
  }
  return `${compact.slice(0, max - 1)}…`;
}

function githubReadmeRaw(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== "github.com") {
      return null;
    }
    const parts = parsed.pathname.split("/").filter(Boolean);
    if (parts.length < 2) {
      return null;
    }
    return `https://raw.githubusercontent.com/${parts[0]}/${parts[1]}/HEAD/README.md`;
  } catch {
    return null;
  }
}

function passAUrls(artifact: Artifact): string[] {
  const primary = artifactHttpUrl(artifact.kind, artifact.value);
  if (!primary) {
    return [];
  }
  const urls = [primary];
  const readme = githubReadmeRaw(primary);
  if (readme) {
    urls.push(readme);
  }
  return urls.slice(0, 2);
}

function extractLooksLikeMechanic(text: string): boolean {
  if (text.length < 160 || isGreetingCopy(text.slice(0, 500))) {
    return false;
  }
  return (
    /\b(paste|grade|verdict|director|hook|runtime|extract|search|demo|users?|product|app|tool)\b/i.test(text) ||
    text.length > 800
  );
}

export async function runTavilyPasses(brief: NormalizedBrief, artifact: Artifact): Promise<TavilyPasses> {
  const rows: TavilyRow[] = [];
  let extractText = "";

  const pushExtract = (results: Array<{ url: string; raw_content: string }>, title: string) => {
    for (const result of results) {
      const body = result.raw_content ?? "";
      if (!body.trim()) {
        continue;
      }
      extractText += `\n${body.slice(0, EXTRACT_CHARS)}`;
      rows.push({
        pass: "A",
        title,
        url: result.url,
        quote: clip(body, QUOTE_CHARS),
      });
    }
  };

  const urls = passAUrls(artifact);
  let artifactExtracted = false;
  if (urls.length > 0) {
    const extracted = await tavilyExtract(urls);
    const before = extractText;
    pushExtract(extracted.results, "extract");
    artifactExtracted = extractText !== before;
  }

  const hookQuery =
    brief.mechanic && brief.mechanic.includes(" ") && !brief.mechanic.includes("/")
      ? `${brief.mechanic} product demo first 10 seconds cold open hook`
      : "hackathon product demo first 10 seconds cold open outcome-first hook";
  const search = await tavilySearch(hookQuery, {
    timeRange: "month",
    maxResults: 5,
    searchDepth: "basic",
    excludeDomains: ["facebook.com", "instagram.com", "x.com", "twitter.com", "linkedin.com"],
  });
  for (const result of search.results) {
    rows.push({
      pass: "B",
      title: result.title,
      url: result.url,
      quote: clip(result.content, QUOTE_CHARS),
    });
  }

  if (!extractText && urls.length > 0 && search.results.length > 0) {
    const follow = search.results.map((result) => result.url).filter((url) => url.startsWith("http")).slice(0, 2);
    if (follow.length > 0) {
      const extracted = await tavilyExtract(follow);
      pushExtract(extracted.results, "extract");
    }
  }

  const extractFoundMechanic = artifactExtracted && extractLooksLikeMechanic(extractText);
  const hookRefCount = rows.filter((row) => row.pass === "B" && row.url.startsWith("http")).length;

  return {
    rows,
    extractFoundMechanic,
    extractText: clip(extractText, EXTRACT_CHARS),
    hookRefCount,
  };
}
