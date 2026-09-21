"use client";

import type { DirectResponse, PathOption, ShotBeat, TavilyRow } from "@/lib/schema";
import { CONFIDENCE_COPY, GRADE_COPY, HOOK_TYPE_COPY, PATH_COPY, PATH_EXECUTE, chipLabel } from "./desk-copy";

const CONFIDENCE_CAP = 0.95;
const GUESS_AT = 0.45;
const SURE_AT = 0.7;

function markLeft(score: number): string {
  return `${(score / CONFIDENCE_CAP) * 100}%`;
}

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
        <div className="relative mt-1 h-4 font-mono text-[10px] text-ink-soft">
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
      className={`grid grid-cols-[1.5rem_4.75rem_1fr] gap-3 border-t border-rule py-3 text-sm leading-snug ${
        killWindow ? "text-ink" : "text-ink-soft"
      }`}
    >
      <span className="font-mono text-[11px] text-stamp">{index + 1}</span>
      <span className="font-mono text-[11px] tabular-nums">
        {beat.start}–{beat.end}s
      </span>
      <span>{beat.action}</span>
    </li>
  );
}

function ConfidenceMeter({
  confidence,
  label,
}: {
  confidence: number;
  label: DirectResponse["confidence_label"];
}) {
  const width = Math.max(2, (confidence / CONFIDENCE_CAP) * 100);
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-stamp">{label}</p>
        <p className="font-mono text-sm tabular-nums">{Math.round(confidence * 100)}%</p>
      </div>
      <div
        className="relative h-2 bg-rule"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={CONFIDENCE_CAP}
        aria-valuenow={Number(confidence.toFixed(2))}
        aria-label={`Confidence ${label}`}
      >
        <div className="absolute inset-y-0 left-0 bg-ink motion-safe:transition-[width] motion-safe:duration-300" style={{ width: `${width}%` }} />
        <span className="absolute top-[-3px] h-3.5 w-px bg-ink-soft" style={{ left: markLeft(GUESS_AT) }} aria-hidden />
        <span className="absolute top-[-3px] h-3.5 w-px bg-ink-soft" style={{ left: markLeft(SURE_AT) }} aria-hidden />
      </div>
      <div className="relative h-4 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
        <span className="absolute left-0">gissning</span>
        <span className="absolute left-[47%] -translate-x-1/2">osäker</span>
        <span className="absolute right-0">dom</span>
      </div>
      <p className="text-sm leading-snug text-ink-soft">{CONFIDENCE_COPY[label]}</p>
    </div>
  );
}

function PathCard({ path, recommended }: { path: PathOption; recommended: boolean }) {
  return (
    <article
      className={`flex flex-col gap-3 border-t border-rule pt-5 ${recommended ? "text-ink" : "text-ink-soft"}`}
    >
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-stamp">
        {recommended ? "Shoot this" : "The other camera"}
      </p>
      <h3 className="font-display text-3xl leading-none tracking-tight">{PATH_COPY[path.id]}</h3>
      <p className="font-mono text-[11px] uppercase tracking-[0.12em]">
        {path.cost} · truth {path.truth}/2
      </p>
      <p className="text-sm leading-relaxed">{path.why}</p>
      <p className="text-sm leading-relaxed">{path.stack.join(" · ")}</p>
    </article>
  );
}

function EvidenceList({ rows }: { rows: TavilyRow[] }) {
  const passA = rows.filter((row) => row.pass === "A");
  const passB = rows.filter((row) => row.pass === "B");
  return (
    <section>
      <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-stamp">Tavily</h2>
      <div className="mt-4 grid gap-8 sm:grid-cols-2">
        <PassColumn label="Pass A · this project" rows={passA} empty="No extract. Private repo, or the URL did not yield a mechanic." />
        <PassColumn label="Pass B · hooks, last 30 days" rows={passB} empty="No recent hook grammar in this category." />
      </div>
    </section>
  );
}

