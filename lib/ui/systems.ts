// Each course is drawn in the colour its system has on coordinated MEP drawings.
export type Sys = { key: 'hvac' | 'fire' | 'plumb' | 'bim'; color: string; ar: string; en: string };

export const SYSTEMS: Record<Sys['key'], Sys> = {
  hvac: { key: 'hvac', color: '#1F6FB2', ar: 'تكييف', en: 'HVAC' },
  fire: { key: 'fire', color: '#D7322F', ar: 'حريق', en: 'Fire' },
  plumb: { key: 'plumb', color: '#18875A', ar: 'صحي', en: 'Plumbing' },
  bim: { key: 'bim', color: '#5B4BC4', ar: 'BIM', en: 'BIM' }
};

export function systemOf(c: { slug?: string; title_en?: string } | null | undefined, i = 0): Sys {
  const s = `${c?.slug || ''} ${c?.title_en || ''}`.toLowerCase();
  if (/fire|sprink/.test(s)) return SYSTEMS.fire;
  if (/plumb|drain|water/.test(s)) return SYSTEMS.plumb;
  if (/revit|bim/.test(s)) return SYSTEMS.bim;
  if (/hvac|duct|air|cool/.test(s)) return SYSTEMS.hvac;
  return [SYSTEMS.bim, SYSTEMS.hvac, SYSTEMS.fire, SYSTEMS.plumb][i % 4];
}
