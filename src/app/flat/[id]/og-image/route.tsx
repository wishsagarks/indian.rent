import { ImageResponse } from 'next/og';
import { getFlatDetails } from '@/app/actions/map-actions';

export const runtime = 'nodejs';
export const revalidate = 3600; // Cache for 1 hour

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const flatData = await getFlatDetails(id);

    if (!flatData) {
      return new ImageResponse(
        (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            background: 'linear-gradient(135deg, #0A0A0A 0%, #1a1a1a 100%)',
            color: '#fff',
            fontFamily: 'system-ui',
            fontSize: '32px',
            fontWeight: 'bold',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>📍</div>
            Listing Not Found
          </div>
        ),
        { width: 1200, height: 630 }
      );
    }

    const bhkText = flatData.bhk ? `${flatData.bhk} BHK` : 'Property';
    const rentText = flatData.rentAmount ? `₹${(flatData.rentAmount / 1000).toFixed(0)}k/mo` : 'Rent TBD';
    const locality = flatData.buildingAddress || flatData.buildingCity || 'Hyderabad';

    return new ImageResponse(
      (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #0A0A0A 0%, #1a1a1a 100%)',
          color: '#fff',
          fontFamily: 'system-ui',
          padding: '60px',
        }}>
          {/* Header */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1, justifyContent: 'center' }}>
            {/* Locality */}
            <div style={{
              fontSize: '28px',
              color: '#888',
              fontWeight: '500',
              textTransform: 'uppercase',
              letterSpacing: '2px',
            }}>
              📍 {locality}
            </div>

            {/* Main Info */}
            <div style={{
              fontSize: '64px',
              fontWeight: '900',
              lineHeight: '1.2',
              marginBottom: '20px',
            }}>
              {bhkText}
            </div>

            {/* Rent */}
            <div style={{
              fontSize: '48px',
              fontWeight: '700',
              color: '#4f46e5',
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
            }}>
              {rentText}
              {flatData.furnishing && (
                <span style={{
                  fontSize: '24px',
                  color: '#888',
                  fontWeight: '400',
                  textTransform: 'capitalize',
                }}>
                  • {flatData.furnishing.replace('-', ' ')}
                </span>
              )}
            </div>
          </div>

          {/* Footer */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            paddingTop: '40px',
          }}>
            <div style={{
              fontSize: '28px',
              fontWeight: '700',
              color: '#4f46e5',
            }}>
              indian.rent
            </div>
            <div style={{
              fontSize: '18px',
              color: '#666',
              fontWeight: '500',
            }}>
              No Broker • Direct from Owner
            </div>
          </div>
        </div>
      ),
      { width: 1200, height: 630 }
    );
  } catch (err) {
    console.error('OG image generation error:', err);
    return new ImageResponse(
      (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          background: '#0A0A0A',
          color: '#fff',
          fontFamily: 'system-ui',
          fontSize: '32px',
        }}>
          indian.rent
        </div>
      ),
      { width: 1200, height: 630 }
    );
  }
}
