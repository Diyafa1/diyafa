import { getT } from "@/lib/i18n/server";
import { PAGES } from "@/content/pages";

export async function StaticPage({ page }: { page: keyof typeof PAGES }) {
  const { locale } = await getT();
  const p = PAGES[page][locale];
  return (
    <div className="container-page max-w-3xl py-8">
      <h1 className="mb-6 text-2xl">{p.title}</h1>
      <div className="space-y-5">
        {p.sections.map((s) => (
          <section key={s.h}>
            <h2 className="mb-1 text-base">{s.h}</h2>
            <p className="text-sm leading-relaxed text-neutral-700">{s.p}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
