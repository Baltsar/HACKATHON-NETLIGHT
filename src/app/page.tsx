import { BriefDesk } from "@/components/brief-desk";
import stack from "../../stack.json";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-5 py-10 sm:py-16">
      <header className="border-b border-rule pb-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-stamp">
          Nemotron · Token Factory · Tavily
        </p>
        <h1 className="mt-3 font-display text-[clamp(2.6rem,8vw,4.6rem)] leading-[0.92] tracking-tight">
          Källan
        </h1>
        <p className="mt-4 max-w-xl text-lg leading-snug text-ink-soft">
          Paste a URL, repo, or notes. We grade whether second 0–4 loses a jury. Confidence is ours, not the model&apos;s.
        </p>
      </header>
      <BriefDesk />
      <footer className="mt-auto border-t border-rule pt-6 font-mono text-[11px] leading-relaxed text-ink-soft">
        <p>
          {stack.runtime.app} · {stack.inference.model} · {stack.tools.web_search} + {stack.tools.web_extract}
        </p>
        <p className="mt-1">
          GET /api/stack · GET /api/health · GET /api/logs · POST /api/direct · POST /api/agent
        </p>
      </footer>
    </main>
  );
}
