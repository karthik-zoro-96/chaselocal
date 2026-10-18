import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#1a1917',
        }}
      >
        <svg width="112" height="112" viewBox="0 0 24 24" fill="none" stroke="#faf9f6" strokeWidth="1.8">
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="m3 6 9 6.5L21 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    ),
    size
  );
}
