import type { Metadata } from 'next';
import ExplorePageClient from './explore-client';

export const metadata: Metadata = {
  title: "Explore Rentals | indian.rent",
  description: "Browse verified rental listings directly from property owners. No brokers, no middlemen, real homes.",
  openGraph: {
    title: "Explore Rentals | indian.rent",
    description: "Find your next home directly from property owners across Indian cities.",
    url: "https://indian.rent/explore",
    siteName: "indian.rent",
    images: [{ url: "https://indian.rent/og-image", width: 1200, height: 630, alt: "indian.rent - Explore" }],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Explore | indian.rent",
    description: "Direct rental listings without broker fees.",
    images: ["https://indian.rent/og-image"],
  },
};

export default function ExplorePage() {
  return <ExplorePageClient />;
}
