import { NextResponse, type NextRequest } from "next/server";
import { GATE_COOKIE, gateToken } from "@/lib/gate";

export async function proxy(request: NextRequest) {
  const password = process.env.SITE_PASSWORD;
  if (!password) {
    if (process.env.VERCEL) {
      return new NextResponse("SITE_PASSWORD is not set", { status: 500 });
    }
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;
  if (pathname === "/gate" || pathname.startsWith("/gate/")) {
    return NextResponse.next();
  }
  if (pathname === "/api/health") {
    return NextResponse.next();
  }

  const expected = await gateToken(password);
  if (request.cookies.get(GATE_COOKIE)?.value === expected) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Password required" }, { status: 401 });
  }

  const gate = new URL("/gate", request.url);
  gate.searchParams.set("next", pathname);
  return NextResponse.redirect(gate);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
