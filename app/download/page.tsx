import { getT } from '@/lib/i18n';
import DownloadButton from '@/components/DownloadButton';

export default async function Download() {
  const { t, locale } = await getT();
  const ver = process.env.NEXT_PUBLIC_PLAYER_VERSION || '2.1.7';
  // the installer ships with the site (public/player); an env URL can override it later
  const url = process.env.NEXT_PUBLIC_PLAYER_DOWNLOAD_URL || `/player/MEP-LAB-Player-Setup-${ver}.msi`;
  const local = url.startsWith('/');
  const steps = [t.dl1, t.dl2, t.dl3, t.dl4];
  return (
    <section className="container-x grid gap-10 py-12 md:py-16 lg:grid-cols-[1fr,1.1fr] lg:items-start">
      <div>
        <h1 className="display text-[2.4rem] leading-tight md:text-[3.75rem]">{t.download_title}</h1>
        <p className="mt-4 max-w-xl text-[17px] leading-8 text-ink-soft">{t.download_sub}</p>
        <DownloadButton
          url={url}
          local={local}
          labels={{ btn: t.download_btn, phone: t.download_phone, copy: t.download_copy, copied: t.download_copied, started: t.download_started, direct: t.download_direct }}
        />
        <p className="mt-3 text-sm text-ink-soft" dir="ltr" style={{ textAlign: 'start' }}>MEP-LAB-Player-Setup-{ver}.msi · 47.6 MB · Windows 64-bit</p>
        <dl className="card mt-8 grid max-w-md grid-cols-2 overflow-hidden text-start">
          <div className="px-4 py-3"><dt className="tb-k">{t.version}</dt><dd className="tb-v" dir="ltr" style={{ textAlign: 'start' }}>{ver || '—'}</dd></div>
          <div className="border-s border-line px-4 py-3"><dt className="tb-k">{locale === 'ar' ? 'النظام' : 'System'}</dt><dd className="tb-v" dir="ltr" style={{ textAlign: 'start' }}>Windows 10 / 11</dd></div>
        </dl>
      </div>

      <ol className="sheet divide-y divide-line">
        {steps.map((s, i) => (
          <li key={i} className="flex items-start gap-4 px-5 py-5">
            <span className="display w-10 shrink-0 text-4xl leading-none text-brand-red">{i + 1}</span>
            <span className="pt-1 leading-7 text-ink">{s}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
