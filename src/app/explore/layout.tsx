import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Explore Listings | indian.rent",
  description: "Browse available rentals on our interactive map. Real-time inventory from verified landlords across Hyderabad and India.",
  openGraph: {
    title: "Explore Listings | indian.rent",
    description: "Browse available rentals on our interactive map. Real-time inventory from verified landlords.",
    url: "https://indian.rent/explore",
    siteName: "indian.rent",
    images: [{ url: "https://indian.rent/og-image", width: 1200, height: 630, alt: "indian.rent - Explore Listings" }],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Explore Rentals | indian.rent",
    description: "Interactive map of verified rentals. No brokers, transparent pricing.",
    images: ["https://indian.rent/og-image"],
  },
};

export default function ExploreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
