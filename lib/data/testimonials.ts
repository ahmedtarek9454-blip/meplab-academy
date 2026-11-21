/**
 * Real student opinions only — add one when a student sends it (screenshot or message) and agrees to show it.
 * The section stays hidden until this list has at least one item for the course (or for 'all').
 *   course: course slug, or 'all' to show on every course page
 *   name:   as the student wants it shown (e.g. "م/ محمد أ.")
 *   role:   optional, e.g. "مهندس تكييف — القاهرة"
 *   text:   their words, unedited apart from typos
 */
export type Testimonial = { course: string; name: string; role?: string; text: string };

export const TESTIMONIALS: Testimonial[] = [];
