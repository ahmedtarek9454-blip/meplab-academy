// Placeholder mark - replace /public/logo.png with the real MEP LAB logo
// and set USE_IMAGE = true.
const USE_IMAGE = false;

export function Mark({ className = 'h-9 w-9', center = '#0B1B3A', mono }: { className?: string; center?: string; mono?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      {[0, 60, 120, 180, 240, 300].map((a, i) => (
        <g key={a} transform={`rotate(${a} 24 24)`} stroke={mono || (i % 2 ? '#1E5BD6' : '#E53935')} strokeWidth="3.2" strokeLinecap="round" fill="none">
          <path d="M24 24V5" />
          <path d="M24 11l-5-4M24 11l5-4" />
        </g>
      ))}
      <circle cx="24" cy="24" r="3.5" fill={center} />
    </svg>
  );
}

export default function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className="flex items-center gap-2">
      {USE_IMAGE ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src="/logo.png" alt="MEP LAB" className="h-9 w-auto" />
      ) : (
        <Mark center={light ? '#fff' : '#0B1B3A'} />
      )}
      <span className={`text-xl font-black tracking-wide ${light ? 'text-white' : 'text-brand-navy'}`} dir="ltr">
        MEP <span className="text-brand-red">LAB</span>
      </span>
    </span>
  );
}
