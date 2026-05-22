'use client';

import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';

interface Marquee3DProps {
  items: Array<{
    id: string;
    label: string;
    icon?: React.ReactNode;
    color?: string;
  }>;
  className?: string;
  speed?: number;
  direction?: 'left' | 'right';
  perspective?: boolean;
}

export function Marquee3D({
  items,
  className = '',
  speed = 50,
  direction = 'left',
  perspective = true
}: Marquee3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !innerRef.current) return;

    const container = containerRef.current;
    const inner = innerRef.current;

    // Clone items for seamless loop
    const children = Array.from(inner.children) as HTMLElement[];
    children.forEach((child) => {
      const clone = child.cloneNode(true) as HTMLElement;
      inner.appendChild(clone);
    });

    // Calculate width for animation
    const totalWidth = inner.scrollWidth / 2;

    // GSAP animation
    gsap.set(inner, { x: 0 });
    gsap.to(inner, {
      x: direction === 'left' ? -totalWidth : totalWidth,
      duration: speed,
      ease: 'none',
      repeat: -1,
      modifiers: {
        x: gsap.utils.unitize((x) => parseFloat(x) % totalWidth)
      }
    });

    return () => {
      gsap.killTweensOf(inner);
    };
  }, [speed, direction]);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden w-full ${perspective ? 'perspective' : ''} ${className}`}
      style={{
        perspective: perspective ? '1000px' : 'none'
      }}
    >
      {/* Gradient fade left */}
      <div className="absolute left-0 top-0 bottom-0 w-32 md:w-48 bg-gradient-to-r from-background via-background/50 to-transparent z-20 pointer-events-none" />
      {/* Gradient fade right */}
      <div className="absolute right-0 top-0 bottom-0 w-32 md:w-48 bg-gradient-to-l from-background via-background/50 to-transparent z-20 pointer-events-none" />

      {/* Scrolling container */}
      <div
        ref={innerRef}
        className="flex gap-6 md:gap-8 whitespace-nowrap py-8 md:py-10"
        style={{
          transformStyle: perspective ? 'preserve-3d' : 'flat'
        }}
      >
        {items.map((item) => (
          <motion.div
            key={item.id}
            className="flex-shrink-0"
            whileHover={{
              scale: 1.05,
              y: -8,
              rotateY: perspective ? 15 : 0,
              transition: { type: 'spring', stiffness: 200, damping: 15 }
            }}
            style={{
              transformStyle: perspective ? 'preserve-3d' : 'flat'
            }}
          >
            <motion.div
              className={`group relative px-8 md:px-12 py-5 md:py-6 font-technical font-black uppercase tracking-widest transition-all duration-300 border border-primary/60 bg-gradient-to-br from-primary/25 to-primary/10 text-primary shadow-lg shadow-primary/20 backdrop-blur-sm rounded-xl ${item.color || ''}`}
              whileHover={{
                boxShadow: '0 20px 40px rgba(255, 107, 53, 0.4)'
              }}
            >
              <div className="flex items-center gap-3 w-full">
                {item.icon && (
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-2 h-2 bg-primary rounded-full flex-shrink-0"
                  />
                )}
                <span className="text-xs md:text-sm font-black uppercase tracking-tight">
                  {item.label}
                </span>
              </div>

              {/* Hover shine effect */}
              <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            </motion.div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
