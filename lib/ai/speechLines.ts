import { normalizeSpeech } from '@/lib/cv/speech';
/**
 * AI pass for the voice CV builder (server only).
 * Turns what a person said (Egyptian Arabic, English or mixed) into English CV lines.
 * Strict rule: it may reword and translate, never add a fact the person did not say.
 * Env: GEMINI_API_KEY (+ optional GEMINI_MODEL, GEMINI_FALLBACK_MODEL).
 */
export const aiEnabled = () => Boolean(process.env.GEMINI_API_KEY);

export type AiLine = { text: string; unclear: boolean };

const SYS = `You turn what an engineer SAID about their work (Egyptian Arabic, Modern Standard Arabic, English, or a mix, transcribed by speech-to-text) into English CV bullet lines.

Rules — follow all of them:
1. Use ONLY facts in the sentence. Never add numbers, project types, sizes, tools, codes, results, responsibilities or seniority that were not said.
2. Keep every number, unit, building type, system, software and code that was said. Convert spoken numbers to digits (e.g. "اتناشر" → 12, "تلاتة آلاف طن تبريد" → 3,000 TR).
3. Fix obvious speech-to-text mistakes in engineering terms (e.g. "rivet" → Revit, "h vac" → HVAC, "الشوب دروينج" → shop drawings, "مستخلصات" → interim payment applications, "مقاولين باطن" → subcontractors, "استلام" → inspection/handover depending on context).
4. Start with a strong past-tense action verb. No "I", no "responsible for". One line, at most 30 words, no ending full stop.
5. Do not exaggerate: "اشتغلت على" / "worked on" means "Contributed to", not "Led" or "Delivered".
6. If the sentence is not about work, or is too unclear to translate without guessing, return an empty text and unclear=true.
Return JSON only, one item per input line, in the same order.`;

const SCHEMA = {
  type: 'OBJECT',
  properties: { lines: { type: 'ARRAY', items: { type: 'OBJECT', properties: { text: { type: 'STRING' }, unclear: { type: 'BOOLEAN' } }, required: ['text', 'unclear'] } } },
  required: ['lines']
};

/** Strip anything personal before it leaves the server. */
export const redactLine = (s: string) =>
  String(s || '')
    .replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, '[email]')
    .replace(/(?:\+|00)?\d[\d\s-]{8,}\d/g, '[phone]')
    .slice(0, 400);

async function call(model: string, key: string, user: string) {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYS }] },
      contents: [{ role: 'user', parts: [{ text: user }] }],
      generationConfig: { temperature: 0.1, responseMimeType: 'application/json', responseSchema: SCHEMA, maxOutputTokens: 4096 }
    }),
    cache: 'no-store',
    signal: AbortSignal.timeout(25000)
  });
  if (res.status === 429 || res.status === 503) throw Object.assign(new Error('busy'), { retryable: true });
  if (!res.ok) throw new Error(`gemini ${res.status}`);
  const data = await res.json();
  const txt = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text || '').join('') || '';
  return JSON.parse(txt);
}

export async function interpretWithAi(lines: string[], role: string): Promise<AiLine[]> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('not_configured');
  const user = `Target job: ${role || 'engineer'}\nLines:\n${lines.map((l, i) => `${i + 1}. ${redactLine(l)}`).join('\n')}`;
  const models = [process.env.GEMINI_MODEL || 'gemini-flash-latest', process.env.GEMINI_FALLBACK_MODEL || 'gemini-flash-lite-latest'];
  let last: any;
  for (const m of models) {
    try {
      const r = await call(m, key, user);
      const out: AiLine[] = (Array.isArray(r?.lines) ? r.lines : []).slice(0, lines.length).map((x: any) => ({
        text: String(x?.text || '').replace(/\s+/g, ' ').replace(/\.$/, '').trim().slice(0, 300),
        unclear: Boolean(x?.unclear) || !String(x?.text || '').trim()
      }));
      while (out.length < lines.length) out.push({ text: '', unclear: true });
      return out;
    } catch (e) { last = e; }
  }
  throw last;
}

/** Guard: every number in the AI line must come from what was said (after spoken numbers → digits). */
export function addsNumbers(orig: string, out: string) {
  const said = new Set((normalizeSpeech(orig).replace(/,/g, '').match(/\d+(?:\.\d+)?/g) || []).map(Number));
  const got = (out.replace(/,/g, '').match(/\d+(?:\.\d+)?/g) || []).map(Number);
  return got.some((n) => !said.has(n));
}
