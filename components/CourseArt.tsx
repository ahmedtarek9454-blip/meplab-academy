import { courseArtSvg, artKey, type ArtPalette } from '@/lib/ui/courseArt';

/**
 * the discipline illustration of a course (static SVG).
 * fit="cover" fills and crops its box; fit="contain" keeps the whole drawing
 * and fills the sides with the course colour, so a short box shrinks it.
 */
export default function CourseArt({ course, palette, className = '', fit = 'contain' }: { course: { slug?: string; title_en?: string }; palette: ArtPalette; className?: string; fit?: 'cover' | 'contain' }) {
  let svg = courseArtSvg(artKey(course), palette);
  if (fit === 'contain') svg = svg.replace('xMidYMid slice', 'xMidYMid meet');
  return <div aria-hidden className={`[&>svg]:h-full [&>svg]:w-full ${className}`} style={{ background: palette.bg }} dangerouslySetInnerHTML={{ __html: svg }} />;
}
