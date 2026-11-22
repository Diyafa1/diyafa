import "server-only";

/** "Sign in with Google" (OAuth 2.0 / OpenID Connect). Enabled when GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set. */
export const googleEnabled = () => !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
export const GOOGLE_STATE_COOKIE = "diyafa_google_state";
export const googleRedirectUri = () => `${process.env.APP_URL || "http://localhost:3000"}/api/auth/google/callback`;

export function googleAuthUrl(state: string) {
  const u = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  u.searchParams.set("client_id", process.env.GOOGLE_CLIENT_ID!);
  u.searchParams.set("redirect_uri", googleRedirectUri());
  u.searchParams.set("response_type", "code");
  u.searchParams.set("scope", "openid email profile");
  u.searchParams.set("state", state);
  u.searchParams.set("prompt", "select_account");
  return u.toString();
}

export type GoogleProfile = { email: string; name: string };

/** Exchanges the code with Google (server to server) and returns the verified e-mail and name. */
export async function googleProfileFromCode(code: string): Promise<GoogleProfile | null> {
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: googleRedirectUri(),
      grant_type: "authorization_code",
    }),
  });
  if (!tokenRes.ok) return null;
  const token = await tokenRes.json();
  const infoRes = await fetch("https://openidconnect.googleapis.com/v1/userinfo", { headers: { Authorization: `Bearer ${token.access_token}` } });
  if (!infoRes.ok) return null;
  const info = await infoRes.json();
  if (!info.email || info.email_verified !== true) return null;
  return { email: String(info.email).toLowerCase(), name: String(info.name || info.email.split("@")[0]).slice(0, 100) };
}
