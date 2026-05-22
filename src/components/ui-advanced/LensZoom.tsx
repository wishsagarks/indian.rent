'use client';

import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface LensZoomProps {
  imageSrc: string;
  alt?: string;
  className?: string;
  lensSize?: number;
  zoomLevel?: number;
}

export function LensZoom({
  imageSrc,
  alt = 'Image',
  className = '',
  lensSize = 100,
  zoomLevel = 2
}: LensZoomProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setMousePos({ x, y });
  };

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden rounded-xl border border-primary/20 ${className}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Main Image */}
      <img
        src={imageSrc}
        alt={alt}
        className="w-full h-full object-cover"
        draggable={false}
      />

      {/* Lens Circle */}
      <motion.div
        className="absolute pointer-events-none"
        style={{
          width: lensSize,
          height: lensSize,
          left: mousePos.x - lensSize / 2,
          top: mousePos.y - lensSize / 2,
          opacity: isHovering ? 1 : 0,
          transition: 'opacity 0.2s ease'
        }}
      >
        {/* Lens Border */}
        <div
          className="absolute inset-0 rounded-full border-2 border-primary/50 shadow-lg"
          style={{
            boxShadow: '0 0 0 3px rgba(255, 107, 53, 0.1)'
          }}
        />

        {/* Zoomed Image inside lens */}
        <motion.div
          className="absolute w-full h-full rounded-full overflow-hidden bg-black/50 backdrop-blur-sm"
          style={{
            left: -(mousePos.x * zoomLevel - lensSize / 2),
            top: -(mousePos.y * zoomLevel - lensSize / 2),
            width: '100%',
            height: '100%'
          }}
        >
          <img
            src={imageSrc}
            alt={alt}
            className="w-full h-full object-cover"
            style={{
              width: `${100 * zoomLevel}%`,
              height: `${100 * zoomLevel}%`,
              marginLeft: `${-mousePos.x * (zoomLevel - 1)}px`,
              marginTop: `${-mousePos.y * (zoomLevel - 1)}px`
            }}
            draggable={false}
          />
        </motion.div>

        {/* Crosshair */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-0.5 h-4 bg-primary/60" />
          <div className="w-4 h-0.5 bg-primary/60" />
        </div>
      </motion.div>

      {/* Hover Hint */}
      {!isHovering && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm"
        >
          <span className="text-white text-sm font-black uppercase tracking-widest">
            Hover to Zoom
          </span>
        </motion.div>
      )}
    </div>
  );
}
