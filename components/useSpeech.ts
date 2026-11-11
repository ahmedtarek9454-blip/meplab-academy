'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Browser speech-to-text (Web Speech API). Works in Chrome, Edge, Samsung Internet
 * and Safari 14.5+. Nothing is sent to MEP LAB: the browser's own speech service
 * turns the voice into text, and the text stays on the device.
 */
export function speechSupported() {
  return typeof window !== 'undefined' && !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
}

export function useSpeech(onFinal: (text: string) => void) {
  const rec = useRef<any>(null);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState('');
  const [error, setError] = useState('');
  const cb = useRef(onFinal);
  cb.current = onFinal;

  const stop = useCallback(() => { try { rec.current?.stop(); } catch {} }, []);

  const start = useCallback((lang: string) => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setError('unsupported'); return; }
    try { rec.current?.abort(); } catch {}
    const r = new SR();
    r.lang = lang;
    r.continuous = true;
    r.interimResults = true;
    r.maxAlternatives = 1;
    r.onresult = (e: any) => {
      let live = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) cb.current(t.trim());
        else live += t;
      }
      setInterim(live);
    };
    r.onerror = (e: any) => { setError(e.error === 'not-allowed' || e.error === 'service-not-allowed' ? 'denied' : e.error === 'no-speech' ? '' : 'failed'); };
    r.onend = () => { setListening(false); setInterim(''); };
    rec.current = r;
    setError('');
    setListening(true);
    try { r.start(); } catch { setListening(false); setError('failed'); }
  }, []);

  useEffect(() => () => { try { rec.current?.abort(); } catch {} }, []);
  return { listening, interim, error, start, stop };
}
