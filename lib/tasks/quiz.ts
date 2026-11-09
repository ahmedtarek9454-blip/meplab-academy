/** Quiz helpers shared by the admin editor, the member page and the grader. */

export type QuizQ = { q: string; options: string[]; answer: number };

/**
 * Parse the admin's plain-text quiz format:
 *
 *   What is the design static pressure unit?
 *   - m³/h
 *   * Pa
 *   - kW
 *
 *   (blank line between questions; "*" marks the correct option)
 */
export function parseQuiz(text: string): { quiz: QuizQ[]; error?: string } {
  const blocks = (text || '').replace(/\r/g, '').split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  const quiz: QuizQ[] = [];
  for (const b of blocks) {
    const ls = b.split('\n').map((l) => l.trim()).filter(Boolean);
    const q = ls.shift() || '';
    const options: string[] = []; let answer = -1;
    for (const l of ls) {
      const m = l.match(/^([-*•])\s*(.+)$/);
      if (!m) { options.push(l); continue; }
      if (m[1] === '*') answer = options.length;
      options.push(m[2]);
    }
    if (options.length < 2) return { quiz, error: `"${q.slice(0, 40)}": needs at least 2 options` };
    if (answer < 0) return { quiz, error: `"${q.slice(0, 40)}": mark the correct option with *` };
    quiz.push({ q, options, answer });
  }
  return { quiz };
}

/** Back to the editable text format. */
export function quizToText(quiz: QuizQ[] | null | undefined) {
  return (quiz || []).map((x) => [x.q, ...x.options.map((o, i) => `${i === x.answer ? '*' : '-'} ${o}`)].join('\n')).join('\n\n');
}

/** Auto-grade: returns score scaled to maxScore and per-question correctness. */
export function gradeQuiz(quiz: QuizQ[], answers: (number | null)[], maxScore: number) {
  const correct = quiz.map((x, i) => answers[i] === x.answer);
  const n = correct.filter(Boolean).length;
  const score = quiz.length ? Math.round((n / quiz.length) * maxScore * 10) / 10 : 0;
  return { score, correct, n, total: quiz.length };
}

export const TASK_MAX_BYTES = 50 * 1024 * 1024;
export const TASK_EXT = /\.(pdf|docx?|xlsx?|pptx?|rvt|rfa|dwg|dxf|nwc|nwd|ifc|zip|rar|7z|png|jpe?g|webp|txt|csv)$/i;
