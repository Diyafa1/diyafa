"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { uploadOnePhotoAction } from "@/app/actions/host";
import { useI18n } from "./I18nProvider";

const MAX_SIDE = 2000;

/** Shrinks a phone photo in the browser before sending it (much faster upload, stays under the server's size limit). */
async function shrink(file: File): Promise<File> {
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: "from-image" } as ImageBitmapOptions);
    const scale = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
    if (scale === 1 && file.size < 1.5 * 1024 * 1024) return file;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.86));
    return blob ? new File([blob], "photo.jpg", { type: "image/jpeg" }) : file;
  } catch {
    return file; // old browser: send the original, the server compresses it anyway
  }
}

export function PhotoUploader({ listingId }: { listingId: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [failed, setFailed] = useState(0);

  async function send() {
    const files = [...(input.current?.files ?? [])].slice(0, 20);
    if (!files.length) return;
    setFailed(0);
    setProgress({ done: 0, total: files.length });
    let bad = 0;
    for (let i = 0; i < files.length; i++) {
      const fd = new FormData();
      fd.set("id", listingId);
      fd.set("photo", await shrink(files[i]));
      const res = await uploadOnePhotoAction(fd).catch(() => ({ ok: false }));
      if (!res.ok) bad++;
      setProgress({ done: i + 1, total: files.length });
    }
    setFailed(bad);
    setProgress(null);
    if (input.current) input.current.value = "";
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <input ref={input} type="file" name="photos" accept="image/jpeg,image/png,image/webp" multiple className="input max-w-xs" disabled={!!progress} />
        <button type="button" onClick={send} disabled={!!progress} className="btn-secondary">
          {progress ? t("lf.uploading", { done: progress.done, total: progress.total }) : t("lf.addPhotos")}
        </button>
      </div>
      {failed > 0 && <p className="text-sm text-red-700">{t("lf.uploadFailed", { n: failed })}</p>}
    </div>
  );
}
