'use client';

import dynamic from "next/dynamic";
import MapErrorBoundary from "@/components/MapErrorBoundary";

const RefinedMapEngine = dynamic(() => import("@/components/map/RefinedMapEngine"), {
  ssr: false,
  loading: () => <div className="w-full h-screen bg-background animate-pulse" />,
});

export default function ExplorePage() {
  return (
    <main className="h-screen w-full">
      <MapErrorBoundary>
        <RefinedMapEngine />
      </MapErrorBoundary>
    </main>
  );
}
