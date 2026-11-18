import { afterEach, describe, expect, it, vi } from "vitest";
import { stripeProvider } from "@/lib/payments";

process.env.STRIPE_SECRET_KEY = "sk_test_dummy";
afterEach(() => vi.unstubAllGlobals());

function mockFetch(responses: Record<string, unknown>) {
  const calls: { url: string; body?: string }[] = [];
  vi.stubGlobal("fetch", async (url: string, init?: RequestInit) => {
    calls.push({ url, body: init?.body as string | undefined });
    const key = Object.keys(responses).find((k) => url.includes(k))!;
    return new Response(JSON.stringify(responses[key]), { status: 200 });
  });
  return calls;
}

describe("Stripe payments", () => {
  it("creates a checkout page in EUR with the exact amount", async () => {
    const calls = mockFetch({ "checkout/sessions": { id: "cs_1", url: "https://checkout.stripe.com/x" } });
    const r = await stripeProvider.createPayment({ paymentId: "p1", amount: 120750, description: "Diyafa DY-1", callbackUrl: "https://d/cb?pid=p1" });
    expect(r).toEqual({ redirectUrl: "https://checkout.stripe.com/x", providerRef: "cs_1" });
    const body = new URLSearchParams(calls[0].body);
    expect(body.get("line_items[0][price_data][currency]")).toBe("eur");
    expect(body.get("line_items[0][price_data][unit_amount]")).toBe("120750");
  });
  it("checks payment status on Stripe's side, not from the URL", async () => {
    mockFetch({ "checkout/sessions/cs_1": { payment_status: "paid", amount_total: 120750 } });
    expect(await stripeProvider.verifyPayment("cs_1")).toEqual({ paid: true, amount: 120750 });
    mockFetch({ "checkout/sessions/cs_2": { payment_status: "unpaid", amount_total: 120750 } });
    expect((await stripeProvider.verifyPayment("cs_2")).paid).toBe(false);
  });
  it("refunds a partial amount on the right payment", async () => {
    const calls = mockFetch({ "checkout/sessions/cs_1": { payment_intent: "pi_9" }, refunds: { id: "re_1" } });
    expect(await stripeProvider.refund("cs_1", 5000)).toEqual({ ok: true });
    const body = new URLSearchParams(calls[1].body);
    expect(body.get("payment_intent")).toBe("pi_9");
    expect(body.get("amount")).toBe("5000");
  });
});

describe("Stripe key check", () => {
  it("refuses a key that is not a secret key", async () => {
    const old = process.env.STRIPE_SECRET_KEY;
    process.env.STRIPE_SECRET_KEY = "mk_123";
    await expect(stripeProvider.createPayment({ paymentId: "p", amount: 100, description: "x", callbackUrl: "u" })).rejects.toThrow(/sk_/);
    process.env.STRIPE_SECRET_KEY = old;
  });
});
