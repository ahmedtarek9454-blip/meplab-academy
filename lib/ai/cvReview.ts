/**
 * =====================================================================
 *  MEP LAB AI — CV review (Google Gemini, free tier on Flash models)
 *  Env: GEMINI_API_KEY, GEMINI_MODEL (default gemini-flash-latest),
 *       GEMINI_FALLBACK_MODEL (default gemini-flash-lite-latest)
 * =====================================================================
 */
import type { Market } from '@/lib/cv/data';
import { knowledgeFor } from './knowledge';
import { redactCv } from './redact';

export type AiReview = {
  verdict: string;
  rating: number; // 1-10
  breakdown: { area: string; score: number; note: string }[];
  strengths: string[];
  weaknesses: string[];
  target_titles: string[];
  summary_rewrite: string;
  bullet_rewrites: { before: string; after: string }[];
  missing_skills: { skill: string; why: string }[];
  next_steps: string[];
  interview_questions: { q: string; hint: string }[];
  jd_match: null | { match_pct: number; matched: string[]; missing: string[]; tailored_summary: string };
};

export const AREAS = ['relevance', 'technical_depth', 'impact', 'presentation', 'market_fit'] as const;

const S = (type: string, extra: any = {}) => ({ type, ...extra });
const STR = S('STRING');
const STRS = S('ARRAY', { items: STR });
function schema(withJd: boolean) {
  const props: any = {
    verdict: STR,
    rating: S('INTEGER'),
    breakdown: S('ARRAY', { items: S('OBJECT', { properties: { area: S('STRING', { enum: [...AREAS] }), score: S('INTEGER'), note: STR }, required: ['area', 'score', 'note'] }) }),
    strengths: STRS,
    weaknesses: STRS,
    target_titles: STRS,
    summary_rewrite: STR,
    bullet_rewrites: S('ARRAY', { items: S('OBJECT', { properties: { before: STR, after: STR }, required: ['before', 'after'] }) }),
    missing_skills: S('ARRAY', { items: S('OBJECT', { properties: { skill: STR, why: STR }, required: ['skill', 'why'] }) }),
    next_steps: STRS,
    interview_questions: S('ARRAY', { items: S('OBJECT', { properties: { q: STR, hint: STR }, required: ['q', 'hint'] }) })
  };
  const required = Object.keys(props);
  if (withJd) {
    props.jd_match = S('OBJECT', { properties: { match_pct: S('INTEGER'), matched: STRS, missing: STRS, tailored_summary: STR }, required: ['match_pct', 'matched', 'missing', 'tailored_summary'] });
    required.push('jd_match');
  }
  return S('OBJECT', { properties: props, required });
}

function systemPrompt(o: Opts) {
  const lang = o.locale === 'ar'
    ? 'Write verdict, breakdown notes, strengths, weaknesses, missing_skills.why, next_steps and interview hints in clear Egyptian Arabic (keep technical terms, software and codes in English). Interview questions themselves in English. All CV rewrites in English.'
    : 'Write everything in clear professional English.';
  return `You are "MEP LAB AI", a senior MEP recruitment consultant and chartered mechanical engineer who has hired HVAC, fire-fighting, plumbing and BIM engineers in Egypt, Saudi Arabia and the UAE for 15+ years. You review CVs like a hiring manager at a top consultant or contractor: direct, specific, constructive.

TARGET: "${o.role}" in ${o.marketName}. Detected experience ≈ ${o.years} years. Automatic ATS score from our parser: ${o.atsScore}/100.

${knowledgeFor(o.roleId, o.market)}

HOW TO REVIEW
1. Read the whole CV. Judge it against the rubric and market notes above for the target role and seniority.
2. Score each area 0-10 (be calibrated: 5 = average applicant, 8 = would shortlist, 10 = exceptional):
   - relevance: how well experience matches the target role
   - technical_depth: evidence of real engineering work (calcs, designs, codes, systems, project types)
   - impact: quantified results (projects, areas, TR, values, savings, team sizes, approvals)
   - presentation: structure, clarity, length, ATS-friendliness, bullet quality
   - market_fit: fit for ${o.marketName} (local codes, authorities, accreditation, regional experience)
3. rating (1-10) = overall competitiveness for this role & market, consistent with the area scores.
4. Every strength/weakness must cite something concrete from the CV (a project, tool, phrase or a clear absence). No generic advice.
5. target_titles: 2-3 job titles this person should apply for now (may differ from the target if the CV fits better elsewhere).
6. summary_rewrite: a 3-4 line English summary that a recruiter would love, using only facts in the CV.
7. bullet_rewrites: the 3-4 weakest experience bullets, rewritten as action verb + scope + technical detail + result.
8. missing_skills: up to 6 items the rubric expects but the CV does not show, each with a one-line why.
9. next_steps: exactly 3 actions, highest impact first.
10. interview_questions: 5 technical questions a hiring manager would ask THIS candidate based on THEIR CV (mention their projects/tools), each with a short hint of what a strong answer covers.
${o.jd ? '11. jd_match: compare the CV with the JOB DESCRIPTION below: match_pct (0-100, calibrated), requirements matched, requirements missing, and a tailored English summary for this specific job (facts from CV only).' : ''}

STRICT RULES
- NEVER invent employers, projects, numbers, certificates or skills. When a number is unknown write a placeholder like [X projects], [Y TR], [Z sqm].
- Personal data has been replaced with [NAME]/[EMAIL]/[PHONE]/[LINK]; ignore those tokens and never ask for them.
- If the text is not a CV, set rating 1 and explain in verdict.
- ${lang}`;
}

