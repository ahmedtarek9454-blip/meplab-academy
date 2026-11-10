import { SKILLS, type Skill } from './taxonomy';

/** compile every synonym once: word-boundary match, tolerant to plurals and -, /, spaces */
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
type Compiled = { skill: Skill; res: RegExp[] };
let compiled: Compiled[] | null = null;
const compileOne = (skill: Skill): Compiled => ({
    skill,
    res: skill.syn.map((syn) => {
      const body = esc(syn.toLowerCase()).replace(/\\-|\s+/g, '[\\s\\-_/]*');
      return /[a-z]/.test(syn)
        ? new RegExp(`(?:^|[^a-z0-9])(${body}(?:s|es)?)(?=[^a-z0-9]|$)`, 'gi')
        : new RegExp(`(${body})`, 'g');
    })
  });
function compile() {
  if (compiled) return compiled;
  compiled = SKILLS.map(compileOne);
  return compiled;
}
const extraCache = new Map<string, Compiled>();

export function normText(t: string) {
  return t.replace(/\r/g, '').replace(/[–—]/g, '-').replace(/[“”]/g, '"').replace(/[ \t]+/g, ' ');
}

export type Found = { id: string; label: string; cat: Skill['cat']; hits: number; evidence: string };

/** find all taxonomy skills in a text, with a short evidence snippet */
export function findSkills(text: string, extra: Skill[] = []): Map<string, Found> {
  const t = normText(text);
  const lower = t.toLowerCase();
  const out = new Map<string, Found>();
  const ex = extra.map((k) => { let c = extraCache.get(k.id); if (!c) { c = compileOne(k); extraCache.set(k.id, c); } return c; });
  for (const { skill, res } of [...compile(), ...ex]) {
    let hits = 0, at = -1;
    for (const re of res) {
      re.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = re.exec(lower))) {
        hits++;
        if (at < 0) at = m.index;
        if (m[0].length === 0) re.lastIndex++;
      }
    }
    if (hits) {
      const a = Math.max(0, lower.lastIndexOf('\n', at) + 1);
      let b = lower.indexOf('\n', at); if (b < 0) b = t.length;
      out.set(skill.id, { id: skill.id, label: skill.label, cat: skill.cat, hits, evidence: t.slice(a, Math.min(b, a + 160)).trim() });
    }
  }
  return out;
}

/* ---------- literal keyword extraction (what an ATS literally searches for) ---------- */
const STOP = new Set(('a an the and or of to in on for with by at from as is are be will shall must should can may this that these those our your their we you they it its ' +
  'have has having experience experienced years year minimum least knowledge good strong excellent ability able work working working skills skill required requirement requirements ' +
  'preferred plus advantage candidate candidates role position job company team project projects responsibilities including include etc using use well also other new related relevant ' +
  'degree bachelor engineering engineer engineers mechanical field similar within across level senior junior mid lead manager based office site client clients please apply send cv resume coordinator modeler modeller specialist technician supervisor salary benefits ' +
  'لا في من على الى إلى مع عن او أو و ال هذا هذه').split(/\s+/));

const PLACES = new Set('riyadh jeddah dammam khobar mecca makkah madinah medina neom ksa saudi arabia uae dubai abu dhabi sharjah ajman qatar doha kuwait oman muscat bahrain egypt cairo giza alexandria new remote onsite hybrid full time part'.split(' '));

export function keywords(text: string, max = 25): string[] {
  const freq = new Map<string, number>();
  const ok = (w: string) => w.length > 2 && !STOP.has(w) && !PLACES.has(w) && !/^\d/.test(w);
  // split into phrases first so bigrams never cross punctuation or line breaks
  const phrases = normText(text).toLowerCase().split(/[\n,.;:()|•*!?"]+|\s-\s|\s—\s/);
  for (const ph of phrases) {
    const words = ph.replace(/[^a-z0-9+#&/\s-]/g, ' ').split(/\s+/).map((w) => w.replace(/^[\-/]+|[\-/]+$/g, '')).filter(Boolean);
    for (let i = 0; i < words.length; i++) {
      const w = words[i];
      if (ok(w)) freq.set(w, (freq.get(w) || 0) + 1);
      const w2 = words[i + 1];
      if (w2 && ok(w) && ok(w2)) { const bg = `${w} ${w2}`; freq.set(bg, (freq.get(bg) || 0) + 1.6); }
    }
  }
  const ranked = [...freq.entries()].sort((a, b) => b[1] - a[1]).map(([k]) => k);
  // keep a bigram over its parts when the bigram is frequent enough
  const out: string[] = [];
  for (const k of ranked) {
    if (out.some((p) => p.includes(k) || k.includes(p))) continue;
    out.push(k);
    if (out.length >= max) break;
  }
  return out;
}

export function containsLiteral(haystackLower: string, kw: string) {
  const body = esc(kw).replace(/\s+/g, '[\\s\\-_/]*');
  return new RegExp(`(?:^|[^a-z0-9])${body}(?:s|es)?(?=[^a-z0-9]|$)`, 'i').test(haystackLower);
}
