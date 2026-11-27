"use client";
import { useFormStatus } from "react-dom";

/** Submit button that shows a spinner and blocks double clicks while the form is being sent. */
export function SubmitButton({ children, className = "btn-primary", pendingText }: { children: React.ReactNode; className?: string; pendingText?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} aria-busy={pending} className={`${className} ${pending ? "cursor-wait opacity-80" : ""}`}>
      {pending ? (
        <span className="inline-flex items-center gap-2">
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />
          {pendingText ?? children}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
