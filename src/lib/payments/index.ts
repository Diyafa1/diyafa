import "server-only";

/**
 * Payment gateway abstraction. Today: "test". Tomorrow: Moyasar (Mada, Apple Pay, cards).
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

// Moyasar: https://docs.moyasar.com — activated by PAYMENT_PROVIDER=moyasar once the merchant account is approved.
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

export function getPaymentProvider(): PaymentProvider {
  return process.env.PAYMENT_PROVIDER === "moyasar" ? moyasarProvider : testProvider;
}
