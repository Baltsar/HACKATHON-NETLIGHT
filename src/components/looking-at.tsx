"use client";

import { useEffect, useState } from "react";
import type { TavilyRow } from "@/lib/schema";
import { chipLabel } from "./desk-copy";

const STEP_COPY: Record<string, string> = {
  extract: "Extracting the artifact",
  search: "Searching last-30-days hooks",
  classify: "Super writing the verdict",
  score: "Overwriting confidence",
};

function clipQuote(quote: string, max = 110): string {
  const cleaned = quote.replace(/\s+/g, " ").trim();
  if (cleaned.length <= max) {
    return cleaned;
  }
  return `${cleaned.slice(0, max).trimEnd()}…`;
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

  useEffect(() => {
    const timer = window.setInterval(() => {
      setElapsed((seconds) => seconds + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col gap-6" aria-live="polite" aria-busy="true">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-stamp">
          Looking · {elapsed}s
        </p>
        <p className="font-mono text-[11px] text-ink-soft">{STEP_COPY[step] ?? "Directing"}</p>
      </div>

      {chips.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {chips.map((chip) => (
            <li
              key={chip}
              className="border border-rule px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-soft"
            >
              {chipLabel(chip)}
            </li>
          ))}
        </ul>
      ) : null}

      {query ? (
        <p className="text-sm leading-relaxed text-ink-soft">
          Pass B · <span className="text-ink">{query}</span>
        </p>
      ) : null}

      {rows.length === 0 ? (
        <p className="text-sm text-ink-soft">Waiting for Tavily. You will see the pages as we extract them.</p>
      ) : (
        <ol className="flex flex-col">
          {rows.map((row) => (
            <li key={`${row.pass}-${row.url}`} className="border-t border-rule py-3">
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-stamp">
                Pass {row.pass}
              </p>
              <a
                href={row.url}
                target="_blank"
                rel="noreferrer"
                className="mt-1 block text-sm leading-snug underline decoration-rule underline-offset-4 hover:decoration-stamp"
              >
                {clipQuote(row.title || row.url, 72)}
              </a>
              {row.quote ? <p className="mt-1 text-sm leading-relaxed text-ink-soft">{clipQuote(row.quote)}</p> : null}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
