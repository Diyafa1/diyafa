/** Extracts coordinates from a Google Maps link (…/@21.42,39.82,17z, ?q=21.42,39.82, !3d21.42!4d39.82…). */
export function coordsFromText(text: string): { lat: number; lng: number } | null {
  const t = decodeURIComponent(text);
  const patterns = [/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/, /@(-?\d+\.\d+),(-?\d+\.\d+)/, /[?&](?:q|query|ll|destination)=(-?\d+\.\d+),\s*(-?\d+\.\d+)/, /(-?\d{1,2}\.\d{3,}),\s*(-?\d{1,3}\.\d{3,})/];
  for (const re of patterns) {
    const m = re.exec(t);
    if (m) {
      const lat = Number(m[1]), lng = Number(m[2]);
      if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) return { lat, lng };
    }
  }
  return null;
}

/** Short links (maps.app.goo.gl) are followed once to read the full address. */
export async function coordsFromMapsLink(link: string): Promise<{ lat: number; lng: number } | null> {
  const direct = coordsFromText(link);
  if (direct) return direct;
  if (!/^https:\/\/(maps\.app\.goo\.gl|goo\.gl\/maps|g\.co\/kgs)\//.test(link.trim())) return null;
  try {
    const res = await fetch(link.trim(), { redirect: "manual", signal: AbortSignal.timeout(6000) });
    const loc = res.headers.get("location");
    return loc ? coordsFromText(loc) : null;
  } catch {
    return null;
  }
}
