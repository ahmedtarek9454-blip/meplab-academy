/**
 * =====================================================================
 *  MEP LAB ATS — training
 *  Learns from real job posts (jobs table):
 *   • skill weights per role & market  = how often employers ask for each
 *     skill, blended with the knowledge-graph prior (Bayesian smoothing)
 *   • salary stats per role & market   = parsed from posts that show pay
 *   • emerging terms                    = frequent words employers use that
 *     the knowledge graph does not cover yet (→ add them to taxonomy.ts)
 * =====================================================================
 */
import { ROLES, MARKETS, type Market } from '@/lib/cv/data';
import { SKILLS } from './taxonomy';
import { findSkills, keywords } from './match';
import { priorWeights, type AtsModel, type SalaryStat, type ScoreHist } from './model';
import { labelOf, learnTerms, type SignalRow } from './learn';

const SKILL_IDS = new Set(SKILLS.map((s) => s.id));

export type TrainJob = { title: string; snippet?: string | null; role_id: string | null; market: Market; salary?: string | null };

const ALPHA = 12; // prior strength (how many "virtual" posts the prior is worth)
const MARKET_LIST = Object.keys(MARKETS) as Market[];

/* ---------- salary parsing → monthly, local currency ---------- */
const CUR: Record<Market, RegExp> = {
  eg: /(egp|le\b|l\.e|جنيه|ج\.م)/i,
  sa: /(sar|sr\b|riyal|ريال|ر\.س)/i,
  ae: /(aed|dhs|dirham|درهم|د\.إ)/i
};
const PLAUSIBLE: Record<Market, [number, number]> = { eg: [4000, 400000], sa: [2500, 80000], ae: [2500, 90000] };

export function parseSalary(raw: string | null | undefined, market: Market): number | null {
  if (!raw) return null;
  const s = raw.toLowerCase().replace(/,/g, '');
  const other = (Object.keys(CUR) as Market[]).filter((m) => m !== market).some((m) => CUR[m].test(s));
  if (other || /usd|\$|eur|€|gbp|£/.test(s)) return null;
  const nums = [...s.matchAll(/(\d+(?:\.\d+)?)\s*(k)?/g)].map((m) => parseFloat(m[1]) * (m[2] ? 1000 : 1)).filter((n) => n >= 100);
  if (!nums.length) return null;
  let v = nums.length >= 2 ? (nums[0] + nums[1]) / 2 : nums[0];
  if (/year|annual|annum|p\.a|yearly|سنوي/.test(s)) v /= 12;
  else if (/hour|hr\b|ساعة/.test(s)) v *= 200;
  else if (/day|daily|يوم/.test(s)) v *= 26;
  else if (/week/.test(s)) v *= 4.33;
  const [lo, hi] = PLAUSIBLE[market];
  return v >= lo && v <= hi ? Math.round(v) : null;
}

const q = (sorted: number[], p: number) => {
  const i = (sorted.length - 1) * p, a = Math.floor(i), b = Math.ceil(i);
  return Math.round(sorted[a] + (sorted[b] - sorted[a]) * (i - a));
};

/* ---------- training ---------- */
const BETA = 0.7; // one confirmed CV is worth 0.7 of a job post when learning skill weights

