import { ROLES } from '@/lib/cv/data';
import { DISCIPLINES } from '@/lib/cv/roles-extra';
import { LAUNCH_DAY, daysSince, eventCounts, signalsOfDay, type StoredSignal } from '@/lib/stats/store';
import { getModel, jdPosts } from '@/lib/stats/store';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'إحصائيات فحص الـ CV', robots: { index: false, follow: false } };

const MARKET: Record<string, string> = { eg: 'مصر', sa: 'السعودية', ae: 'الإمارات' };
const roleName = (id: string) => ROLES.find((r) => r.id === id)?.ar || id;
const discName = (id: string | null) => (id ? DISCIPLINES[id]?.ar || id : 'برّه الهندسة / مش واضح');

function top(map: Map<string, number>, n = 8) { return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, n); }

export default async function Stats() {
  let error = '';
  const days = daysSince(LAUNCH_DAY);
  const rows: { day: string; visitors: number; checks: number; checkers: number; rewrites: number; downloads: number; shares: number; jd: number; apply: number; avg: number | null }[] = [];
  const all: StoredSignal[] = [];
  const people = new Set<string>(); const visitors = new Set<string>();
  let model: any = null;
  let posts = 0;
  try {
    for (const day of days) {
      const [sigs, ev] = await Promise.all([signalsOfDay(day), eventCounts(day)]);
      all.push(...sigs);
      sigs.forEach((s) => people.add(s.ip_hash));
      const n = (k: string) => ev[k]?.n || 0;
      rows.push({
        day, visitors: ev.visit?.people || 0, checks: sigs.length, checkers: new Set(sigs.map((s) => s.ip_hash)).size,
        rewrites: n('rewrite'), downloads: n('word') + n('pdf'), shares: n('share_dl') + n('share_li') + n('share_fb') + n('share_native'), jd: n('jd'), apply: n('apply'),
        avg: sigs.length ? Math.round(sigs.reduce((x, s) => x + s.score, 0) / sigs.length) : null
      });
    }
    model = await getModel();
    posts = (await jdPosts().catch(() => [])).length;
  } catch (e: any) { error = e?.message || 'stats unavailable'; }

  const sum = (k: keyof (typeof rows)[number]) => rows.reduce((x, r) => x + ((r[k] as number) || 0), 0);
  const roles = new Map<string, number>(); const discs = new Map<string, number>(); const mk = new Map<string, number>();
  const buckets = [0, 0, 0, 0];
  for (const s of all) {
    roles.set(s.role_id, (roles.get(s.role_id) || 0) + 1);
    discs.set(discName(s.discipline), (discs.get(discName(s.discipline)) || 0) + 1);
    mk.set(MARKET[s.market] || s.market, (mk.get(MARKET[s.market] || s.market) || 0) + 1);
    buckets[s.score >= 75 ? 3 : s.score >= 50 ? 2 : s.score >= 25 ? 1 : 0]++;
  }
  const fails = new Map<string, number>();
  const hist5 = Array(21).fill(0);
  for (const s of all) { for (const f of (s as any).failing || []) fails.set(f, (fails.get(f) || 0) + 1); hist5[Math.min(20, Math.floor(s.score / 5))]++; }
  const cnt = (xs: (string | null | undefined)[]) => { const m = new Map<string, number>(); for (const x of xs) m.set(x || '-', (m.get(x || '-') || 0) + 1); return [...m].sort((a, b) => b[1] - a[1]); };
  const roleDiag = [...roles.keys()].sort((a, b) => roles.get(b)! - roles.get(a)!).slice(0, 14).map((id) => {
    const rs = all.filter((s) => s.role_id === id);
    const avg = (f: (s: StoredSignal) => number) => Math.round(rs.reduce((x, s) => x + f(s), 0) / rs.length);
    return {
      id, n: rs.length, pct: avg((s) => s.pct), score: avg((s) => s.score), years: avg((s) => s.years || 0),
      disc: cnt(rs.map((s) => s.discipline)).map(([k, v]) => `${k} ${v}`).join(', '),
      conf: cnt(rs.filter((s) => s.confirmed_role).map((s) => (s.confirmed_role === s.role_id ? 'ok' : '→' + s.confirmed_role))).map(([k, v]) => `${k} ${v}`).join(', ') || '-',
      skills: cnt(rs.flatMap((s) => s.skills || [])).slice(0, 8).map(([k, v]) => `${k} ${v}`).join(', ')
    };
  });
  const confirmed = all.filter((s) => s.confirmed_role).length;
  const corrected = all.filter((s) => s.confirmed_role && s.confirmed_role !== s.role_id).length;

  const Card = ({ label, value, note }: { label: string; value: string | number; note?: string }) => (
    <div className="card p-5">
      <div className="text-sm text-ink-mute">{label}</div>
      <div className="mt-1 text-3xl font-bold tabular-nums text-ink" dir="ltr" style={{ textAlign: 'right' }}>{value}</div>
      {note && <div className="mt-1 text-xs text-ink-mute">{note}</div>}
    </div>
  );
  const List = ({ title, items, total }: { title: string; items: [string, number][]; total: number }) => (
    <div className="card p-5">
      <h3 className="font-bold text-ink">{title}</h3>
      {items.length ? (
        <ul className="mt-3 space-y-2 text-sm">
          {items.map(([k, v]) => (
            <li key={k}>
              <div className="flex justify-between gap-3"><span className="text-ink-soft">{k}</span><span className="tabular-nums font-bold text-ink">{v}</span></div>
              <div className="mt-1 h-1 bg-line"><div className="h-full bg-brand-blue" style={{ width: `${Math.round((100 * v) / Math.max(1, total))}%` }} /></div>
            </li>
          ))}
        </ul>
      ) : <p className="mt-3 text-sm text-ink-mute">لسه مفيش بيانات.</p>}
    </div>
  );

  return (
    <main className="container-x py-10" dir="rtl">
      <h1 className="display text-3xl">إحصائيات فحص الـ CV</h1>
      <p className="mt-2 text-sm text-ink-mute">من يوم الإطلاق {LAUNCH_DAY} لحد النهارده، بتوقيت القاهرة. الأرقام من غير أي بيانات شخصية: الزائر بيتحسب برقم مشفّر من غير اسمه أو الـ IP بتاعه.</p>
      {error && <p className="mt-4 rounded-sheet border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">الإحصائيات بتشتغل على Netlify بس. ({error})</p>}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card label="زوّار صفحة الفحص" value={sum('visitors')} note="كل زائر بيتحسب مرة في اليوم" />
        <Card label="فحصوا الـ CV" value={people.size} note={`${all.length} فحص في المجموع`} />
        <Card label="عملوا النسخة المعدّلة" value={sum('rewrites')} note={`${sum('downloads')} تحميل Word أو PDF`} />
        <Card label="شاركوا النتيجة" value={sum('shares')} note={all.length ? `متوسط الدرجة ${Math.round(all.reduce((x, s) => x + s.score, 0) / all.length)}` : undefined} />
      </div>

      <div className="card mt-6 overflow-x-auto p-0">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="border-b border-line text-ink-mute">
            <tr>{['اليوم', 'زوار', 'فحوصات', 'أشخاص فحصوا', 'نسخة معدّلة', 'تحميل', 'مشاركة', 'طابقوا إعلان', 'جهّزوا تقديم', 'متوسط الدرجة'].map((h) => <th key={h} className="px-4 py-3 text-right font-semibold">{h}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.day} className="border-b border-line last:border-0">
                <td className="px-4 py-3 tabular-nums" dir="ltr" style={{ textAlign: 'right' }}>{r.day}</td>
                {[r.visitors, r.checks, r.checkers, r.rewrites, r.downloads, r.shares, r.jd, r.apply, r.avg ?? '–'].map((v, i) => <td key={i} className="px-4 py-3 tabular-nums">{v}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <List title="أكتر وظايف طلعت" items={top(new Map([...roles].map(([k, v]) => [roleName(k), v])))} total={all.length} />
        <List title="التخصصات" items={top(discs)} total={all.length} />
        <div className="space-y-4">
          <List title="السوق" items={top(mk)} total={all.length} />
          <List title="الدرجات" items={([['75 وأكتر', buckets[3]], ['50 لـ 74', buckets[2]], ['25 لـ 49', buckets[1]], ['أقل من 25', buckets[0]]] as [string, number][]).filter(([, v]) => v)} total={all.length} />
        </div>
      </div>

      <details className="card mt-6 p-5 text-sm">
        <summary className="cursor-pointer font-bold text-ink">تفاصيل للمراجعة</summary>
        <h4 className="mt-4 font-bold text-ink">البنود اللي بتقع أكتر (من {all.length} فحص)</h4>
        <ul className="mt-2 grid gap-1 sm:grid-cols-2" dir="ltr">
          {top(fails, 20).map(([k, v]) => <li key={k} className="flex justify-between gap-3 border-b border-line py-1"><span>{k}</span><span className="tabular-nums">{v} ({Math.round((100 * v) / Math.max(1, all.length))}%)</span></li>)}
        </ul>
        <h4 className="mt-5 font-bold text-ink">الدرجات كل 5</h4>
        <p className="mt-1 tabular-nums" dir="ltr">{hist5.map((v, i) => `${i * 5}-${i * 5 + 4}: ${v}`).filter((x) => !/: 0$/.test(x)).join(' | ')}</p>
        <h4 className="mt-5 font-bold text-ink">كل وظيفة طلعت لمين</h4>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full min-w-[720px] text-xs" dir="ltr">
            <thead><tr className="border-b border-line text-left text-ink-mute">{['role', 'n', 'avg pct', 'avg score', 'avg yrs', 'disciplines', 'confirmed / corrected to', 'top skills'].map((h) => <th key={h} className="px-2 py-1">{h}</th>)}</tr></thead>
            <tbody>
              {roleDiag.map((r) => (
                <tr key={r.id} className="border-b border-line align-top">
                  <td className="px-2 py-1 font-semibold">{r.id}</td><td className="px-2 py-1">{r.n}</td><td className="px-2 py-1">{r.pct}</td><td className="px-2 py-1">{r.score}</td><td className="px-2 py-1">{r.years}</td>
                  <td className="px-2 py-1">{r.disc}</td><td className="px-2 py-1">{r.conf}</td><td className="px-2 py-1">{r.skills}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>

      <div className="card mt-6 p-5 text-sm leading-7 text-ink-soft">
        <h3 className="font-bold text-ink">المحرك بيتعلم إزاي</h3>
        <p className="mt-1">كل فحص بيبعت ملخص من غير الـ CV نفسه: الوظيفة، والتخصص، والدرجة، والمهارات اللي اتعرفت. مرة كل يوم المحرك بيتدرّب من جديد على الملخصات دي لما يكون عنده {20} فحص على الأقل، وعلى إعلانات الوظايف اللي الناس طابقت عليها.</p>
        <p className="mt-1">بيعرف الوظيفة الصح من غير ما حد يختار: الأول من تأكيد الشخص لو أكّد ({all.filter((s) => s.confirmed_role).length})، وبعدين من المسمى المكتوب في الـ CV نفسه ({all.filter((s) => !s.confirmed_role && (s as any).title_role).length})، وآخر حاجة من تخمين المحرك لما يكون متأكد (بوزن صغير عشان ميقلّدش نفسه). إعلانات وظايف اتعلّم منها: {posts}.</p>
        <p className="mt-1">النسخة الحالية: <span dir="ltr">{model?.version || '0.1-prior (لسه متدرّبش)'}</span>{model?.cvs_used ? ` · اتعلّم من ${model.cvs_used} CV` : ''}. {confirmed} شخص أكّد الوظيفة، و{corrected} منهم صحّحها.</p>
      </div>
    </main>
  );
}
