/** Banner shown to the admin right after approving / rejecting: what was done and whether the person got the e-mail. */
const DONE: Record<string, string> = { approved: "validé ✅", rejected: "refusé", suspended: "suspendu" };

export function DecisionNotice({ done, who, mail }: { done?: string; who?: string; mail?: string }) {
  if (!done || !DONE[done]) return null;
  const mailText =
    mail === "sent" ? "📧 L'e-mail de confirmation lui a été envoyé."
    : mail === "logged" ? "📧 E-mail préparé (mode test : il n'est pas réellement envoyé)."
    : mail === "error" ? "⚠️ L'e-mail n'a pas pu être envoyé (voir Admin → Diagnostic). Tant que le domaine n'est pas vérifié chez Resend, seuls les e-mails vers votre propre adresse partent."
    : "⚠️ Aucun e-mail n'a été envoyé.";
  return (
    <div className="alert-brand space-y-1">
      <div className="font-medium">« {who} » : {DONE[done]}</div>
      <div className="text-sm">{mailText}</div>
    </div>
  );
}

export function ReviewTrace({ by, at, status }: { by?: string | null; at?: Date | null; status: string }) {
  if (!by || !at) return null;
  const verb = status === "APPROVED" ? "Validé" : status === "REJECTED" ? "Refusé" : status === "SUSPENDED" ? "Suspendu" : "Revu";
  const when = new Intl.DateTimeFormat("fr", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Riyadh" }).format(at);
  return <div className="text-xs text-neutral-500">{verb} par <strong>{by}</strong> le {when}</div>;
}
