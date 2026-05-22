'use client';

import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface MobileCardRevealProps {
  children: ReactNode;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  duration?: number;
  className?: string;
  index?: number;
  staggerDelay?: number;
}

export function MobileCardReveal({
  children,
  delay = 0,
  direction = 'up',
  duration = 0.6,
  className = '',
  index = 0,
  staggerDelay = 0.1
}: MobileCardRevealProps) {
  const getInitialPosition = () => {
    switch (direction) {
      case 'up':
        return { y: 40, x: 0 };
      case 'down':
        return { y: -40, x: 0 };
      case 'left':
        return { x: 40, y: 0 };
      case 'right':
        return { x: -40, y: 0 };
      default:
        return { y: 40, x: 0 };
    }
  };

  return (
    <motion.div
      initial={{
        opacity: 0,
        ...getInitialPosition()
      }}
      whileInView={{
        opacity: 1,
        x: 0,
        y: 0
      }}
      viewport={{ once: false, margin: '-50px' }}
      transition={{
        duration,
        delay: delay + (index * staggerDelay),
        ease: [0.34, 1.56, 0.64, 1]
      }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.98, transition: { duration: 0.1 } }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
