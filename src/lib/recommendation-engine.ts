/**
 * Recommendation Engine for Localities
 * Provides similar neighborhoods, investment opportunities, and personalized suggestions
 */

export interface LocalityMetrics {
  name: string;
  avgRent: number;
  medianRent: number;
  supply: number;
  demand: number;
  ratio: number; // demand-supply ratio
  volatility: number;
  transparencyScore: number;
  gatedPercent?: number;
  bhk1Avg?: number;
  bhk2Avg?: number;
  bhk3Avg?: number;
}

export interface Recommendation {
  type: 'similar' | 'investment' | 'seeker' | 'seasonal';
  targetLocality: string;
  suggestedLocality: string;
  reason: string;
  metrics: {
    similarity?: number; // 0-100
    opportunity?: number; // 0-100
    priceMatch?: number; // % difference
    ratioMatch?: number; // % difference
    growthPotential?: number; // 0-100
  };
  icon: string;
  action: string;
}

/**
 * Calculate similarity score between two localities
 * Factors: price range (30%), ratio (30%), volatility (20%), transparency (20%)
 */
export function calculateSimilarity(
  locality1: LocalityMetrics,
  locality2: LocalityMetrics
): number {
  // Price similarity (±20% = 100)
  const priceRatio = locality1.avgRent / locality2.avgRent;
  const priceSim = Math.max(0, 100 - Math.abs((priceRatio - 1) * 100 * 2.5));

  // Ratio similarity (demand-supply)
  const ratioRatio = locality1.ratio / (locality2.ratio || 0.1);
  const ratioSim = Math.max(0, 100 - Math.abs((ratioRatio - 1) * 100 * 2));

  // Volatility similarity
  const volatilityDiff = Math.abs(locality1.volatility - locality2.volatility);
  const volatilitySim = Math.max(0, 100 - volatilityDiff * 2);

  // Transparency similarity
  const transparencyDiff = Math.abs(
    locality1.transparencyScore - locality2.transparencyScore
  );
  const transparencySim = Math.max(0, 100 - transparencyDiff * 0.5);

  // Weighted average
  const similarity =
    priceSim * 0.3 + ratioSim * 0.3 + volatilitySim * 0.2 + transparencySim * 0.2;

  return Math.round(similarity);
}

/**
 * Find similar neighborhoods for a given locality
 */
export function findSimilarLocalities(
  targetLocality: LocalityMetrics,
  allLocalities: LocalityMetrics[],
  limit: number = 5
): Recommendation[] {
  return allLocalities
    .filter(loc => loc.name !== targetLocality.name)
    .map(loc => {
      const similarity = calculateSimilarity(targetLocality, loc);
      const priceMatch = Math.round(
        ((loc.avgRent - targetLocality.avgRent) / targetLocality.avgRent) * 100
      );

      return {
        type: 'similar' as const,
        targetLocality: targetLocality.name,
        suggestedLocality: loc.name,
        reason:
          similarity > 80
            ? 'Nearly identical profile'
            : similarity > 60
            ? 'Similar price range and market dynamics'
            : 'Comparable metrics with some differences',
        metrics: {
          similarity,
          priceMatch,
          ratioMatch: Math.round(
            ((loc.ratio - targetLocality.ratio) / (targetLocality.ratio || 1)) * 100
          ),
          growthPotential: loc.ratio > 1.5 ? 85 : loc.ratio > 0.8 ? 60 : 40
        },
        icon: priceMatch < -10 ? '💰' : priceMatch > 10 ? '📈' : '⚖️',
        action:
          priceMatch < -15
            ? `${Math.abs(priceMatch)}% cheaper, similar profile`
            : priceMatch > 15
            ? `${priceMatch}% premium, higher demand`
            : 'Comparable pricing'
      };
    })
    .sort((a, b) => (b.metrics.similarity || 0) - (a.metrics.similarity || 0))
    .slice(0, limit);
}

/**
 * Identify investment opportunities
 * High demand + low supply = seller opportunity
 */
