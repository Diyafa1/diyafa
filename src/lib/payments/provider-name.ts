/** "test" | "stripe" | "moyasar", from PAYMENT_PROVIDER (spaces and capitals ignored). */
export function paymentProviderName(): "test" | "stripe" | "moyasar" {
  const p = (process.env.PAYMENT_PROVIDER ?? "test").trim().toLowerCase();
  return p === "stripe" || p === "moyasar" ? p : "test";
}
