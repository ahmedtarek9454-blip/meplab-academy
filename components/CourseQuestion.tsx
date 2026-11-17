'use client';
import { useState } from 'react';

/** Profile: "are you one of our course students? which course?" — the course list shows only after "yes". */
export default function CourseQuestion({ ar, courses, answer, courseId, status }: {
  ar: boolean; courses: { id: string; title: string }[]; answer: string; courseId: string; status: string;
}) {
  const [a, setA] = useState(answer);
  const statusText: Record<string, string> = ar
    ? { pending: 'مستني تأكيد من MEP LAB — هنأكدلك قريب.', approved: 'متأكد ✓ التاسكات مفتوحالك.', rejected: 'مقدرناش نلاقيك في الكورس ده. كلّمنا على الواتساب.' }
    : { pending: 'Waiting for MEP LAB to confirm.', approved: 'Confirmed ✓ your tasks are open.', rejected: "We couldn't find you in this course. Contact us on WhatsApp." };
  const tone: Record<string, string> = { pending: 'text-amber-700', approved: 'text-green-700', rejected: 'text-red-700' };

  return (
    <fieldset className="rounded-sheet border border-line p-4 md:col-span-2">
      <legend className="px-1 text-sm font-bold text-ink">{ar ? 'إنت مشترك معانا في كورس؟' : 'Are you enrolled in one of our courses?'}</legend>
      <div className="flex flex-wrap gap-4">
        {[['yes', ar ? 'آه، مشترك' : 'Yes'], ['no', ar ? 'لأ' : 'No']].map(([v, l]) => (
          <label key={v} className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-ink-soft">
            <input type="radio" name="course_answer" value={v} checked={a === v} onChange={() => setA(v)} className="h-4 w-4" /> {l}
          </label>
        ))}
      </div>
      {a === 'yes' && (
        <div className="mt-3">
          <label className="label">{ar ? 'أنهي كورس؟' : 'Which course?'} *</label>
          <select name="claimed_course_id" defaultValue={courseId} required className="input">
            <option value="">—</option>
            {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
          {status && answer === 'yes' && <p className={`mt-2 text-xs font-semibold ${tone[status] || ''}`}>{statusText[status]}</p>}
          {status !== 'approved' && (
            <p className="mt-1 text-xs text-ink-mute">{ar ? 'معاك كود الكورس من الجروب؟ اكتبه في خانة «انضم لكورس بالكود» وهيتأكد على طول.' : 'Have the course code from your group? Enter it in "Join a course with a code" to confirm right away.'}</p>
          )}
        </div>
      )}
    </fieldset>
  );
}
