"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
export function AutoRefresh({ seconds = 10 }: { seconds?: number }) {
  const router = useRouter();
  useEffect(() => {
    const i = setInterval(() => document.visibilityState === "visible" && router.refresh(), seconds * 1000);
    return () => clearInterval(i);
  }, [router, seconds]);
  return null;
}