export function findInvestmentOpportunities(
  allLocalities: LocalityMetrics[],
  limit: number = 5
): Recommendation[] {
  const recommendations: Recommendation[] = [];

  allLocalities.forEach(loc => {
    // Investment score based on multiple factors
    let score = 0;
    let reason = '';
    let icon = '';

    // High demand, low supply (best opportunity)
    if (loc.ratio > 1.5 && loc.supply < 30) {
      score = 90;
      reason = 'High demand, limited supply - Premium listing opportunity';
      icon = '🔥';
    }
    // High demand, moderate supply
    else if (loc.ratio > 1.2) {
      score = 75;
      reason = 'Growing demand - Good investment potential';
      icon = '📈';
    }
    // Emerging market (high demand potential)
    else if (loc.demand > 50 && loc.supply < 20) {
      score = 70;
      reason = 'Emerging market with early demand signals';
      icon = '⭐';
    }
    // Balanced with growth
    else if (loc.ratio > 0.8 && loc.ratio < 1.2) {
      score = 55;
      reason = 'Stable market - Safe investment';
      icon = '⚖️';
    }

    if (score > 50) {
      recommendations.push({
        type: 'investment' as const,
        targetLocality: 'Investment Focus',
        suggestedLocality: loc.name,
        reason,
        metrics: {
          opportunity: score,
          growthPotential: loc.ratio > 1.5 ? 85 : loc.ratio > 0.8 ? 60 : 40
        },
        icon,
        action: `Opportunity Score: ${score}/100`
      });
    }
  });

  return recommendations
    .sort((a, b) => (b.metrics.opportunity || 0) - (a.metrics.opportunity || 0))
    .slice(0, limit);
}

/**
 * Identify seeker-friendly localities
 * Low price, high supply = buyer advantage
 */
export function findSeekerRecommendations(
  targetPrice: number,
  allLocalities: LocalityMetrics[],
  limit: number = 5
): Recommendation[] {
  const recommendations: Recommendation[] = [];

  allLocalities.forEach(loc => {
    const priceDiff = Math.abs(loc.avgRent - targetPrice) / targetPrice;

    // Find localities with good supply and reasonable price
    if (priceDiff < 0.3) {
      // Within 30% of target price
      let score = 0;
      let reason = '';

      if (loc.ratio < 0.8) {
        score = 85;
        reason = 'More options available - Better negotiation power';
      } else if (loc.ratio < 1.2) {
        score = 70;
        reason = 'Balanced market with decent choices';
      } else {
        score = 55;
        reason = 'Competitive market - Act quickly';
      }

      recommendations.push({
        type: 'seeker' as const,
        targetLocality: 'Seeker Search',
        suggestedLocality: loc.name,
        reason,
        metrics: {
          similarity: score,
          priceMatch: Math.round((priceDiff * 100 - 100) * -1)
        },
        icon: loc.ratio < 0.8 ? '💚' : '🟡',
        action: `${loc.supply} listings available`
      });
    }
  });

  return recommendations
    .sort((a, b) => (b.metrics.similarity || 0) - (a.metrics.similarity || 0))
    .slice(0, limit);
}

/**
 * Generate seasonal recommendations
 */
export function getSeasonalRecommendations(
  allLocalities: LocalityMetrics[]
): Recommendation[] {
  const month = new Date().getMonth();
  const recommendations: Recommendation[] = [];

  // Season definitions (Northern India)
  const isPeakSeason = month >= 3 && month <= 6; // Apr-Jun
  const isOffSeason = month >= 9 && month <= 11; // Oct-Dec

  if (isPeakSeason) {
    // Peak season - higher prices
    const highGrowthLocalities = allLocalities
      .filter(loc => loc.volatility > 12)
      .slice(0, 3);

    highGrowthLocalities.forEach(loc => {
      recommendations.push({
        type: 'seasonal' as const,
        targetLocality: 'Seasonal',
        suggestedLocality: loc.name,
        reason: 'Peak rental season - Prices rising, act now if listing',
        metrics: { growthPotential: 80 },
        icon: '📈',
        action: 'Peak season active'
      });
    });
  } else if (isOffSeason) {
    // Off-season - better deals
    const stableLocalities = allLocalities
      .filter(loc => loc.volatility < 10)
      .slice(0, 3);

    stableLocalities.forEach(loc => {
      recommendations.push({
        type: 'seasonal' as const,
        targetLocality: 'Seasonal',
        suggestedLocality: loc.name,
        reason: 'Off-season - Good time to negotiate, less competition',
        metrics: { opportunity: 70 },
        icon: '💰',
        action: 'Negotiation window open'
      });
    });
  }

  return recommendations;
}

/**
 * Get comprehensive recommendations for a locality
 */
export function getLocalityRecommendations(
  targetLocality: LocalityMetrics,
  allLocalities: LocalityMetrics[]
) {
  return {
    similar: findSimilarLocalities(targetLocality, allLocalities, 3),
    investments: findInvestmentOpportunities(allLocalities, 3),
    seasonal: getSeasonalRecommendations(allLocalities)
  };
}
