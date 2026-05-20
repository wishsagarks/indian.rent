'use client';

import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Info } from 'lucide-react';

interface SegmentData {
  name: string;
  value: number;
}

interface Props {
  data: SegmentData[];
  title: string;
  description?: string;
}

export default function MarketSegmentChartEnhanced({ data, title, description }: Props) {
  const [showInfo, setShowInfo] = useState(false);
  const COLORS = ['#0066ff', '#2f8001', '#ff9500', '#ff3b30', '#5856d6', '#00c7be', '#ff6b6b', '#a78bfa'];

  const total = data.reduce((sum, item) => sum + item.value, 0);

  // Custom label function - only show percentage for large slices
  const renderLabel = (entry: any) => {
    const percent = ((entry.value / total) * 100).toFixed(1);
    // Only show label on pie for slices > 10%
    if (parseFloat(percent) > 10) {
      return `${percent}%`;
    }
    return '';
  };

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
                Market split by BHK type (studio, 1BHK, 2BHK, etc). Shows which segment dominates the rental market.
              </div>
            )}
          </div>
        </div>
        {description && <p className="text-xs text-on-surface-variant mt-1">{description}</p>}
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="40%"
            cy="50%"
            labelLine={false}
            label={renderLabel}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#1a1a1a',
              border: '1px solid rgba(0,102,255,0.3)',
              borderRadius: '8px',
              color: '#fff'
            }}
            formatter={(value: any) => {
              if (typeof value !== 'number') return value;
              const percent = ((value / total) * 100).toFixed(1);
              return [`${value} listings (${percent}%)`, 'Count'];
            }}
          />
          <Legend
            layout="vertical"
            align="right"
            verticalAlign="middle"
            wrapperStyle={{ paddingLeft: '20px' }}
            formatter={(value, entry) => {
              const dataItem = data.find(d => d.name === value);
              if (!dataItem) return value;
              const percent = ((dataItem.value / total) * 100).toFixed(1);
              return `${value}: ${dataItem.value} (${percent}%)`;
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Detailed Table */}
      <div className="mt-6 pt-4 border-t border-white/10">
        <p className="text-xs font-technical font-bold uppercase tracking-widest text-on-surface-variant mb-3">
          Market Breakdown
        </p>
        <div className="space-y-2">
          {data.map((item, index) => {
            const percent = ((item.value / total) * 100).toFixed(1);
            return (
              <div key={item.name} className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/10">
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-sm font-technical font-bold text-on-surface">{item.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-primary">{item.value}</span>
                  <span className="text-xs text-on-surface-variant w-12 text-right">{percent}%</span>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 p-3 rounded-lg bg-primary/10 border border-primary/30">
          <div className="flex justify-between">
            <span className="text-xs font-technical font-bold uppercase text-on-surface-variant">Total Listings</span>
            <span className="text-lg font-bold text-primary">{total}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
