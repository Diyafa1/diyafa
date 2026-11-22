import { describe, expect, it } from "vitest";
import crypto from "node:crypto";
import { POST } from "@/app/api/stripe/webhook/route";

const sign = (payload: string, secret: string, t = Math.floor(Date.now() / 1000)) =>
  `t=${t},v1=${crypto.createHmac("sha256", secret).update(`${t}.${payload}`).digest("hex")}`;

describe("Stripe webhook", () => {
  it("rejects calls that are not signed by Stripe", async () => {
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
    const body = JSON.stringify({ type: "checkout.session.completed", data: { object: { id: "cs_x" } } });
    const bad = await POST(new Request("http://x/api/stripe/webhook", { method: "POST", body, headers: { "stripe-signature": sign(body, "wrong") } }));
    expect(bad.status).toBe(400);
    const old = await POST(new Request("http://x/api/stripe/webhook", { method: "POST", body, headers: { "stripe-signature": sign(body, "whsec_test", 1000) } }));
    expect(old.status).toBe(400);
  });
  it("accepts a correctly signed call", async () => {
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
    const body = JSON.stringify({ type: "checkout.session.completed", data: { object: { id: "cs_unknown" } } });
    const ok = await POST(new Request("http://x/api/stripe/webhook", { method: "POST", body, headers: { "stripe-signature": sign(body, "whsec_test") } }));
    expect(ok.status).toBe(200);
  });
});
