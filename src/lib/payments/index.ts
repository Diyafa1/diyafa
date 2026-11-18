import "server-only";
import { CURRENCY } from "../money";

/**
 * Payment gateway abstraction: "test" (fake page), "stripe" (Stripe Checkout: cards, Apple Pay, Google Pay)
 * or "moyasar" (Saudi gateway: Mada, Apple Pay, cards — needs a Saudi company).
 * Diyafa collects the full amount; the host's share is recorded on each booking (hostPayout)
 * and paid out from the admin "Payouts" page.
 */
export type CreateResult = { redirectUrl: string; providerRef: string };
export type VerifyResult = { paid: boolean; amount: number };

export interface PaymentProvider {
  name: string;
  createPayment(o: { paymentId: string; amount: number; description: string; callbackUrl: string }): Promise<CreateResult>;
  verifyPayment(providerRef: string): Promise<VerifyResult>;
  refund(providerRef: string, amount: number): Promise<{ ok: boolean }>;
}

const testProvider: PaymentProvider = {
  name: "test",
  async createPayment(o) {
    return { redirectUrl: `/pay/test/${o.paymentId}`, providerRef: `test_${o.paymentId}` };
  },
  async verifyPayment() {
    // the test page confirms explicitly; see app/pay/test
    return { paid: true, amount: 0 };
  },
  async refund() {
    return { ok: true };
  },
};

// Moyasar (Saudi gateway, SAR only — would require switching CURRENCY to SAR): https://docs.moyasar.com — activated by PAYMENT_PROVIDER=moyasar once the merchant account is approved.
const moyasarProvider: PaymentProvider = {
  name: "moyasar",
  async createPayment(o) {
    // Moyasar invoices give a hosted page supporting Mada, Visa/Mastercard and Apple Pay.
    const res = await fetch("https://api.moyasar.com/v1/invoices", {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(`${process.env.MOYASAR_SECRET_KEY}:`).toString("base64"),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: o.amount,
        currency: "SAR",
        description: o.description,
        callback_url: o.callbackUrl,
        success_url: o.callbackUrl,
        metadata: { payment_id: o.paymentId },
      }),
    });
    if (!res.ok) throw new Error("moyasar create failed");
    const inv = await res.json();
    return { redirectUrl: inv.url, providerRef: inv.id };
  },
  async verifyPayment(ref) {
    const res = await fetch(`https://api.moyasar.com/v1/invoices/${ref}`, {
      headers: { Authorization: "Basic " + Buffer.from(`${process.env.MOYASAR_SECRET_KEY}:`).toString("base64") },
    });
    if (!res.ok) return { paid: false, amount: 0 };
    const inv = await res.json();
    return { paid: inv.status === "paid", amount: inv.amount };
  },
  async refund(ref, amount) {
    // Refunds apply to the payment attached to the invoice.
    const inv = await (
      await fetch(`https://api.moyasar.com/v1/invoices/${ref}`, {
        headers: { Authorization: "Basic " + Buffer.from(`${process.env.MOYASAR_SECRET_KEY}:`).toString("base64") },
      })
    ).json();
    const paymentId = inv.payments?.find((p: { status: string }) => p.status === "paid")?.id;
    if (!paymentId) return { ok: false };
    const res = await fetch(`https://api.moyasar.com/v1/payments/${paymentId}/refund`, {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(`${process.env.MOYASAR_SECRET_KEY}:`).toString("base64"),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ amount }),
    });
    return { ok: res.ok };
  },
};

// Stripe Checkout (hosted payment page). Amounts are in cents (smallest currency unit), as Stripe expects.
const stripeApi = async (path: string, body?: Record<string, string>) => {
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: body ? "POST" : "GET",
    headers: {
      Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      ...(body ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
    },
    body: body ? new URLSearchParams(body).toString() : undefined,
  });
  const json = await res.json().catch(() => ({}));
  return { ok: res.ok, json };
};

export const stripeProvider: PaymentProvider = {
  name: "stripe",
  async createPayment(o) {
    if (!process.env.STRIPE_SECRET_KEY?.startsWith("sk_")) throw new Error("STRIPE_SECRET_KEY missing or not a secret key (must start with sk_)");
    const { ok, json } = await stripeApi("checkout/sessions", {
      mode: "payment",
      "line_items[0][quantity]": "1",
      "line_items[0][price_data][currency]": CURRENCY.toLowerCase(),
      "line_items[0][price_data][unit_amount]": String(o.amount),
      "line_items[0][price_data][product_data][name]": o.description,
      success_url: o.callbackUrl,
      cancel_url: o.callbackUrl,
      client_reference_id: o.paymentId,
      "metadata[payment_id]": o.paymentId,
      expires_at: String(Math.floor(Date.now() / 1000) + 31 * 60),
    });
    if (!ok) throw new Error("stripe create failed: " + (json?.error?.message ?? ""));
    return { redirectUrl: json.url, providerRef: json.id };
  },
  async verifyPayment(ref) {
    const { ok, json } = await stripeApi(`checkout/sessions/${encodeURIComponent(ref)}`);
    if (!ok) return { paid: false, amount: 0 };
    return { paid: json.payment_status === "paid", amount: json.amount_total ?? 0 };
  },
  async refund(ref, amount) {
    const s = await stripeApi(`checkout/sessions/${encodeURIComponent(ref)}`);
    const pi = s.json?.payment_intent;
    if (!s.ok || !pi) return { ok: false };
    const r = await stripeApi("refunds", { payment_intent: String(pi), amount: String(amount) });
    return { ok: r.ok };
  },
};

export function getPaymentProvider(): PaymentProvider {
  const p = process.env.PAYMENT_PROVIDER;
  return p === "stripe" ? stripeProvider : p === "moyasar" ? moyasarProvider : testProvider;
}
