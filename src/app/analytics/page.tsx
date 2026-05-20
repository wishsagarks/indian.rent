import AnalyticsDashboardV2Wrapper from '@/components/analytics/AnalyticsDashboardV2Wrapper';
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Intelligence Hub — indian.rent by WishLabs",
  description: "Real-time telemetry and network analytics for the direct rental protocol.",
};

export default function AnalyticsPage() {
  return <AnalyticsDashboardV2Wrapper />;
}
