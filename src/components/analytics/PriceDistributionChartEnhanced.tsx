'use client';

import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Info } from 'lucide-react';

interface PriceData {
  category: string;
  P25?: number;
  Median?: number;
  P75?: number;
  Average?: number;
}

interface Props {
  data: PriceData[];
  title: string;
  description?: string;
}

export default function PriceDistributionChartEnhanced({ data, title, description }: Props) {
  const [visibleMetrics, setVisibleMetrics] = useState({
    P25: true,
    Median: true,
    P75: true,
    Average: true
  });
  const [showInfo, setShowInfo] = useState(false);

  const toggleMetric = (metric: keyof typeof visibleMetrics) => {
    setVisibleMetrics(prev => ({
      ...prev,
      [metric]: !prev[metric]
    }));
  };

  const metrics = [
    { key: 'P25', label: '25th Percentile', color: 'rgba(0,102,255,0.4)', rgba: 'rgba(0,102,255,0.4)' },
    { key: 'Median', label: 'Median', color: '#0066ff', rgba: '#0066ff' },
    { key: 'P75', label: '75th Percentile', color: 'rgba(0,102,255,0.7)', rgba: 'rgba(0,102,255,0.7)' },
    { key: 'Average', label: 'Average', color: 'rgba(47,248,1,0.5)', rgba: 'rgba(47,248,1,0.5)' }
  ];

  return (
    <div className="bg-surface border border-white/10 rounded-lg p-6 space-y-4">
      <div>
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-black uppercase tracking-widest text-primary font-technical">{title}</h3>
          <div className="relative">
            <button
              onClick={() => setShowInfo(!showInfo)}
              onMouseEnter={() => setShowInfo(true)}
              onMouseLeave={() => setShowInfo(false)}
              className="p-0.5 text-on-surface-variant/60 hover:text-primary transition-colors flex items-center justify-center"
            >
              <Info size={14} />
            </button>
            {showInfo && (
              <div className="absolute top-full left-0 mt-2 w-56 bg-surface border border-outline/30 rounded-lg p-2.5 text-[10px] leading-normal text-on-surface z-50 shadow-2xl">
                P25 = 25th percentile (quarter rent lower). Median = middle price. P75 = 75th percentile (quarter higher). Average = mean of all rents.
              </div>
            )}
          </div>
        </div>
        {description && <p className="text-xs text-on-surface-variant mt-1">{description}</p>}
      </div>

      {/* Toggle Buttons */}
      <div className="flex flex-wrap gap-2">
        {metrics.map(metric => (
          <button
            key={metric.key}
            onClick={() => toggleMetric(metric.key as keyof typeof visibleMetrics)}
            className={`px-3 py-1.5 rounded-lg text-xs font-technical font-bold uppercase tracking-wider transition-all ${
              visibleMetrics[metric.key as keyof typeof visibleMetrics]
                ? 'bg-primary/20 text-primary border border-primary/50'
                : 'bg-white/5 text-on-surface-variant border border-white/10 hover:border-white/20'
            }`}
          >
            {metric.label}
          </button>
        ))}
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis dataKey="category" stroke="rgba(255,255,255,0.3)" style={{ fontSize: '12px' }} />
          <YAxis stroke="rgba(255,255,255,0.3)" style={{ fontSize: '12px' }} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1a1a1a',
              border: '1px solid rgba(0,102,255,0.3)',
              borderRadius: '8px',
              color: '#fff'
            }}
            formatter={(value) => {
              if (typeof value === 'number') {
                return `₹${(value / 1000).toFixed(2)}k`;
              }
              return value;
            }}
            labelStyle={{ color: '#fff' }}
          />
          <Legend wrapperStyle={{ paddingTop: '16px' }} />

          {visibleMetrics.P25 && (
            <Bar dataKey="P25" fill="rgba(0,102,255,0.4)" name="25th Percentile" />
          )}
          {visibleMetrics.Median && (
            <Bar dataKey="Median" fill="#0066ff" name="Median" />
          )}
          {visibleMetrics.P75 && (
            <Bar dataKey="P75" fill="rgba(0,102,255,0.7)" name="75th Percentile" />
          )}
          {visibleMetrics.Average && (
            <Bar dataKey="Average" fill="rgba(47,248,1,0.5)" name="Average" />
          )}
        </BarChart>
      </ResponsiveContainer>

      {/* Data Summary Table */}
      <div className="mt-6 pt-4 border-t border-white/10">
        <p className="text-xs font-technical font-bold uppercase tracking-widest text-on-surface-variant mb-3">
          Price Summary (₹)
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          {data.map(row => (
            <div key={row.category} className="p-2 rounded-lg bg-white/5 border border-white/10">
              <p className="font-bold text-primary mb-1">{row.category}</p>
              <div className="space-y-1 text-[11px] text-on-surface-variant">
                {row.P25 && <div>P25: ₹{(row.P25 / 1000).toFixed(2)}k</div>}
                {row.Median && <div>Med: ₹{(row.Median / 1000).toFixed(2)}k</div>}
                {row.P75 && <div>P75: ₹{(row.P75 / 1000).toFixed(2)}k</div>}
                {row.Average && <div>Avg: ₹{(row.Average / 1000).toFixed(2)}k</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
