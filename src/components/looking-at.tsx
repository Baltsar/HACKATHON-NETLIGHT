"use client";

import { useEffect, useState } from "react";
import { Loader2Icon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import type { DirectStep } from "@/lib/direct-events";
import type { TavilyRow } from "@/lib/schema";
import { cn } from "@/lib/utils";
import { STEP_COPY, chipLabel } from "./desk-copy";
import { SourcePills, hostnameOf } from "./source-pills";

const ORDER: DirectStep[] = ["extract", "search", "classify", "score"];

function clipQuote(quote: string, max = 110): string {
  const cleaned = quote.replace(/\s+/g, " ").trim();
  if (cleaned.length <= max) {
    return cleaned;
  }
  return `${cleaned.slice(0, max).trimEnd()}…`;
}

function isNoiseQuote(quote: string): boolean {
  return /skip to content|careers careers|unlimited revisions|### chapters/i.test(quote);
}

export function LookingAt({
  step,
  query,
  rows,
  chips,
}: {
  step: string;
  query?: string;
  rows: TavilyRow[];
  chips: string[];
}) {
  const [elapsed, setElapsed] = useState(0);
  const current = (ORDER.includes(step as DirectStep) ? step : "extract") as DirectStep;
  const index = ORDER.indexOf(current);
  const progress = Math.min(95, ((index + 1) / ORDER.length) * 100);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setElapsed((seconds) => seconds + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col gap-6" aria-live="polite" aria-busy="true">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-stamp">
          <Loader2Icon className="size-3.5 animate-spin" aria-hidden />
          <span className="kallan-live">Working</span>
          <span className="text-muted-foreground">· {elapsed}s</span>
        </p>
        <p className="font-mono text-[11px] text-muted-foreground">{STEP_COPY[current]?.doing ?? "Directing"}</p>
      </div>

      <Progress value={progress} className="gap-0">
        <span className="sr-only">Director progress</span>
      </Progress>

      <ol className="relative flex flex-col gap-5 border-l border-border pl-5">
        {ORDER.map((id, stepIndex) => {
          const copy = STEP_COPY[id];
          const state = stepIndex < index ? "done" : stepIndex === index ? "active" : "pending";
          return (
            <li key={id} className={cn("relative kallan-in", state === "pending" && "opacity-40")}>
              <span
                className={cn(
                  "absolute top-1.5 -left-[1.45rem] size-2.5 rounded-full border-2 border-paper",
                  state === "active" && "bg-stamp kallan-live",
                  state === "done" && "bg-ink",
                  state === "pending" && "bg-border",
                )}
                aria-hidden
              />
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-stamp">{copy.title}</p>
              <p className="mt-1 text-sm leading-snug text-ink">
                {state === "done" ? copy.done : state === "active" ? copy.doing : copy.title}
              </p>
              {id === "search" && query ? (
                <Badge variant="outline" className="mt-2 max-w-full truncate font-mono font-normal">
                  {query}
                </Badge>
              ) : null}
              {id === current && rows.length === 0 ? (
                <div className="mt-3 flex flex-col gap-2">
                  <Skeleton className="h-3 w-48" />
                  <Skeleton className="h-3 w-36" />
                </div>
              ) : null}
            </li>
          );
        })}
      </ol>

      {chips.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5">
          {chips.map((chip) => (
            <li key={chip}>
              <Badge variant="secondary">{chipLabel(chip)}</Badge>
            </li>
          ))}
        </ul>
      ) : null}

      {rows.length > 0 ? (
        <Collapsible className="rounded-lg border border-border bg-card/70 px-3 py-3 kallan-in">
          <div className="flex items-center justify-between gap-3">
            <CollapsibleTrigger className="cursor-pointer text-left text-sm font-medium">
              Reviewing sources · {rows.length}
            </CollapsibleTrigger>
            <SourcePills urls={rows.map((row) => row.url)} />
          </div>
          <CollapsibleContent className="flex flex-col gap-2 pt-3">
            {rows.slice(0, 6).map((row) => (
              <a
                key={`${row.pass}-${row.url}`}
                href={row.url}
                target="_blank"
                rel="noreferrer"
                className="block rounded-md px-2 py-1.5 text-sm leading-snug hover:bg-muted"
              >
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-stamp">Pass {row.pass}</span>
                <span className="mt-0.5 block truncate">{row.title || hostnameOf(row.url)}</span>
                {row.quote && !isNoiseQuote(row.quote) ? (
                  <span className="mt-0.5 block text-muted-foreground">{clipQuote(row.quote, 90)}</span>
                ) : null}
              </a>
            ))}
          </CollapsibleContent>
        </Collapsible>
      ) : (
        <p className="text-sm text-muted-foreground">Pages will land here as Tavily extract and search return.</p>
      )}
    </div>
  );
}
