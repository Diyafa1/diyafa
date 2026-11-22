import { describe, expect, it } from "vitest";
import { detectLocale } from "@/lib/locale-detect";

describe("automatic language on first visit", () => {
  it("France and Belgium get French", () => {
    expect(detectLocale("FR", "en-US,en")).toBe("fr");
    expect(detectLocale("BE", "nl-BE,nl")).toBe("fr");
  });
  it("Saudi Arabia gets Arabic", () => expect(detectLocale("SA", "en")).toBe("ar"));
  it("otherwise follows the browser, else English", () => {
    expect(detectLocale("DE", "fr-FR,fr;q=0.9")).toBe("fr");
    expect(detectLocale("GB", "en-GB")).toBe("en");
    expect(detectLocale(null, "de-DE")).toBe("en");
  });
});
