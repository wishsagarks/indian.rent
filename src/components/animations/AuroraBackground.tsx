'use client';

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

interface AuroraBackgroundProps {
  children?: React.ReactNode;
  className?: string;
  colors?: string[];
}

export function AuroraBackground({
  children,
  className = '',
  colors = ['#ff6b35', '#0088ff', '#ff1b8d', '#00d4ff']
}: AuroraBackgroundProps) {
  return (
    <div className={`relative w-full overflow-hidden bg-background ${className}`}>
      {/* Aurora Effect Container */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Aurora Wave 1 */}
        <motion.div
          className="absolute inset-0 opacity-30"
          animate={{
            background: [
              `radial-gradient(600px ellipse at 20% 30%, ${colors[0]}40 0%, transparent 40%)`,
              `radial-gradient(600px ellipse at 80% 50%, ${colors[1]}40 0%, transparent 40%)`,
              `radial-gradient(600px ellipse at 20% 80%, ${colors[2]}40 0%, transparent 40%)`,
              `radial-gradient(600px ellipse at 80% 20%, ${colors[3]}40 0%, transparent 40%)`,
              `radial-gradient(600px ellipse at 20% 30%, ${colors[0]}40 0%, transparent 40%)`
            ]
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />

        {/* Aurora Wave 2 - Offset */}
        <motion.div
          className="absolute inset-0 opacity-20"
          animate={{
            background: [
              `radial-gradient(800px ellipse at 80% 20%, ${colors[1]}30 0%, transparent 50%)`,
              `radial-gradient(800px ellipse at 20% 50%, ${colors[2]}30 0%, transparent 50%)`,
              `radial-gradient(800px ellipse at 80% 80%, ${colors[3]}30 0%, transparent 50%)`,
              `radial-gradient(800px ellipse at 20% 30%, ${colors[0]}30 0%, transparent 50%)`,
              `radial-gradient(800px ellipse at 80% 20%, ${colors[1]}30 0%, transparent 50%)`
            ]
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 1
          }}
        />

        {/* Aurora Wave 3 - Slow */}
        <motion.div
          className="absolute inset-0 opacity-15"
          animate={{
            background: [
              `radial-gradient(900px ellipse at 50% 50%, ${colors[2]}20 0%, transparent 60%)`,
              `radial-gradient(900px ellipse at 50% 50%, ${colors[3]}20 0%, transparent 60%)`,
              `radial-gradient(900px ellipse at 50% 50%, ${colors[0]}20 0%, transparent 60%)`,
              `radial-gradient(900px ellipse at 50% 50%, ${colors[1]}20 0%, transparent 60%)`,
              `radial-gradient(900px ellipse at 50% 50%, ${colors[2]}20 0%, transparent 60%)`
            ]
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 2
          }}
        />

        {/* Blur filter for smoothness */}
        <div className="absolute inset-0 backdrop-blur-[100px]" />
      </div>

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
