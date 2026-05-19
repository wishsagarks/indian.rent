'use client';

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface CityComparisonCard3DProps {
  label: string;
  bengaluru: string | number;
  hyderabad: string | number;
  delta: number;
  category: string;
}

export default function CityComparisonCard3D({
  label,
  bengaluru,
  hyderabad,
  delta,
  category
}: CityComparisonCard3DProps) {
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

      if (content) {
        gsap.to(content, {
          z: 50,
          duration: 0.3,
          ease: 'power2.out'
        });
      }
    };

    const handleMouseLeave = () => {
      gsap.to(card, {
        rotationX: 0,
        rotationY: 0,
        duration: 0.5,
        ease: 'elastic.out(1, 0.5)'
      });

      if (content) {
        gsap.to(content, {
          z: 0,
          duration: 0.5,
          ease: 'elastic.out(1, 0.5)'
        });
      }
    };

    card.addEventListener('mousemove', handleMouseMove);
    card.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      card.removeEventListener('mousemove', handleMouseMove);
      card.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  const deltaColor = delta > 0 ? 'text-green-400' : delta < 0 ? 'text-red-400' : 'text-yellow-400';

  return (
    <div
      ref={cardRef}
      className="relative rounded-xl border border-white/10 bg-gradient-to-br from-surface/80 via-surface/40 to-background/60 shadow-lg shadow-black/40 p-4 h-48"
      style={{
        transformStyle: 'preserve-3d',
        transform: 'translateZ(0)'
      }}
    >
      <div
        ref={contentRef}
        className="relative h-full flex flex-col justify-between"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Header */}
        <div>
          <p className="text-xs font-technical font-bold uppercase tracking-widest text-on-surface-variant mb-3">
            {label}
          </p>
          <p className="text-xs text-on-surface-variant/60 font-medium capitalize">
            {category}
          </p>
        </div>

        {/* Data Grid */}
        <div className="grid grid-cols-3 gap-3">
          {/* Bengaluru */}
          <div className="p-2 rounded-lg bg-white/5 border border-white/10">
            <p className="text-[10px] text-on-surface-variant mb-1">🏙️</p>
            <p className="text-sm font-bold text-white">
              {String(bengaluru).length > 10 ? String(bengaluru).slice(0, 10) + '...' : bengaluru}
            </p>
          </div>

          {/* Hyderabad */}
          <div className="p-2 rounded-lg bg-white/5 border border-white/10">
            <p className="text-[10px] text-on-surface-variant mb-1">🏙️</p>
            <p className="text-sm font-bold text-white">
              {String(hyderabad).length > 10 ? String(hyderabad).slice(0, 10) + '...' : hyderabad}
            </p>
          </div>

          {/* Delta */}
          <div className={`p-2 rounded-lg border ${
            delta > 0
              ? 'bg-green-500/10 border-green-500/30'
              : delta < 0
              ? 'bg-red-500/10 border-red-500/30'
              : 'bg-yellow-500/10 border-yellow-500/30'
          }`}>
            <p className={`text-[10px] mb-1 ${deltaColor}`}>Δ</p>
            <div className={`flex items-center gap-0.5 ${deltaColor}`}>
              {delta > 0 ? (
                <TrendingUp size={12} />
              ) : delta < 0 ? (
                <TrendingDown size={12} />
              ) : (
                <span className="text-xs">→</span>
              )}
              <span className="text-xs font-bold">{Math.abs(delta).toFixed(0)}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
