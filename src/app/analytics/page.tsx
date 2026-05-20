import type { Metadata } from "next";
import AnalyticsDashboard from './AnalyticsDashboard';
import { fetchPlatformStats } from '@/app/lib/stats-server';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Market Analytics | indian.rent",
  description: "Real-time rental market insights and demand intelligence across Indian cities. Track listings, seekers, and market velocity.",
  openGraph: {
    title: "Market Analytics | indian.rent",
    description: "Real-time rental market insights and demand intelligence across Indian cities.",
    url: "https://indian.rent/analytics",
    siteName: "indian.rent",
    images: [{ url: "https://indian.rent/og-image", width: 1200, height: 630, alt: "indian.rent - Analytics" }],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Analytics | indian.rent",
    description: "Real-time rental market metrics and demand heatmaps.",
    images: ["https://indian.rent/og-image"],
  },
};

export default async function AnalyticsPage() {
  const stats = await fetchPlatformStats();

  return (
    <div className="min-h-screen bg-background">
      <AnalyticsDashboard stats={stats} />
    </div>
  );
}
