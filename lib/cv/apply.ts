/**
 * Application email + cover letter for one job post, written only from what the CV says.
 * Never claims a requirement the CV doesn't show; missing must-haves are left out, not invented.
 */
import { englishize, parseCv, polishBullet, enLine, type CvModel } from '@/lib/cv/rebuild';
import { findSkills } from '@/lib/ats/match';
import { SKILL_BY_ID } from '@/lib/ats/taxonomy';
import type { JdMatch } from '@/lib/ats/engine';

export type Application = { subject: string; email: string; letter: string; company: string; title: string; used: string[]; left: string[] };

const AR = /[؀-ۿ]/;
const list = (xs: string[]) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);
// "Designed …" → "designed …"; never "AutoCAD" → "autoCAD"
const lcFirst = (s: string) => (/^[A-Z][a-z]+(?=[\s,]|$)/.test(s) ? s[0].toLowerCase() + s.slice(1) : s);
const tidy = (s: string) => s.replace(/\s+/g, ' ').replace(/\s+([,.;])/g, '$1').trim();

/** company name from the post: "Company: X", "X is hiring", "About X", "Join X", "at X" */
export function jdCompany(jd: string): string {
  const t = jd.replace(/\r/g, '');
  const pats = [
    /^\s*(?:company|employer|organization|organisation|client)\s*(?:name)?\s*[:：\-]\s*(.{2,60})$/im,
    /^\s*(?:about|join)\s+(?:us\s*[:\-]\s*)?([A-Z][\w&.\- ]{1,50}?)\s*[:\n]/m,
    /\b([A-Z][\w&.\-]+(?:\s+(?:[A-Z][\w&.\-]+|&|and|for|of)){0,5})\s+(?:is|are)\s+(?:hiring|looking|seeking|currently\s+(?:hiring|looking|seeking))/,
    /\b(?:at|with|join)\s+([A-Z][\w&.\-]+(?:\s+(?:[A-Z][\w&.\-]+|&|for|of)){0,5})(?=[,.\n]|\s+(?:is|in|we|as)\b)/
  ];
  for (const re of pats) {
    const m = t.match(re);
    const v = m?.[1]?.trim().replace(/[.,:;]+$/, '');
    if (v && !/^(we|our|the|a|an|this|you|your|us|mep|hvac|bim|ksa|uae|egypt|saudi|riyadh|cairo|dubai|jeddah)$/i.test(v) && v.length <= 60) return v;
  }
  return '';
}

function cleanTitle(t: string) {
  return tidy(t.replace(/^(job\s*title|position|role|vacancy|we\s+are\s+hiring)\s*[:\-–]\s*/i, '').replace(/^.*?\b(?:is|are)\s+(?:urgently\s+)?(?:hiring|looking\s+for|seeking)\s+(?:an?\s+)?/i, '').replace(/^(?:hiring|wanted|urgent(?:ly)?(?:\s+hiring)?)\s*[:\-–]?\s*(?:an?\s+)?/i, '').replace(/\s*\([^)]*\b(?:urgent|hiring|immediate|ksa|uae|egypt|riyadh|cairo|dubai|jeddah|remote|full[\s-]?time)\b[^)]*\)/gi, '').replace(/\s*[-–|]\s*[^-–|]*\b(?:urgent|hiring|immediate|ksa|uae|egypt|riyadh|cairo|dubai|jeddah|remote|full[\s-]?time)\b[^-–|]*$/i, '').replace(/[!.]+$/, '')).slice(0, 70);
}

