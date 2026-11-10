import { courseArtSvg, artKey, type ArtPalette } from '@/lib/ui/courseArt';

/** the discipline illustration of a course (static SVG, fills its box) */
export default function CourseArt({ course, palette, className = '' }: { course: { slug?: string; title_en?: string }; palette: ArtPalette; className?: string }) {
  return <div aria-hidden className={`[&>svg]:h-full [&>svg]:w-full ${className}`} dangerouslySetInnerHTML={{ __html: courseArtSvg(artKey(course), palette) }} />;
}
