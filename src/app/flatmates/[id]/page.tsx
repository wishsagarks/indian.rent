import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import ListingDetail from "@/components/ListingDetail";
import ListingJsonLd from "@/components/ListingJsonLd";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function fetchListing(id: string) {
  try {
    const { data: listing } = await supabase
      .from("flatmates")
      .select("title, description, image_url, location, rent_amount, deposit_months, furnishing_type")
      .eq("id", id)
      .single();
    return listing;
  } catch (error) {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const listing = await fetchListing(id);

  if (!listing) {
    return {
      title: "Listing | indian.rent",
      description: "Find your next rental on indian.rent",
    };
  }

  const title = `${listing.title} | indian.rent`;
  const description =
    listing.description ||
    `${listing.location} - ₹${listing.rent_amount}/month on indian.rent`;
  const ogImageUrl = `https://indian.rent/flatmates/${id}/og-image`;
  const fallbackImageUrl = listing.image_url || "https://indian.rent/og-image";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://indian.rent/flatmates/${id}`,
      siteName: "indian.rent",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: listing.title,
        },
      ],
      locale: "en_IN",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

export default async function FlatmatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listing = await fetchListing(id);

  return (
    <>
      {listing && (
        <ListingJsonLd
          id={id}
          title={listing.title}
          description={listing.description}
          imageUrl={listing.image_url}
          location={listing.location}
          rentAmount={listing.rent_amount}
          depositMonths={listing.deposit_months}
          furnishingType={listing.furnishing_type}
        />
      )}
      <ListingDetail id={id} type="flatmate" />
    </>
  );
}
