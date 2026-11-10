import { getT } from '@/lib/i18n';

export const metadata = {
  title: 'أدوات مجانية — AT Tools for Revit | MEP LAB',
  description: 'AT Tools: إضافة Revit مجانية لمهندسي MEP و BIM — Filter Manager, View Manager, Check Connections, BOQ, Sleeves, Slopes, Insulation, Supports, Riser Diagram.'
};

const FEATURES: { g: string; items: string[] }[] = [
  { g: 'Views & Filters', items: ['Filter Manager', 'View Manager'] },
  { g: 'Model QA', items: ['Check Connections', 'Navisworks Export'] },
  { g: 'MEP Tools', items: ['BOQ', 'Sleeves', 'Slopes', 'Insulation', 'Supports', 'Riser Diagram'] }
];

export default async function Tools() {
  const { t, locale } = await getT();
  const dl = process.env.NEXT_PUBLIC_AT_TOOLS_URL || 'https://drive.google.com/file/d/1HzkViwOkHqFcjvjcHibVJ9kZIWUVbRw0/view?usp=sharing';
  const wa = process.env.NEXT_PUBLIC_WHATSAPP;
  const steps = [t.at_lic1, t.at_lic2, t.at_lic3];

  return (
    <>
      <section className="relative overflow-hidden bg-ink text-white">
        <div className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
        <div className="container-x relative py-12 text-center md:py-14">
          <h1 className="text-3xl font-bold md:text-4xl">{t.tools_title}</h1>
          <p className="mx-auto mt-3 max-w-2xl text-lg text-slate-300">{t.tools_sub}</p>
        </div>
      </section>

      <section className="container-x relative z-10 -mt-6">
        <div className="card overflow-hidden">
          <div className="grid gap-8 p-6 md:grid-cols-[auto,1fr,auto] md:items-center md:p-8">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-sheet bg-ink text-3xl font-bold text-white" dir="ltr">AT</div>
            <div className="text-center md:text-start">
              <div className="flex flex-wrap items-center justify-center gap-2 md:justify-start">
                <h2 className="text-2xl font-extrabold text-ink" dir="ltr">AT Tools for Revit</h2>
                <span className="badge bg-green-100 text-green-700">{t.at_free}</span>
                <span className="badge bg-blue-50 text-brand-blue">{t.at_tag}</span>
              </div>
              <p className="mt-2 leading-7 text-ink-soft">{t.at_desc}</p>
            </div>
            <a href={dl} target="_blank" rel="noopener" className="btn-red px-7 py-3 text-base">⬇ {t.at_dl}</a>
          </div>

          <div className="grid gap-8 border-t border-line p-6 md:grid-cols-2 md:p-8">
            <div>
              <h3 className="mb-4 font-bold text-ink">{t.at_features}</h3>
              <div className="space-y-4">
                {FEATURES.map((f) => (
                  <div key={f.g}>
                    <div className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">{f.g}</div>
                    <div className="flex flex-wrap gap-2" dir="ltr" style={{ justifyContent: locale === 'ar' ? 'flex-end' : 'flex-start' }}>
                      {f.items.map((i) => <span key={i} className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-semibold text-ink-soft">{i}</span>)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="mb-4 font-bold text-ink">{t.at_lic_t}</h3>
              <ol className="space-y-3">
                {steps.map((s, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink text-sm font-bold text-white">{i + 1}</span>
                    <span className="pt-0.5 text-ink-soft">{s}</span>
                  </li>
                ))}
              </ol>
              {wa && (
                <a href={`https://wa.me/${wa}?text=${encodeURIComponent(t.at_wa_msg)}`} target="_blank" className="btn mt-5 bg-green-600 text-white hover:bg-green-700">💬 {t.at_lic_btn}</a>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
