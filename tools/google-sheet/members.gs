/**
 * MEP LAB members → Google Sheet.
 * Paste into the sheet: Extensions → Apps Script, set SECRET below, Deploy → New deployment → Web app,
 * Execute as: Me, Who has access: Anyone. Copy the /exec URL into Netlify SHEET_WEBHOOK_URL and the same
 * secret into SHEET_WEBHOOK_SECRET.
 * One row per member (by e-mail); later events update the same row.
 */
const SECRET = 'PUT-THE-SAME-SECRET-HERE';
const HEAD = ['أول تسجيل', 'آخر تحديث', 'الاسم', 'الإيميل', 'واتساب', 'سجّل من', 'المسمى', 'الكورسات', 'القسم', 'الجامعة', 'سنة التخرج'];

function doPost(e) {
  const d = JSON.parse(e.postData.contents || '{}');
  if (!d.secret || d.secret !== SECRET || !d.email) return out({ ok: false });
  const lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    const sh = SpreadsheetApp.getActive().getSheetByName('Members') || SpreadsheetApp.getActive().insertSheet('Members');
    if (sh.getLastRow() === 0) { sh.appendRow(HEAD); sh.setFrozenRows(1); sh.getRange(1, 1, 1, HEAD.length).setFontWeight('bold'); }
    const emails = sh.getLastRow() > 1 ? sh.getRange(2, 4, sh.getLastRow() - 1, 1).getValues().map((r) => String(r[0]).toLowerCase()) : [];
    const i = emails.indexOf(String(d.email).toLowerCase());
    const now = new Date(d.at || Date.now());
    if (i < 0) {
      sh.appendRow([now, now, d.name || '', d.email, d.whatsapp || '', d.source || '', d.job_title || '', d.course || '', d.department || '', d.university || '', d.grad_year || '']);
    } else {
      const row = i + 2; const cur = sh.getRange(row, 1, 1, HEAD.length).getValues()[0];
      const courses = String(cur[7] || '').split('، ').filter(Boolean);
      if (d.course && courses.indexOf(d.course) < 0) courses.push(d.course);
      sh.getRange(row, 2, 1, 10).setValues([[now, d.name || cur[2], d.email, d.whatsapp || cur[4], cur[5] || d.source || '', d.job_title || cur[6], courses.join('، '), d.department || cur[8], d.university || cur[9], d.grad_year || cur[10]]]);
    }
    return out({ ok: true });
  } finally { lock.releaseLock(); }
}
function out(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
