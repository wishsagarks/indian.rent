'use client';

import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

interface BeamPoint {
  id: string;
  x: number;
  y: number;
  label: string;
  icon?: React.ReactNode;
}

interface AnimatedBeamProps {
  points: BeamPoint[];
  connections?: Array<{ from: string; to: string }>;
  className?: string;
  beamColor?: string;
  animated?: boolean;
  direction?: 'horizontal' | 'vertical' | 'auto';
}

export function AnimatedBeam({
  points,
  connections,
  className = '',
  beamColor = '#ff6b35',
  animated = true,
  direction = 'auto'
}: AnimatedBeamProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const defaultConnections = connections ||
    (points.length > 1
      ? points.slice(0, -1).map((p, i) => ({
          from: p.id,
          to: points[i + 1].id
        }))
      : []);

  return (
    <div ref={containerRef} className={`relative w-full h-full ${className}`}>
      {/* SVG Canvas for beams */}
      <svg
        ref={svgRef}
        className="absolute inset-0 w-full h-full"
        style={{ pointerEvents: 'none' }}
      >
        <defs>
          <linearGradient id="beamGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={beamColor} stopOpacity="0" />
            <stop offset="50%" stopColor={beamColor} stopOpacity="0.8" />
            <stop offset="100%" stopColor={beamColor} stopOpacity="0" />
          </linearGradient>

          {animated && (
            <style>
              {`
                @keyframes beam-flow {
                  0% { strokeDashoffset: 1000; }
                  100% { strokeDashoffset: 0; }
                }
                .animated-beam {
                  animation: beam-flow 3s linear infinite;
                }
              `}
            </style>
          )}
        </defs>

        {/* Draw connections */}
        {defaultConnections.map((connection, idx) => {
          const fromPoint = points.find(p => p.id === connection.from);
          const toPoint = points.find(p => p.id === connection.to);

          if (!fromPoint || !toPoint) return null;

          const containerRect = containerRef.current?.getBoundingClientRect();
          if (!containerRect) return null;

          // Calculate line properties
          const x1 = (fromPoint.x / 100) * containerRect.width;
          const y1 = (fromPoint.y / 100) * containerRect.height;
          const x2 = (toPoint.x / 100) * containerRect.width;
          const y2 = (toPoint.y / 100) * containerRect.height;

          const length = Math.sqrt(
            Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)
          );

          return (
            <g key={idx}>
              {/* Main beam line */}
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={beamColor}
                strokeWidth="2"
                strokeOpacity="0.3"
              />

              {/* Animated beam */}
              {animated && (
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="url(#beamGradient)"
                  strokeWidth="3"
                  strokeDasharray={length}
                  strokeDashoffset={length}
                  className="animated-beam"
                  strokeLinecap="round"
                />
              )}

              {/* Connection circle at midpoint */}
              <circle
                cx={(x1 + x2) / 2}
                cy={(y1 + y2) / 2}
                r="4"
                fill={beamColor}
                opacity="0.5"
              />
            </g>
          );
        })}
      </svg>

      {/* Points */}
      <div className="relative w-full h-full">
        {points.map((point) => (
          <motion.div
            key={point.id}
            className="absolute"
            style={{
              left: `${point.x}%`,
              top: `${point.y}%`,
              transform: 'translate(-50%, -50%)'
            }}
            whileHover={{ scale: 1.15 }}
          >
            {/* Point circle with glow */}
            <motion.div
              className="relative w-10 h-10 rounded-full border-2 border-current flex items-center justify-center text-primary shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${beamColor}20, ${beamColor}05)`,
                borderColor: beamColor
              }}
              animate={{
                boxShadow: [
                  `0 0 10px ${beamColor}40`,
                  `0 0 20px ${beamColor}60`,
                  `0 0 10px ${beamColor}40`
                ]
              }}
              transition={{
                duration: 2,
                repeat: Infinity
              }}
            >
              {point.icon && (
                <span className="text-sm">{point.icon}</span>
              )}

              {/* Point label */}
              <motion.div
                className="absolute top-full mt-2 whitespace-nowrap text-xs font-black bg-surface-container border border-primary/20 px-3 py-1 rounded-full backdrop-blur-sm"
                initial={{ opacity: 0, y: -10 }}
                whileHover={{ opacity: 1, y: 0 }}
              >
                {point.label}
              </motion.div>
            </motion.div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
