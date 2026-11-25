'use client';
import { useEffect, useState } from 'react';
import CopyButton from './CopyButton';

type Labels = { btn: string; phone: string; copy: string; copied: string; started: string; direct: string };

// Phones can't run the Player, and most of them silently ignore an .msi download,
// so a student tapping the button on a phone sees nothing happen. Tell them instead.
export default function DownloadButton({ url, local, labels }: { url: string; local: boolean; labels: Labels }) {
  const [phone, setPhone] = useState(false);
  const [clicked, setClicked] = useState(false);
  useEffect(() => {
    const ua = navigator.userAgent;
    setPhone(/Android|iPhone|iPad|iPod|Mobile/i.test(ua) && !/Windows NT/i.test(ua));
  }, []);
  const abs = typeof window === 'undefined' ? url : new URL(url, window.location.origin).href;
  const pageUrl = typeof window === 'undefined' ? 'https://meplab.net/download' : window.location.origin + '/download';

  if (phone) {
    return (
      <div className="card mt-8 max-w-md p-4 text-start">
        <p className="leading-7 text-ink">{labels.phone}</p>
        <p className="mt-3 break-all font-medium text-ink" dir="ltr" style={{ textAlign: 'start' }}>{pageUrl}</p>
        <div className="mt-3"><CopyButton text={pageUrl} label={labels.copy} done={labels.copied} /></div>
      </div>
    );
  }

  return (
    <>
      <a
        href={url}
        {...(local ? { download: true } : { target: '_blank', rel: 'noopener' })}
        onClick={() => setClicked(true)}
        className="btn-red mt-8 px-7 py-3 text-base"
      >
        <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden><path d="M8 2v8m-3.5-3.5L8 10l3.5-3.5M3 13h10" fill="none" stroke="currentColor" strokeWidth="1.8" /></svg>
        {labels.btn}
      </a>
      {clicked && (
        <p className="mt-3 max-w-md text-sm leading-6 text-ink-soft">
          {labels.started} <a href={abs} className="underline" target="_blank" rel="noopener">{labels.direct}</a>
        </p>
      )}
    </>
  );
}
