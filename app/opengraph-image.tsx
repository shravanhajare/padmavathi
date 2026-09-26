import { ImageResponse } from 'next/og';

export const alt = 'Padmavathi Enterprises: handcrafted wooden kitchenware';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  const grain = Array.from({ length: 9 }, (_, i) => i);
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          position: 'relative',
          background: 'linear-gradient(135deg, #fff8ea 0%, #fbe3c6 55%, #fbcfdc 100%)',
          color: '#2e1d12',
          fontFamily: 'serif',
        }}
      >
        {/* a chakla-belan drawn with shapes */}
        <div style={{ position: 'absolute', right: 90, top: 150, width: 380, height: 380, borderRadius: 999, background: 'linear-gradient(135deg,#e2a867,#a0522d)', display: 'flex' }}>
          {grain.map((i) => (
            <div key={i} style={{ position: 'absolute', left: 30 + i * 8, top: 30 + i * 8, width: 320 - i * 16, height: 320 - i * 16, borderRadius: 999, border: '2px solid rgba(92,58,33,0.18)' }} />
          ))}
        </div>
        <div style={{ position: 'absolute', right: 20, top: 290, width: 520, height: 64, borderRadius: 32, background: 'linear-gradient(180deg,#f0c890,#c68642 55%,#7a4424)', transform: 'rotate(-28deg)', display: 'flex' }} />
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '72px 84px', width: 720 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 24, letterSpacing: 6, color: '#8a4a24', textTransform: 'uppercase' }}>
            <div style={{ width: 14, height: 14, borderRadius: 99, background: '#ec4899' }} />
            Padmavathi Enterprises
          </div>
          <div style={{ marginTop: 30, fontSize: 84, fontWeight: 700, lineHeight: 1.02 }}>Handcrafted</div>
          <div style={{ fontSize: 84, fontWeight: 700, lineHeight: 1.02, color: '#a0522d', fontStyle: 'italic' }}>Wooden Kitchenware</div>
          <div style={{ marginTop: 30, fontSize: 30, color: '#6c5344' }}>Belan · Chakla · Mathani · Coconut scrapers · Spice boxes</div>
          <div style={{ marginTop: 34, display: 'flex', fontSize: 24, color: '#3b1a0e', background: 'linear-gradient(135deg,#fcc2e0,#ee6aad)', border: '3px solid #d9a44e', borderRadius: 999, padding: '12px 30px', width: 400 }}>
            Hand-turned from solid wood
          </div>
        </div>
      </div>
    ),
    size,
  );
}
