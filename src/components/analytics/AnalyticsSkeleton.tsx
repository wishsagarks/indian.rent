export default function AnalyticsSkeleton() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-container mx-auto space-y-8">
        {/* Header Skeleton */}
        <div className="space-y-4">
          <div className="h-10 w-64 bg-surface rounded-lg animate-pulse" />
          <div className="h-6 w-96 bg-surface rounded-lg animate-pulse" />
        </div>

        {/* KPI Cards Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-surface-container-low rounded-lg p-6 space-y-4 animate-pulse"
            >
              <div className="h-4 w-20 bg-surface rounded" />
              <div className="h-8 w-32 bg-surface rounded" />
              <div className="h-3 w-24 bg-surface rounded" />
            </div>
          ))}
        </div>

        {/* Chart Skeletons */}
        <div className="space-y-6">
          <div className="bg-surface-container-low rounded-lg p-6">
            <div className="h-6 w-48 bg-surface rounded mb-4 animate-pulse" />
            <div className="h-64 w-full bg-surface rounded animate-pulse" />
          </div>
          <div className="bg-surface-container-low rounded-lg p-6">
            <div className="h-6 w-48 bg-surface rounded mb-4 animate-pulse" />
            <div className="h-64 w-full bg-surface rounded animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
