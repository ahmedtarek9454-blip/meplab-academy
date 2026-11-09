import { getT } from '@/lib/i18n';

export default async function Download() {
  const { t } = await getT();
  const url = process.env.NEXT_PUBLIC_PLAYER_DOWNLOAD_URL || '#';
  const ver = process.env.NEXT_PUBLIC_PLAYER_VERSION;
  const steps = [t.dl1, t.dl2, t.dl3, t.dl4];
  return (
    <section className="container-x max-w-3xl py-14">
      <div className="card overflow-hidden">
        <div className="bg-gradient-to-br from-brand-navy to-brand-blue p-10 text-center text-white">
          <div className="text-5xl">🎬</div>
          <h1 className="mt-4 text-3xl font-black">{t.download_title}</h1>
          <p className="mx-auto mt-3 max-w-xl text-slate-200">{t.download_sub}</p>
          <a href={url} target="_blank" className="btn-red mt-6 px-8 py-3 text-lg">⬇ {t.download_btn}</a>
          {ver && <div className="mt-3 text-sm text-slate-300">{t.version} {ver} · Windows 10/11</div>}
        </div>
        <ol className="divide-y divide-slate-100">
          {steps.map((s, i) => (
            <li key={i} className="flex items-center gap-4 px-6 py-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-red font-bold text-white">{i + 1}</span>
              <span className="font-semibold text-slate-700">{s}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
