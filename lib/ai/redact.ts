/**
 * Remove personal data from a CV before it is sent to the AI provider.
 * The review does not need it, and it keeps the student's identity private.
 */
export function redactCv(text: string) {
  let t = text.replace(/\r/g, '');
  const lines = t.split('\n');
  // first non-empty short line without digits/@ is almost always the person's name
  const first = lines.findIndex((l) => l.trim().length > 0);
  if (first >= 0) {
    const l = lines[first].trim();
    if (l.split(/\s+/).length <= 5 && !/[\d@:/]/.test(l) && !/engineer|summary|profile|curriculum|cv|resume/i.test(l)) lines[first] = '[NAME]';
  }
  t = lines.join('\n');
  t = t.replace(/[\w.+-]+@[\w-]+\.[\w.]{2,}/g, '[EMAIL]');
  t = t.replace(/https?:\/\/\S+|www\.\S+|linkedin\.com\/\S*|github\.com\/\S*/gi, '[LINK]');
  // phone numbers (keep short numbers like years, TR, sqm)
  t = t.replace(/(?<![\w])(\+?\d[\d\s\-().]{8,}\d)(?![\w])/g, (m) => (m.replace(/\D/g, '').length >= 9 ? '[PHONE]' : m));
  // passport / national id style tokens
  t = t.replace(/\b(passport|national id|id no\.?|iqama)\s*[:#]?\s*[A-Z0-9]{6,}\b/gi, '$1 [ID]');
  t = t.replace(/\b(date of birth|dob|birth date|marital status|religion|nationality)\s*[:\-]?\s*[^\n]{0,40}/gi, '$1: [REMOVED]');
  return t;
}
