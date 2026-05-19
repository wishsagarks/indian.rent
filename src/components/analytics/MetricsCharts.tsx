'use client';

import React from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, ScatterChart, Scatter } from 'recharts';
import { TrendingUp, AlertCircle } from 'lucide-react';

interface ChartProps {
  data: any[];
  title: string;
  description?: string;
  height?: number;
}

export function SupplyDemandChart({ data, title, description }: ChartProps) {
  return (
    <div className="bg-surface border border-white/10 rounded-lg p-6 space-y-4">
      <div>
        <h3 className="text-sm font-black uppercase tracking-widest text-primary font-technical">{title}</h3>
        {description && <p className="text-xs text-on-surface-variant mt-1">{description}</p>}
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" style={{ fontSize: '12px' }} />
          <YAxis stroke="rgba(255,255,255,0.3)" style={{ fontSize: '12px' }} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(0,102,255,0.3)', borderRadius: '8px', color: '#fff' }}
            formatter={(value) => typeof value === 'number' ? value.toLocaleString() : value}
          />
          <Legend />
          <Line type="monotone" dataKey="Listings" stroke="#0066ff" strokeWidth={2} dot={{ r: 4 }} />
          <Line type="monotone" dataKey="Seekers" stroke="#2f8001" strokeWidth={2} dot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function PriceDistributionChart({ data, title, description }: ChartProps) {
  return (
    <div className="bg-surface border border-white/10 rounded-lg p-6 space-y-4">
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
    </div>
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
