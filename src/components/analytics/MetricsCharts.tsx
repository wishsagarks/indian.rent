'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, ScatterChart, Scatter } from 'recharts';
import { TrendingUp, AlertCircle } from 'lucide-react';

interface ChartProps {
  data: any[];
  title: string;
  description?: string;
  height?: number;
}

export function SupplyDemandChart({ data, title, description }: ChartProps) {
  // Demo data for when no data is available
  const demoData = [
    { name: 'Apr 22', Listings: 245, Seekers: 312 },
    { name: 'Apr 25', Listings: 268, Seekers: 345 },
    { name: 'Apr 28', Listings: 252, Seekers: 378 },
    { name: 'May 1', Listings: 291, Seekers: 412 },
    { name: 'May 4', Listings: 315, Seekers: 456 },
    { name: 'May 7', Listings: 328, Seekers: 489 },
    { name: 'May 10', Listings: 342, Seekers: 521 },
    { name: 'May 13', Listings: 356, Seekers: 548 },
    { name: 'May 16', Listings: 371, Seekers: 592 },
    { name: 'May 20', Listings: 385, Seekers: 634 },
  ];

  const chartData = data && data.length > 0 ? data : demoData;

  // Calculate stats
  const listingsStart = chartData[0]?.Listings || 0;
  const listingsEnd = chartData[chartData.length - 1]?.Listings || 0;
  const seekersStart = chartData[0]?.Seekers || 0;
  const seekersEnd = chartData[chartData.length - 1]?.Seekers || 0;

  const listingsChangeNum = (listingsEnd - listingsStart) / listingsStart * 100;
  const seekersChangeNum = (seekersEnd - seekersStart) / seekersStart * 100;
  const listingsChange = listingsChangeNum.toFixed(1);
  const seekersChange = seekersChangeNum.toFixed(1);
  const averageListings = (chartData.reduce((sum, d) => sum + (d.Listings || 0), 0) / chartData.length).toFixed(0);
  const averageSeekers = (chartData.reduce((sum, d) => sum + (d.Seekers || 0), 0) / chartData.length).toFixed(0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="bg-surface border border-white/10 rounded-lg p-6 space-y-6"
    >
      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-black uppercase tracking-widest text-primary font-technical">{title}</h3>
          {description && <p className="text-xs text-on-surface-variant mt-1">{description}</p>}
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
          <div className="bg-background/50 rounded-lg p-3 border border-blue-500/20">
            <p className="text-[10px] text-blue-400 font-technical uppercase tracking-wider">Listings Change</p>
            <p className="text-lg font-black text-primary mt-1">{listingsChangeNum > 0 ? '+' : ''}{listingsChange}%</p>
            <p className="text-[10px] text-on-surface-variant mt-0.5">{listingsStart} → {listingsEnd}</p>
          </div>
          <div className="bg-background/50 rounded-lg p-3 border border-green-500/20">
            <p className="text-[10px] text-green-400 font-technical uppercase tracking-wider">Seekers Change</p>
            <p className="text-lg font-black text-secondary mt-1">{seekersChangeNum > 0 ? '+' : ''}{seekersChange}%</p>
            <p className="text-[10px] text-on-surface-variant mt-0.5">{seekersStart} → {seekersEnd}</p>
          </div>
          <div className="bg-background/50 rounded-lg p-3 border border-blue-500/20">
            <p className="text-[10px] text-on-surface-variant font-technical uppercase tracking-wider">Avg Listings</p>
            <p className="text-lg font-black text-on-surface mt-1">{averageListings}</p>
            <p className="text-[10px] text-on-surface-variant mt-0.5">30-day average</p>
          </div>
          <div className="bg-background/50 rounded-lg p-3 border border-green-500/20">
            <p className="text-[10px] text-on-surface-variant font-technical uppercase tracking-wider">Avg Seekers</p>
            <p className="text-lg font-black text-on-surface mt-1">{averageSeekers}</p>
            <p className="text-[10px] text-on-surface-variant mt-0.5">30-day average</p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
          <XAxis
            dataKey="name"
            stroke="rgba(255,255,255,0.3)"
            style={{ fontSize: '11px', fontWeight: '600' }}
            tick={{ fill: 'rgba(255,255,255,0.5)' }}
          />
          <YAxis
            stroke="rgba(255,255,255,0.3)"
            style={{ fontSize: '11px' }}
            tick={{ fill: 'rgba(255,255,255,0.5)' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#0a0a0a',
              border: '1px solid rgba(0,136,255,0.5)',
              borderRadius: '8px',
              color: '#fff',
              boxShadow: '0 0 20px rgba(0,136,255,0.2)'
            }}
            formatter={(value) => typeof value === 'number' ? value.toLocaleString() : value}
            labelStyle={{ color: '#fff' }}
          />
          <Legend
            wrapperStyle={{ paddingTop: '12px' }}
            iconType="line"
          />
          <Line
            type="monotone"
            dataKey="Listings"
            stroke="#0088ff"
            strokeWidth={3}
            dot={{ r: 5, fill: '#0088ff' }}
            activeDot={{ r: 7 }}
            isAnimationActive
            name="📊 Listings"
          />
          <Line
            type="monotone"
            dataKey="Seekers"
            stroke="#2f8001"
            strokeWidth={3}
            dot={{ r: 5, fill: '#2f8001' }}
            activeDot={{ r: 7 }}
            isAnimationActive
            name="👥 Seekers"
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Insight */}
      <div className="border-t border-white/5 pt-4">
        <p className="text-xs text-on-surface-variant leading-relaxed">
          <span className="font-technical font-black text-primary">💡 Insight:</span> {
            listingsChangeNum > 0 && seekersChangeNum > 0
              ? `Both supply and demand growing. Market is active — good opportunity for landlords and seekers.`
              : listingsChangeNum < 0 && seekersChangeNum > 0
              ? `High demand but low supply. Properties rent quickly in this market.`
              : listingsChangeNum > 0 && seekersChangeNum < 0
              ? `More listings but fewer seekers. Competitive market for landlords.`
              : `Balanced market. Standard supply-demand dynamics.`
          }
        </p>
      </div>
    </motion.div>
  );
}

