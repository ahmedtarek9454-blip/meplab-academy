/**
 * =====================================================================
 *  MEP LAB ATS Engine
 *  Works like a real Applicant Tracking System:
 *   1) parse the CV into skills (knowledge graph + synonyms)
 *   2) rank the CV against each MEP role with LEARNED weights (model)
 *   3) for a job post: knock-out filters → must/nice coverage →
 *      literal keyword match → title match → final ranking score
 *  Runs fully in the browser — no external AI, no data leaves the device.
 * =====================================================================
 */
import { ROLES, type Market, type Role } from '@/lib/cv/data';
import { SKILL_BY_ID } from './taxonomy';
import { findSkills, containsLiteral, normText, type Found } from './match';
import { parseJd, type ParsedJd } from './jd';
import { weightsFor, type AtsModel } from './model';
import { titleEvidence, type TitleEvidence } from './titles';
import { detectDisciplines, disciplinePenalty, type DisciplineScores } from './discipline';
import { TITLE_PATTERNS } from './titles';

/** country-specific codes are only suggested for their own market */
const OTHER_MARKET: Record<Market, string[]> = { sa: ['uae_code', 'eg_code'], ae: ['sbc', 'eg_code'], eg: ['sbc', 'uae_code'] };

export type RoleScore = { role: Role; pct: number; skillPct: number; titleBoost: number; matched: string[]; missing: string[]; missingIds: string[] };

/** how much of a role's (weighted) skill profile the CV covers */
export function rankRoles(found: Map<string, Found>, model: AtsModel, market: Market, text = '', firstWorkLine?: string, ds?: DisciplineScores): RoleScore[] {
  const ev: TitleEvidence | null = text ? titleEvidence(text, firstWorkLine) : null;
  const disc = ds || detectDisciplines(text, found);
  // a generic title ("Site Engineer", "MEP Engineer", "Engineer") says nothing by itself: read the whole job history first.
  // Only when no job in the history names a role of the graduate's department (or an any-department role) do we fall back to
  // site work in that department.
  const SITE_OF: Record<string, string> = { elec: 'elec_site', telecom: 'elv', civil: 'civil_site', survey: 'civil_site', arch: 'architect' };
  const degSite = disc.degree?.map((d) => SITE_OF[d]).find(Boolean);
  if (ev && degSite) {
    const ownOrAny = ROLES.filter((r) => r.disc === 'any' || disciplinePenalty(r.disc, disc) === 0).map((r) => r.id);
    const named = ownOrAny.some((id) => ev.titled[id]);
    const cur = ev.headline + ' | ' + ev.recent;
    // "Site / Execution / Construction Engineer" is a real job (site work) that just doesn't say the department: it is the department's site role
    if (/(site|execution|construction|field)\s*engineer/i.test(cur)) ev.hits[degSite] = Math.max(ev.hits[degSite] || 0, 2), ev.titled[degSite] = true;
    // a bare "Engineer" / "MEP Engineer" / "Project Engineer": the earlier jobs decide; site work is only the last resort
    else if (!named && /(^|[\s|,–-])(mep\s*engineer|project\s*engineer|engineer)\b/i.test(cur)) ev.hits[degSite] = Math.max(ev.hits[degSite] || 0, 1.5);
  }
  // non-mechanical graduates: a small lift for their own department's roles (MEP roles here are the mechanical ones)
  const ownBoost = (d: string) => (disc.degree?.length && !disc.degree.some((x) => x === 'mep' || x === 'mech') && disciplinePenalty(d, disc) === 0 && d !== 'any' ? 8 : 0);
  const scored = ROLES.map((role) => {
    const w = weightsFor(model, role.id, market);
    const entries = Object.entries(w).sort((a, b) => b[1] - a[1]);
    // yardstick = the role's 12 most important skills (a strong CV shows most of them)
    const yard = Math.max(7, entries.slice(0, 12).reduce((s, [, v]) => s + v, 0));
    let got = 0;
    const matched: string[] = [], missing: string[] = [], missingIds: string[] = [];
    for (const [id, v] of entries) {
      const lbl = SKILL_BY_ID.get(id)?.label || id.replace(/^l:/, '');
      if (found.has(id)) { got += v; matched.push(lbl); }
      else if (v >= 0.3 && SKILL_BY_ID.get(id)?.cat !== 'cert' && !OTHER_MARKET[market].includes(id)) { missing.push(lbl); missingIds.push(id); }
    }
    const skillPct = Math.min(98, Math.round((100 * got) / yard));
    // title evidence: what the candidate calls themselves (headline / latest job) — up to +30
    let titleBoost = 0;
    if (ev) {
      const h = ev.hits[role.id] || 0;
      titleBoost = Math.round(Math.min(5, h) * 6);
      // management roles need leadership signals too; execution/design roles are penalised when the CV reads as a manager's
      if (role.id === 'pm') titleBoost += Math.min(10, ev.leadership * 2);
      if (h === 0 && Object.values(ev.hits).some((v) => v >= 2)) titleBoost -= 8; // the CV clearly names another role in its headline/latest job
    }
    // what they call themselves can override the degree (an electrical graduate who works as "HVAC Design Engineer")
    let pen = disciplinePenalty(role.disc, disc);
    if (pen && ev && ev.titled[role.id] && role.id !== 'site') pen = Math.round(pen / 3);
    // technical office is a job title, not a skill set: shop drawings and submittals are everyone's daily work
    if (role.id === 'tech_office') pen += !ev || !ev.titled.tech_office ? 22 : TITLE_PATTERNS.tech_office.test(ev.headline + ' | ' + ev.recent) ? 0 : 11; // an earlier job only: half
    const pct = Math.max(0, Math.min(98, Math.round(skillPct * 0.75 + titleBoost - pen + ownBoost(role.disc))));
    return { role, pct, skillPct, titleBoost, matched, missing: missing.slice(0, 8), missingIds: missingIds.slice(0, 8) };
  });
  return scored.sort((a, b) => b.pct - a.pct);
}

