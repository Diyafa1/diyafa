"use client";
import { useEffect, useState } from "react";
import { useI18n } from "./I18nProvider";
import { LogoMark } from "./Logo";

type PromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
const KEY = "install-dismissed";

/** "Install the app" banner: one tap on Android/Chrome, short instructions on iPhone (Share → Add to Home Screen). */
export function InstallApp() {
  const { t } = useI18n();
  const [prompt, setPrompt] = useState<PromptEvent | null>(null);
  const [kind, setKind] = useState<"ios" | "android" | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone;
    if (standalone) return;
    let dismissed = 0;
    try { dismissed = Number(localStorage.getItem(KEY) || 0); } catch {}
    if (Date.now() - dismissed < 30 * 86400000) return;
    const ua = navigator.userAgent;
    const isIos = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const isAndroid = /Android/.test(ua);
    if (!isIos && !isAndroid) {
      // computer: only when the browser offers a real install (Chrome / Edge)
      const onPrompt = (e: Event) => { e.preventDefault(); setPrompt(e as PromptEvent); setShow(true); };
      window.addEventListener("beforeinstallprompt", onPrompt);
      return () => window.removeEventListener("beforeinstallprompt", onPrompt);
    }
    setKind(isIos ? "ios" : "android");
    const onPrompt = (e: Event) => { e.preventDefault(); setPrompt(e as PromptEvent); };
    window.addEventListener("beforeinstallprompt", onPrompt);
    // phones: always show after a few seconds (with a one-tap button when the browser allows it, otherwise instructions)
    const timer = setTimeout(() => setShow(true), 4000);
    return () => { clearTimeout(timer); window.removeEventListener("beforeinstallprompt", onPrompt); };
  }, []);

  if (!show) return null;
  const close = () => { setShow(false); try { localStorage.setItem(KEY, String(Date.now())); } catch {} };
  return (
    <div className="fixed inset-x-3 bottom-20 z-40 md:inset-x-auto md:bottom-6 md:end-6 md:w-96">
      <div className="card flex items-start gap-3 p-3 shadow-lg">
        <LogoMark size={40} />
        <div className="min-w-0 flex-1 text-sm">
          <div className="font-medium text-neutral-900">{t("app.installTitle")}</div>
          <div className="text-neutral-600">{prompt ? t("app.installText") : kind === "ios" ? t("app.iosHint") : t("app.androidHint")}</div>
          <div className="mt-2 flex gap-2">
            {prompt && (
              <button type="button" className="btn-primary btn-sm" onClick={async () => { await prompt.prompt(); await prompt.userChoice.catch(() => null); close(); }}>
                {t("app.install")}
              </button>
            )}
            <button type="button" className="btn-ghost btn-sm" onClick={close}>{t("app.later")}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
