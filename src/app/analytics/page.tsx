import AnalyticsDashboard from './AnalyticsDashboard';
import { fetchPlatformStats } from '@/app/lib/stats-server';

export default async function AnalyticsPage() {
  const stats = await fetchPlatformStats();

  return (
    <div className="min-h-screen bg-background">
      <AnalyticsDashboard stats={stats} />
    </div>
  );
}