export function buildApplication(cvText: string, jd: string, r: JdMatch, years: number): Application {
  const m: CvModel = englishize(parseCv(cvText));
  // an Arabic CV goes through a word-by-word English pass: good enough for names and titles, not for quoting bullets in a letter
  const arabicCv = (cvText.match(/[\u0600-\u06FF]/g) || []).length / Math.max(1, cvText.replace(/\s/g, '').length) > 0.3;
  const title = cleanTitle(r.title) || 'the advertised position';
  const company = jdCompany(jd);
  const name = m.name && !AR.test(m.name) ? m.name : 'Your Name';

  // requirements the CV actually shows, and the ones it doesn't (left out of the letter on purpose)
  const lab = (x: string) => {
    const parts = x.replace(/\s*\(general\)/i, '').split(/\s+\/\s+/);
    return parts.filter((p) => !parts.some((q) => q !== p && q.toLowerCase().includes(p.toLowerCase()))).join(' / ');
  };
  const okMust = r.must.filter((x) => x.ok).map((x) => lab(x.label));
  const okNice = r.nice.filter((x) => x.ok).map((x) => lab(x.label));
  const left = r.must.filter((x) => !x.ok).map((x) => lab(x.label));
  const want = new Set([...r.must.filter((x) => x.ok).map((x) => x.id), ...r.nice.filter((x) => x.ok).map((x) => x.id)]);

  // the two bullets from the CV that prove the most of what the post asks for
  const cands: { b: string; job: string; company: string; s: number }[] = [];
  if (!arabicCv) m.experience.forEach((e, i) => {
    for (const raw of e.orig || e.bullets) {
      const b0 = AR.test(raw) ? enLine(raw) : raw;
      if (!b0 || AR.test(b0)) continue;
      const b = polishBullet(b0).replace(/\.$/, '').replace(/^([A-Z]\w+ [\w&/ ]{2,25}):\s+/, '$1, including ');
      if (b.length < 25) continue;
      const hits = [...findSkills(b).keys()].filter((id) => want.has(id)).length;
      const num = /\d/.test(b.replace(/\b(19|20)\d{2}\b/g, '')) ? 1 : 0;
      cands.push({ b, job: e.title, company: e.company, s: hits * 3 + num * 2 + (i === 0 ? 1 : 0) });
    }
  });
  const best = cands.sort((a, b) => b.s - a.s).filter((c, i, a) => a.findIndex((x) => x.b === c.b) === i).slice(0, 3);

  const cur = m.experience[0];
  const y = Math.floor(years);
  const yrs = y >= 1 ? `${y}+ year${y > 1 ? 's' : ''}` : '';
  const curRole = cur?.title ? `${cur.title}${cur.company ? ` at ${cur.company}` : ''}` : '';
  const at = company ? ` at ${company}` : '';
  const to = company ? `${company} Hiring Team` : 'Hiring Manager';

  const degree = m.education.map((l) => l.replace(/\s*[|,]\s*(?:grade|gpa|(?:19|20)\d{2}).*$/i, '')).find((l) => /(bachelor|b\.?\s?sc|b\.?\s?eng|master|m\.?\s?sc)/i.test(l) && !AR.test(l));
  const fresh = !yrs && !curRole && degree ? ` I recently graduated with a ${degree.replace(/^bachelor of/i, "Bachelor's degree in").replace(/\s+[–-]\s+/, ' from ')}.` : '';
  const opening = yrs
    ? `I am applying for the ${title} position${at}. I bring ${yrs} of experience${curRole ? `, currently as ${curRole}` : ''}.`
    : `I am applying for the ${title} position${at}.${curRole ? ` I am currently working as ${curRole}.` : fresh}`;

  const proof = best.length
    ? best.map((c, i) => {
        const where = c.company && (i === 0 || c.company !== best[i - 1].company) ? `${i === 0 ? 'At' : 'Before that, at'} ${c.company}, ` : '';
        return where ? `${where}I ${lcFirst(c.b)}.` : `${i === 1 ? 'I also' : 'In addition, I'} ${lcFirst(c.b)}.`;
      }).join(' ')
    : '';

  const reqLine = okMust.length
    ? `Your post asks for ${list(okMust.slice(0, 5))}, and my CV shows hands-on work in ${okMust.length === 1 ? 'it' : 'each of them'}${okNice.length ? `, along with ${list(okNice.slice(0, 3))}` : ''}.`
    : okNice.length ? `I also bring ${list(okNice.slice(0, 3))}, which your post lists as a plus.` : '';

  const certs = arabicCv ? [] : m.certifications.filter((c) => !AR.test(c)).map((c) => c.split(/\s+[–-]\s+|\s*\(|,\s*(?:19|20)\d{2}/)[0].trim()).filter((c) => c.length > 2 && c.length < 60).slice(0, 2);
  const courses = certs.filter((c) => /course|diploma|training|workshop|bootcamp|program/i.test(c));
  const held = certs.filter((c) => !courses.includes(c));
  const certLine = [held.length ? `I hold ${list(held)}.` : '', courses.length ? `I completed the ${list(courses)}.` : ''].filter(Boolean).join(' ');
  // a fresh graduate's strongest proof is usually the graduation project
  const gp = !best.length ? [...m.education, ...(m.additional || []), ...(m.keyProjects || [])].map((l) => l.match(/graduation\s+project[^:]*:\s*["“]?([^"”]{8,90})/i)?.[1]).find(Boolean) : '';
  const gpLine = gp ? `My graduation project was "${gp.trim()}".` : '';

  const contact = [m.phone, m.email].filter(Boolean).join(' | ');
  const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  const letter = [
    name, [m.location, contact, m.linkedin].filter(Boolean).join(' | '), '', date, '',
    `Dear ${to},`, '',
    tidy(opening), '',
    ...(proof || gpLine ? [tidy(proof || gpLine), ''] : []),
    ...(reqLine || certLine ? [tidy([reqLine, certLine].filter(Boolean).join(' ')), ''] : []),
    tidy(`I would welcome the chance to discuss how I can support your team${company ? ` at ${company}` : ''}. My CV is attached, and I am available for an interview at your convenience.`), '',
    'Kind regards,', name
  ].join('\n');

  const email = [
    `Dear ${to},`, '',
    tidy(`I would like to apply for the ${title} position${at}. ` + (() => {
      const skills = okMust.length ? `, with hands-on work in ${list(okMust.slice(0, 4))}` : '';
      if (yrs) return `I have ${yrs} of experience${curRole ? `, currently as ${curRole}` : ''}${skills}.`;
      if (curRole) return `I am currently working as ${curRole}${skills}.`;
      return okMust.length ? `My experience covers ${list(okMust.slice(0, 4))}.` : '';
    })()),
    '',
    best[0] ? tidy(`Most relevant to this role: I ${lcFirst(best[0].b)}.`) : '',
    '',
    'Please find my CV and cover letter attached. I would be glad to discuss the role at your convenience.', '',
    'Best regards,', name, contact
  ].filter((l, i, a) => !(l === '' && a[i - 1] === '')).join('\n');

  const subject = `Application for ${title}${name !== 'Your Name' ? ` – ${name}` : ''}`;
  return { subject, email, letter, company, title, used: okMust, left };
}
