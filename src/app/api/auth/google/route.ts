import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { GOOGLE_STATE_COOKIE, googleAuthUrl, googleEnabled } from "@/lib/google";
import { safeNext } from "@/lib/forms";

/** Step 1: send the visitor to Google's account chooser. */
export async function GET(req: Request) {
  if (!googleEnabled()) return NextResponse.redirect(new URL("/login", req.url));
  const url = new URL(req.url);
  const state = crypto.randomBytes(16).toString("hex");
  const payload = JSON.stringify({ state, next: safeNext(url.searchParams.get("next"), ""), intent: url.searchParams.get("intent") === "host" ? "host" : "guest" });
  const res = NextResponse.redirect(googleAuthUrl(state));
  res.cookies.set(GOOGLE_STATE_COOKIE, payload, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 600 });
  return res;
}
