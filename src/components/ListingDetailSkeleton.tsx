'use client';

export default function ListingDetailSkeleton() {
  return (
    <div className="min-h-screen bg-background pb-24 animate-pulse">
      <div className="h-16 border-b border-white/5 bg-surface/80" />
      <div className="pt-24 px-4 md:px-8 max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="aspect-video w-full rounded-lg bg-white/5" />
          <div className="bg-surface border border-white/10 rounded-lg p-8 space-y-6">
            <div className="space-y-3">
              <div className="h-10 bg-white/5 rounded w-3/4" />
              <div className="h-4 bg-white/5 rounded w-1/2" />
            </div>
            <div className="flex gap-2">
              <div className="h-6 bg-white/5 rounded-full w-20" />
              <div className="h-6 bg-white/5 rounded-full w-24" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white/5 rounded-lg p-4 space-y-2">
                  <div className="h-3 bg-white/5 rounded w-2/3 mx-auto" />
                  <div className="h-6 bg-white/5 rounded w-1/2 mx-auto" />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="space-y-6">
          <div className="bg-surface border border-white/10 rounded-lg p-8 space-y-6">
            <div className="h-16 bg-white/5 rounded-lg" />
            <div className="h-12 bg-white/5 rounded-lg" />
            <div className="h-14 bg-white/5 rounded-lg" />
            <div className="h-14 bg-white/5 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