type Opts = { locale: 'ar' | 'en'; market: Market; marketName: string; role: string; roleId: string; years: number; atsScore: number; jd?: string };

async function callGemini(model: string, key: string, sys: string, user: string, withJd: boolean) {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: sys }] },
      contents: [{ role: 'user', parts: [{ text: user }] }],
      generationConfig: { temperature: 0.3, responseMimeType: 'application/json', responseSchema: schema(withJd), maxOutputTokens: 8192 }
    }),
    cache: 'no-store'
  });
  if (res.status === 429 || res.status === 503) throw Object.assign(new Error('busy'), { retryable: true });
  if (!res.ok) throw new Error(`gemini ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  const txt = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text || '').join('') || '';
  return JSON.parse(txt);
}

const arr = (a: any, n: number) => (Array.isArray(a) ? a.filter(Boolean).slice(0, n) : []);
const clamp = (v: any, lo: number, hi: number, d: number) => Math.max(lo, Math.min(hi, Math.round(Number(v)) || d));

export function normalize(r: any, withJd: boolean): AiReview {
  const byArea = new Map(arr(r.breakdown, 10).map((b: any) => [b.area, b]));
  const out: AiReview = {
    verdict: String(r.verdict || ''),
    rating: clamp(r.rating, 1, 10, 5),
    breakdown: AREAS.map((a) => {
      const b: any = byArea.get(a) || {};
      return { area: a, score: clamp(b.score, 0, 10, 5), note: String(b.note || '') };
    }),
    strengths: arr(r.strengths, 5),
    weaknesses: arr(r.weaknesses, 5),
    target_titles: arr(r.target_titles, 3),
    summary_rewrite: String(r.summary_rewrite || ''),
    bullet_rewrites: arr(r.bullet_rewrites, 4).filter((b: any) => b?.before && b?.after),
    missing_skills: arr(r.missing_skills, 6).map((m: any) => (typeof m === 'string' ? { skill: m, why: '' } : { skill: String(m.skill || ''), why: String(m.why || '') })).filter((m: any) => m.skill),
    next_steps: arr(r.next_steps, 3),
    interview_questions: arr(r.interview_questions, 5).filter((q: any) => q?.q),
    jd_match: null
  };
  if (withJd && r.jd_match) {
    out.jd_match = {
      match_pct: clamp(r.jd_match.match_pct, 0, 100, 50),
      matched: arr(r.jd_match.matched, 10),
      missing: arr(r.jd_match.missing, 10),
      tailored_summary: String(r.jd_match.tailored_summary || '')
    };
  }
  return out;
}

export async function reviewCv(cv: string, o: Opts): Promise<AiReview> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('not_configured');
  const models = [process.env.GEMINI_MODEL || 'gemini-flash-latest', process.env.GEMINI_FALLBACK_MODEL || 'gemini-flash-lite-latest'];
  const withJd = !!o.jd?.trim();
  const sys = systemPrompt(o);
  const user = `CV TEXT (personal data removed):\n"""\n${redactCv(cv).slice(0, 15000)}\n"""${withJd ? `\n\nJOB DESCRIPTION:\n"""\n${o.jd!.slice(0, 6000)}\n"""` : ''}`;

  let last: any;
  // try main model (twice if the JSON came back broken), then the fallback model
  for (const [model, tries] of [[models[0], 2], [models[1], 1]] as [string, number][]) {
    for (let i = 0; i < tries; i++) {
      try {
        return normalize(await callGemini(model, key, sys, user, withJd), withJd);
      } catch (e: any) {
        last = e;
        if (e.retryable) break; // busy → go straight to the fallback model
        if (!(e instanceof SyntaxError)) break; // real API error → next model
      }
    }
  }
  throw last?.retryable ? new Error('busy') : last;
}
