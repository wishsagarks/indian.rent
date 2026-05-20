'use client';

import React from 'react';
import { motion, useScroll, useSpring, useTransform } from 'framer-motion';

export default function MobileScrollProgress() {
  const { scrollYProgress } = useScroll();

  const y1 = useSpring(scrollYProgress, {
    stiffness: 500,
    damping: 90,
  });

  const scaleX = useTransform(y1, [0, 1], ['0%', '100%']);
  const opacity = useTransform(y1, [0, 0.1], [0, 1]);

  return (
    <>
      {/* Mobile scroll progress bar (visible on <1024px) */}
      <motion.div
        style={{
          scaleX,
          originX: 0,
          opacity,
        }}
        className="fixed top-16 left-0 h-0.5 md:h-1 bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_8px_rgba(204,120,92,0.6)] z-50 lg:hidden"
      />

      {/* Desktop scroll progress bar (visible on >=1024px) */}
      <motion.div
        style={{
          scaleX,
          originX: 0,
        }}
        className="fixed top-16 left-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_15px_rgba(0,102,255,0.4)] z-50 hidden lg:block"
      />
    </>
  );
}
