"use client";

import { useState, type FormEvent } from "react";
import type { DirectEvent } from "@/lib/direct-events";
import type { ArtifactKind, Audience, DirectResponse, TavilyRow, WillAppear } from "@/lib/schema";
import { AUDIENCE_COPY, KIND_COPY } from "./desk-copy";
import { LookingAt } from "./looking-at";
import { VerdictCard } from "./verdict-card";

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
  | {
      status: "loading";
      step: string;
      query?: string;
      rows: TavilyRow[];
      chips: string[];
    }
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

function isDirectEvent(value: unknown): value is DirectEvent {
  return typeof value === "object" && value !== null && "type" in value && typeof value.type === "string";
}

async function readNdjson(response: Response, onEvent: (event: DirectEvent) => void): Promise<void> {
  if (!response.body) {
    throw new Error("Director returned no stream");
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        continue;
      }
      try {
        const parsed: unknown = JSON.parse(trimmed);
        if (isDirectEvent(parsed)) {
          onEvent(parsed);
        }
      } catch {
        // Partial or non-JSON line. Wait for the next chunk.
      }
    }
  }
}

export function BriefDesk() {
  const [kind, setKind] = useState<ArtifactKind>("url");
  const [value, setValue] = useState("https://docs.tavily.com");
  const [audience, setAudience] = useState<Audience>("hackathon_jury");
  const [oneLiner, setOneLiner] = useState("");
  const [hideFace, setHideFace] = useState(true);
  const [copied, setCopied] = useState(false);
  const [state, setState] = useState<DeskState>({ status: "idle" });

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setCopied(false);
    setState({ status: "loading", step: "extract", rows: [], chips: [] });
    const startedAt = performance.now();
    const will_appear: WillAppear = hideFace ? "none" : "face";
    try {
      const res = await fetch("/api/direct", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/x-ndjson",
        },
        body: JSON.stringify({
          artifact: { kind, value },
          audience,
          one_liner: oneLiner.trim() || undefined,
          will_appear,
        }),
      });
      const contentType = res.headers.get("content-type") ?? "";
      if (contentType.includes("ndjson") && res.body) {
        let verdict: DirectResponse | null = null;
        let errorMessage: string | null = null;
        await readNdjson(res, (directEvent) => {
          if (directEvent.type === "error") {
            errorMessage = directEvent.message;
            return;
          }
          if (directEvent.type === "verdict") {
            verdict = directEvent.result;
            return;
          }
          setState((current) => {
            if (current.status !== "loading") {
              return current;
            }
            if (directEvent.type === "status") {
              return { ...current, step: directEvent.step };
            }
            if (directEvent.type === "query") {
              return { ...current, query: directEvent.query };
            }
            if (directEvent.type === "hints") {
              return { ...current, chips: directEvent.chips };
            }
            if (directEvent.type === "tavily") {
              if (current.rows.some((row) => row.url === directEvent.row.url && row.pass === directEvent.row.pass)) {
                return current;
              }
              return { ...current, rows: [...current.rows, directEvent.row] };
            }
            return current;
          });
        });
        if (errorMessage) {
          setState({ status: "error", message: errorMessage });
          return;
        }
        if (!verdict) {
          setState({ status: "error", message: "Director returned no verdict" });
          return;
        }
        setState({ status: "done", result: verdict, elapsedMs: performance.now() - startedAt });
        return;
      }

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
    setCopied(true);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Clipboard can fail when the tab is not focused. The promptpack is still on screen.
    }
  }

  const showRepoHint = kind === "repo" || (kind === "url" && /github\.com/i.test(value));

  return (
    <section className="flex flex-col gap-12 pt-8">
      {state.status === "done" && (
        <VerdictCard
          result={state.result}
          elapsedMs={state.elapsedMs}
          copied={copied}
          onCopy={() => void copyPromptpack(state.result.promptpack)}
        />
      )}

      {state.status === "loading" && (
        <LookingAt step={state.step} query={state.query} rows={state.rows} chips={state.chips} />
      )}

      {state.status === "error" && (
        <p className="border border-stamp bg-stamp-wash px-4 py-3 text-sm leading-relaxed text-stamp">{state.message}</p>
      )}

      <form onSubmit={handleSubmit} className="flex max-w-3xl flex-col gap-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-soft">
            Artifact
            <select
              value={kind}
              onChange={(event) => setKind(event.target.value as ArtifactKind)}
              className="min-h-11 cursor-pointer border border-rule bg-transparent px-2 py-2 font-serif text-base text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stamp"
            >
              {KINDS.map((item) => (
                <option key={item} value={item}>
                  {KIND_COPY[item]}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-soft">
            Audience
            <select
              value={audience}
              onChange={(event) => setAudience(event.target.value as Audience)}
              className="min-h-11 cursor-pointer border border-rule bg-transparent px-2 py-2 font-serif text-base text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stamp"
            >
              {AUDIENCES.map((item) => (
                <option key={item} value={item}>
                  {AUDIENCE_COPY[item]}
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
            placeholder="URL, repo, or the words you were going to say"
            className="w-full resize-none border-0 border-b border-rule bg-transparent pb-3 font-serif text-xl leading-snug text-ink outline-none placeholder:text-rule focus:border-stamp"
          />
        </label>
        {showRepoHint ? (
          <p className="font-mono text-[11px] leading-relaxed text-ink-soft">
            Private GitHub 404s on extract. Make the repo public, or paste the README as notes.
          </p>
        ) : null}
        <label className="flex flex-col gap-1 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-soft">
          One-liner (optional)
          <input
            value={oneLiner}
            onChange={(event) => setOneLiner(event.target.value)}
            placeholder="The outcome in one sentence"
            className="min-h-11 border-0 border-b border-rule bg-transparent pb-2 font-serif text-base text-ink outline-none placeholder:text-rule focus:border-stamp"
          />
        </label>
        <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-ink">
          <input
            type="checkbox"
            checked={hideFace}
            onChange={(event) => setHideFace(event.target.checked)}
            className="size-4 accent-stamp"
          />
          I will not appear on camera
        </label>
        <button
          type="submit"
          disabled={state.status === "loading" || value.trim().length === 0}
          className="mt-1 min-h-11 cursor-pointer self-start bg-ink px-5 py-2.5 text-sm font-medium tracking-wide text-paper disabled:cursor-not-allowed disabled:opacity-40"
        >
          {state.status === "loading" ? "Directing…" : state.status === "done" ? "Grade again" : "Grade the first 10s"}
        </button>
      </form>
    </section>
  );
}
