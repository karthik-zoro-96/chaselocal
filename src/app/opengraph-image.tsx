import { ImageResponse } from 'next/og';

export const alt = 'ChaseLocal turns an overdue invoice into Polite, Firm and Final notice follow-up emails';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const STAGES = [
  { label: 'Polite', range: 'Day 1–7', line: '#10b981', text: '#2f7d5b', soft: '#e6f2ec' },
  { label: 'Firm', range: 'Day 8–21', line: '#f59e0b', text: '#8a5a00', soft: '#fbf0d9' },
  { label: 'Final notice', range: 'Day 22+', line: '#ef4444', text: '#a93a24', soft: '#f9e6e1' },
];

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 72,
          background: '#faf9f6',
          color: '#1a1917',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 12,
              background: '#1a1917',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#faf9f6" strokeWidth="2">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="m3 6 9 6.5L21 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div style={{ fontSize: 36 }}>ChaseLocal</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', fontSize: 76, letterSpacing: -2, lineHeight: 1.05 }}>
            <span>Chase the invoice,</span>
            <span>not the client.</span>
          </div>
          <div style={{ fontSize: 32, color: '#6b6860' }}>
            Drop an overdue invoice. Get three follow-ups that escalate politely.
          </div>
        </div>

        <div style={{ display: 'flex', gap: 24 }}>
          {STAGES.map((stage) => (
            <div key={stage.label} style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 14 }}>
              <div style={{ height: 6, borderRadius: 3, background: stage.line }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    fontSize: 26,
                    color: stage.text,
                    background: stage.soft,
                    padding: '6px 16px',
                    borderRadius: 999,
                  }}
                >
                  {stage.label}
                </div>
                <div style={{ fontSize: 24, color: '#6b6860' }}>{stage.range}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
    size
  );
}
