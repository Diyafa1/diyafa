"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { thumbUrl } from "@/lib/photo-url";
import { useI18n } from "./I18nProvider";

/** Listing photos: tap one to open it full screen, swipe or use arrows to browse, ✕ / Esc to close. */
export function PhotoGallery({ photos }: { photos: { id: string; url: string }[] }) {
  const { t, locale } = useI18n();
  const [open, setOpen] = useState<number | null>(null);
  const startX = useRef<number | null>(null);
  const rtl = locale === "ar";
  const n = photos.length;
  const go = useCallback((d: number) => setOpen((i) => (i === null ? i : (i + d + n) % n)), [n]);

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") go(rtl ? -1 : 1);
      if (e.key === "ArrowLeft") go(rtl ? 1 : -1);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, go, rtl]);

  if (!n) return null;
  return (
    <>
      <div className="relative -mx-4 mb-6 md:mx-0">
        <div className="flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 md:grid md:grid-cols-4 md:grid-rows-2 md:overflow-visible md:px-0">
          {photos.slice(0, 5).map((p, i) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setOpen(i)}
              aria-label={`${t("gallery.open")} ${i + 1}/${n}`}
              className={`w-[85%] shrink-0 snap-center cursor-zoom-in overflow-hidden rounded-[12px] md:w-full ${i === 0 ? "md:col-span-2 md:row-span-2" : ""}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={i === 0 ? p.url : thumbUrl(p.url)} alt="" fetchPriority={i === 0 ? "high" : "auto"} loading={i === 0 ? "eager" : "lazy"} decoding="async" className={`aspect-[4/3] h-full w-full object-cover transition-transform hover:scale-[1.02] ${i === 0 ? "md:aspect-auto" : ""}`} />
            </button>
          ))}
        </div>
        <button type="button" onClick={() => setOpen(0)} className="btn-secondary btn-sm absolute bottom-3 end-6 bg-white/95 shadow md:end-3">
          ▦ {t("gallery.all", { n })}
        </button>
      </div>

      {open !== null && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex flex-col bg-black"
          onTouchStart={(e) => (startX.current = e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (startX.current === null) return;
            const dx = e.changedTouches[0].clientX - startX.current;
            if (Math.abs(dx) > 50) go((dx < 0 ? 1 : -1) * (rtl ? -1 : 1));
            startX.current = null;
          }}
        >
          <div className="flex items-center justify-between p-4 text-sm text-white">
            <span>{open + 1} / {n}</span>
            <button type="button" onClick={() => setOpen(null)} aria-label={t("gallery.close")} className="rounded-full bg-white/10 px-3 py-1.5 text-lg leading-none hover:bg-white/20">✕</button>
          </div>
          <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden px-2 pb-4" onClick={(e) => e.target === e.currentTarget && setOpen(null)}>
            {/* the whole photo always fits in the screen, whatever its shape */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photos[open].url}
              alt=""
              className="block h-auto w-auto select-none rounded-[8px] object-contain"
              style={{ maxWidth: "100%", maxHeight: n > 1 ? "calc(100dvh - 170px)" : "calc(100dvh - 90px)" }}
              draggable={false}
            />
            {n > 1 && (
              <>
                <button type="button" onClick={() => go(rtl ? 1 : -1)} aria-label={t("gallery.prev")} className="absolute start-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/15 px-4 py-3 text-2xl text-white hover:bg-white/25 sm:block">‹</button>
                <button type="button" onClick={() => go(rtl ? -1 : 1)} aria-label={t("gallery.next")} className="absolute end-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/15 px-4 py-3 text-2xl text-white hover:bg-white/25 sm:block">›</button>
              </>
            )}
          </div>
          {n > 1 && (
            <div className="flex gap-2 overflow-x-auto px-4 pb-4">
              {photos.map((p, i) => (
                <button key={p.id} type="button" onClick={() => setOpen(i)} className={`h-14 w-20 shrink-0 overflow-hidden rounded-[6px] border-2 ${i === open ? "border-white" : "border-transparent opacity-60"}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={thumbUrl(p.url)} alt="" loading="lazy" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