function PassColumn({
  label,
  rows,
  empty,
}: {
  label: string;
  rows: TavilyRow[];
  empty: string;
}) {
  return (
    <div>
      <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-soft">{label}</p>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm leading-relaxed text-ink-soft">{empty}</p>
      ) : (
        <ul className="mt-3 flex flex-col">
          {rows.slice(0, 3).map((row) => (
            <li key={`${row.pass}-${row.url}`} className="border-t border-rule py-3">
              <a
                href={row.url}
                target="_blank"
                rel="noreferrer"
                className="text-sm leading-snug underline decoration-rule underline-offset-4 hover:decoration-stamp"
              >
                {clipQuote(row.title || row.url, 72)}
              </a>
              {row.quote && !isNoiseQuote(row.quote) ? (
                <p className="mt-1 text-sm leading-relaxed text-ink-soft">{clipQuote(row.quote)}</p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function VerdictCard({
  result,
  elapsedMs,
  copied,
  onCopy,
}: {
  result: DirectResponse;
  elapsedMs: number;
  copied: boolean;
  onCopy: () => void;
}) {
  const grade = GRADE_COPY[result.grade];
  const fail = result.grade === "worst" || result.grade === "bad";

  return (
    <article className="flex flex-col gap-12">
      <header className="grid gap-10 border-b border-ink pb-10 lg:grid-cols-[minmax(0,11rem)_minmax(0,1fr)]">
        <div className="flex flex-col gap-3">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-stamp">Seconds 0–4</p>
          <p
            className={`inline-block w-fit border-2 px-3 py-1 font-display text-4xl leading-none tracking-tight ${
              fail ? "border-stamp text-stamp" : "border-ink text-ink"
            }`}
          >
            {grade.stamp}
          </p>
          <p className="text-sm leading-snug text-ink-soft">{grade.meaning}</p>
        </div>
        <ConfidenceMeter confidence={result.confidence} label={result.confidence_label} />
      </header>

      {result.missing.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {result.missing.map((item) => (
            <li
              key={item}
              className="border border-rule px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-soft"
            >
              {chipLabel(item)}
            </li>
          ))}
        </ul>
      ) : null}

      <section>
        <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-stamp">The observable</h2>
        <p className="mt-4 font-display text-[clamp(1.8rem,5vw,3.1rem)] leading-[1.02] tracking-tight">
          {result.worst}
        </p>
      </section>

      <section className="grid gap-0 border-y border-rule sm:grid-cols-2">
        <div className="py-6 sm:pr-8">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-stamp">Do not</h2>
          <p className="mt-3 text-lg leading-snug">{result.avoid}</p>
        </div>
        <div className="border-t border-rule py-6 sm:border-t-0 sm:border-l sm:pl-8">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-stamp">First sentence</h2>
          <p className="mt-3 font-display text-3xl leading-[1.05] tracking-tight">{result.hook_claim}</p>
          <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-soft">
            {HOOK_TYPE_COPY[result.hook_type]}
          </p>
        </div>
      </section>

      <ShotRuler beats={result.shotlist} />

      <section>
        <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-stamp">Two cameras</h2>
        <div className="mt-5 grid gap-10 sm:grid-cols-2">
          {result.paths.map((path) => (
            <PathCard key={path.id} path={path} recommended={path.id === result.recommended_path} />
          ))}
        </div>
        <p className="mt-6 text-sm leading-relaxed text-ink-soft">{result.why_not_the_other}</p>
      </section>

      <EvidenceList rows={result.tavilyRows} />

      <section className="border-t border-ink pt-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-stamp">Execute</h2>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-soft">
              Copy, then paste into {PATH_EXECUTE[result.recommended_path]} yourself. No login from here.
            </p>
          </div>
          <button
            type="button"
            onClick={onCopy}
            className="min-h-11 cursor-pointer border border-ink px-4 py-2.5 text-sm hover:border-stamp hover:text-stamp focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stamp"
          >
            {copied ? "Copied" : `Copy for ${PATH_EXECUTE[result.recommended_path]}`}
          </button>
        </div>
        {result.promptpack ? (
          <pre className="mt-5 whitespace-pre-wrap font-mono text-xs leading-relaxed text-ink-soft">
            {result.promptpack}
          </pre>
        ) : null}
        <p className="mt-4 font-mono text-[11px] text-ink-soft">{(elapsedMs / 1000).toFixed(1)}s · {result.grade} · {result.confidence_label}</p>
      </section>
    </article>
  );
}
