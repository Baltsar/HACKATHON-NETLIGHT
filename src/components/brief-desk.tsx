"use client";

import { useState, type FormEvent } from "react";
import type { ArtifactKind, Audience, DirectResponse, WillAppear } from "@/lib/schema";

const KINDS: ArtifactKind[] = ["url", "repo", "notes", "deck_text", "video_url", "transcript"];
const AUDIENCES: Audience[] = [
  "hackathon_jury",
  "yc_application",
  "yc_demo_day",
  "vc",
  "product_hunt",
  "social",
  "promo_feed",
];

type DeskState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; result: DirectResponse; elapsedMs: number }
  | { status: "error"; message: string };

function isDirectResponse(value: unknown): value is DirectResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "grade" in value &&
    "confidence" in value &&
    "tavilyRows" in value
  );
}

export function BriefDesk() {
  const [kind, setKind] = useState<ArtifactKind>("url");
  const [value, setValue] = useState("https://github.com/Baltsar/HACKATHON-NETLIGHT");
  const [audience, setAudience] = useState<Audience>("hackathon_jury");
  const [oneLiner, setOneLiner] = useState("");
  const [hideFace, setHideFace] = useState(true);
  const [copied, setCopied] = useState(false);
  const [state, setState] = useState<DeskState>({ status: "idle" });

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setCopied(false);
    setState({ status: "loading" });
    const startedAt = performance.now();
    const will_appear: WillAppear = hideFace ? "none" : "face";
    try {
      const res = await fetch("/api/direct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          artifact: { kind, value },
          audience,
          one_liner: oneLiner.trim() || undefined,
          will_appear,
        }),
      });
      const data: unknown = await res.json();
      if (!res.ok || !isDirectResponse(data)) {
        const message =
          typeof data === "object" && data !== null && "error" in data && typeof data.error === "string"
            ? data.error
            : "Director returned no verdict";
        setState({ status: "error", message });
        return;
      }
      setState({ status: "done", result: data, elapsedMs: performance.now() - startedAt });
    } catch (error: unknown) {
      setState({
        status: "error",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async function copyPromptpack(text: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Clipboard can fail when the tab is not focused (automation, some browsers).
    }
    setCopied(true);
  }

  return (
    <section className="flex flex-col gap-10 pt-8">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-soft">
            Artifact
            <select
              value={kind}
              onChange={(event) => setKind(event.target.value as ArtifactKind)}
              className="border border-rule bg-transparent px-2 py-2 font-serif text-base text-ink"
            >
              {KINDS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-soft">
            Audience
            <select
              value={audience}
              onChange={(event) => setAudience(event.target.value as Audience)}
              className="border border-rule bg-transparent px-2 py-2 font-serif text-base text-ink"
            >
              {AUDIENCES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="flex flex-col gap-1 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-soft">
          Paste
          <textarea
            value={value}
            onChange={(event) => setValue(event.target.value)}
            rows={3}
            className="w-full resize-none border-0 border-b border-rule bg-transparent pb-3 font-serif text-xl leading-snug text-ink outline-none focus:border-stamp"
          />
        </label>
        <label className="flex flex-col gap-1 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-soft">
          One-liner (optional)
          <input
            value={oneLiner}
            onChange={(event) => setOneLiner(event.target.value)}
            className="border-0 border-b border-rule bg-transparent pb-2 font-serif text-base text-ink outline-none focus:border-stamp"
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-ink">
          <input type="checkbox" checked={hideFace} onChange={(event) => setHideFace(event.target.checked)} />
          I will not appear on camera
        </label>
        <button
          type="submit"
          disabled={state.status === "loading" || value.trim().length === 0}
          className="mt-1 self-start bg-ink px-5 py-2.5 text-sm font-medium tracking-wide text-paper disabled:opacity-40"
        >
          {state.status === "loading" ? "Directing…" : "Grade the first 10s"}
        </button>
      </form>

      {state.status === "loading" && (
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-stamp">
          Extract → hook search → Super classify → confidence overwrite
        </p>
      )}

      {state.status === "error" && (
        <p className="border border-stamp bg-stamp-wash px-4 py-3 text-sm leading-relaxed text-stamp">{state.message}</p>
      )}

      {state.status === "done" && (
        <article className="flex flex-col gap-8">
          <header className="border-b border-rule pb-6">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-stamp">
              {state.result.grade} · {Math.round(state.result.confidence * 100)}% {state.result.confidence_label} ·{" "}
              {(state.elapsedMs / 1000).toFixed(1)}s
            </p>
            <p className="mt-3 font-display text-4xl leading-none tracking-tight">{state.result.worst}</p>
            <p className="mt-3 text-lg text-ink-soft">{state.result.avoid}</p>
            <p className="mt-4 font-mono text-sm">hook: {state.result.hook_claim}</p>
          </header>

          {state.result.tavilyRows.length > 0 && (
            <section>
              <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-stamp">Tavily</h2>
              <ul className="mt-3 flex flex-col gap-2 text-sm">
                {state.result.tavilyRows.map((row) => (
                  <li key={`${row.pass}-${row.url}`}>
                    <span className="font-mono text-[11px] text-ink-soft">{row.pass}</span>{" "}
                    <a href={row.url} target="_blank" rel="noreferrer" className="underline decoration-rule underline-offset-4">
                      {row.title || row.url}
                    </a>
                    <p className="text-ink-soft">{row.quote}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {state.result.missing.length > 0 && (
            <p className="font-mono text-xs text-ink-soft">missing: {state.result.missing.join(" · ")}</p>
          )}

          <section>
            <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-stamp">Four beats</h2>
            <ol className="mt-3 flex flex-col gap-2 text-sm">
              {state.result.shotlist.map((beat) => (
                <li key={`${beat.start}-${beat.end}`}>
                  {beat.start}–{beat.end}s · {beat.action}
                </li>
              ))}
            </ol>
          </section>

          <section>
            <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-stamp">Two paths</h2>
            <ul className="mt-3 flex flex-col gap-3 text-sm">
              {state.result.paths.map((path) => (
                <li key={path.id} className={path.id === state.result.recommended_path ? "font-medium" : "text-ink-soft"}>
                  {path.id === state.result.recommended_path ? "recommend" : "other"}: {path.id} · {path.cost} · truth {path.truth} ·{" "}
                  {path.why}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-sm text-ink-soft">{state.result.why_not_the_other}</p>
          </section>

          <section className="border-t border-rule pt-6">
            <button
              type="button"
              onClick={() => copyPromptpack(state.result.promptpack)}
              className="border border-rule px-3 py-2 text-sm hover:border-stamp"
            >
              {copied ? "Copied promptpack" : "Copy promptpack"}
            </button>
            {state.result.promptpack ? (
              <pre className="mt-3 whitespace-pre-wrap font-mono text-xs leading-relaxed text-ink-soft">
                {state.result.promptpack}
              </pre>
            ) : null}
          </section>
        </article>
      )}
    </section>
  );
}
