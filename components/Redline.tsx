/**
 * Redline drawings: a design in black/blue linework with a reviewer's red marks
 * on top, the way MEP drawings come back from a consultant.
 * Server components, pure SVG; red marks draw in once (skipped for reduced motion).
 */

/** revision cloud around a rectangle: a chain of outward arcs */
function cloud(x: number, y: number, w: number, h: number, r = 9) {
  const pts: [number, number][] = [];
  const side = (x1: number, y1: number, x2: number, y2: number) => {
    const len = Math.hypot(x2 - x1, y2 - y1);
    const n = Math.max(2, Math.round(len / (r * 1.6)));
    for (let i = 0; i < n; i++) pts.push([x1 + ((x2 - x1) * i) / n, y1 + ((y2 - y1) * i) / n]);
  };
  side(x, y, x + w, y); side(x + w, y, x + w, y + h); side(x + w, y + h, x, y + h); side(x, y + h, x, y);
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 1; i <= pts.length; i++) {
    const [px, py] = pts[i % pts.length];
    d += ` A${r} ${r} 0 0 1 ${px.toFixed(1)} ${py.toFixed(1)}`;
  }
  return d;
}

const RED = '#D7263D';
const BLUE = '#1F5FAF';
const INK = '#1D2329';

/** hero: part of an HVAC plan with the reviewer's comments */
export function RedlinePlan({ ar = true, reviewer }: { ar?: boolean; reviewer: string }) {
  const n1 = ar ? 'الدكت ده صغير.. كبّره' : 'Duct too small, upsize';
  const n2 = ar ? 'زوّد دفيوزر هنا' : 'Add a diffuser here';
  const n3 = ar ? 'تمام' : 'OK';
  return (
    <figure className="redline overflow-hidden rounded-[3px] border-[1.5px] border-ink bg-white">
      <svg viewBox="0 0 520 330" className="block h-auto w-full bg-sheet" role="img" aria-label={ar ? 'مثال: لوحة تكييف عليها تعليقات المراجعة بالأحمر' : 'Example: an HVAC plan with review comments in red'}>
        {/* walls */}
        <g fill="none" stroke={INK} strokeWidth="5" strokeLinecap="square">
          <path d="M20 22H500V308H20Z" />
          <path d="M210 22V150M210 200V308M20 165H120M160 165H210M360 22V120M360 170V308" />
        </g>
        <g fill="none" stroke="#9AA3AE" strokeWidth="1"><path d="M120 165a40 40 0 0 1 40 -40M360 120a50 50 0 0 1 50 50" /></g>
        {/* supply duct */}
        <g fill="none" stroke={BLUE} strokeWidth="2">
          <path d="M500 64H120V86H500" />
          <path d="M300 86V230H316V86" />
          <path d="M440 86V250H452V86" />
          <path d="M150 86V120H162V86" />
        </g>
        <g fill="none" stroke={BLUE} strokeWidth="1.5">
          {[[156, 132], [308, 150], [308, 242], [446, 180], [446, 262]].map(([x, y]) => (
            <g key={`${x}${y}`}><rect x={x - 11} y={y - 11} width="22" height="22" /><path d={`M${x - 11} ${y - 11}l22 22M${x + 11} ${y - 11}l-22 22`} /></g>
          ))}
        </g>
        <g fill={BLUE} fontFamily="IBM Plex Sans Arabic" fontSize="11"><text x="470" y="58" textAnchor="middle" direction="ltr">600×350</text><text x="330" y="200" direction="ltr">300×200</text></g>

        {/* reviewer's marks */}
        <g fill="none" stroke={RED} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="mark">
          <path pathLength={1} d={cloud(278, 96, 58, 76, 8)} />
          <path pathLength={1} d="M338 140 C 352 138, 362 132, 372 124" />
          <path pathLength={1} d="M363 122l10 1l-3 9" />
          <ellipse pathLength={1} cx="96" cy="250" rx="46" ry="26" transform="rotate(-8 96 250)" />
          <path pathLength={1} d="M412 292l10 9l20 -24" />
        </g>
        <g fill={RED} stroke="#fff" strokeWidth="5" paintOrder="stroke" strokeLinejoin="round" fontFamily="'Aref Ruqaa', serif" fontWeight="700" className="mark-t">
          <text x="507" y="140" fontSize="22" textAnchor="start" direction="rtl">{n1}</text>
          <text x="160" y="232" fontSize="21" textAnchor="start" direction="rtl" transform="rotate(-4 160 232)">{n2}</text>
          <text x="500" y="284" fontSize="21" textAnchor="start" direction="rtl">{n3}</text>
        </g>
      </svg>
      {/* title block */}
      <figcaption className="grid grid-cols-[1fr,1fr,auto] border-t-[1.5px] border-ink text-[12px] leading-5">
        <div className="border-e border-ink px-3 py-2"><span className="block text-ink-mute">{ar ? 'اللوحة' : 'Sheet'}</span><b dir="ltr">M-301 · HVAC</b></div>
        <div className="border-e border-ink px-3 py-2"><span className="block text-ink-mute">{ar ? 'راجعها' : 'Checked by'}</span><b>{reviewer}</b></div>
        <div className="px-3 py-2 text-center"><span className="block text-ink-mute">Rev</span><b className="text-brand-red">B</b></div>
      </figcaption>
    </figure>
  );
}

