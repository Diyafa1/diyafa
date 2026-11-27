/** Small version of a listing photo (640 px). Photos stored before compression existed have no thumbnail: the original is used. */
export function thumbUrl(url: string): string {
  return /\/[0-9a-f-]{36}\.webp$/.test(url) ? url.replace(/\.webp$/, "-sm.webp") : url;
}
