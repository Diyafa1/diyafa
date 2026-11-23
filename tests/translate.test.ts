import { describe, expect, it } from "vitest";
import { localizedTexts } from "@/lib/translate";

const listing = {
  title: "شقة قرب الحرم", description: "شقة جميلة", rules: null, sourceLang: "ar",
  translations: { fr: { title: "Appartement près du Haram", description: "Bel appartement", rules: null }, en: { title: "Flat near the Haram", description: "Nice flat", rules: null }, ar: { title: "شقة قرب الحرم", description: "شقة جميلة", rules: null } },
};

describe("listing translations", () => {
  it("shows the visitor's language when a translation exists", () => {
    expect(localizedTexts(listing, "fr")).toMatchObject({ title: "Appartement près du Haram", translated: true });
    expect(localizedTexts(listing, "en").title).toBe("Flat near the Haram");
  });
  it("shows the original to visitors of the same language, or on request", () => {
    expect(localizedTexts(listing, "ar")).toMatchObject({ title: "شقة قرب الحرم", translated: false });
    expect(localizedTexts(listing, "fr", true)).toMatchObject({ title: "شقة قرب الحرم", translated: false });
  });
  it("falls back to the original when nothing is translated yet", () => {
    expect(localizedTexts({ ...listing, translations: null }, "fr").title).toBe("شقة قرب الحرم");
  });
});
