/** how many ways people actually write a skill the engine understands (and that it doesn't over-read) */
import fs from 'fs';
import { findSkills } from '../lib/ats/match';
const pos = JSON.parse(fs.readFileSync(__dirname + '/../evalset/phrasing.json', 'utf8')) as [string, string[]][];
const neg = JSON.parse(fs.readFileSync(__dirname + '/../evalset/phrasing-neg.json', 'utf8')) as [string, string][];
let need = 0, got = 0, fp = 0;
for (const [t, ids] of pos) { const f = findSkills(t); for (const id of ids) { need++; if (f.has(id)) got++; else console.log('MISS', id.padEnd(14), t); } }
for (const [t, id] of neg) if (findSkills(t).has(id)) { fp++; console.log('FALSE', id.padEnd(14), t); }
console.log(`==== phrasing recall ${got}/${need} (${Math.round((100 * got) / need)}%) | false positives ${fp}/${neg.length}`);
