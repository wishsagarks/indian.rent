'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import AnalyticsSkeleton from './AnalyticsSkeleton';

const AnalyticsDashboardV2 = dynamic(
  () => import('@/app/analytics/v2/page'),
  { ssr: false, loading: () => <AnalyticsSkeleton /> }
);

export default function AnalyticsDashboardV2Wrapper() {
  return (
    <Suspense fallback={<AnalyticsSkeleton />}>
      <AnalyticsDashboardV2 />
    </Suspense>
  );
}
