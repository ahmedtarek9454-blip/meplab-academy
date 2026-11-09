import { findSkills, keywords, normText } from './match';
import { SKILL_BY_ID } from './taxonomy';

export type ParsedJd = {
  title: string;
  yearsMin: number | null;
  degree: boolean;
  engDegree: boolean; // the degree must be in engineering
  must: string[]; // skill ids
  nice: string[];
  certs: string[]; // cert skill ids required
  literal: string[]; // top literal keywords
};

const NICE = /(prefer|preferred|preferable|\ba plus\b|\bis plus\b|plus point|advantage|advantageous|desirable|nice to have|is a bonus|would be (?:a |an )?(?:plus|advantage|bonus|asset)|ideally|optional|an asset)/i;
const MUST = /(must|required|requirement|mandatory|essential|minimum|at least|should have|need to|proven)/i;

export function parseJd(raw: string): ParsedJd {
  const text = normText(raw);
  const lines = text.split(/\n|(?<=[.;])\s+(?=[A-Z•\-*])/).map((l) => l.trim()).filter(Boolean);
  const title = (lines.find((l) => l.length > 4 && l.length < 90 && /\b(engineer|manager|coordinator|modeler|modeller|estimator|specialist|lead|head|technician|supervisor|director)\b/i.test(l) && !/^(we are|about us|our company|the company|join)/i.test(l)) || lines[0] || '').replace(/^(job title|position|role)\s*[:\-]\s*/i, '');

  const must = new Set<string>(), nice = new Set<string>(), certs = new Set<string>();
  let softSection = false; // under a "Preferred / Nice to have / Desirable" heading
  for (const l of lines) {
    const h = l.replace(/[:：\-\s]+$/, '');
    if (h.length <= 40 && /^(preferred|preferable|nice to have|desirable|plus|advantages?|good to have|bonus)/i.test(h)) { softSection = true; continue; }
    if (h.length <= 40 && /^(requirements?|qualifications?|must have|essential|minimum|mandatory|what you need|skills required|job requirements)/i.test(h)) { softSection = false; continue; }
    const found = findSkills(l);
    if (!found.size) continue;
    const isNice = (softSection || NICE.test(l)) && !MUST.test(l);
    for (const id of found.keys()) {
      if (SKILL_BY_ID.get(id)?.cat === 'cert') { if (!isNice) certs.add(id); else nice.add(id); continue; }
      (isNice ? nice : must).add(id);
    }
  }
  for (const id of must) nice.delete(id);

  let yearsMin: number | null = null;
  // "minimum 5 years of experience" — ignore "company with 25 years in the market"
  const re = /(\d{1,2})\s*\+?\s*(?:-|to|–)?\s*(\d{1,2})?\s*\+?\s*(?:years?|yrs)[^.\n]{0,40}?(?:experience|exp\b|خبرة|in (?:mep|hvac|design|bim|fire|plumbing|site|estimation|sales|maintenance|construction|similar|the same|a similar))/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const before = text.slice(Math.max(0, m.index - 40), m.index);
    if (/(company|firm|group|we have|established|founded|history|market|over the past|more than \d+ projects)/i.test(before)) continue;
    const v = parseInt(m[1], 10);
    if (v > 0 && v < 30) yearsMin = yearsMin === null ? v : Math.max(yearsMin, v);
  }
  const degree = /(bachelor|b\.?\s?sc|b\.?\s?eng|degree in|university degree|بكالوريوس)/i.test(text);
  const engDegree = degree && /(bachelor|b\.?\s?sc|b\.?\s?eng|degree)[^.\n]{0,60}(engineering|هندس)/i.test(text);

  return { title, yearsMin, degree, engDegree, must: [...must], nice: [...nice], certs: [...certs], literal: keywords(text, 20) };
}
