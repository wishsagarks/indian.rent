/**
 * Calculate contributor reward based on rent amount.
 * Good faith reward = 5% of rent, capped between ₹1000-₹10000, rounded to nearest ₹100.
 */
export function rewardFromRent(rent: number | null | undefined): number {
  if (!rent) return 2500;
  return Math.round(Math.min(Math.max(rent * 0.05, 1000), 10000) / 100) * 100;
}

/**
 * Supported cities with their coordinates for geofencing
 */
export const SUPPORTED_CITIES = [
  { name: 'Hyderabad', lat: 17.385, lng: 78.4867 },
  { name: 'Bengaluru', lat: 12.9716, lng: 77.5946 },
  { name: 'Bhubaneswar', lat: 20.2961, lng: 85.8245 },
  { name: 'Cuttack', lat: 20.4625, lng: 85.8830 },
] as const;

/**
 * Max deployment radius from supported city center (km)
 */
export const DEPLOY_MAX_RADIUS_KM = 150;
