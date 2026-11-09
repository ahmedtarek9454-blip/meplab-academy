/** DOCX (editable) + print-ready HTML for "Save as PDF" — both generated in the browser. */
import type { CvModel } from './rebuild';

const CAT_LABEL: Record<string, string> = { design: 'HVAC Design', systems: 'HVAC Systems', fire: 'Fire Protection', plumbing: 'Plumbing', software: 'Software', codes: 'Codes & Standards', execution: 'Execution & BIM', office: 'Technical Office', commercial: 'Commercial', management: 'Management', other: 'Other Tools' };

export async function buildDocx(m: CvModel, summary: string): Promise<Blob> {
  const D: any = await import('docx');
  const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle, TabStopType } = D;
  const font = 'Calibri';
  const P = (text: string, o: any = {}) => new Paragraph({ children: [new TextRun({ text, font, size: o.size || 21, bold: o.bold, color: o.color })], alignment: o.align, spacing: { after: o.after ?? 60, before: o.before ?? 0 }, bullet: o.bullet ? { level: 0 } : undefined });
  const H = (text: string) => new Paragraph({
    children: [new TextRun({ text: text.toUpperCase(), font, size: 22, bold: true, color: '0B1B3A' })],
    spacing: { before: 220, after: 80 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '1E5BD6', space: 2 } }
  });
  const kids: any[] = [];
  kids.push(new Paragraph({ children: [new TextRun({ text: m.name.toUpperCase(), font, size: 36, bold: true, color: '0B1B3A' })], alignment: AlignmentType.CENTER, spacing: { after: 40 } }));
  if (m.headline) kids.push(P(m.headline, { size: 24, color: '1E5BD6', align: AlignmentType.CENTER, after: 40 }));
  kids.push(P([m.location, m.phone, m.email, m.linkedin].filter(Boolean).join('  |  '), { size: 19, color: '475569', align: AlignmentType.CENTER, after: 120 }));
  kids.push(H('Professional Summary'), P(summary, { after: 80 }));
  const cats = Object.keys(m.skills);
  if (cats.length) {
    kids.push(H('Core Skills'));
    for (const c of cats) kids.push(new Paragraph({ children: [new TextRun({ text: `${CAT_LABEL[c] || c}: `, font, size: 21, bold: true }), new TextRun({ text: m.skills[c].join(', '), font, size: 21 })], spacing: { after: 40 } }));
  }
  if (m.experience.length) {
    kids.push(H('Professional Experience'));
    for (const e of m.experience) {
      kids.push(new Paragraph({
        children: [new TextRun({ text: e.title, font, size: 22, bold: true }), new TextRun({ text: `\t${e.dates}`, font, size: 20, color: '475569' })],
        tabStops: [{ type: TabStopType.RIGHT, position: 9360 }], spacing: { before: 120, after: 20 }
      }));
      kids.push(P([e.company, e.location].filter(Boolean).join(', '), { size: 20, color: '1E5BD6', after: 40 }));
      for (const b of e.bullets) kids.push(P(b, { bullet: true, after: 30 }));
    }
  }
  if (m.education.length) { kids.push(H('Education')); for (const x of m.education) kids.push(P(x)); }
  if (m.certifications.length) { kids.push(H('Certifications & Training')); for (const x of m.certifications) kids.push(P(x, { bullet: true, after: 30 })); }
  if (m.languages.length) { kids.push(H('Languages'), P(m.languages.join('  |  '))); }

  const doc = new Document({
    styles: { default: { document: { run: { font, size: 21 } } } },
    sections: [{ properties: { page: { margin: { top: 850, bottom: 850, left: 1000, right: 1000 } } }, children: kids }]
  });
  return Packer.toBlob(doc);
}

