import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { GATE_COOKIE, gateToken } from "@/lib/gate";

async function enter(formData: FormData): Promise<void> {
  "use server";
  const password = process.env.SITE_PASSWORD;
  const submitted = String(formData.get("password") ?? "");
  const nextPath = String(formData.get("next") ?? "/");
  const safeNext = nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/";
  if (!password || submitted !== password) {
    redirect(`/gate?e=1&next=${encodeURIComponent(safeNext)}`);
  }
  const store = await cookies();
  store.set(GATE_COOKIE, await gateToken(password), {
    httpOnly: true,
    secure: process.env.VERCEL === "1",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
  redirect(safeNext);
}

export default async function GatePage({
  searchParams,
}: {
  searchParams: Promise<{ e?: string; next?: string }>;
}) {
  const params = await searchParams;
  const nextPath = params.next && params.next.startsWith("/") ? params.next : "/";
  const failed = params.e === "1";

  return (
    <main className="mx-auto flex min-h-full w-full max-w-lg flex-1 flex-col justify-center px-5 py-16">
      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-stamp">Källan · gated</p>
      <h1 className="mt-3 font-display text-5xl leading-none tracking-tight">Password</h1>
      <p className="mt-4 text-lg leading-snug text-ink-soft">
        Demo is closed so Token Factory and Tavily credits stay ours. Jury get the password, not the open internet.
      </p>
      <form action={enter} className="mt-10 flex flex-col gap-5">
        <input type="hidden" name="next" value={nextPath} />
        <label className="flex flex-col gap-1 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-soft">
          Password
          <input
            type="password"
            name="password"
            autoFocus
            required
            className="min-h-11 border-0 border-b border-rule bg-transparent pb-2 font-serif text-xl text-ink outline-none focus:border-stamp"
          />
        </label>
        {failed ? <p className="text-sm text-stamp">Wrong password.</p> : null}
        <button
          type="submit"
          className="mt-2 min-h-11 cursor-pointer self-start bg-ink px-5 py-2.5 text-sm font-medium tracking-wide text-paper"
        >
          Enter
        </button>
      </form>
    </main>
  );
}
