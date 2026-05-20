import AnalyticsDashboard from './AnalyticsDashboard';
import { fetchPlatformStats } from '@/app/lib/stats-server';

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
  const stats = await fetchPlatformStats();

  return (
    <div className="min-h-screen bg-background">
      <AnalyticsDashboard stats={stats} />
    </div>
  );
}
