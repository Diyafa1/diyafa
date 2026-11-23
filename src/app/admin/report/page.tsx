import { requireSection } from "@/lib/auth";
import { buildReport, reportEmail } from "@/lib/report";
import { parseDay, todayUTC, addDays, dayKey } from "@/lib/dates";
import { sendReportNowAction } from "@/app/actions/admin";
import { Stat } from "@/components/ui";

/** Owner-only daily report (same content as the morning e-mail), for any day. */
export default async function ReportPage({ searchParams }: { searchParams: Promise<{ day?: string; sent?: string }> }) {
  await requireSection("finances");
  const sp = await searchParams;
  let day: Date;
  try {
    day = sp.day ? parseDay(sp.day) : addDays(todayUTC(), -1);
  } catch {
    day = addDays(todayUTC(), -1);
  }
  const from = new Date(day.getTime() - 3 * 3600000); // Makkah time (UTC+3)
  const to = addDays(from, 1);
  const label = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(day);
  const r = await buildReport(from, to);
  const c = reportEmail(r, label);
  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <form className="flex items-end gap-2">
          <label className="block"><span className="label">Jour</span><input type="date" name="day" defaultValue={dayKey(day)} max={dayKey(todayUTC())} className="input" /></label>
          <button className="btn-secondary">Afficher</button>
        </form>
        <form action={sendReportNowAction}><button className="btn-primary">📧 M'envoyer le rapport d'hier</button></form>
      </div>
      {sp.sent && <div className="alert-brand">✅ Rapport envoyé sur votre e-mail.</div>}
      <h1 className="text-xl">{c.title}</h1>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {c.rows.map(([k, v]) => <Stat key={k} label={k} value={v} />)}
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {c.highlight.map(([k, v]) => <Stat key={k} label={k} value={v} />)}
      </div>
      <div className="card space-y-2 p-4 text-sm">
        {c.paragraphs.map((p, i) => <p key={i}>{p}</p>)}
      </div>
      <p className="text-xs text-neutral-500">Ce rapport vous est envoyé automatiquement chaque matin vers 8 h (heure de La Mecque) sur votre e-mail admin.</p>
    </div>
  );
}
