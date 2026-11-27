import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import sharp from "sharp";
import { compressPhoto } from "@/lib/storage";
import { thumbUrl } from "@/lib/photo-url";

describe("photo compression", () => {
  it("shrinks a big phone photo to WebP 1600 px + 640 px thumbnail", async () => {
    const big = await sharp({ create: { width: 4000, height: 3000, channels: 3, noise: { type: "gaussian", mean: 128, sigma: 40 } } }).jpeg({ quality: 95 }).toBuffer();
    const { full, thumb } = await compressPhoto(big);
    const m = await sharp(full).metadata();
    const s = await sharp(thumb).metadata();
    expect(m.format).toBe("webp");
    expect(m.width).toBe(1600);
    expect(s.width).toBe(640);
    expect(full.length).toBeLessThan(big.length / 3);
  });
  it("never enlarges small photos", async () => {
    const small = await sharp({ create: { width: 500, height: 400, channels: 3, background: "#fff" } }).png().toBuffer();
    expect((await sharp((await compressPhoto(small)).full).metadata()).width).toBe(500);
  });
  it("thumbnail URL only for compressed photos", () => {
    expect(thumbUrl("https://x.supabase.co/storage/v1/object/public/photos/7c5551c0-fed2-40c4-9516-f0f22f072e88.webp")).toMatch(/-sm\.webp$/);
    expect(thumbUrl("https://x/photos/7c5551c0-fed2-40c4-9516-f0f22f072e88.jpg")).toMatch(/\.jpg$/);
  });
});
