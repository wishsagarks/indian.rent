'use client';

import React, { useState } from 'react';
import LocalityProfileCard from './LocalityProfileCard';

interface LocalityProfile {
  name: string;
  region?: string;
  supply: number;
  demand: number;
  ratio: number;
  avgRent: number;
  medianRent: number;
  minRent: number;
  maxRent: number;
  bhk1Avg?: number;
  bhk2Avg?: number;
  bhk3Avg?: number;
  mostCommonBhk?: string;
  gatedPercent?: number;
  listingAge?: number;
  transparencyScore?: number;
  volatility?: number;
  cityRank?: number;
}

interface LocalityProfileListProps {
  localities: LocalityProfile[];
  cityAverage?: Partial<LocalityProfile>;
  sortBy?: 'demand' | 'rent' | 'ratio' | 'transparency';
  onLocalitySelect?: (localityName: string) => void;
}

export default function LocalityProfileList({
  localities = [],
  cityAverage,
  sortBy = 'demand',
  onLocalitySelect
}: LocalityProfileListProps) {
  const [selectedLocality, setSelectedLocality] = useState<string | null>(
    localities.length > 0 ? localities[0].name : null
  );
  const [currentPage, setCurrentPage] = useState(0);

  const itemsPerPage = 5;
  const paginatedLocalities = localities.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);
  const totalPages = Math.ceil(localities.length / itemsPerPage);

  const selectedProfile = localities.find(l => l.name === selectedLocality);

  const isAboveAverage = (locality: LocalityProfile, metric: string): boolean => {
    if (!cityAverage) return false;

    const metricMap: Record<string, keyof LocalityProfile> = {
      avgRent: 'avgRent',
      demand: 'demand',
      supply: 'supply',
      ratio: 'ratio',
      transparencyScore: 'transparencyScore'
    };

    const key = metricMap[metric] as keyof LocalityProfile;
    if (!key) return false;

    const localityValue = locality[key] as number;
    const avgValue = (cityAverage[key] as number) || 0;

    return localityValue > avgValue;
  };

  if (localities.length === 0) {
    return (
      <div className="text-center py-12 text-on-surface-variant">
        <p className="text-sm mb-2">No locality data available</p>
        <p className="text-xs">Localities will appear here once data is loaded</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Locality List */}
      <div className="lg:col-span-1 space-y-3">
        <div>
          <h3 className="text-xs uppercase tracking-widest font-technical font-bold text-primary mb-3">
            Browse Localities
          </h3>
          <p className="text-xs text-on-surface-variant mb-4">
            Showing {currentPage * itemsPerPage + 1}-{Math.min((currentPage + 1) * itemsPerPage, localities.length)} of {localities.length}
          </p>
        </div>

        <div className="space-y-2">
          {paginatedLocalities.map((locality, idx) => (
            <button
              key={idx}
              onClick={() => {
                setSelectedLocality(locality.name);
                onLocalitySelect?.(locality.name);
              }}
              className={`w-full text-left p-3 rounded-lg border transition-all ${
                selectedLocality === locality.name
                  ? 'border-primary bg-primary/20 text-on-surface'
                  : 'border-white/10 bg-surface/30 text-on-surface-variant hover:border-primary/50'
              }`}
            >
              <div className="flex items-start justify-between mb-1">
                <h4 className="font-bold text-sm">{locality.name}</h4>
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary font-bold">
                  {!isFinite(locality.ratio) ? '∞:1' : locality.ratio.toFixed(1) + ':1'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                <div>
                  <p className="text-on-surface-variant">Rent</p>
                  <p className="font-bold">₹{(locality.avgRent / 1000).toFixed(0)}k</p>
                </div>
                <div>
                  <p className="text-on-surface-variant">Supply</p>
                  <p className="font-bold">{locality.supply}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex gap-2 pt-4 border-t border-white/10">
            <button
              onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
              className="flex-1 px-2 py-1.5 text-xs font-bold rounded border border-primary/50 text-primary hover:bg-primary/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Prev
            </button>
            <div className="flex-1 flex items-center justify-center">
              <span className="text-xs text-on-surface-variant">
                {currentPage + 1} / {totalPages}
              </span>
            </div>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
              disabled={currentPage === totalPages - 1}
              className="flex-1 px-2 py-1.5 text-xs font-bold rounded border border-primary/50 text-primary hover:bg-primary/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          </div>
        )}
      </div>

      {/* Detailed Profile View */}
      <div className="lg:col-span-2">
        {selectedProfile ? (
          <div className="bg-surface/50 border border-white/10 rounded-lg p-6">
            <LocalityProfileCard
              locality={selectedProfile}
              cityAverage={cityAverage}
              isAboveAverage={(metric) => isAboveAverage(selectedProfile, metric)}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-96 border border-white/10 rounded-lg">
            <p className="text-on-surface-variant">Select a locality to view details</p>
          </div>
        )}
      </div>
    </div>
  );
}