export function PriceDistributionChart({ data, title, description }: ChartProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
      className="bg-surface border border-white/10 rounded-lg p-6 space-y-4"
    >
      <div>
        <h3 className="text-sm font-black uppercase tracking-widest text-primary font-technical">{title}</h3>
        {description && <p className="text-xs text-on-surface-variant mt-1">{description}</p>}
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis dataKey="category" stroke="rgba(255,255,255,0.3)" style={{ fontSize: '12px' }} />
          <YAxis stroke="rgba(255,255,255,0.3)" style={{ fontSize: '12px' }} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(0,102,255,0.3)', borderRadius: '8px', color: '#fff' }}
            formatter={(value) => `₹${typeof value === 'number' ? (value / 1000).toFixed(1) : value}k`}
          />
          <Legend />
          <Bar dataKey="P25" fill="rgba(0,102,255,0.4)" />
          <Bar dataKey="Median" fill="#0066ff" />
          <Bar dataKey="P75" fill="rgba(0,102,255,0.7)" />
          <Bar dataKey="Average" fill="rgba(47,248,1,0.5)" />
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}

export function MarketSegmentChart({ data, title, description }: ChartProps) {
  const COLORS = ['#0066ff', '#2f8001', '#ff9500', '#ff3b30', '#5856d6', '#00c7be'];

  return (
    <div className="bg-surface border border-white/10 rounded-lg p-6 space-y-4">
      <div>
        <h3 className="text-sm font-black uppercase tracking-widest text-primary font-technical">{title}</h3>
        {description && <p className="text-xs text-on-surface-variant mt-1">{description}</p>}
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, value }) => `${name} (${value})`}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(0,102,255,0.3)', borderRadius: '8px', color: '#fff' }}
            formatter={(value) => typeof value === 'number' ? value.toLocaleString() : value}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function LocalityPerformanceChart({ data, title, description }: ChartProps) {
  return (
    <div className="bg-surface border border-white/10 rounded-lg p-6 space-y-4">
      <div>
        <h3 className="text-sm font-black uppercase tracking-widest text-primary font-technical">{title}</h3>
        {description && <p className="text-xs text-on-surface-variant mt-1">{description}</p>}
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <ScatterChart margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis type="number" dataKey="demand" stroke="rgba(255,255,255,0.3)" style={{ fontSize: '12px' }} />
          <YAxis type="number" dataKey="medianRent" stroke="rgba(255,255,255,0.3)" style={{ fontSize: '12px' }} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(0,102,255,0.3)', borderRadius: '8px', color: '#fff' }}
            cursor={{ fill: 'rgba(0,0,0,0.1)' }}
            formatter={(value) => typeof value === 'number' ? value.toLocaleString() : value}
          />
          <Scatter name="Localities" data={data} fill="#0066ff" fillOpacity={0.6} />
        </ScatterChart>
      </ResponsiveContainer>
      <div className="text-xs text-on-surface-variant">
        X-Axis: Seeker Demand | Y-Axis: Median Rent
      </div>
    </div>
  );
}
