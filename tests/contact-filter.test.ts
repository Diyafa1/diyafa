import { describe, expect, it } from "vitest";
import { checkContact } from "@/lib/contact-filter";

const blocked = (s: string) => checkContact(s).ok === false;

describe("no phone numbers, e-mails or links in messages", () => {
  it("normal messages pass", () => {
    for (const s of ["Bonjour, est-ce qu'il y a un ascenseur ?", "Nous arrivons le 12/03/2027 vers 15h, 4 personnes", "السلام عليكم، هل يوجد موقف سيارات؟", "The flat is 400 m from the Haram, 2 rooms"])
      expect(blocked(s)).toBe(false);
  });
  it("phone numbers are blocked, even disguised", () => {
    for (const s of ["appelle moi 0612345678", "+32 470 12 34 56", "06.12.34.56.78", "0 6 1 2 3 4 5 6 7 8", "رقمي ٠٥٥١٢٣٤٥٦٧", "zero six one two three four five six seven", "mon num 06 12 puis 34 56 78"])
      expect(blocked(s)).toBe(true);
  });
  it("e-mails are blocked, even disguised", () => {
    for (const s of ["ecris moi ali@gmail.com", "ali at gmail dot com", "ali arobase hotmail point fr", "mon gmail c'est ali123"])
      expect(blocked(s)).toBe(true);
  });
  it("links and outside apps are blocked", () => {
    for (const s of ["contacte moi sur whatsapp", "واتساب افضل", "wa.me/966500000000", "www.monsite.com", "on se parle sur telegram"])
      expect(blocked(s)).toBe(true);
  });
});
