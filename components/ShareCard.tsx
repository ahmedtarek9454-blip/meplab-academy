'use client';
import { useEffect, useRef, useState } from 'react';

type Props = {
  locale: 'ar' | 'en';
  score: number;
  role: string;
  discipline?: string | null;
  better?: { pct: number; scopeLabel: string } | null;
  siteUrl?: string;
};

const T = {
  ar: {
    title: 'شارك نتيجتك', desc: 'صورة جاهزة لـ LinkedIn و Facebook — من غير اسمك أو أي بيانات من الـ CV.',
    head: 'درجة الـ CV بتاعي في الـ ATS', role: 'أقرب وظيفة ليا', cta: 'افحص الـ CV بتاعك مجانًا',
    dl: 'حمّل الصورة', share: 'شارك', li: 'LinkedIn', fb: 'Facebook', copied: 'اتنسخ اللينك',
    better: (p: number, s: string) => `أحسن من ${p}% من ${s}`
  },
  en: {
    title: 'Share your result', desc: 'A ready image for LinkedIn and Facebook — without your name or any CV details.',
    head: 'My CV ATS score', role: 'Closest role', cta: 'Check your CV for free',
    dl: 'Download image', share: 'Share', li: 'LinkedIn', fb: 'Facebook', copied: 'Link copied',
    better: (p: number, s: string) => `Better than ${p}% of ${s}`
  }
};

const W = 1080, H = 1350;

function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number) {
  const words = text.split(' '); const lines: string[] = []; let cur = '';
  for (const w of words) { const t = cur ? cur + ' ' + w : w; if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; }
  if (cur) lines.push(cur);
  return lines;
}

/** draws the share image on a canvas (browser shapes Arabic correctly) */
async function draw(cv: HTMLCanvasElement, p: Props) {
  const t = T[p.locale];
  const ctx = cv.getContext('2d')!;
  const font = getComputedStyle(document.body).fontFamily || 'sans-serif';
  try { await (document as any).fonts?.ready; } catch {}
  const rtl = p.locale === 'ar';
  ctx.direction = rtl ? 'rtl' : 'ltr';
  const X = rtl ? W - 96 : 96; ctx.textAlign = rtl ? 'right' : 'left';

  // background
  const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#0B1B3A'); g.addColorStop(1, '#13264F');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(255,255,255,.05)'; ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 54) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y < H; y += 54) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

  // brand
  ctx.fillStyle = '#fff'; ctx.font = `700 46px ${font}`;
  ctx.save(); ctx.direction = 'ltr'; ctx.textAlign = 'left';
  ctx.fillText('MEP', 96, 140); const mw = ctx.measureText('MEP ').width; ctx.fillStyle = '#FF5A4F'; ctx.fillText('LAB', 96 + mw, 140); ctx.restore();

  // heading
  ctx.fillStyle = '#A9B6CF'; ctx.font = `500 44px ${font}`; ctx.fillText(t.head, X, 280);

  // score ring
  const cx = W / 2, cy = 560, r = 190;
  const col = p.score >= 75 ? '#38D39F' : p.score >= 50 ? '#F5A524' : '#FF5A4F';
  ctx.lineWidth = 34; ctx.lineCap = 'round';
  ctx.strokeStyle = 'rgba(255,255,255,.08)'; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = col; ctx.beginPath(); ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * p.score) / 100); ctx.stroke();
  ctx.save(); ctx.direction = 'ltr'; ctx.textAlign = 'center'; ctx.fillStyle = '#fff';
  ctx.font = `700 170px ${font}`; ctx.fillText(String(p.score), cx, cy + 58);
  ctx.font = `500 40px ${font}`; ctx.fillStyle = '#7F8DA9'; ctx.fillText('/100', cx, cy + 120); ctx.restore();

  // role
  ctx.fillStyle = '#7F8DA9'; ctx.font = `500 36px ${font}`; ctx.fillText(t.role, X, 880);
  ctx.fillStyle = '#fff'; ctx.font = `700 58px ${font}`;
  const lines = wrap(ctx, p.role, W - 192).slice(0, 2);
  lines.forEach((l, i) => ctx.fillText(l, X, 960 + i * 72));
  let y = 960 + lines.length * 72 + 20;
  if (p.better) {
    ctx.fillStyle = '#38D39F'; ctx.font = `600 40px ${font}`;
    wrap(ctx, t.better(p.better.pct, p.better.scopeLabel), W - 192).slice(0, 2).forEach((l, i) => ctx.fillText(l, X, y + i * 52));
  }

  // footer
  ctx.fillStyle = '#E53935'; ctx.fillRect(0, H - 150, W, 150);
  ctx.fillStyle = '#fff'; ctx.font = `700 44px ${font}`; ctx.fillText(t.cta, X, H - 82);
  ctx.save(); ctx.direction = 'ltr'; ctx.textAlign = rtl ? 'left' : 'right'; ctx.font = `500 34px ${font}`; ctx.fillStyle = '#FFE1DF';
  ctx.fillText((p.siteUrl || location.host).replace(/^https?:\/\//, ''), rtl ? 96 : W - 96, H - 82); ctx.restore();
}

export default function ShareCard(p: Props) {
  const t = T[p.locale];
  const ref = useRef<HTMLCanvasElement>(null);
  const [url, setUrl] = useState('');
  const [msg, setMsg] = useState('');
  const [canShareFile, setCanShareFile] = useState(false);
  const site = (p.siteUrl || (typeof location !== 'undefined' ? location.origin : '')).replace(/\/$/, '');
  const link = `${site}/cv-check`;

  useEffect(() => {
    if (!ref.current) return;
    draw(ref.current, p).then(() => setUrl(ref.current!.toDataURL('image/png')));
    try { setCanShareFile(!!(navigator as any).canShare?.({ files: [new File([new Blob()], 'x.png', { type: 'image/png' })] })); } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.score, p.role, p.better?.pct, p.locale]);

  async function share() {
    try {
      const blob: Blob = await new Promise((res) => ref.current!.toBlob((b) => res(b!), 'image/png'));
      const file = new File([blob], 'meplab-cv-score.png', { type: 'image/png' });
      await (navigator as any).share({ files: [file], text: `${t.head}: ${p.score}/100 — ${link}` });
    } catch {}
  }
  async function copyLink() { try { await navigator.clipboard.writeText(link); setMsg(t.copied); setTimeout(() => setMsg(''), 2000); } catch {} }

  return (
    <div className="card grid gap-6 p-6 md:grid-cols-[minmax(0,260px),1fr] md:items-center">
      <canvas ref={ref} width={W} height={H} className="w-full max-w-[260px] rounded-lg shadow-sm" aria-label={`${t.head}: ${p.score}/100`} />
      <div>
        <h3 className="text-lg font-bold text-ink">{t.title}</h3>
        <p className="mt-1 text-sm leading-6 text-ink-soft">{t.desc}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {url && <a href={url} download="meplab-cv-score.png" className="btn-red btn-sm">{t.dl}</a>}
          {canShareFile && <button onClick={share} className="btn-ghost btn-sm">{t.share}</button>}
          <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}`} target="_blank" rel="noopener" onClick={copyLink} className="btn-ghost btn-sm">{t.li}</a>
          <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`} target="_blank" rel="noopener" className="btn-ghost btn-sm">{t.fb}</a>
        </div>
        {msg && <p className="mt-2 text-xs text-sys-plumb">{msg}</p>}
      </div>
    </div>
  );
}
