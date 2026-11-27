import { NextResponse } from "next/server";

/**
 * Android app (Trusted Web Activity): proves the Play Store app and this website belong together,
 * so the app opens full screen without a browser bar. Set ANDROID_PACKAGE and ANDROID_SHA256
 * (the signing key fingerprint shown in Google Play Console → App integrity) in Vercel.
 */
// Public fingerprint of the key that signs the test APK (not a secret). Play Store keys are added with ANDROID_SHA256.
const TEST_APK_SHA256 = "DC:4B:2D:F3:BD:BC:2B:2A:67:57:ED:82:41:C5:B5:CF:B5:33:AB:50:00:95:F6:D5:21:AC:92:32:E8:DF:00:5E";

export function GET() {
  const pkg = process.env.ANDROID_PACKAGE?.trim() || "com.aldiyafa.app";
  const fingerprints = [TEST_APK_SHA256, ...(process.env.ANDROID_SHA256 ?? "").split(",").map((s) => s.trim()).filter(Boolean)];
  const body = pkg && fingerprints.length
    ? [{ relation: ["delegate_permission/common.handle_all_urls"], target: { namespace: "android_app", package_name: pkg, sha256_cert_fingerprints: fingerprints } }]
    : [];
  return NextResponse.json(body, { headers: { "Cache-Control": "public, max-age=3600" } });
}
