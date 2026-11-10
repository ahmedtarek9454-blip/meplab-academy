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
};

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
