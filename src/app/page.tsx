import LandingPage from "@/components/LandingPage";
import { fetchPlatformStats } from "@/app/lib/stats-server";

export default async function Home() {
  const stats = await fetchPlatformStats();
  return <LandingPage platformStats={stats} />;
}
