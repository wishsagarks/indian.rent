import AnalyticsDashboard from "./AnalyticsDashboard";
import { fetchPlatformStats } from "@/app/lib/stats-server";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Intelligence Hub — indian.rent by WishLabs",
  description: "Real-time telemetry and network analytics for the direct rental protocol.",
};

export default async function AnalyticsPage() {
  const stats = await fetchPlatformStats();
  
  return <AnalyticsDashboard stats={stats} />;
}
