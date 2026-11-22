import { NextResponse, type NextRequest } from "next/server";
import { checkAccess } from "@/lib/access";
import { SESSION_COOKIE, verifySession } from "@/lib/session";
import { detectLocale } from "@/lib/locale-detect";

const REF_COOKIE = "diyafa_ref";

export async function middleware(req: NextRequest) {
  const s = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  const decision = checkAccess(req.nextUrl.pathname, s?.role ?? null);
  let res: NextResponse;
  if (decision === "login") {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", req.nextUrl.pathname);
    res = NextResponse.redirect(url);
  } else if (decision === "forbidden") {
    res = NextResponse.redirect(new URL("/forbidden", req.url));
  } else {
    res = NextResponse.next();
  }

  // First visit: pick the language automatically (the visitor can still change it).
  if (!req.cookies.get("locale")) {
    const locale = detectLocale(req.headers.get("x-vercel-ip-country"), req.headers.get("accept-language"));
    res.cookies.set("locale", locale, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
    if (decision === "allow") {
      // apply it to this very first page too
      const headers = new Headers(req.headers);
      headers.set("cookie", `${req.headers.get("cookie") ?? ""}; locale=${locale}`.replace(/^; /, ""));
      const forwarded = NextResponse.next({ request: { headers } });
      res.cookies.getAll().forEach((c) => forwarded.cookies.set(c));
      res = forwarded;
    }
  }

  // Referral link (?ref=CODE): remember it for 30 days so the sign-up can credit the friend.
  const ref = req.nextUrl.searchParams.get("ref");
  if (ref && /^[A-Z0-9]{4,12}$/i.test(ref)) res.cookies.set(REF_COOKIE, ref.toUpperCase(), { path: "/", maxAge: 60 * 60 * 24 * 30, sameSite: "lax" });
  return res;
}

export const config = { matcher: ["/((?!_next|uploads|icons|seed|media|favicon|manifest|sw.js|offline.html|icon.png).*)"] };
