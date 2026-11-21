'use client';
import { useEffect } from 'react';
import { track, adTrack } from '@/lib/stats/track';

/** counts one event when the page opens (e.g. a course page view) */
export default function TrackView({ type, params, adOnly }: { type: string; params?: Record<string, any>; adOnly?: boolean }) {
  useEffect(() => { if (adOnly) adTrack(type, params); else track(type, params); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

/** a normal link that also counts a click */
export function TrackLink({ type, params, ...a }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { type: string; params?: Record<string, any> }) {
  return <a {...a} onClick={() => track(type, params)} />;
}
