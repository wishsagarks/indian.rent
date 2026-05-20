import { ImageResponse } from 'next/og';
import { createClient } from "@supabase/supabase-js";

export const runtime = 'nodejs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data: listing } = await supabase
      .from("flatmates")
      .select("title, location, rent_amount, image_url")
      .eq("id", id)
      .single();

    const title = listing?.title || "Listing on indian.rent";
    const location = listing?.location || "India";
    const rent = listing?.rent_amount ? `₹${listing.rent_amount}/month` : "";

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
            gap: '24px',
            padding: '60px 80px',
          }}
        >
          {/* Logo */}
          <div
            style={{
              fontSize: 80,
              fontWeight: 'bold',
              color: '#ff6b35',
              letterSpacing: '-2px',
            }}
          >
            IR
          </div>

          {/* Title */}
          <div
            style={{
              fontSize: 52,
              fontWeight: 'bold',
              textAlign: 'center',
              lineHeight: 1.3,
              maxWidth: '900px',
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            {title}
          </div>

          {/* Location and Rent */}
          <div
            style={{
              display: 'flex',
              gap: '24px',
              fontSize: 28,
              color: '#999',
              alignItems: 'center',
            }}
          >
            <span>{location}</span>
            {rent && (
              <>
                <span style={{ color: '#ff6b35' }}>•</span>
                <span style={{ color: '#ff6b35', fontWeight: 'bold' }}>{rent}</span>
              </>
            )}
          </div>

          {/* Accent bar */}
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
