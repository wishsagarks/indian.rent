import type { Metadata } from "next";
import LandingPage from "@/components/LandingPage";
import { fetchPlatformStats } from "@/app/lib/stats-server";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "indian.rent | Direct Rental Marketplace by WishLabs",
  description: "Bypass brokers, find your next home directly in Hyderabad and across India. A product of WishLabs.",
  openGraph: {
    title: "indian.rent | Direct Rental Marketplace by WishLabs",
    description: "Bypass brokers, find your next home directly in Hyderabad and across India. A product of WishLabs.",
    url: "https://indian.rent",
    siteName: "indian.rent",
    images: [{ url: "https://indian.rent/og-image", width: 1200, height: 630, alt: "indian.rent" }],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "indian.rent — No Broker, No Bullshit",
    description: "Find verified rentals without broker fees.",
    images: ["https://indian.rent/og-image"],
  },
};

export default async function Home() {
  const stats = await fetchPlatformStats();
  return <LandingPage platformStats={stats} />;
}
