'use client';
import { useRef, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/client';

const MAX = 50 * 1024 * 1024;
const EXT = /\.(pdf|docx?|xlsx?|pptx?|rvt|rfa|dwg|dxf|nwc|nwd|ifc|zip|rar|7z|png|jpe?g|webp|txt|csv)$/i;

/**
 * Task file goes straight from the browser to Supabase Storage (the student's own folder),
 * so a 40 MB Revit file never passes through our server (whose request limit is ~6 MB).
 * The form then submits only the stored path; the server checks it before saving.
 */
export default function TaskFileInput({ userId, taskId, label, hint, ar }: { userId: string; taskId: string; label: string; hint: string; ar: boolean }) {
  const [state, setState] = useState<'idle' | 'up' | 'done' | 'err'>('idle');
  const [msg, setMsg] = useState('');
  const [path, setPath] = useState('');
  const [name, setName] = useState('');
  const box = useRef<HTMLInputElement>(null);
  const req = useRef<HTMLInputElement>(null);

  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    setPath(''); setName(''); setMsg('');
    if (!f) { setState('idle'); return; }
    if (!EXT.test(f.name)) { setState('err'); setMsg(hint); return; }
    if (f.size > MAX) { setState('err'); setMsg(ar ? 'الملف أكبر من 50 ميجا. اضغطه ZIP أو ابعت الجزء المطلوب بس.' : 'File is larger than 50 MB. Zip it or send only the needed part.'); return; }
    const sb = supabaseBrowser();
    if (!sb) { setState('err'); setMsg(ar ? 'الرفع مش شغال دلوقتي، جرّب بعد شوية.' : 'Upload is unavailable, try again later.'); return; }
    const safe = f.name.replace(/[^\w.\-]+/g, '_').slice(-80);
    const p = `${userId}/${taskId}/${Date.now()}-${safe}`;
    setState('up');
    const { error } = await sb.storage.from('tasks').upload(p, f, { contentType: f.type || 'application/octet-stream', upsert: false });
    if (error) {
      setState('err');
      setMsg((ar ? 'الرفع فشل: ' : 'Upload failed: ') + (error.message || ''));
      if (box.current) box.current.value = '';
      return;
    }
    req.current?.setCustomValidity('');
    setPath(p); setName(f.name.slice(0, 120)); setState('done');
    setMsg(`${(f.size / 1024 / 1024).toFixed(1)} MB`);
  }

  return (
    <div>
      <label className="label">{label}</label>
      <input ref={box} type="file" onChange={pick} className="input" disabled={state === 'up'}
        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.rvt,.rfa,.dwg,.dxf,.nwc,.nwd,.ifc,.zip,.rar,.7z,.png,.jpg,.jpeg,.webp,.txt,.csv" />
      {/* the form's required check: empty until the upload finished */}
      <input ref={req} type="text" name="file_path" value={path} onChange={() => {}} required tabIndex={-1} aria-hidden className="sr-only"
        onInvalid={(e) => (e.target as HTMLInputElement).setCustomValidity(ar ? 'استنى الملف يترفع الأول' : 'Wait for the file to finish uploading')}
      />
      <input type="hidden" name="file_name" value={name} />
      {state === 'up' && <p className="mt-1 text-xs font-semibold text-brand-blue">{ar ? 'بيترفع… متقفلش الصفحة' : 'Uploading… keep this page open'}</p>}
      {state === 'done' && <p className="mt-1 text-xs font-semibold text-green-700">✓ {ar ? 'اترفع' : 'Uploaded'} · <span dir="ltr">{msg}</span> — {ar ? 'دوس تسليم' : 'now press submit'}</p>}
      {state === 'err' && <p className="mt-1 text-xs font-semibold text-red-700">⚠️ {msg}</p>}
      {state === 'idle' && <p className="mt-1 text-xs text-ink-mute" dir="ltr">{hint}</p>}
    </div>
  );
}
