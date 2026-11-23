/**
 * Small relay running in Europe (Edge runtime, Frankfurt), close to Telegram's servers.
 * The main site (Singapore, next to the database) sometimes cannot reach api.telegram.org,
 * so it hands the message to this relay. Protected by CRON_SECRET.
 */
export const runtime = "edge";
export const preferredRegion = ["fra1", "cdg1", "arn1"];

export async function POST(req: Request) {
  const secret = (process.env.CRON_SECRET ?? "").trim();
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return new Response("forbidden", { status: 403 });
  const { method, body } = (await req.json()) as { method: string; body?: unknown };
  if (!/^(sendMessage|getUpdates)$/.test(method)) return new Response("bad method", { status: 400 });
  const raw = process.env.TELEGRAM_BOT_TOKEN ?? "";
  const token = (raw.match(/\d{6,}:[A-Za-z0-9_-]{30,}/)?.[0] ?? raw).trim();
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: body ? "POST" : "GET",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  return new Response(await res.text(), { status: res.status, headers: { "Content-Type": "application/json" } });
}
