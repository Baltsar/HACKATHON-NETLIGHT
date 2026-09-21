"use client";

import { useState } from "react";
import { CheckIcon, CopyIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import type { DirectResponse, PathOption, ShotBeat, TavilyRow } from "@/lib/schema";
import { cn } from "@/lib/utils";
import {
  CONFIDENCE_COPY,
  GRADE_COPY,
  HOOK_TYPE_COPY,
  PATH_COPY,
  PATH_EXECUTE,
  chipLabel,
} from "./desk-copy";
import { SourcePills, hostnameOf } from "./source-pills";

const CONFIDENCE_CAP = 0.95;

function clipQuote(quote: string, max = 140): string {
  const cleaned = quote.replace(/\s+/g, " ").trim();
  if (cleaned.length <= max) {
    return cleaned;
  }
  return `${cleaned.slice(0, max).trimEnd()}…`;
}

function isNoiseQuote(quote: string): boolean {
  return /skip to content|careers careers|unlimited revisions|### chapters/i.test(quote);
}

function ShotRuler({ beats }: { beats: DirectResponse["shotlist"] }) {
  return (
    <section>
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-stamp">Ten seconds</h2>
        <p className="font-mono text-[11px] text-stamp">0–4 is where they leave</p>
      </div>
      <div className="relative mt-4">
        <div className="relative h-11 border-y border-ink">
          <div className="absolute inset-y-0 left-0 w-2/5 bg-stamp-wash" aria-hidden />
          {beats.map((beat, index) => (
            <div
              key={`${beat.start}-${beat.end}-${index}`}
              className="absolute inset-y-0 border-r border-ink/25"
              style={{
                left: `${(Math.max(0, beat.start) / 10) * 100}%`,
                width: `${(Math.max(0.25, beat.end - beat.start) / 10) * 100}%`,
              }}
            >
              <span className="absolute bottom-1 left-1.5 font-mono text-[10px] tabular-nums text-ink">
                {index + 1}
              </span>
            </div>
          ))}
        </div>
        <div className="relative mt-1 h-4 font-mono text-[10px] text-muted-foreground">
          <span className="absolute left-0">0s</span>
          <span className="absolute left-[40%] -translate-x-1/2 text-stamp">4s</span>
          <span className="absolute right-0">10s</span>
        </div>
      </div>
      <ol className="mt-2">
        {beats.map((beat, index) => (
          <BeatRow key={`${beat.start}-${beat.end}-${index}`} beat={beat} index={index} />
        ))}
      </ol>
    </section>
  );
}

function BeatRow({ beat, index }: { beat: ShotBeat; index: number }) {
  const killWindow = beat.start < 4;
  return (
    <li
      className={cn(
        "grid grid-cols-[1.5rem_4.75rem_1fr] gap-3 border-t border-border py-3 text-sm leading-snug",
        killWindow ? "text-ink" : "text-muted-foreground",
      )}
    >
      <span className="font-mono text-[11px] text-stamp">{index + 1}</span>
      <span className="font-mono text-[11px] tabular-nums">
        {beat.start}–{beat.end}s
      </span>
      <span>{beat.action}</span>
    </li>
  );
}

function PathCard({ path, recommended }: { path: PathOption; recommended: boolean }) {
  return (
    <article className={cn("flex flex-col gap-2", recommended ? "text-ink" : "text-muted-foreground")}>
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-stamp">
        {recommended ? "Shoot this" : "The other camera"}
      </p>
      <h3 className="font-display text-3xl leading-none tracking-tight">{PATH_COPY[path.id]}</h3>
      <p className="font-mono text-[11px] uppercase tracking-[0.12em]">
        {path.cost} · paste into {PATH_EXECUTE[path.id]}
      </p>
      <p className="text-sm leading-relaxed">{path.why}</p>
    </article>
  );
}

function CopyDeck({
  title,
  hint,
  body,
}: {
  title: string;
  hint: string;
  body: string;
}) {
  const [copied, setCopied] = useState(false);
  async function copy(): Promise<void> {
    setCopied(true);
    try {
      await navigator.clipboard.writeText(body);
    } catch {
      // Still visible on screen.
    }
    window.setTimeout(() => setCopied(false), 1600);
  }
  return (
    <article className="flex flex-col gap-3 rounded-lg border border-border bg-card/80 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-medium">{title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{hint}</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => void copy()}>
          {copied ? <CheckIcon data-icon="inline-start" /> : <CopyIcon data-icon="inline-start" />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <pre className="max-h-40 overflow-auto whitespace-pre-wrap font-mono text-xs leading-relaxed text-muted-foreground">
        {body}
      </pre>
    </article>
  );
}

function SourcesFold({ rows }: { rows: TavilyRow[] }) {
  const clean = rows.filter((row) => row.url.startsWith("http"));
  return (
    <Collapsible className="rounded-lg border border-border px-3 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <CollapsibleTrigger className="cursor-pointer text-sm font-medium">
          {clean.length} sources
        </CollapsibleTrigger>
        <SourcePills urls={clean.map((row) => row.url)} />
      </div>
      <CollapsibleContent className="flex flex-col gap-2 pt-3">
        {clean.length === 0 ? (
          <p className="text-sm text-muted-foreground">No public extract. Private repo, or the URL did not yield a mechanic.</p>
        ) : (
          clean.map((row) => (
            <a
              key={`${row.pass}-${row.url}`}
              href={row.url}
              target="_blank"
              rel="noreferrer"
              className="block rounded-md px-2 py-1.5 text-sm leading-snug hover:bg-muted"
            >
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-stamp">
                {row.pass === "A" ? "This project" : "Category hook"}
              </span>
              <span className="mt-0.5 block">{row.title || hostnameOf(row.url)}</span>
              {row.quote && !isNoiseQuote(row.quote) ? (
                <span className="mt-0.5 block text-muted-foreground">{clipQuote(row.quote, 100)}</span>
              ) : null}
            </a>
          ))
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

function shotDeck(beats: DirectResponse["shotlist"]): string {
  return beats.map((beat, index) => `${index + 1}. ${beat.start}–${beat.end}s — ${beat.action}`).join("\n");
}

export function VerdictCard({
  result,
  elapsedMs,
  hasCut,
  onCopy,
  copied,
}: {
  result: DirectResponse;
  elapsedMs: number;
  hasCut: boolean;
  copied: boolean;
  onCopy: () => void;
}) {
  const grade = GRADE_COPY[result.grade];
  const fail = result.grade === "worst" || result.grade === "bad";
  const recommended = result.paths.find((path) => path.id === result.recommended_path) ?? result.paths[0];
  const other = result.paths.find((path) => path.id !== result.recommended_path);
  const camera = PATH_EXECUTE[result.recommended_path];
  const confidencePct = Math.round(result.confidence * 100);

  return (
    <article className="flex flex-col gap-10">
      <p className="rounded-lg border border-border bg-card/80 px-4 py-3 text-sm leading-relaxed">
        {hasCut
          ? "You already have a cut. Grade is whether seconds 0–4 lose the room. Copy the rewrite into the same tool you used."
          : "You do not have a film yet. The job is a camera and a promptpack, not a generated gallery."}
      </p>

      <header className="grid gap-8 lg:grid-cols-[minmax(0,11rem)_minmax(0,1fr)]">
        <div className="flex flex-col gap-3">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-stamp">Seconds 0–4</p>
          <p
            className={cn(
              "inline-block w-fit border-2 px-3 py-1 font-display text-4xl leading-none tracking-tight",
              fail ? "border-stamp text-stamp" : "border-ink text-ink",
            )}
          >
            {grade.stamp}
          </p>
          <p className="text-sm leading-snug text-muted-foreground">{grade.meaning}</p>
        </div>
        <div className="flex min-w-0 flex-col gap-3">
          <div className="flex items-baseline justify-between gap-3">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-stamp">{result.confidence_label}</p>
            <p className="font-mono text-sm tabular-nums">{confidencePct}%</p>
          </div>
          <Progress value={(result.confidence / CONFIDENCE_CAP) * 100} className="gap-0" />
          <p className="text-sm leading-snug text-muted-foreground">{CONFIDENCE_COPY[result.confidence_label]}</p>
        </div>
      </header>

      {result.missing.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5">
          {result.missing.map((item) => (
            <li key={item}>
              <Badge variant="outline">{chipLabel(item)}</Badge>
            </li>
          ))}
        </ul>
      ) : null}

      <section>
        <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-stamp">
          {hasCut ? "Why they leave" : "If you opened like this"}
        </h2>
        <p className="mt-4 font-display text-[clamp(1.8rem,5vw,3.1rem)] leading-[1.02] tracking-tight">
          {result.worst}
        </p>
      </section>

      <section>
        <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-stamp">First sentence</h2>
        <p className="mt-3 font-display text-3xl leading-[1.05] tracking-tight">{result.hook_claim}</p>
        <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
          {HOOK_TYPE_COPY[result.hook_type]} · do not: {result.avoid}
        </p>
      </section>

      <ShotRuler beats={result.shotlist} />

      <section className="flex flex-col gap-6">
        {recommended ? <PathCard path={recommended} recommended /> : null}
        <p className="text-sm leading-relaxed text-muted-foreground">{result.why_not_the_other}</p>
        {other ? (
          <Collapsible>
            <CollapsibleTrigger className="cursor-pointer font-mono text-[11px] uppercase tracking-[0.16em] text-stamp">
              The other camera
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-4">
              <PathCard path={other} recommended={false} />
            </CollapsibleContent>
          </Collapsible>
        ) : null}
      </section>

      <Separator />

      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-stamp">Prompt decks</h2>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
              Copy one, paste into {camera} yourself. No login from here.
            </p>
          </div>
          <Button type="button" onClick={onCopy}>
            {copied ? <CheckIcon data-icon="inline-start" /> : <CopyIcon data-icon="inline-start" />}
            {copied ? "Copied pack" : `Copy full pack · ${camera}`}
          </Button>
        </div>
        <div className="grid gap-3 lg:grid-cols-3">
          <CopyDeck title="Hook line" hint="Say this in the first second." body={result.hook_claim} />
          <CopyDeck title="Shot list" hint="Four beats. Kill window is 0–4." body={shotDeck(result.shotlist)} />
          <CopyDeck title={`Paste into ${camera}`} hint="The full director pack." body={result.promptpack} />
        </div>
      </section>

      <SourcesFold rows={result.tavilyRows} />

      <p className="font-mono text-[11px] text-muted-foreground">
        {(elapsedMs / 1000).toFixed(1)}s · {result.grade} · {result.confidence_label}
      </p>
    </article>
  );
}
