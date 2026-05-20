'use client';

import React from 'react';
import { motion, useScroll, useSpring, useTransform, MotionValue } from 'framer-motion';

function CheckpointNode({ cp, y1 }: { cp: number, y1: MotionValue<number> }) {
  // Hook called at top level of the component
  const opacity = useTransform(y1, [cp - 0.05, cp, cp + 0.05], [0, 1, 0]);
  const scale = useTransform(y1, [cp - 0.05, cp, cp + 0.05], [0.8, 1.2, 0.8]);

  return (
    <div 
      className="absolute left-1/2 -translate-x-1/2 w-2 h-2 rounded-full border border-white/20 bg-surface shadow-inner z-10 flex items-center justify-center"
      style={{ top: `${cp * 100}%` }}
    >
      {/* Dynamic Glow for active checkpoint */}
      <motion.div 
        style={{ opacity, scale }}
        className="absolute inset-0 rounded-full bg-primary blur-[6px]"
      />
      {/* Inner physical dot */}
      <div className="w-0.5 h-0.5 rounded-full bg-white/30" />
    </div>
  );
}

export default function TracingBeam({ children, checkpoints: customCheckpoints }: { children: React.ReactNode, checkpoints?: number[] }) {
  const { scrollYProgress } = useScroll();

  const y1 = useSpring(scrollYProgress, {
    stiffness: 500,
    damping: 90,
  });

  const heightTransform = useTransform(y1, [0, 1], ["0%", "100%"]);

  // Milestone percentages for sections
  const checkpoints = customCheckpoints ?? [0, 0.33, 0.66, 1];

  return (
    <div className="relative w-full min-h-screen">
      {/* Fixed Vertical Progress HUD in the Margin */}
      <div className="fixed left-0 top-0 bottom-0 w-16 hidden lg:flex flex-col items-center justify-center z-[60] pointer-events-none">
        <div className="h-1/2 w-px bg-white/5 relative">
          {/* Background Track */}
          <div className="absolute inset-0 bg-primary/10" />
          
          {/* Static Milestone Checkpoints (Rounded Circles) */}
          {checkpoints.map((cp, i) => (
            <CheckpointNode key={i} cp={cp} y1={y1} />
          ))}
          
          {/* Progress Fill */}
          <motion.div
            style={{
              height: heightTransform,
            }}
            className="absolute top-0 left-0 w-full bg-gradient-to-b from-primary via-secondary to-primary shadow-[0_0_15px_rgba(0,102,255,0.4)]"
          />
          
          {/* Tactical Indicator Node (Moving) */}
          <motion.div
             style={{
               top: heightTransform,
             }}
             className="absolute left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-primary shadow-[0_0_20px_rgba(0,102,255,1)] border-2 border-white flex items-center justify-center z-20"
          >
             <div className="w-1 h-1 bg-white rounded-full animate-ping" />
          </motion.div>
        </div>
      </div>

      <div className="relative z-10 w-full">
        {children}
      </div>
    </div>
  );
}
