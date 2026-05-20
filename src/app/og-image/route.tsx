import { ImageResponse } from 'next/og';

export const runtime = 'nodejs';

export async function GET() {
  try {
    return new ImageResponse(
      (
        <div
          style={{
            fontSize: 48,
            background: '#0a0a0a',
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            gap: '32px',
            padding: '60px 120px',
          }}
        >
          {/* Logo placeholder - ir.svg */}
          <div
            style={{
              fontSize: 120,
              fontWeight: 'bold',
              color: '#ff6b35',
              letterSpacing: '-2px',
            }}
          >
            IR
          </div>

          {/* Tagline */}
          <div
            style={{
              fontSize: 48,
              fontWeight: 'bold',
              textAlign: 'center',
              lineHeight: 1.4,
              maxWidth: '900px',
            }}
          >
            Bypass Brokers. Find Homes. Reward the Community.
          </div>

          {/* Subtext */}
          <div
            style={{
              fontSize: 28,
              color: '#999',
              textAlign: 'center',
            }}
          >
            Direct Rental Marketplace
          </div>

          {/* Coral accent bar */}
          <div
            style={{
              width: '200px',
              height: '4px',
              background: '#ff6b35',
              marginTop: '16px',
            }}
          />
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error('OG image generation error:', error);
    return new Response('Failed to generate image', { status: 500 });
  }
}
