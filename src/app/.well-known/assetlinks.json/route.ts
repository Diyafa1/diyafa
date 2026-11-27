import { NextResponse } from "next/server";

/**
 * Android app (Trusted Web Activity): proves the Play Store app and this website belong together,
 * so the app opens full screen without a browser bar. Set ANDROID_PACKAGE and ANDROID_SHA256
 * (the signing key fingerprint shown in Google Play Console → App integrity) in Vercel.
 */
export function GET() {
  const pkg = process.env.ANDROID_PACKAGE?.trim();
  const fingerprints = (process.env.ANDROID_SHA256 ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const body = pkg && fingerprints.length
    ? [{ relation: ["delegate_permission/common.handle_all_urls"], target: { namespace: "android_app", package_name: pkg, sha256_cert_fingerprints: fingerprints } }]
    : [];
  return NextResponse.json(body, { headers: { "Cache-Control": "public, max-age=3600" } });
}
