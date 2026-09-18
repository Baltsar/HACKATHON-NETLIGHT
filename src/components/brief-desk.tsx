"use client";

import { useState, type FormEvent } from "react";
import type { AgentResult } from "@/lib/agent";

const EXAMPLES: string[] = [
  "Vilka Nemotron-modeller kör Nebius Token Factory just nu, och vad kostar Super?",
  "Vad får man för krediter på Builders & Brews Stockholm / Nebius-hackathonet?",
  "Vad säger EU AI Act kort om öppna modeller för en svensk builder 2026?",
];

type DeskState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; result: AgentResult; elapsedMs: number }
  | { status: "error"; message: string };

export function BriefDesk() {
  const [question, setQuestion] = useState<string>(EXAMPLES[0]);
  const [state, setState] = useState<DeskState>({ status: "idle" });

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setState({ status: "loading" });
    const startedAt: number = performance.now();
    try {
      const res: Response = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const data: AgentResult | { error: string } = await res.json();
      if ("error" in data) {
        setState({ status: "error", message: data.error });
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

  return (
    <section className="flex flex-col gap-10 pt-8">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label htmlFor="question" className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-soft">
          Fråga
        </label>
        <textarea
          id="question"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          rows={3}
          className="w-full resize-none border-0 border-b border-rule bg-transparent pb-3 text-xl leading-snug outline-none focus:border-stamp"
        />
        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => setQuestion(example)}
              className="border border-rule px-2.5 py-1 text-left text-xs text-ink-soft hover:border-stamp hover:text-stamp"
            >
              {example}
            </button>
          ))}
        </div>
        <button
          type="submit"
          disabled={state.status === "loading" || question.trim().length === 0}
          className="mt-2 self-start bg-ink px-5 py-2.5 text-sm font-medium tracking-wide text-paper disabled:opacity-40"
        >
          {state.status === "loading" ? "Läser källor…" : "Skriv brief"}
        </button>
      </form>

      {state.status === "loading" && (
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-stamp">
          Söker → extraherar sidor → skriver brief
        </p>
      )}

      {state.status === "error" && (
        <p className="border border-stamp bg-stamp-wash px-4 py-3 text-sm leading-relaxed text-stamp">
          {state.message}
        </p>
      )}

      {state.status === "done" && (
        <article className="flex flex-col gap-8">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-soft">
            {state.result.model} · {state.result.steps.length} verktyg ·{" "}
            {state.result.usage?.total_tokens ?? 0} tokens · {(state.elapsedMs / 1000).toFixed(1)}s
          </p>
          {state.result.steps.length > 0 && (
            <ol className="flex flex-col gap-1 font-mono text-xs text-ink-soft">
              {state.result.steps.map((step, index) => (
                <li key={`${step.tool}-${index}`}>
                  {step.tool}: {step.input} → {step.resultCount}
                </li>
              ))}
            </ol>
          )}
          <div className="whitespace-pre-wrap text-[1.05rem] leading-[1.7]">{state.result.answer}</div>
          {state.result.sources.length > 0 && (
            <footer className="border-t border-rule pt-6">
              <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-stamp">Källor</h2>
              <ol className="mt-3 flex list-decimal flex-col gap-2 pl-5 text-sm leading-snug">
                {state.result.sources.map((source) => (
                  <li key={source.url}>
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noreferrer"
                      className="underline decoration-rule underline-offset-4 hover:decoration-stamp"
                    >
                      {source.title}
                    </a>
                  </li>
                ))}
              </ol>
            </footer>
          )}
        </article>
      )}
    </section>
  );
}
