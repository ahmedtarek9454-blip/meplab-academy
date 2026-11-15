/* Discipline check: the department in the degree decides the discipline; technical office only when the title says so. Run: npx tsx tools/eval-disciplines.ts */
import fs from 'fs'; import { analyzeCv } from './lib/cv/analyze';
const C = JSON.parse(fs.readFileSync('./evalset/disciplines.json','utf8')); let bad=0;
for (const c of C) { const a:any = analyzeCv(c.text, 'eg'); const top = a.roles.slice(0,4).map((r:any)=>r.role.id+':'+r.pct);
  const issues:string[]=[]; if (a.discipline?.id !== c.disc && !(c.disc==='mep' && a.discipline?.id==='mech')) issues.push(`disc ${a.discipline?.id}≠${c.disc}`);
  if (!c.roles.includes(a.roles[0].role.id)) issues.push(`top ${a.roles[0].role.id}`);
  if (c.notech && a.roles.slice(0,4).some((r:any)=>r.role.id==='tech_office' && r.pct>=25)) issues.push('tech_office shown');
  if (issues.length) bad++; console.log(c.id.padEnd(16), (a.discipline?.ar||'-').padEnd(16), top.join(' '), issues.length? '  <== '+issues.join('; '):''); }
console.log('bad', bad, '/', C.length);
