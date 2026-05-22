'use client';

import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';

interface LocalityData {
  name: string;
  supply: number;
  demand: number;
  avgRent: number;
  medianRent: number;
  minPrice: number;
  maxPrice: number;
  bhk1Avg?: number;
  bhk2Avg?: number;
  bhk3Avg?: number;
  gatedPercent?: number;
  furnishedPercent?: number;
  volatility?: number;
  transparencyScore?: number;
}

interface LocalityComparisonProps {
  localities: LocalityData[];
  allLocalities: string[];
  onAddLocality: (locality: string) => void;
  onRemoveLocality: (locality: string) => void;
  cityAverage?: LocalityData;
}

export default function LocalityComparison({
  localities = [],
  allLocalities = [],
  onAddLocality,
  onRemoveLocality,
  cityAverage
}: LocalityComparisonProps) {
  const [selectedForAdd, setSelectedForAdd] = useState<string>('');

  const getComparisonValue = (localityValue: number, avgValue: number) => {
    if (!avgValue || avgValue === 0 || !isFinite(avgValue)) return 0;
    const diff = ((localityValue - avgValue) / avgValue) * 100;
    return isFinite(diff) ? diff : 0;
  };

  const getComparisonColor = (value: number, isHighBetter: boolean = true) => {
    if (value > 10) return isHighBetter ? 'text-emerald-400' : 'text-red-400';
    if (value > 0) return isHighBetter ? 'text-emerald-400' : 'text-orange-400';
    if (value < -10) return isHighBetter ? 'text-red-400' : 'text-emerald-400';
    return 'text-on-surface-variant';
  };

  return (
    <div className="space-y-6">
      {/* Locality Selector */}
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <label className="text-xs font-technical text-on-surface-variant uppercase mb-2 block">
            Add Locality to Compare
          </label>
          <select
            value={selectedForAdd}
            onChange={(e) => setSelectedForAdd(e.target.value)}
            className="w-full px-3 py-2 text-xs font-bold bg-primary/10 border border-primary/30 text-on-surface rounded hover:border-primary/50 cursor-pointer focus:outline-none transition-all"
          >
            <option value="">Select a locality...</option>
            {allLocalities
              .filter(loc => !localities.find(l => l.name === loc))
              .map(locality => (
                <option key={locality} value={locality}>{locality}</option>
              ))}
          </select>
        </div>
        <button
          onClick={() => {
            if (selectedForAdd) {
              onAddLocality(selectedForAdd);
              setSelectedForAdd('');
            }
          }}
          disabled={!selectedForAdd || localities.length >= 4}
          className="px-3 py-2 rounded bg-primary text-background font-bold text-xs uppercase hover:bg-primary/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Plus size={16} /> Add
        </button>
      </div>

      {/* Comparison Grid */}
      {localities.length > 0 ? (
        <div className="overflow-x-auto">
          <div className="min-w-full space-y-4">
            {/* Metrics Header */}
            <div className="grid grid-cols-5 gap-4 text-xs font-technical font-bold text-on-surface-variant uppercase">
              <div>Metric</div>
              {localities.map(loc => (
                <div key={loc.name} className="text-center">
                  {loc.name}
                </div>
              ))}
            </div>

            {/* Supply & Demand */}
            <div className="border-t border-primary/20 pt-4 space-y-3">
              <div className="text-xs font-bold text-primary uppercase">Demand & Supply</div>

              <div className="grid grid-cols-5 gap-4 items-center">
                <div className="text-xs text-on-surface-variant">Supply (Listings)</div>
                {localities.map(loc => (
                  <div key={`supply-${loc.name}`} className="text-center">
                    <p className="text-sm font-bold text-on-surface">{loc.supply}</p>
                    {cityAverage && (
                      <p className={`text-xs ${getComparisonColor(getComparisonValue(loc.supply, cityAverage.supply), true)}`}>
                        {getComparisonValue(loc.supply, cityAverage.supply) > 0 ? '+' : ''}{getComparisonValue(loc.supply, cityAverage.supply).toFixed(0)}%
                      </p>
                    )}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-5 gap-4 items-center">
                <div className="text-xs text-on-surface-variant">Demand (Seekers)</div>
                {localities.map(loc => (
                  <div key={`demand-${loc.name}`} className="text-center">
                    <p className="text-sm font-bold text-on-surface">{loc.demand}</p>
                    {cityAverage && (
                      <p className={`text-xs ${getComparisonColor(getComparisonValue(loc.demand, cityAverage.demand), true)}`}>
                        {getComparisonValue(loc.demand, cityAverage.demand) > 0 ? '+' : ''}{getComparisonValue(loc.demand, cityAverage.demand).toFixed(0)}%
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Pricing */}
            <div className="border-t border-primary/20 pt-4 space-y-3">
              <div className="text-xs font-bold text-secondary uppercase">Pricing</div>

              <div className="grid grid-cols-5 gap-4 items-center">
                <div className="text-xs text-on-surface-variant">Avg Rent</div>
                {localities.map(loc => (
                  <div key={`avg-${loc.name}`} className="text-center">
                    <p className="text-sm font-bold text-on-surface">₹{(loc.avgRent / 1000).toFixed(0)}k</p>
                    {cityAverage && (
                      <p className={`text-xs ${getComparisonColor(getComparisonValue(loc.avgRent, cityAverage.avgRent), false)}`}>
                        {getComparisonValue(loc.avgRent, cityAverage.avgRent) > 0 ? '+' : ''}{getComparisonValue(loc.avgRent, cityAverage.avgRent).toFixed(0)}%
                      </p>
                    )}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-5 gap-4 items-center">
                <div className="text-xs text-on-surface-variant">Median Rent</div>
                {localities.map(loc => (
                  <div key={`median-${loc.name}`} className="text-center">
                    <p className="text-sm font-bold text-on-surface">₹{(loc.medianRent / 1000).toFixed(0)}k</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-5 gap-4 items-center">
                <div className="text-xs text-on-surface-variant">Price Range</div>
                {localities.map(loc => (
                  <div key={`range-${loc.name}`} className="text-center">
                    <p className="text-xs text-on-surface-variant">
                      ₹{(loc.minPrice / 1000).toFixed(0)}k - ₹{(loc.maxPrice / 1000).toFixed(0)}k
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* BHK Pricing */}
            {localities.some(loc => loc.bhk1Avg || loc.bhk2Avg || loc.bhk3Avg) && (
              <div className="border-t border-primary/20 pt-4 space-y-3">
                <div className="text-xs font-bold text-primary uppercase">Price by BHK</div>

                {[
                  { key: 'bhk1Avg', label: '1BHK Avg' },
                  { key: 'bhk2Avg', label: '2BHK Avg' },
                  { key: 'bhk3Avg', label: '3BHK Avg' }
                ].map(bhk => (
                  localities.some(loc => (loc as any)[bhk.key]) && (
                    <div key={bhk.key} className="grid grid-cols-5 gap-4 items-center">
                      <div className="text-xs text-on-surface-variant">{bhk.label}</div>
                      {localities.map(loc => (
                        <div key={`${bhk.key}-${loc.name}`} className="text-center">
                          {(loc as any)[bhk.key] ? (
                            <>
                              <p className="text-sm font-bold text-on-surface">₹{((loc as any)[bhk.key] / 1000).toFixed(0)}k</p>
                            </>
                          ) : (
                            <p className="text-xs text-on-surface-variant">—</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )
                ))}
              </div>
            )}

            {/* Quality Metrics */}
            <div className="border-t border-primary/20 pt-4 space-y-3">
              <div className="text-xs font-bold text-tertiary uppercase">Quality & Profile</div>

              {localities.some(loc => loc.volatility) && (
                <div className="grid grid-cols-5 gap-4 items-center">
                  <div className="text-xs text-on-surface-variant">Volatility</div>
                  {localities.map(loc => (
                    <div key={`vol-${loc.name}`} className="text-center">
                      {loc.volatility ? (
                        <p className={`text-sm font-bold ${loc.volatility > 15 ? 'text-orange-400' : 'text-emerald-400'}`}>
                          {loc.volatility.toFixed(1)}%
                        </p>
                      ) : (
                        <p className="text-xs text-on-surface-variant">—</p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {localities.some(loc => loc.transparencyScore) && (
                <div className="grid grid-cols-5 gap-4 items-center">
                  <div className="text-xs text-on-surface-variant">Transparency</div>
                  {localities.map(loc => (
                    <div key={`trans-${loc.name}`} className="text-center">
                      {loc.transparencyScore ? (
                        <p className="text-sm font-bold text-on-surface">{loc.transparencyScore.toFixed(0)}%</p>
                      ) : (
                        <p className="text-xs text-on-surface-variant">—</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-on-surface-variant">
          <p className="text-sm mb-2">No localities selected for comparison</p>
          <p className="text-xs">Add 2-4 localities to see detailed comparison metrics</p>
        </div>
      )}

      {/* Selected Localities Pills */}
      {localities.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-4 border-t border-primary/20">
          {localities.map(locality => (
            <div
              key={locality.name}
              className="px-3 py-1.5 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center gap-2"
            >
              {locality.name}
              <button
                onClick={() => onRemoveLocality(locality.name)}
                className="hover:bg-primary/30 rounded-full p-0.5 transition-all"
                aria-label={`Remove ${locality.name}`}
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