export type Knockout = { id: 'years' | 'degree' | 'cert'; ok: boolean; need: string; have: string; near?: boolean };

export type JdMatch = {
  score: number; // final ATS ranking score 0-100
  rawScore: number; // before knock-out cap
  verdict: 'strong' | 'possible' | 'weak' | 'rejected';
  title: string;
  knockouts: Knockout[];
  must: { id: string; label: string; ok: boolean; evidence?: string }[];
  nice: { id: string; label: string; ok: boolean }[];
  literal: { kw: string; ok: boolean }[];
  parts: { must: number; nice: number; literal: number; title: number };
};

/** a certificate counts only when the CV states holding it — not a prep course, planned exam or expired/inactive status */
const NOT_HELD = /(prep(?:aration)?|preparing|exam not|not yet|planned|in progress|ongoing|pursuing|candidate|studying|training|course|bootcamp|expected|to be|inactive|expired|lapsed)/i;
export function hasCertificate(cvText: string, certId: string) {
  const sk = SKILL_BY_ID.get(certId);
  if (!sk) return false;
  const lower = normText(cvText).toLowerCase();
  for (const syn of sk.syn) {
    const body = syn.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '[\\s\\-_/]*');
    const re = new RegExp(`(?:^|[^a-z0-9])${body}(?=[^a-z0-9]|$)`, 'gi');
    let m: RegExpExecArray | null;
    while ((m = re.exec(lower))) {
      // judge only the ±45 chars around THIS mention, so "PMP, LEED GA (in progress)" still credits PMP
      const ctx = lower.slice(Math.max(0, m.index - 45), m.index + m[0].length + 45);
      const after = lower.slice(m.index + m[0].length, m.index + m[0].length + 45).split(/[,;|•\n]/)[0];
      if (!NOT_HELD.test(after) && !/(prep(?:aration)?|preparing|studying for|pursuing|candidate for|planning to|will take|exam not)\s*(?:for|the)?\s*$/i.test(lower.slice(Math.max(0, m.index - 45), m.index))) return true;
      void ctx;
    }
  }
  return false;
}

const tokens = (s: string) => new Set(s.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter((w) => w.length > 2 && !['senior', 'junior', 'engineer', 'the', 'and'].includes(w)));

