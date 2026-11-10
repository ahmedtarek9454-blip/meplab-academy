/**
 * Which engineering discipline is this CV? Evidence = degree line (strongest),
 * headline, and how many domain skills of each discipline the CV shows.
 * Used to keep roles from another discipline from winning on generic words
 * (a civil QS must not come out as an MEP estimator, a plant mechanic not as HVAC).
 */
import { DISCIPLINES, CAT_DISC } from '@/lib/cv/roles-extra';
import type { Found } from './match';

const DEGREE = /(bachelor|b\.?\s?sc\b|b\.?\s?eng\b|\bbsc\b|\bbeng\b|\bbs\b|m\.?\s?sc\b|\bmsc\b|master(?:'?s)?\s+(?:of|in|degree)|\bdegree\b|graduat|faculty\s+of|department\s+of|major\s*:|diploma\s+in|بكالوريوس|ماجستير|كلية|قسم|تخصص)/i;

export type DisciplineScores = { scores: Record<string, number>; top: string; best: number };

export function detectDisciplines(text: string, found: Map<string, Found>): DisciplineScores {
  const scores: Record<string, number> = {};
  for (const k of Object.keys(DISCIPLINES)) scores[k] = 0;
  const lines = text.replace(/\r/g, '').split('\n').map((l) => l.trim()).filter(Boolean);

  // degree: +4 (once per discipline)
  const deg = new Set<string>();
  for (const l of lines) {
    if (!DEGREE.test(l) || l.length > 220) continue;
    for (const [k, d] of Object.entries(DISCIPLINES)) if (d.re.test(l)) deg.add(k);
  }
  for (const k of deg) scores[k] += 4;

  // headline (top lines): +2
  const head = lines.slice(0, 6).join(' | ');
  for (const [k, d] of Object.entries(DISCIPLINES)) if (d.re.test(head)) scores[k] += 2;

  // domain skills: +1 each, +0.5 when used repeatedly
  for (const f of found.values()) {
    const d = CAT_DISC[f.cat];
    if (d) scores[d] += 1 + (f.hits >= 3 ? 0.5 : 0);
  }
  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  return { scores, top: ranked[0][0], best: ranked[0][1] };
}

/** points to subtract from a role that belongs to a discipline the CV shows little of */
export function disciplinePenalty(roleDisc: string, ds: DisciplineScores): number {
  if (roleDisc === 'any' || ds.best < 3) return 0;
  const ratio = (ds.scores[roleDisc] || 0) / ds.best;
  if (ratio < 0.34) return 25;
  if (ratio < 0.6) return 12;
  return 0;
}
