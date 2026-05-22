'use client';

import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface ImageComparisonSliderProps {
  beforeImage: string;
  afterImage: string;
  beforeLabel?: string;
  afterLabel?: string;
  className?: string;
  height?: string;
}

export function ImageComparisonSlider({
  beforeImage,
  afterImage,
  beforeLabel = 'Before',
  afterLabel = 'After',
  className = '',
  height = 'h-96'
}: ImageComparisonSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sliderPos, setSliderPos] = useState(50);
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = () => {
    setIsDragging(true);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = (x / rect.width) * 100;

      setSliderPos(Math.max(0, Math.min(100, percentage)));
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden rounded-xl border border-primary/20 bg-surface cursor-col-resize select-none ${height} ${className}`}
      onMouseDown={handleMouseDown}
      onMouseLeave={handleMouseUp}
    >
      {/* Before Image - Full */}
      <div className="absolute inset-0 w-full h-full">
        <img
          src={beforeImage}
          alt={beforeLabel}
          className="w-full h-full object-cover"
          draggable={false}
        />
      </div>

      {/* After Image - Clipped */}
      <div
        className="absolute inset-0 w-full h-full overflow-hidden"
        style={{ width: `${100 - sliderPos}%`, right: 0 }}
      >
        <img
          src={afterImage}
          alt={afterLabel}
          className="w-screen h-full object-cover"
          style={{ marginLeft: `-${sliderPos}%` }}
          draggable={false}
        />
      </div>

      {/* Slider Handle */}
      <div
        className="absolute top-0 bottom-0 w-1 bg-gradient-to-b from-primary via-primary to-secondary cursor-col-resize hover:w-2 transition-all"
        style={{ left: `${sliderPos}%` }}
      />

      {/* Handle Circle */}
      <motion.div
        className="absolute top-1/2 -translate-y-1/2 w-12 h-12 bg-primary/20 backdrop-blur-sm border-2 border-primary rounded-full flex items-center justify-center shadow-lg pointer-events-none"
        style={{ left: `${sliderPos}%`, x: '-50%' }}
      >
        <div className="flex gap-1">
          <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 24 24">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth={2} fill="none" />
          </svg>
          <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 24 24">
            <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth={2} fill="none" />
          </svg>
        </div>
      </motion.div>

      {/* Labels */}
      <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm px-3 py-1 rounded text-white text-xs font-black uppercase">
        {beforeLabel}
      </div>
      <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm px-3 py-1 rounded text-white text-xs font-black uppercase">
        {afterLabel}
      </div>
    </div>
  );
}
