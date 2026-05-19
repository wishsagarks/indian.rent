'use client';

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

interface KPICard3DProps {
  label: string;
  value: string | number;
  unit?: string;
  trend?: number;
  interpretation?: string;
  icon?: React.ReactNode;
  highlight?: boolean;
}

export default function KPICard3D({
  label,
  value,
  unit,
  trend,
  interpretation,
  icon,
  highlight = false
}: KPICard3DProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!cardRef.current) return;

    const card = cardRef.current;
    const content = contentRef.current;

    const handleMouseMove = (e: MouseEvent) => {
      if (!card) return;

      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = (y - centerY) * 0.05;
      const rotateY = (centerX - x) * 0.05;

      gsap.to(card, {
        rotationX: rotateX,
        rotationY: rotateY,
        transformPerspective: 1000,
        duration: 0.3,
        ease: 'power2.out'
      });

      gsap.to(content, {
        z: 50,
        duration: 0.3,
        ease: 'power2.out'
      });
    };

    const handleMouseLeave = () => {
      gsap.to(card, {
        rotationX: 0,
        rotationY: 0,
        duration: 0.5,
        ease: 'elastic.out(1, 0.5)'
      });

      gsap.to(content, {
        z: 0,
        duration: 0.5,
        ease: 'elastic.out(1, 0.5)'
      });
    };

    card.addEventListener('mousemove', handleMouseMove);
    card.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      card.removeEventListener('mousemove', handleMouseMove);
      card.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  const trendColor = trend && trend > 0 ? 'text-green-400' : trend && trend < 0 ? 'text-red-400' : 'text-on-surface-variant';
  const trendSymbol = trend && trend > 0 ? '↑' : trend && trend < 0 ? '↓' : '→';

  return (
    <div
      ref={cardRef}
      className={`relative h-40 rounded-xl border backdrop-blur-sm transition-all duration-300 ${
        highlight
          ? 'border-primary/60 bg-gradient-to-br from-primary/20 via-primary/5 to-surface/20 shadow-lg shadow-primary/20'
          : 'border-white/10 bg-gradient-to-br from-surface/80 via-surface/40 to-background/60 shadow-lg shadow-black/40'
      }`}
      style={{
        transformStyle: 'preserve-3d',
        transform: 'translateZ(0)'
      }}
    >
      {/* Animated gradient border effect */}
      <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
        <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
          highlight
            ? 'bg-gradient-to-r from-primary/40 via-primary/20 to-transparent'
            : 'bg-gradient-to-r from-white/20 via-white/5 to-transparent'
        }`} />
      </div>

      {/* Content container */}
      <div
        ref={contentRef}
        className="relative h-full p-5 flex flex-col justify-between"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-xs font-technical font-bold uppercase tracking-widest text-on-surface-variant mb-2">
              {label}
            </p>
          </div>
          {icon && (
            <div className={`p-2 rounded-lg ${
              highlight
                ? 'bg-primary/20 text-primary'
                : 'bg-white/5 text-on-surface-variant'
            }`}>
              {icon}
            </div>
          )}
        </div>

        {/* Value display */}
        <div className="space-y-1">
          <div className="flex items-baseline gap-2">
            <span className={`font-display text-3xl font-black ${
              highlight ? 'text-primary' : 'text-white'
            }`}>
              {value}
            </span>
            {unit && (
              <span className="text-xs font-technical text-on-surface-variant">
                {unit}
              </span>
            )}
          </div>

          {/* Trend or interpretation */}
          {trend !== undefined ? (
            <div className="flex items-center gap-1 pt-1">
              <span className={`text-sm font-bold ${trendColor}`}>
                {trendSymbol} {Math.abs(trend).toFixed(1)}%
              </span>
            </div>
          ) : interpretation ? (
            <p className="text-xs text-on-surface-variant pt-1">
              {interpretation}
            </p>
          ) : null}
        </div>
      </div>

      {/* Shine effect */}
      <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
        <div className="absolute -inset-full opacity-0 group-hover:opacity-20 transition-opacity duration-500 bg-gradient-to-r from-transparent via-white to-transparent animate-shimmer" />
      </div>
    </div>
  );
}