/** a CV page with the reviewer's corrections */
export function RedlineCv({ ar = true }: { ar?: boolean }) {
  const bar = (x: number, y: number, w: number, c = '#CBD2DA') => <rect x={x} y={y} width={w} height="7" rx="1" fill={c} />;
  return (
    <figure className="redline rounded-[3px] border-[1.5px] border-ink bg-white p-1">
      <svg viewBox="0 0 360 420" className="block h-auto w-full" role="img" aria-label={ar ? 'مثال: CV عليه تصحيحات بالأحمر' : 'Example: a CV with corrections in red'}>
        <g direction="ltr">
          {bar(30, 30, 150, INK)}{bar(30, 46, 110, '#8C96A3')}
          <path d="M30 70H330" stroke={INK} strokeWidth="1" />
          {bar(30, 88, 70, INK)}
          {bar(30, 106, 290)}{bar(30, 120, 250)}
          {bar(30, 150, 90, INK)}
          {bar(30, 168, 170, '#8C96A3')}
          {bar(42, 186, 260)}{bar(42, 202, 230)}{bar(42, 218, 270)}
          {bar(30, 250, 90, INK)}
          {bar(42, 268, 250)}{bar(42, 284, 210)}
          {bar(30, 316, 70, INK)}
          {[0, 1, 2, 3].map((i) => <rect key={i} x={30 + i * 72} y="334" width="62" height="16" rx="2" fill="none" stroke="#CBD2DA" />)}
        </g>
        <g fill="none" stroke={RED} strokeWidth="2.2" strokeLinecap="round" className="mark">
          <path pathLength={1} d="M36 206H276" />
          <ellipse pathLength={1} cx="175" cy="113" rx="160" ry="20" />
          <path pathLength={1} d="M300 350 C 318 330, 330 300, 326 280" />
        </g>
        <g fill={RED} stroke="#fff" strokeWidth="5" paintOrder="stroke" strokeLinejoin="round" fontFamily="'Aref Ruqaa', serif" fontWeight="700" className="mark-t" direction="rtl">
          <text x="330" y="150" fontSize="18" textAnchor="start">{ar ? 'فين الأرقام؟' : 'Where are the numbers?'}</text>
          <text x="300" y="242" fontSize="17" textAnchor="start">{ar ? 'اكتب عملت إيه، مش مسؤوليتك' : 'Say what you did'}</text>
          <text x="330" y="395" fontSize="17" textAnchor="start">{ar ? 'ناقص: HAP و ASHRAE' : 'Missing: HAP, ASHRAE'}</text>
        </g>
        <g fontFamily="'Aref Ruqaa', serif" fontWeight="700" className="mark-t">
          <text x="262" y="44" fontSize="26" fill="#8C96A3" textDecoration="line-through" direction="ltr">58</text>
          <text x="300" y="48" fontSize="30" fill={RED} direction="ltr">89</text>
        </g>
      </svg>
    </figure>
  );
}
