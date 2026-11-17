import { NextResponse, type NextRequest } from "next/server";
import { checkAccess } from "@/lib/access";
import { SESSION_COOKIE, verifySession } from "@/lib/session";

export async function middleware(req: NextRequest) {
  const s = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  const decision = checkAccess(req.nextUrl.pathname, s?.role ?? null);
  if (decision === "login") {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  if (decision === "forbidden") return NextResponse.redirect(new URL("/forbidden", req.url));
  return NextResponse.next();
}

export const config = { matcher: ["/((?!_next|uploads|icons|favicon|manifest|sw.js).*)"] };
