import type { DirectResponse, TavilyRow } from "@/lib/schema";

export type DirectStep = "extract" | "search" | "classify" | "score";

export type DirectEvent =
  | { type: "status"; step: DirectStep }
  | { type: "query"; pass: "B"; query: string }
  | { type: "tavily"; row: TavilyRow }
  | { type: "hints"; chips: string[] }
  | { type: "verdict"; result: DirectResponse }
  | { type: "error"; message: string };