export function trainModel(jobs: TrainJob[], cvs: SignalRow[] = [], blocked: Set<string> = new Set()): AtsModel {
  const covered = new Set(SKILLS.flatMap((s) => s.syn.flatMap((x) => x.toLowerCase().split(/\s+/))));
  const model: AtsModel = { version: '', trained_at: new Date().toISOString(), jobs_used: 0, weights: {}, salary: {}, samples: {}, emerging: {} };

  // pre-parse every post once
  const parsed = jobs
    .filter((j) => j.role_id && j.title)
    .map((j) => {
      const text = `${j.title}\n${j.snippet || ''}`;
      return { ...j, skills: new Set(findSkills(text).keys()), kws: keywords(text, 30) };
    });
  model.jobs_used = parsed.length;

  // CVs people checked: labelled by their confirmation (or, at half weight, a confident engine)
  const labelled = cvs.map((s) => ({ s, l: labelOf(s) })).filter((x): x is { s: SignalRow; l: { role: string; w: number } } => !!x.l);
  model.cvs_used = cvs.length;
  model.cvs_confirmed = cvs.filter((s) => s.confirmed_role).length;
  model.learned = learnTerms(cvs, blocked);
  const conf = new Map<string, number>();
  for (const s of cvs) if (s.confirmed_role && s.confirmed_role !== s.role_id) conf.set(`${s.role_id}>${s.confirmed_role}`, (conf.get(`${s.role_id}>${s.confirmed_role}`) || 0) + 1);
  // score distribution of checked CVs (each check once) for the market comparison
  const hist = (): ScoreHist => ({ n: 0, h: Array(21).fill(0) });
  const add = (H: ScoreHist, sc: number) => { H.n++; H.h[Math.max(0, Math.min(20, Math.floor(sc / 5)))]++; };
  const dist: NonNullable<AtsModel['score_dist']> = { all: hist(), role: {}, disc: {} };
  for (const s of cvs) {
    if (typeof s.score !== 'number') continue;
    const role = s.confirmed_role || s.role_id;
    add(dist.all!, s.score); add((dist.role![role] ||= hist()), s.score);
    if (s.discipline) add((dist.disc![s.discipline] ||= hist()), s.score);
  }
  model.score_dist = dist;
  model.confusions = [...conf.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([k, n]) => ({ from: k.split('>')[0], to: k.split('>')[1], n }));

  for (const role of ROLES) {
    const prior = priorWeights(role.id);
    const posts = parsed.filter((p) => p.role_id === role.id);
    model.weights[role.id] = {};
    model.samples[role.id] = {};
    model.salary[role.id] = {};

    const roleCvs = labelled.filter((x) => x.l.role === role.id);
    const learn = (subset: typeof posts, cvSub: typeof roleCvs) => {
      let n = subset.length;
      const df: Record<string, number> = {};
      for (const p of subset) for (const id of p.skills) df[id] = (df[id] || 0) + 1;
      for (const { s, l } of cvSub) {
        n += BETA * l.w;
        for (const id of new Set(s.skills || [])) if (SKILL_IDS.has(id)) df[id] = (df[id] || 0) + BETA * l.w;
      }
      const ids = new Set([...Object.keys(prior), ...Object.keys(df)]);
      const w: Record<string, number> = {};
      for (const id of ids) {
        // prior importance 0..1 → expected share of posts asking for it (max ~0.6)
        const p0 = (prior[id] || 0) * 0.6;
        const share = ((df[id] || 0) + ALPHA * p0) / (n + ALPHA);
        if (share >= 0.04) w[id] = share;
      }
      // normalise so the most-demanded skill = 1
      const mx = Math.max(...Object.values(w), 0.0001);
      for (const id in w) w[id] = Math.round((w[id] / mx) * 1000) / 1000;
      // vocabulary learned from this role's CVs joins the role profile
      for (const x of model.learned?.[role.id] || []) w[`l:${x.term}`] = Math.round(Math.min(0.6, x.share * 2) * 1000) / 1000;
      return w;
    };

    model.weights[role.id].all = learn(posts, roleCvs);
    for (const m of MARKET_LIST) {
      const sub = posts.filter((p) => p.market === m);
      model.samples[role.id][m] = sub.length;
      if (sub.length >= 15) model.weights[role.id][m] = learn(sub, roleCvs.filter((x) => x.s.market === m)); // only when enough market data

      const pays = sub.map((p) => parseSalary(p.salary, m)).filter((v): v is number => v !== null).sort((a, b) => a - b);
      if (pays.length >= 3) model.salary[role.id][m] = { n: pays.length, p25: q(pays, 0.25), p50: q(pays, 0.5), p75: q(pays, 0.75) } as SalaryStat;
    }

    // emerging: frequent post keywords no synonym covers yet
    const freq = new Map<string, number>();
    for (const p of posts) for (const k of p.kws) if (!k.split(' ').every((w) => covered.has(w))) freq.set(k, (freq.get(k) || 0) + 1);
    model.emerging[role.id] = [...freq.entries()].filter(([, c]) => c >= 3).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([k]) => k);
  }

  model.version = `1.${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`;
  return model;
}
