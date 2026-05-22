'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

interface BenefitItem {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
  accentColor: string;
  details: string[];
}

interface BenefitsCarouselProps {
  items: BenefitItem[];
  className?: string;
}

export function BenefitsCarousel({ items, className = '' }: BenefitsCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isTouching, setIsTouching] = useState(false);
  const [touchStartX, setTouchStartX] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0
    })
  };

  const handlePrevious = () => {
    setDirection(-1);
    setActiveIndex((prev) => (prev === 0 ? items.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setDirection(1);
    setActiveIndex((prev) => (prev === items.length - 1 ? 0 : prev + 1));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
    setIsTouching(true);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;

    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        handleNext();
      } else {
        handlePrevious();
      }
    }
    setIsTouching(false);
  };

  const activeItem = items[activeIndex];

  const accentToGradient: { [key: string]: string } = {
    'bg-blue-500': 'from-blue-500/30 via-blue-600/20 to-cyan-500/10',
    'bg-amber-500': 'from-amber-500/30 via-orange-500/20 to-red-500/10',
    'bg-emerald-500': 'from-emerald-500/30 via-teal-500/20 to-green-500/10',
    'bg-purple-500': 'from-purple-500/30 via-pink-500/20 to-rose-500/10',
    'bg-rose-500': 'from-rose-500/30 via-pink-500/20 to-red-500/10',
    'bg-indigo-500': 'from-indigo-500/30 via-blue-500/20 to-purple-500/10'
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Carousel Container with Mobile-Specific Background */}
      <div
        className="relative w-full lg:h-[500px] flex items-center overflow-hidden rounded-2xl transition-all duration-500"
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Mobile Animated Background Gradient */}
        <motion.div
          className={`absolute inset-0 bg-gradient-to-br ${accentToGradient[activeItem.accentColor]} lg:hidden`}
          animate={{
            scale: isTouching ? [1, 1.05, 1] : [1, 1.02, 1],
            opacity: [0.5, 0.7, 0.5]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />

        {/* Desktop Hover Gradient (invisible on mobile) */}
        <div className="absolute inset-0 bg-gradient-to-br from-surface/20 to-transparent hidden lg:block" />

        {/* Main Slide */}
        <div className="w-full relative z-10" ref={containerRef}>
          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div
              key={activeIndex}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: 'spring', stiffness: 300, damping: 30 },
                opacity: { duration: 0.5 }
              }}
              className="w-full"
            >
              {/* Card Design */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center px-4 sm:px-6 md:px-8">
                {/* Left: Icon + Visual */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="flex flex-col items-center lg:items-start"
                >
                  <motion.div
                    className={`w-24 h-24 md:w-32 md:h-32 rounded-2xl lg:rounded-3xl ${activeItem.gradient} flex items-center justify-center shadow-2xl border border-white/10 relative group cursor-pointer`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    animate={{
                      boxShadow: isTouching
                        ? `0 0 40px ${activeItem.accentColor.split('-')[1]}`
                        : '0 0 0px rgba(0,0,0,0)'
                    }}
                  >
                    <motion.div
                      animate={{
                        scale: isTouching ? [1, 1.2, 1] : [1, 1.1, 1]
                      }}
                      transition={{
                        duration: isTouching ? 0.5 : 3,
                        repeat: isTouching ? 0 : Infinity
                      }}
                      className="text-5xl md:text-6xl"
                    >
                      {activeItem.icon}
                    </motion.div>

                    {/* Glow effect - hover on desktop, animated on mobile */}
                    <motion.div
                      className={`absolute inset-0 rounded-2xl lg:rounded-3xl ${activeItem.gradient} blur-2xl -z-10`}
                      animate={{
                        opacity: isTouching ? [0.6, 1, 0.6] : [0, 0]
                      }}
                      transition={{
                        duration: isTouching ? 0.5 : 0.3,
                        ease: 'easeInOut'
                      }}
                    />

                    {/* Desktop hover glow */}
                    <div className={`absolute inset-0 rounded-2xl lg:rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${activeItem.gradient} blur-2xl -z-10 hidden lg:block`} />
                  </motion.div>
                </motion.div>

                {/* Right: Content */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="flex flex-col gap-6"
                >
                  {/* Badge */}
                  <div className="inline-flex items-center gap-2 w-fit">
                    <div className={`w-2 h-2 rounded-full ${activeItem.accentColor} animate-pulse`} />
                    <span className="text-xs font-technical uppercase tracking-[0.3em] text-on-surface-variant/80 font-black">
                      Feature {activeIndex + 1} of {items.length}
                    </span>
                  </div>

                  {/* Title */}
                  <div className="space-y-3">
                    <h3 className="text-3xl md:text-4xl lg:text-5xl font-black text-on-surface uppercase tracking-tight leading-tight">
                      {activeItem.title}
                    </h3>
                    <p className="text-base md:text-lg text-on-surface-variant font-medium leading-relaxed">
                      {activeItem.description}
                    </p>
                  </div>

                  {/* Details List */}
                  <div className="space-y-3 py-6 border-y border-white/10">
                    {activeItem.details.map((detail, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + idx * 0.1 }}
                        whileHover={{ x: 8 }}
                        whileTap={{ scale: 0.98, x: 4 }}
                        className="flex items-start gap-3 cursor-pointer lg:hover:translate-x-2 transition-all duration-200"
                      >
                        <motion.div
                          className={`w-5 h-5 rounded-full ${activeItem.accentColor} flex items-center justify-center flex-shrink-0 mt-0.5`}
                          animate={{
                            scale: isTouching ? [1, 1.2, 1] : 1
                          }}
                          transition={{ duration: 0.3 }}
                        >
                          <div className="w-2 h-2 bg-white rounded-full" />
                        </motion.div>
                        <span className="text-sm md:text-base text-on-surface/80 font-medium">{detail}</span>
                      </motion.div>
                    ))}
                  </div>

                  {/* CTA */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.9 }}
                    className={`w-fit px-8 py-3 rounded-lg font-technical uppercase tracking-[0.2em] font-black text-sm transition-all duration-300 ${activeItem.accentColor} text-on-primary border border-white/20`}
                    animate={{
                      boxShadow: isTouching
                        ? `0 0 20px currentColor, 0 0 40px currentColor`
                        : 'none'
                    }}
                    transition={{ duration: 0.3 }}
                  >
                    Learn More
                  </motion.button>
                </motion.div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation & Indicators */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-12 md:mt-20 flex flex-col lg:flex-row items-center justify-between gap-8"
      >
        {/* Indicators */}
        <div className="flex gap-2 lg:gap-3">
          {items.map((_, index) => (
            <motion.button
              key={index}
              onClick={() => {
                setDirection(index > activeIndex ? 1 : -1);
                setActiveIndex(index);
              }}
              className={`transition-all duration-300 rounded-full border ${
                index === activeIndex
                  ? `w-8 h-2 ${activeItem.accentColor} border-white/40 shadow-lg`
                  : 'w-2 h-2 bg-white/20 border-white/10 hover:bg-white/40'
              }`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 1.15 }}
              animate={{
                boxShadow: index === activeIndex ? `0 0 12px ${activeItem.accentColor.split('-')[1]}` : 'none'
              }}
            />
          ))}
        </div>

        {/* Navigation Buttons - Hidden on mobile */}
        <div className="hidden md:flex items-center gap-4">
          <motion.button
            onClick={handlePrevious}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-3 rounded-lg border border-white/20 bg-surface/50 backdrop-blur hover:bg-surface-container transition-colors"
            aria-label="Previous benefit"
          >
            <ChevronLeft size={20} className="text-on-surface" />
          </motion.button>

          <span className="text-xs font-technical uppercase tracking-[0.2em] text-on-surface-variant/60 font-black px-3">
            {String(activeIndex + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}
          </span>

          <motion.button
            onClick={handleNext}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-3 rounded-lg border border-white/20 bg-surface/50 backdrop-blur hover:bg-surface-container transition-colors"
            aria-label="Next benefit"
          >
            <ChevronRight size={20} className="text-on-surface" />
          </motion.button>
        </div>

        {/* Mobile Swipe Hint - Animated on mobile only */}
        <motion.div
          className="md:hidden text-center"
          animate={{
            y: [0, -4, 0],
            opacity: [0.6, 1, 0.6]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        >
          <div className="inline-block">
            <motion.div
              className="text-xs font-technical uppercase tracking-[0.2em] text-on-surface-variant/80 font-black px-4 py-2 rounded-full border border-white/20 bg-surface/50 backdrop-blur"
              animate={{
                x: [-2, 2, -2]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            >
              ← Swipe to explore →
            </motion.div>
            <p className="text-[10px] text-on-surface-variant/50 mt-2 font-technical">
              Tap dots to jump • {String(activeIndex + 1).padStart(2, '0')}/{String(items.length).padStart(2, '0')}
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
