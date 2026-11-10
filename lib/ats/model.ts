/**
 * MEP LAB ATS model = learned numbers the engine scores with.
 * v0 (default) is built from the knowledge graph; training on real job posts
 * (lib/ats/train.ts) replaces the weights and salary figures over time.
 */
import { SKILLS, type Skill } from './taxonomy';
import { learnedSkill } from './learn';
import { ROLES, type Market } from '@/lib/cv/data';

export type SalaryStat = { n: number; p25: number; p50: number; p75: number };

export type AtsModel = {
  version: string;
  trained_at: string | null;
  jobs_used: number;
  /** role -> market|'all' -> skill -> weight 0..1 */
  weights: Record<string, Record<string, Record<string, number>>>;
  /** role -> market -> monthly salary stats from job posts (local currency) */
  salary: Record<string, Partial<Record<Market, SalaryStat>>>;
  /** role -> market -> number of job posts learned from */
  samples: Record<string, Partial<Record<Market, number>>>;
  /** role -> frequent terms in job posts that the knowledge graph does not cover yet */
  emerging: Record<string, string[]>;
  /** learned from checked CVs (lib/ats/learn.ts) */
  cvs_used?: number;
  cvs_confirmed?: number;
  /** role -> vocabulary the engine learned from CVs of that role */
  learned?: Record<string, { term: string; n: number; share: number }[]>;
  /** most frequent corrections people made: detected → confirmed */
  confusions?: { from: string; to: string; n: number }[];
  /** ATS score histograms of checked CVs (21 buckets of 5 points) — for "better than X% of engineers" */
  score_dist?: { all?: ScoreHist; role?: Record<string, ScoreHist>; disc?: Record<string, ScoreHist> };
};
export type ScoreHist = { n: number; h: number[] };

/** share of checked CVs (same role → discipline → everyone, whichever has enough data) that scored below this one */
export function percentile(model: AtsModel, score: number, roleId: string, disc: string | null, minN = 30): { pct: number; n: number; scope: 'role' | 'disc' | 'all' } | null {
  const d = model.score_dist; if (!d) return null;
  const pick: [ScoreHist | undefined, 'role' | 'disc' | 'all'][] = [[d.role?.[roleId], 'role'], [disc ? d.disc?.[disc] : undefined, 'disc'], [d.all, 'all']];
  for (const [hist, scope] of pick) {
    if (!hist || hist.n < minN) continue;
    const b = Math.max(0, Math.min(20, Math.floor(score / 5)));
    const below = hist.h.slice(0, b).reduce((x, y) => x + y, 0) + hist.h[b] * 0.5;
    return { pct: Math.max(1, Math.min(99, Math.round((100 * below) / hist.n))), n: hist.n, scope };
  }
  return null;
}

export function priorWeights(roleId: string): Record<string, number> {
  const w: Record<string, number> = {};
  for (const s of SKILLS) {
    const v = s.roles[roleId];
    if (v) w[s.id] = Math.round((v / 3) * 1000) / 1000;
  }
  return w;
}

export function defaultModel(): AtsModel {
  const weights: AtsModel['weights'] = {};
  for (const r of ROLES) weights[r.id] = { all: priorWeights(r.id) };
  return { version: '0.1-prior', trained_at: null, jobs_used: 0, weights, salary: {}, samples: {}, emerging: {} };
}

/** every learned term as a matchable skill */
export function learnedSkills(model: AtsModel): Skill[] {
  const terms = new Set(Object.values(model.learned || {}).flat().map((x) => x.term));
  return [...terms].map(learnedSkill);
}

export function weightsFor(model: AtsModel, roleId: string, market: Market) {
  return model.weights[roleId]?.[market] || model.weights[roleId]?.all || priorWeights(roleId);
}
