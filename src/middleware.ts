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

  // Language: ?lang=fr|en|ar (links from Google and the language versions) wins; otherwise, first visit: pick it automatically.
  const forced = req.nextUrl.searchParams.get("lang");
  const forcedLocale = forced === "fr" || forced === "en" || forced === "ar" ? forced : null;
  const current = req.cookies.get("locale")?.value;
  if (forcedLocale ? forcedLocale !== current : !current) {
    const locale = forcedLocale ?? detectLocale(req.headers.get("x-vercel-ip-country"), req.headers.get("accept-language"));
    res.cookies.set("locale", locale, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
    if (decision === "allow") {
      // apply it to this very page too
      const headers = new Headers(req.headers);
      const others = (req.headers.get("cookie") ?? "").split(/;\s*/).filter((c) => c && !c.startsWith("locale="));
      headers.set("cookie", [...others, `locale=${locale}`].join("; "));
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

export const config = { matcher: ["/((?!_next|uploads|icons|seed|media|favicon|manifest|sw.js|offline.html|icon.png|robots.txt|sitemap.xml|.well-known).*)"] };