export function matchJd(cvText: string, found: Map<string, Found>, years: number, jdText: string): JdMatch {
  const jd: ParsedJd = parseJd(jdText);
  const cvLower = normText(cvText).toLowerCase();

  // 1) knock-out filters (what auto-rejects candidates in real ATS)
  const knockouts: Knockout[] = [];
  // 5 asked, 4.5 in the CV: not met. Within a year it is "close" (many recruiters still read it); more than a year short fails the filter
  if (jd.yearsMin !== null) {
    const ok = years >= jd.yearsMin - 0.05;
    knockouts.push({ id: 'years', ok, near: !ok && jd.yearsMin - years <= 1, need: `${jd.yearsMin}+`, have: `${Math.round(years * 10) / 10}` });
  }
  if (jd.degree) {
    const degLines = cvText.split('\n').filter((l) => /(bachelor|b\.?\s?sc\b|b\.?\s?eng\b|\bbsc\b|\bbeng\b|\bmaster(?:'?s)?\b(?!\s*plan)|m\.?\s?sc\b|\bmsc\b|بكالوريوس|ماجستير)/i.test(l) && !/\bmastered\b/i.test(l));
    const anyDeg = degLines.length > 0;
    const engDeg = degLines.some((l) => /(engineering|engineer|هندس|mechanical|electrical|hvac|power)/i.test(l));
    const ok = jd.engDegree ? engDeg : anyDeg;
    knockouts.push({ id: 'degree', ok, need: jd.engDegree ? 'B.Sc. Eng.' : 'B.Sc.', have: engDeg ? 'B.Sc. Eng.' : anyDeg ? (degLines[0].match(/bachelor of (\w+)|b\.?\s?sc\.?\s*(?:in\s+)?(\w+)/i)?.slice(1).find(Boolean) || 'B.Sc.') : '—' });
  }
  for (const c of jd.certs) {
    const ok = hasCertificate(cvText, c);
    knockouts.push({ id: 'cert', ok, need: SKILL_BY_ID.get(c)?.label || c, have: ok ? '✓' : found.has(c) ? (SKILL_BY_ID.get(c)?.label ? 'mentioned only' : '—') : '—' });
  }

  // 2) skills coverage
  const must = jd.must.map((id) => ({ id, label: SKILL_BY_ID.get(id)?.label || id, ok: found.has(id), evidence: found.get(id)?.evidence }));
  const nice = jd.nice.map((id) => ({ id, label: SKILL_BY_ID.get(id)?.label || id, ok: found.has(id) }));
  const literal = jd.literal.slice(0, 15).map((kw) => ({ kw, ok: containsLiteral(cvLower, kw) }));

  const cov = (a: { ok: boolean }[], d: number) => (a.length ? a.filter((x) => x.ok).length / a.length : d);
  const mustC = cov(must, 0.6), niceC = cov(nice, 0.5), litC = cov(literal, 0.5);
  const jt = tokens(jd.title), ct = tokens(cvText.slice(0, 1500));
  const titleC = jt.size ? [...jt].filter((w) => ct.has(w)).length / jt.size : 0.5;

  // Must-have coverage is what shortlisting is really about; nice-to-haves, literal keywords and
  // title add or remove a few points around it. With no structured requirements, fall back to keywords+title.
  let rawScore: number;
  if (must.length) {
    rawScore = Math.round(100 * (0.7 * mustC + 0.1 * niceC + 0.1 * litC + 0.1 * titleC));
  } else {
    rawScore = Math.round(100 * (0.4 * niceC + 0.35 * litC + 0.25 * titleC));
  }
  let score = rawScore;
  const failed = knockouts.filter((k) => !k.ok && !k.near);
  if (knockouts.some((k) => k.near)) score = Math.min(score, 60); // close but short: a human may still read it, an ATS ranks it lower
  if (failed.length) score = Math.min(score, 35); // real ATS hides knocked-out candidates
  const verdict = failed.length ? 'rejected' : score >= 75 && !knockouts.some((k) => k.near) ? 'strong' : score >= 55 ? 'possible' : 'weak';
  return { score, rawScore, verdict, title: jd.title, knockouts, must, nice, literal, parts: { must: mustC, nice: niceC, literal: litC, title: titleC } };
}

export { findSkills, detectDisciplines };
