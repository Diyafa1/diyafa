export const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
export const num = (fd: FormData, k: string) => {
  const v = str(fd, k);
  if (v === "") return null;
  const n = Number(v.replace(",", "."));
  return Number.isFinite(n) ? n : null;
};
export const int = (fd: FormData, k: string) => {
  const n = num(fd, k);
  return n === null ? null : Math.round(n);
};
/** Only allow redirects to local paths. */
export const safeNext = (v: string | null | undefined, fallback = "/") =>
  v && v.startsWith("/") && !v.startsWith("//") ? v : fallback;
