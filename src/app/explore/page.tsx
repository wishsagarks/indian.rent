import RefinedMapEngine from "@/components/map/RefinedMapEngine";
import MapErrorBoundary from "@/components/MapErrorBoundary";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Explore Map — indian.rent by WishLabs",
  description: "Live tactical rental grid for Hyderabad. Find direct listings and contributor rewards.",
};

export default function ExplorePage() {
  return (
    <main className="h-screen w-full">
      <MapErrorBoundary>
        <RefinedMapEngine />
      </MapErrorBoundary>
    </main>
  );
}
