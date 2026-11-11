import { analyzeCv } from '../lib/cv/analyze';
const fs = require('fs');
const mep = JSON.parse(fs.readFileSync('./evalset/cases.json', 'utf8'));
const multi = JSON.parse(fs.readFileSync('./evalset/multi_cases.json', 'utf8'));
const all = [...mep.map((c: any) => c.text || c.cv || ''), ...multi.map((c: any) => c.text)];
analyzeCv(all[0], 'eg'); // warm-up
const times: number[] = [];
let ok = 0;
for (const c of multi) {
  const t = performance.now(); const r: any = analyzeCv(c.text, 'eg'); times.push(performance.now() - t);
  const exp = c.expected.role; const got = r.matches?.[0]?.role?.id ?? r.roles?.[0]?.role?.id;
  if (got === exp || (c.expected.acceptable_roles || []).includes(got)) ok++;
}
for (const txt of all.slice(0, mep.length)) { const t = performance.now(); analyzeCv(txt, 'sa'); times.push(performance.now() - t); }
times.sort((a, b) => a - b);
console.log(`multi-discipline role ${ok}/${multi.length}`);
console.log(`analyses ${times.length} | median ${times[times.length >> 1].toFixed(1)}ms | p95 ${times[Math.floor(times.length * .95)].toFixed(1)}ms | max ${times[times.length - 1].toFixed(1)}ms`);
