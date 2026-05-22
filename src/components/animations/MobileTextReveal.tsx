'use client';

import React from 'react';
import { motion, Variants } from 'framer-motion';

interface MobileTextRevealProps {
  text: string;
  className?: string;
  delay?: number;
  containerDelay?: number;
  staggerDuration?: number;
  splitByWord?: boolean;
}

export function MobileTextReveal({
  text,
  className = '',
  delay = 0,
  containerDelay = 0.1,
  staggerDuration = 0.05,
  splitByWord = true
}: MobileTextRevealProps) {
  const words = splitByWord ? text.split(' ') : text.split('');

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDuration,
        delayChildren: delay
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        ease: 'easeOut',
        duration: 0.5
      }
    }
  };

  return (
    <motion.div
      className={`inline-block ${className}`}
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: false, margin: '-100px' }}
    >
      {words.map((word, index) => (
        <motion.span
          key={index}
          variants={itemVariants}
          className="inline"
        >
          {word}{splitByWord && index < words.length - 1 ? ' ' : ''}
        </motion.span>
      ))}
    </motion.div>
  );
}
