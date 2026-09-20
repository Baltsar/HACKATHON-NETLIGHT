export function extractMetrics(text: string): string[] {
  return text.match(/\$?\d+(?:[.,]\d+)?%?/g) ?? [];
}

export function hookInventedMetrics(hook: string, evidence: string): boolean {
  const allowed = new Set(extractMetrics(evidence).map((item) => item.toLowerCase()));
  return extractMetrics(hook).some((item) => !allowed.has(item.toLowerCase()));
}

export function isCleanHook(text: string, evidence = ""): boolean {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length < 2 || words.length > 8) {
    return false;
  }
  if (/(thinking|analyze|user input|here'?s a|markdown|\*\*|#{1,}|^\d+\.|on schedule|under budget|exceeding all|i cannot|i can't|as an ai|cannot paste|provide code)/i.test(text)) {
    return false;
  }
  return !hookInventedMetrics(text, evidence);
}
