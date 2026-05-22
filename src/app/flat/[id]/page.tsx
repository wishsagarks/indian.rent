import type { Metadata } from 'next';
import ListingDetail from "@/components/ListingDetail";
import { getFlatDetails } from "@/app/actions/map-actions";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const result = await getFlatDetails(id);

  if (result.error || !result.data) {
    return { title: 'Listing Not Found — indian.rent by WishLabs' };
  }

  const listing = result.data;
  const rent = listing.rentAmount ? `₹${Number(listing.rentAmount).toLocaleString()}/mo` : '';
  const bhk = listing.bhk ? `${listing.bhk} BHK` : '';
  const location = listing.buildingAddress || listing.buildingCity || 'Hyderabad';
  const title = [listing.buildingName, bhk, rent].filter(Boolean).join(' · ') + ' — indian.rent by WishLabs';
  const description = `${bhk} ${listing.furnishing || 'flat'} in ${location}. Direct listing, zero broker. Contributor reward available.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: `/flat/${id}/og-image`, alt: `${bhk} flat in ${location}` }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      image: `/flat/${id}/og-image`,
    },
  };
}

export default async function FlatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ListingDetail id={id} type="flat" />;
}
