import { BriefDesk } from "@/components/brief-desk";
import stack from "../../stack.json";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-5 py-10 sm:py-14">
      <header className="border-b border-border pb-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-stamp">
          Nemotron · Token Factory · Tavily
        </p>
        <h1 className="mt-2 font-display text-[clamp(2.4rem,7vw,3.8rem)] leading-[0.92] tracking-tight">
          Källan
        </h1>
        <p className="mt-3 max-w-xl text-base leading-snug text-muted-foreground">
          Director for an AI builder’s first 10 seconds. Paste what you have — a cut, or not. Grade and confidence are two numbers.
        </p>
      </header>
      <BriefDesk />
      <footer className="mt-auto border-t border-border pt-6 font-mono text-[11px] leading-relaxed text-muted-foreground">
        <p>
          {stack.runtime.app} · {stack.inference.model} · {stack.tools.web_search} + {stack.tools.web_extract}
        </p>
      </footer>
    </main>
  );
}
