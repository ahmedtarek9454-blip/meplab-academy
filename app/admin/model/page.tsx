import Link from 'next/link';
import { getT } from '@/lib/i18n';
import { requireAdmin } from '@/lib/auth';
import { ROLES, MARKETS, type Market } from '@/lib/cv/data';
import { SKILL_BY_ID } from '@/lib/ats/taxonomy';
import { defaultModel, type AtsModel } from '@/lib/ats/model';
import SubmitButton from '@/components/SubmitButton';
import { trainNow, blockTerm } from './actions';

export const dynamic = 'force-dynamic';

export default async function ModelAdmin({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const { supabase } = await requireAdmin();
  const { t, locale } = await getT();
  const ar = locale === 'ar';
  const { data } = await supabase.from('ats_models').select('id, version, jobs_used, created_at, model').order('id', { ascending: false }).limit(10);
  const latest: AtsModel = (data?.[0]?.model as AtsModel) || defaultModel();
  const markets = Object.keys(MARKETS) as Market[];
  const r = sp.r || '';
  const top = (w?: Record<string, number>) => Object.entries(w || {}).sort((a, b) => b[1] - a[1]).slice(0, 6);

  return (
    <section className="container-x py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="h-section">🧠 MEP LAB ATS Model</h1>
          <p className="mt-1 text-sm text-ink-mute">{ar ? 'الموديل بيتدرّب لوحده كل يوم الساعة 7 الصبح: من الـ CVs اللي اتفحصت (آخر 12 شهر) ومن إعلانات الوظايف.' : 'Retrains itself every day at 07:00 from checked CVs (last 12 months) and job posts.'}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin" className="btn-ghost">{t.admin_title}</Link>
          <form action={trainNow}><SubmitButton className="btn-blue">↻ {ar ? 'درّب الموديل دلوقتي' : 'Train now'}</SubmitButton></form>
        </div>
      </div>
      {r.startsWith('ok:') && <p className="mt-4 rounded-sheet bg-green-50 p-4 text-green-800" dir="auto">✓ {ar ? `اتدرّب: إصدار ${r.split(':')[1]} على ${r.split(':')[2]} إعلان` : `Trained: v${r.split(':')[1]} on ${r.split(':')[2]} posts`}</p>}
      {r.startsWith('err:') && <p className="mt-4 rounded-sheet bg-red-50 p-4 text-sm text-red-700" dir="ltr">{decodeURIComponent(r.slice(4))}</p>}

      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="card p-5"><div className="text-sm text-ink-mute">{ar ? 'الإصدار' : 'Version'}</div><div className="text-xl font-bold text-ink" dir="ltr">{latest.version}</div></div>
        <div className="card p-5"><div className="text-sm text-ink-mute">{ar ? 'اتدرّب على' : 'Trained on'}</div><div className="text-xl font-bold text-ink">{latest.jobs_used} {ar ? 'إعلان' : 'posts'}</div></div>
        <div className="card p-5"><div className="text-sm text-ink-mute">{ar ? 'آخر تدريب' : 'Last training'}</div><div className="text-sm font-bold text-ink" dir="ltr">{latest.trained_at ? new Date(latest.trained_at).toLocaleString('en-GB') : '—'}</div></div>
        <div className="card p-5"><div className="text-sm text-ink-mute">{ar ? 'المهارات في شبكة المعرفة' : 'Skills in knowledge graph'}</div><div className="text-xl font-bold text-ink">{SKILL_BY_ID.size}</div></div>
      </div>


      {/* ---- learning from CVs ---- */}
      <div className="card mt-6 p-6">
        <h2 className="text-lg font-bold text-ink">{ar ? 'اللي الأداة اتعلمته من الـ CVs' : 'What the engine learned from CVs'}</h2>
        <p className="mt-1 text-sm text-ink-mute">{ar ? 'كل فحص بيبعت المهارات اللي اتعرفت والكلمات الجديدة من قسم المهارات (من غير أي بيانات شخصية). لما الناس تأكد أو تصحح الوظيفة، التصحيح ده هو اللي المحرك بيتعلم منه. الكلمة بتتعلم بس لو ظهرت في 8 CVs على الأقل من نفس الوظيفة.' : 'Each check sends the recognised skills and new words from the skills section (no personal data). Confirmations and corrections are the labels the engine learns from. A word is learned only after it appears in 8+ CVs of the same role.'}</p>
        <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3">
          <div className="rounded-sheet border border-line p-4"><div className="text-sm text-ink-mute">{ar ? 'CVs اتفحصت' : 'CVs checked'}</div><div className="text-xl font-bold text-ink">{latest.cvs_used ?? 0}</div></div>
          <div className="rounded-sheet border border-line p-4"><div className="text-sm text-ink-mute">{ar ? 'أكّدوا أو صحّحوا الوظيفة' : 'Confirmed / corrected'}</div><div className="text-xl font-bold text-ink">{latest.cvs_confirmed ?? 0}</div></div>
          <div className="rounded-sheet border border-line p-4"><div className="text-sm text-ink-mute">{ar ? 'كلمات اتعلمها' : 'Words learned'}</div><div className="text-xl font-bold text-ink">{Object.values(latest.learned || {}).flat().length}</div></div>
        </div>
        {(latest.confusions?.length ?? 0) > 0 && (
          <div className="mt-5">
            <div className="text-sm font-semibold text-ink">{ar ? 'أكتر تصحيحات الناس (المحرك قال ← الصح)' : 'Most frequent corrections (engine said → actual)'}</div>
            <ul className="mt-2 space-y-1 text-sm text-ink-soft">
              {latest.confusions!.map((c) => <li key={c.from + c.to}>{ROLES.find((x) => x.id === c.from)?.[locale] || c.from} ← {ROLES.find((x) => x.id === c.to)?.[locale] || c.to} <b className="text-ink">({c.n})</b></li>)}
            </ul>
          </div>
        )}
        {Object.keys(latest.learned || {}).length > 0 && (
          <div className="mt-5 space-y-3">
            {Object.entries(latest.learned!).map(([role, list]) => (
              <div key={role}>
                <div className="text-sm font-semibold text-ink">{ROLES.find((x) => x.id === role)?.[locale] || role}</div>
                <div className="mt-1 flex flex-wrap gap-2">
                  {list.map((x) => (
                    <form key={x.term} action={blockTerm} className="inline-flex items-center gap-1 rounded-full border border-line bg-paper py-0.5 pe-1 ps-3 text-xs" dir="ltr">
                      <span className="font-semibold text-ink">{x.term}</span><span className="text-ink-mute">{x.n} CVs</span>
                      <input type="hidden" name="term" value={x.term} />
                      <button className="rounded-full px-2 py-0.5 text-red-600 hover:bg-red-50" title={ar ? 'امنع الكلمة دي' : 'Block this word'}>✕</button>
                    </form>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-paper text-ink-mute">
            <tr>
              <th className="px-4 py-3 text-start">{ar ? 'التخصص' : 'Role'}</th>
              {markets.map((m) => <th key={m} className="px-3 py-3 text-start">{MARKETS[m][ar ? 'name_ar' : 'name_en']}<div className="text-[10px] font-normal">{ar ? 'إعلانات · المرتب الشهري' : 'posts · monthly pay'}</div></th>)}
              <th className="px-4 py-3 text-start">{ar ? 'أهم المهارات اللي السوق طالبها' : 'Most demanded skills'}</th>
              <th className="px-4 py-3 text-start">{ar ? 'مصطلحات جديدة (ضيفها لشبكة المعرفة)' : 'Emerging terms (add to taxonomy)'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line align-top">
            {ROLES.map((role) => (
              <tr key={role.id}>
                <td className="px-4 py-3 font-semibold text-ink">{role[locale]}</td>
                {markets.map((m) => {
                  const n = latest.samples[role.id]?.[m] ?? 0, st = latest.salary[role.id]?.[m];
                  return (
                    <td key={m} className="px-3 py-3 text-xs" dir="ltr">
                      <div className="font-bold">{n}</div>
                      {st ? <div className="text-green-700">{st.p25.toLocaleString()}–{st.p75.toLocaleString()} <span className="text-slate-400">(n={st.n})</span></div> : <div className="text-slate-400">—</div>}
                    </td>
                  );
                })}
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {top(latest.weights[role.id]?.all).map(([id, w]) => (
                      <span key={id} className="rounded bg-blue-50 px-1.5 py-0.5 text-[11px] text-brand-blue" dir="ltr">{SKILL_BY_ID.get(id)?.label || id} <b>{w.toFixed(2)}</b></span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">{(latest.emerging[role.id] || []).map((k) => <span key={k} className="rounded bg-amber-50 px-1.5 py-0.5 text-[11px] text-amber-800" dir="ltr">{k}</span>)}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(data?.length ?? 0) > 1 && (
        <div className="card mt-6 p-5 text-sm">
          <div className="mb-2 font-bold text-ink">{ar ? 'الإصدارات السابقة' : 'Previous versions'}</div>
          <ul className="space-y-1 text-ink-soft" dir="ltr">{data!.map((d: any) => <li key={d.id}>{d.version} · {d.jobs_used} posts · {new Date(d.created_at).toLocaleString('en-GB')}</li>)}</ul>
        </div>
      )}
    </section>
  );
}
