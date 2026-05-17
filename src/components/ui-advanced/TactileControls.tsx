'use client';

import React, { useRef, useState, useEffect } from 'react';
import { motion, useSpring, useMotionValue } from 'framer-motion';
import gsap from 'gsap';

export default function MagneticButton({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springConfig = { damping: 15, stiffness: 150 };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const { clientX, clientY } = e;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const centerRelativeX = clientX - (left + width / 2);
    const centerRelativeY = clientY - (top + height / 2);
    
    x.set(centerRelativeX * 0.4);
    y.set(centerRelativeY * 0.4);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        x: springX,
        y: springY,
      }}
      className={`relative inline-block ${className}`}
    >
      {children}
    </motion.div>
  );
}

export function PeelingSticker({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stickerRef = useRef<HTMLDivElement>(null);
  const peelRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    if (!stickerRef.current || !peelRef.current) return;
    
    gsap.to(stickerRef.current, {
      rotateX: 15,
      rotateY: -15,
      y: -10,
      scale: 1.05,
      duration: 0.6,
      ease: 'power3.out'
    });

    gsap.to(peelRef.current, {
      width: '45%',
      height: '45%',
      opacity: 1,
      duration: 0.6,
      ease: 'power3.out'
    });
  };

  const handleMouseLeave = () => {
    if (!stickerRef.current || !peelRef.current) return;

    gsap.to(stickerRef.current, {
      rotateX: 0,
      rotateY: 0,
      y: 0,
      scale: 1,
      duration: 0.8,
      ease: 'elastic.out(1, 0.5)'
    });

    gsap.to(peelRef.current, {
      width: '0%',
      height: '0%',
      opacity: 0,
      duration: 0.4,
      ease: 'power2.in'
    });
  };

  return (
    <div 
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative group cursor-pointer"
    >
      {/* Shadow layer */}
      <div className="absolute inset-0 bg-black/40 blur-2xl rounded-full translate-y-6 scale-90 opacity-0 group-hover:opacity-100 transition-all duration-700" />
      
      {/* Content layer */}
      <div
        ref={stickerRef}
        className="relative z-10 metallic-edge rounded-full transition-shadow duration-500 shadow-xl group-hover:shadow-2xl border border-white/10"
      >
        {children}
        
        {/* Peeling Corner Effect */}
        <div 
          ref={peelRef}
          className="absolute top-0 right-0 bg-white/30 backdrop-blur-2xl rounded-bl-[2.5rem] border-b border-l border-white/40 pointer-events-none w-0 h-0 opacity-0 shadow-inner"
        />
      </div>
    </div>
  );
}
