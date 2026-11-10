/**
 * Optional email notifications via Resend (free: 3,000 emails/month).
 * Env: RESEND_API_KEY, EMAIL_FROM, ADMIN_EMAIL. If no key, emails are skipped silently.
 */
const site = () => (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/$/, '');
const esc = (s: any) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));

function layout(title: string, body: string) {
  return `<!doctype html><html><body style="margin:0;background:#f1f5f9;font-family:Tahoma,Arial,sans-serif">
<div style="max-width:560px;margin:24px auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0">
<div style="background:#0B1B3A;padding:18px 24px;color:#fff;font-size:20px;font-weight:800" dir="ltr">MEP <span style="color:#E53935">LAB</span></div>
<div style="padding:24px;color:#1e293b;font-size:15px;line-height:1.8" dir="rtl">
<h2 style="margin:0 0 12px;color:#0B1B3A;font-size:19px">${title}</h2>${body}</div>
<div style="padding:14px 24px;background:#f8fafc;color:#94a3b8;font-size:12px" dir="ltr">${esc(site())}</div></div></body></html>`;
}

export async function sendEmail(to: string | undefined | null, subject: string, html: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key || !to) return false;
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: process.env.EMAIL_FROM || 'MEP LAB <onboarding@resend.dev>', to: [to], subject, html })
    });
    if (!r.ok) console.error('email', r.status, await r.text());
    return r.ok;
  } catch (e) {
    console.error('email', e);
    return false;
  }
}

const btn = (href: string, label: string) =>
  `<p style="margin:20px 0"><a href="${href}" style="background:#E53935;color:#fff;padding:12px 22px;border-radius:10px;text-decoration:none;font-weight:700">${label}</a></p>`;

export function notifyAdminNewOrder(o: { student: string; email: string; phone?: string; course: string; amount: number; method: string }) {
  return sendEmail(process.env.ADMIN_EMAIL, `طلب اشتراك جديد — ${o.course}`, layout('طلب اشتراك جديد مستني المراجعة', `
<p><b>الطالب:</b> ${esc(o.student)}<br><b>الإيميل:</b> ${esc(o.email)}<br><b>الموبايل:</b> ${esc(o.phone)}<br>
<b>الكورس:</b> ${esc(o.course)}<br><b>المبلغ:</b> ${esc(o.amount)} ج.م — ${o.method === 'instapay' ? 'InstaPay' : 'فودافون كاش'}</p>
${btn(`${site()}/admin`, 'راجع الطلب')}`));
}

export function notifyStudentApproved(o: { to: string; name?: string; course: string; code: string; expires?: string | null }) {
  return sendEmail(o.to, `تم تفعيل اشتراكك في ${o.course} 🎉`, layout(`أهلًا ${esc(o.name || '')}، اشتراكك اتفعّل 🎉`, `
<p>تم قبول اشتراكك في <b>${esc(o.course)}</b>. ده كود التفعيل بتاعك:</p>
<p style="font-family:Consolas,monospace;font-size:20px;font-weight:800;background:#eff6ff;color:#0B1B3A;padding:14px;border-radius:10px;text-align:center" dir="ltr">${esc(o.code)}</p>
<p>افتح <b>MEP LAB Player</b> ← Activate ← الصق الكود.${o.expires ? `<br>الاشتراك ساري لحد <b dir="ltr" style="unicode-bidi:isolate">${esc(o.expires)}</b>.` : ''}</p>
${btn(`${site()}/dashboard`, 'افتح حسابك')}
<p style="color:#64748b;font-size:13px" dir="ltr">Your enrollment is active. Paste the code above into MEP LAB Player → Activate.</p>`));
}

export function notifyStudentRejected(o: { to: string; name?: string; course: string; note?: string | null }) {
  const wa = process.env.NEXT_PUBLIC_WHATSAPP;
  return sendEmail(o.to, `بخصوص طلب اشتراكك في ${o.course}`, layout(`أهلًا ${esc(o.name || '')}`, `
<p>للأسف مقدرناش نقبل طلب اشتراكك في <b>${esc(o.course)}</b>.</p>
${o.note ? `<p style="background:#fef2f2;color:#b91c1c;padding:12px;border-radius:10px"><b>السبب:</b> ${esc(o.note)}</p>` : ''}
<p>لو في أي لبس كلّمنا وهنحلها على طول.</p>
${wa ? btn(`https://wa.me/${wa}`, 'كلّمنا واتساب') : ''}`));
}

export function notifyStudentGraded(o: { to: string; name?: string; task: string; score: number | null; max: number; feedback?: string | null }) {
  return sendEmail(o.to, `اتصحّح التاسك: ${o.task}`, layout(`أهلًا ${esc(o.name || '')} 👋`, `
<p>المحاضر صحّح تاسك <b>${esc(o.task)}</b>.</p>
<p>الدرجة: <b dir="ltr">${o.score ?? '—'} / ${o.max}</b></p>
${o.feedback ? `<p style="background:#f8fafc;border-radius:10px;padding:12px">💬 ${esc(o.feedback)}</p>` : ''}
<p><a href="${esc(site())}/profile" style="display:inline-block;background:#E53935;color:#fff;padding:10px 18px;border-radius:10px;text-decoration:none;font-weight:700">افتح بروفايلي</a></p>`));
}

export function notifyWaitlistLaunch(o: { to: string; course: string; url: string }) {
  return sendEmail(o.to, `نزل كورس ${o.course} على MEP LAB`, layout('الكورس اللي كنت مستنيه نزل 🎉', `
<p>كورس <b>${esc(o.course)}</b> بقى متاح دلوقتي على MEP LAB.</p>
<p>اتفرّج على الفيديو التعريفي المجاني وشوف المحتوى كامل:</p>
<p><a href="${esc(o.url)}" style="display:inline-block;background:#E53935;color:#fff;padding:10px 18px;border-radius:10px;text-decoration:none;font-weight:700">افتح صفحة الكورس</a></p>
<p style="color:#64748b;font-size:13px">وصلك الإيميل ده لأنك طلبت نبلّغك لما الكورس ينزل.</p>`));
}
