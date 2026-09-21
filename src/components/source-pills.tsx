"use client";

import { cn } from "@/lib/utils";

export function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function faviconOf(url: string): string {
  try {
    return `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=32`;
  } catch {
    return "";
  }
}

export function SourcePills({
  urls,
  className,
}: {
  urls: string[];
  className?: string;
}) {
  const unique = [...new Set(urls.filter((url) => url.startsWith("http")))];
  const shown = unique.slice(0, 6);
  const extra = unique.length - shown.length;
  if (unique.length === 0) {
    return null;
  }
  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {shown.map((url) => (
        <a
          key={url}
          href={url}
          target="_blank"
          rel="noreferrer"
          title={hostnameOf(url)}
          className="inline-flex size-7 items-center justify-center overflow-hidden rounded-full border border-border bg-card kallan-in"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={faviconOf(url)} alt="" width={16} height={16} className="size-4" />
        </a>
      ))}
      {extra > 0 ? (
        <span className="inline-flex size-7 items-center justify-center rounded-full border border-border bg-muted font-mono text-[10px] text-muted-foreground">
          +{extra}
        </span>
      ) : null}
    </div>
  );
}
