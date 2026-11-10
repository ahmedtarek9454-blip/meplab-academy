import Link from 'next/link';
import { SYSTEMS } from '@/lib/ui/systems';

// Section through a 3-storey building with the four systems MEP LAB teaches.
// Each system is a link to its course. Lines draw once on load (respects reduced motion).
type Course = { slug: string; title_ar?: string; title_en?: string };

export default function HeroSchematic({ locale, courses }: { locale: 'ar' | 'en'; courses: Record<string, Course | undefined> }) {
  const ar = locale === 'ar';
  const d = (ms: number) => ({ animationDelay: `${ms}ms` });
  const tag = (key: keyof typeof SYSTEMS, x: number, y: number, delay: number, w = 96) => {
    const s = SYSTEMS[key];
    const c = courses[key];
    const label = ar ? s.ar : s.en;
    const inner = (
      <g className="mep-tag" style={d(delay)}>
        <rect x={x} y={y} width={w} height="26" rx="13" fill="#fff" stroke={s.color} strokeWidth="1.5" />
        <circle cx={x + 14} cy={y + 13} r="4" fill={s.color} />
        <text x={x + 26} y={y + 17.5} fontSize="12.5" fontWeight="600" fill="#0B1B3A" style={{ direction: 'ltr' }}>{label}</text>
      </g>
    );
    return c ? <Link key={key} href={`/courses/${c.slug}`} aria-label={(ar ? c.title_ar : c.title_en) || label}>{inner}</Link> : <g key={key}>{inner}</g>;
  };

  return (
    <svg viewBox="0 0 520 400" className="h-auto w-full" role="img" aria-label={ar ? 'مقطع في مبنى فيه أنظمة التكييف والحريق والصحي و BIM' : 'Building section showing HVAC, fire, plumbing and BIM'}>
      {/* BIM grid axes */}
      <g stroke={SYSTEMS.bim.color} strokeWidth="1" strokeDasharray="6 4" opacity=".55">
        {[70, 220, 370].map((x) => <line key={x} x1={x} y1="34" x2={x} y2="372" />)}
      </g>
      {[['A', 70], ['B', 220], ['C', 370]].map(([l, x]) => (
        <g key={l as string}>
          <circle cx={x as number} cy="22" r="12" fill="#fff" stroke={SYSTEMS.bim.color} strokeWidth="1.5" />
          <text x={x as number} y="26.5" textAnchor="middle" fontSize="12" fontWeight="600" fill={SYSTEMS.bim.color}>{l}</text>
        </g>
      ))}

      {/* structure: slabs + columns */}
      <g fill="#0B1B3A">
        {[60, 160, 260, 360].map((y) => <rect key={y} x="40" y={y} width="400" height="8" />)}
        {[60, 160, 260].map((y) => [70, 220, 370].map((x) => <rect key={`${x}-${y}`} x={x - 5} y={y + 8} width="10" height="92" opacity=".9" />))}
      </g>
      <line x1="20" y1="368" x2="500" y2="368" stroke="#0B1B3A" strokeWidth="1" />
      <g stroke="#0B1B3A" strokeWidth="1" opacity=".35">
        {Array.from({ length: 24 }).map((_, i) => <line key={i} x1={20 + i * 20} y1="380" x2={32 + i * 20} y2="368" />)}
      </g>

      {/* shaft */}
      <rect x="452" y="60" width="44" height="308" fill="none" stroke="#0B1B3A" strokeWidth="1" strokeDasharray="3 3" opacity=".5" />

      {/* HVAC: supply duct per floor from the shaft, diffuser drops */}
      <g stroke={SYSTEMS.hvac.color} fill="none" strokeLinecap="square">
        <path className="mep-line" style={d(100)} strokeWidth="2.5" d="M470 352 V80" />
        {[78, 178, 278].map((y, k) => (
          <g key={y}>
            <path className="mep-line" style={d(500 + k * 120)} strokeWidth="9" strokeOpacity=".9" d={`M470 ${y} H50`} />
            {[120, 270, 400].map((x) => <path key={x} className="mep-line" style={d(1100 + k * 120)} strokeWidth="2.5" d={`M${x} ${y + 5} v14 m-10 0 h20`} />)}
          </g>
        ))}
      </g>

      {/* Fire: sprinkler mains below ducts with heads */}
      <g stroke={SYSTEMS.fire.color} fill="none">
        <path className="mep-line" style={d(250)} strokeWidth="2.5" d="M484 352 V96" />
        {[106, 206, 306].map((y, k) => (
          <g key={y}>
            <path className="mep-line" style={d(700 + k * 120)} strokeWidth="2.5" d={`M484 ${y} H50`} />
            {[90, 160, 250, 330, 420].map((x) => <circle key={x} className="mep-tag" style={d(1500 + k * 80)} cx={x} cy={y + 5} r="3" fill={SYSTEMS.fire.color} stroke="none" />)}
          </g>
        ))}
      </g>

      {/* Plumbing: riser + branch to fixtures on each floor */}
      <g stroke={SYSTEMS.plumb.color} fill="none" strokeWidth="2.5">
        <path className="mep-line" style={d(400)} d="M460 360 V128" />
        {[148, 248, 348].map((y, k) => (
          <g key={y}>
            <path className="mep-line" style={d(900 + k * 120)} d={`M460 ${y} H300 v-12`} />
            <rect className="mep-tag" style={d(1600 + k * 80)} x="286" y={y - 28} width="28" height="14" rx="3" fill="#fff" stroke={SYSTEMS.plumb.color} strokeWidth="1.5" />
          </g>
        ))}
      </g>

      {/* tags = links to the four courses */}
      {tag('bim', 236, 6, 1700, 70)}
      {tag('hvac', 92, 120, 1800, 90)}
      {tag('fire', 92, 220, 1900, 84)}
      {tag('plumb', 150, 320, 2000, ar ? 70 : 108)}
    </svg>
  );
}
