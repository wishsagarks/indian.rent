import { Suspense } from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import ModerationDashboard from '@/components/admin/ModerationDashboard';

export const metadata = {
  title: 'Moderation Dashboard | Indian.Rent',
  description: 'Review and manage flagged listings',
};

export default function ModerationPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Quick Nav */}
      <div className="sticky top-0 z-40 border-b border-primary/30 bg-background/90 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <Link href="/explore" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors">
            <ChevronLeft size={20} />
            <span className="font-technical text-xs font-black uppercase tracking-widest">Back to Explore</span>
          </Link>
        </div>
      </div>

      {/* Content */}
      <Suspense fallback={<div className="p-8 text-center text-on-surface-variant">Loading moderation dashboard...</div>}>
        <ModerationDashboard />
      </Suspense>
    </div>
  );
}
