import { describe, expect, it } from "vitest";
import { coordsFromText } from "@/lib/maps-link";

describe("Google Maps links", () => {
  it("reads coordinates from common Google Maps formats", () => {
    expect(coordsFromText("https://www.google.com/maps/place/Ajyad/@21.4195,39.8268,17z/data=!3m1")).toEqual({ lat: 21.4195, lng: 39.8268 });
    expect(coordsFromText("https://maps.google.com/?q=24.4685,39.6098")).toEqual({ lat: 24.4685, lng: 39.6098 });
    expect(coordsFromText("https://www.google.com/maps/place/x/data=!4m6!3m5!1s0x!8m2!3d21.38!4d39.86")).toEqual({ lat: 21.38, lng: 39.86 });
    expect(coordsFromText("21.4195, 39.8268")).toEqual({ lat: 21.4195, lng: 39.8268 });
    expect(coordsFromText("pas de lien")).toBeNull();
  });
});
