// Supabase Edge Function: Listen for new listings and notify subscribers
// This stub sets up the infrastructure for email notifications
// Actual email delivery requires integration with Resend, SendGrid, or similar

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface NewListingPayload {
  flat_id: string;
  lat: number;
  lng: number;
  rent_amount: number;
  bhk: number;
  building_id: string;
  created_at: string;
}

Deno.serve(async (req: Request) => {
  try {
    const { type, payload } = await req.json();

    if (type !== "new_listing") {
      return new Response(JSON.stringify({ error: "Unknown event type" }), {
        status: 400,
      });
    }

    const listing = payload as NewListingPayload;

    // Find all subscribers within radius of this listing
    const { data: subscribers, error } = await supabase.rpc(
      "get_subscribers_near",
      {
        p_lat: listing.lat,
        p_lng: listing.lng,
        p_radius_km: 5, // Default to 5km
      }
    );

    if (error) {
      console.error("Error fetching subscribers:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
      });
    }

    // TODO: Integrate with email service (Resend, SendGrid, etc.)
    // For each subscriber in range:
    //   - Build email content with listing details
    //   - Send via email service API
    //   - Log send attempt in audit table

    console.log(
      `New listing notification: ${listing.flat_id} has ${subscribers?.length || 0} subscribers in range`
    );

    return new Response(
      JSON.stringify({
        success: true,
        listing_id: listing.flat_id,
        subscribers_notified: subscribers?.length || 0,
        status: "pending_email_service_integration",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Function error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
    });
  }
});
