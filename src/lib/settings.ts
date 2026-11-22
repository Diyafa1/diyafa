import type { ListingType } from "@prisma/client";
import { db } from "./db";
import { DEFAULT_RATES, type Rates } from "./pricing";

export async function getRates(type: ListingType): Promise<Rates> {
  const s = await db.commissionSetting.findUnique({ where: { listingType: type } });
  return s ? { hostPercent: s.hostPercent, guestFeePercent: s.guestFeePercent, vatPercent: s.vatPercent } : DEFAULT_RATES[type];
}

export async function getAllRates(): Promise<Record<ListingType, Rates>> {
  const rows = await db.commissionSetting.findMany();
  const out = { ...DEFAULT_RATES };
  for (const r of rows) out[r.listingType] = { hostPercent: r.hostPercent, guestFeePercent: r.guestFeePercent, vatPercent: r.vatPercent };
  return out;
}

/** Owner-editable numbers (automation thresholds). */
export const SETTING_DEFAULTS = { autoSuspendHostCancellations: 3, requestAutoDeclineHours: 24 } as const;
export type SettingKey = keyof typeof SETTING_DEFAULTS;

export async function getNumberSetting(key: SettingKey): Promise<number> {
  const s = await db.appSetting.findUnique({ where: { key } });
  const n = s ? Number(s.value) : NaN;
  return Number.isFinite(n) ? n : SETTING_DEFAULTS[key];
}
export async function setNumberSetting(key: SettingKey, value: number) {
  await db.appSetting.upsert({ where: { key }, create: { key, value: String(value) }, update: { value: String(value) } });
}
