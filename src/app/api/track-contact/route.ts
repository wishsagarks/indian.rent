import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { flatId, action } = body;

    if (!flatId || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Track the contact event (can be extended to log to analytics service)
    // For now, just acknowledge the tracking
    console.log(`[CONTACT_TRACKING] flatId: ${flatId}, action: ${action}, timestamp: ${new Date().toISOString()}`);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Contact tracking error:', err);
    return NextResponse.json({ error: 'Tracking failed' }, { status: 500 });
  }
}
