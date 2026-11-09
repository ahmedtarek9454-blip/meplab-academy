import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'MEP LAB — HVAC & MEP Courses, CV Check, Jobs';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OG() {
  const arms = [0, 60, 120, 180, 240, 300];
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '70px 90px', background: 'linear-gradient(135deg,#0B1B3A 0%,#13306b 60%,#1E5BD6 100%)', color: '#fff', fontFamily: 'sans-serif' }}>
        <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 720 }}>
          <div style={{ display: 'flex', fontSize: 92, fontWeight: 900, letterSpacing: 2 }}>
            MEP<span style={{ color: '#E53935', marginLeft: 22 }}>LAB</span>
          </div>
          <div style={{ fontSize: 40, marginTop: 18, color: '#cbd5e1', lineHeight: 1.3 }}>Practical HVAC & MEP courses</div>
          <div style={{ display: 'flex', gap: 16, marginTop: 40 }}>
            {['Courses', 'ATS CV Check', 'MEP Jobs', 'Free Revit Tools'].map((x) => (
              <div key={x} style={{ display: 'flex', alignItems: 'center', fontSize: 24, lineHeight: 1, padding: '10px 20px', borderRadius: 999, background: 'rgba(255,255,255,0.12)' }}>{x}</div>
            ))}
          </div>
        </div>
        <svg width="300" height="300" viewBox="0 0 48 48">
          {arms.map((a, i) => (
            <g key={a} transform={`rotate(${a} 24 24)`} stroke={i % 2 ? '#5fa8ff' : '#E53935'} strokeWidth="3.2" strokeLinecap="round" fill="none">
              <path d="M24 24V5" /><path d="M24 11l-5-4M24 11l5-4" />
            </g>
          ))}
          <circle cx="24" cy="24" r="3.5" fill="#fff" />
        </svg>
      </div>
    ),
    size
  );
}
