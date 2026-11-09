import { analyzeCv } from '../lib/cv/analyze';
import { findSkills, matchJd } from '../lib/ats/engine';
import { SKILLS } from '../lib/ats/taxonomy';
const fs = require('fs');
const cases = JSON.parse(fs.readFileSync('./evalset/cases.json', 'utf8'));
const jds = JSON.parse(fs.readFileSync('./evalset/jd_cases.json', 'utf8'));
const verbose = process.argv.includes('-v');
const only = (process.argv.find((a) => a.startsWith('--only=')) || '').slice(7).split(',').filter(Boolean);

// map plain skill phrases → taxonomy ids via synonyms/labels
const lc = (s: string) => s.toLowerCase();
function idsFor(phrase: string) {
  const p = lc(phrase);
  return SKILLS.filter((s) => lc(s.label).includes(p) || s.syn.some((x) => x === p || p.includes(x) || x.includes(p))).map((s) => s.id);
}

let roleOk = 0, roleAcc = 0, yearsOk = 0, levelOk = 0, skillTot = 0, skillHit = 0, qualOk = 0;
const fails: string[] = [];
for (const c of cases) {
  if (only.length && !only.includes(c.id)) continue;
  const e = c.expected;
  const r = analyzeCv(c.text, 'sa');
  const top = r.roles[0].role.id;
  const rOk = top === e.role, rAcc = rOk || (e.acceptable_roles || []).includes(top);
  const yOk = r.years >= e.years_min - 0.3 && r.years <= e.years_max + 0.3;
  const lOk = r.level === e.level;
  const found = new Set(r.skills.map((s) => s.id));
  const miss: string[] = [];
  for (const ph of e.must_find_skills) { skillTot++; const ids = idsFor(ph); if (ids.some((id) => found.has(id))) skillHit++; else miss.push(ph + (ids.length ? '' : '(no-id)')); }
  const q = r.score >= 75 ? 'good' : r.score >= 50 ? 'ok' : 'poor';
  const qOk = q === e.ats_quality || (q === 'ok' && e.ats_quality !== (q === 'ok' ? 'x' : '')) && Math.abs(['poor', 'ok', 'good'].indexOf(q) - ['poor', 'ok', 'good'].indexOf(e.ats_quality)) <= 1;
  roleOk += +rOk; roleAcc += +rAcc; yearsOk += +yOk; levelOk += +lOk; qualOk += +qOk;
  const line = `${c.id} role ${rOk ? '✓' : rAcc ? '~' : '✗'} ${top}(${r.roles[0].pct})${rOk ? '' : ' exp ' + e.role} | yrs ${yOk ? '✓' : '✗'} ${r.years}${yOk ? '' : ` exp ${e.years_min}-${e.years_max}`} | lvl ${lOk ? '✓' : '✗'} ${r.level}${lOk ? '' : ' exp ' + e.level} | ats ${r.score} (${e.ats_quality}) | miss: ${miss.join(', ') || '-'}`;
  if (verbose || !rAcc || !yOk || !lOk || miss.length) fails.push(line + (e.notes && (!rAcc || !yOk || !lOk) ? `\n      ↳ ${e.notes}` : ''));
}
let koOk = 0, fitOk = 0, fitNear = 0;
const jfails: string[] = [];
for (const j of jds) {
  if (only.length && !only.includes(j.id)) continue;
  const cv = cases.find((c: any) => c.id === j.cv_id);
  const r = analyzeCv(cv.text, 'sa');
  const m = matchJd(cv.text, findSkills(cv.text), r.years, j.jd);
  const ko = m.verdict === 'rejected';
  const kOk = ko === j.expected.knocked_out;
  // fit ignoring knockouts
  const fit = m.score >= 75 ? 'strong' : m.score >= 55 ? 'possible' : 'weak';
  const sc2 = (m as any).rawScore ?? m.score;
  const fit2 = sc2 >= 75 ? 'strong' : sc2 >= 55 ? 'possible' : 'weak';
  const order = ['weak', 'possible', 'strong'];
  const fOk = fit2 === j.expected.fit, fNear = Math.abs(order.indexOf(fit2) - order.indexOf(j.expected.fit)) <= 1;
  koOk += +kOk; fitOk += +fOk; fitNear += +fNear;
  const line = `${j.id}(${j.cv_id}) ko ${kOk ? '✓' : '✗'} ${ko ? 'KO[' + m.knockouts.filter((k) => !k.ok).map((k) => k.id + ':' + k.need).join(',') + ']' : 'pass'} exp ${j.expected.knocked_out ? 'KO[' + j.expected.knockout_reasons + ']' : 'pass'} | fit ${fOk ? '✓' : '✗'} ${fit2}(${sc2}) exp ${j.expected.fit} | must ${m.must.filter((x) => x.ok).length}/${m.must.length} nice ${m.nice.filter((x) => x.ok).length}/${m.nice.length} lit ${Math.round(m.parts.literal * 100)}%`;
  if (verbose || !kOk || !fOk) jfails.push(line + `\n      ↳ ${j.expected.notes}`);
}
const n = only.length ? only.filter((o) => o.startsWith('cv')).length : cases.length, nj = only.length ? only.filter((o) => o.startsWith('jd')).length : jds.length;
console.log(fails.join('\n'));
console.log(jfails.join('\n'));
console.log(`\n==== CV (${n}) role exact ${roleOk}/${n}  acceptable ${roleAcc}/${n} | years ${yearsOk}/${n} | level ${levelOk}/${n} | skills ${skillHit}/${skillTot} | ats quality ±1 ${qualOk}/${n}`);
console.log(`==== JD (${nj}) knockout ${koOk}/${nj} | fit exact ${fitOk}/${nj} near ${fitNear}/${nj}`);