export function buildPrintHtml(m: CvModel, summary: string) {
  const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c] as string));
  const cats = Object.keys(m.skills);
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(m.name)} - CV</title>
<style>
@page{size:A4;margin:16mm 15mm}body{font-family:Calibri,Arial,Helvetica,sans-serif;color:#1e293b;font-size:10.5pt;line-height:1.35;margin:0}
h1{font-size:20pt;margin:0;text-align:center;color:#0B1B3A;letter-spacing:.5px}.hl{text-align:center;color:#1E5BD6;font-size:12pt;margin:2px 0}.ct{text-align:center;color:#475569;font-size:9.5pt;margin-bottom:10px}
h2{font-size:11pt;color:#0B1B3A;text-transform:uppercase;border-bottom:1.5px solid #1E5BD6;padding-bottom:2px;margin:14px 0 6px}
.e{margin:8px 0 4px}.e .t{display:flex;justify-content:space-between;font-weight:700;font-size:11pt}.e .c{color:#1E5BD6;font-size:10pt}
ul{margin:3px 0 0 16px;padding:0}li{margin:2px 0}.sk b{color:#0B1B3A}
.bar{position:fixed;top:0;left:0;right:0;background:#0B1B3A;color:#fff;padding:8px 14px;font-size:12px;display:flex;justify-content:space-between;align-items:center}
.bar button{background:#E53935;color:#fff;border:0;border-radius:8px;padding:6px 14px;font-weight:700;cursor:pointer}@media print{.bar{display:none}}
</style></head><body>
<div class="bar"><span>MEP LAB — Save as PDF: Ctrl+P / ⌘P → Destination: Save as PDF</span><button onclick="window.print()">Save as PDF</button></div>
<div style="height:38px" class="sp"></div>
<h1>${esc(m.name.toUpperCase())}</h1>${m.headline ? `<div class="hl">${esc(m.headline)}</div>` : ''}
<div class="ct">${[m.location, m.phone, m.email, m.linkedin].filter(Boolean).map(esc).join(' &nbsp;|&nbsp; ')}</div>
<h2>Professional Summary</h2><p>${esc(summary)}</p>
${cats.length ? `<h2>Core Skills</h2><div class="sk">${cats.map((c) => `<div><b>${esc(CAT_LABEL[c] || c)}:</b> ${esc(m.skills[c].join(', '))}</div>`).join('')}</div>` : ''}
${m.experience.length ? `<h2>Professional Experience</h2>${m.experience.map((e) => `<div class="e"><div class="t"><span>${esc(e.title)}</span><span style="font-weight:400;color:#475569;font-size:9.5pt">${esc(e.dates)}</span></div><div class="c">${esc([e.company, e.location].filter(Boolean).join(', '))}</div><ul>${e.bullets.map((b) => `<li>${esc(b)}</li>`).join('')}</ul></div>`).join('')}` : ''}
${m.education.length ? `<h2>Education</h2>${m.education.map((x) => `<div>${esc(x)}</div>`).join('')}` : ''}
${m.certifications.length ? `<h2>Certifications &amp; Training</h2><ul>${m.certifications.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
${m.languages.length ? `<h2>Languages</h2><div>${esc(m.languages.join('  |  '))}</div>` : ''}
<style>@media print{.sp{display:none}}</style>
</body></html>`;
}

/* ---- free-usage limit per device (2 rewrites) ---- */
const KEY = 'meplab_cv_rewrites';
export function deviceId() {
  try {
    let id = localStorage.getItem('meplab_device');
    if (!id) {
      const c = document.createElement('canvas'); const g = c.getContext('2d');
      if (g) { g.textBaseline = 'top'; g.font = '14px Arial'; g.fillText('meplab', 2, 2); }
      const raw = [navigator.userAgent, screen.width, screen.height, screen.colorDepth, Intl.DateTimeFormat().resolvedOptions().timeZone, navigator.language, c.toDataURL().slice(-64)].join('|');
      let h = 0; for (let i = 0; i < raw.length; i++) h = (h * 31 + raw.charCodeAt(i)) | 0;
      id = 'd' + Math.abs(h).toString(36) + Math.random().toString(36).slice(2, 6);
      localStorage.setItem('meplab_device', id);
    }
    return id;
  } catch { return 'd0'; }
}
export function rewritesUsed(): number { try { return parseInt(localStorage.getItem(KEY) || '0', 10) || 0; } catch { return 0; } }
export function markRewrite() { try { localStorage.setItem(KEY, String(rewritesUsed() + 1)); } catch {} }
export const FREE_REWRITES = 2;
