import { ImageResponse } from 'next/og';

export const runtime = 'nodejs';
export const revalidate = 60;

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0A0A0A 0%, #1a1a1a 100%)',
          padding: '40px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '40px' }}>
          <div
            style={{
              width: '80px',
              height: '80px',
              background: '#ff6b35',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '48px',
              fontWeight: 'bold',
              color: '#ffffff',
            }}
          >
            🏠
          </div>
        </div>

        <h1
          style={{
            fontSize: '72px',
            fontWeight: 'bold',
            color: '#ffffff',
            margin: '0 0 20px 0',
            textAlign: 'center',
            fontFamily: 'system-ui',
          }}
        >
          indian.rent
        </h1>

        <p
          style={{
            fontSize: '32px',
            color: '#ff6b35',
            margin: '0 0 40px 0',
            textAlign: 'center',
            fontWeight: '600',
            fontFamily: 'system-ui',
          }}
        >
          Direct Rental Marketplace
        </p>

        <p
          style={{
            fontSize: '24px',
            color: '#aaaaaa',
            margin: '0',
            textAlign: 'center',
            fontFamily: 'system-ui',
          }}
        >
          Bypass brokers, find your next home
        </p>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}
