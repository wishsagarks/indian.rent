'use client';

import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface StickyItem {
  title: string;
  description: string;
  icon?: React.ReactNode;
  content?: React.ReactNode;
}

interface StickyScrollRevealProps {
  items: StickyItem[];
  className?: string;
  contentClassName?: string;
}

export function StickyScrollReveal({
  items,
  className = '',
  contentClassName = ''
}: StickyScrollRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;

      const container = containerRef.current;
      const items = container.querySelectorAll('[data-sticky-item]');

      items.forEach((item, index) => {
        const rect = (item as HTMLElement).getBoundingClientRect();
        if (rect.top < window.innerHeight / 2) {
          setActiveIndex(index);
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
        {/* Content Column */}
        <div className="space-y-8 md:space-y-16">
          {items.map((item, index) => (
            <motion.div
              key={index}
              data-sticky-item
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: false, margin: '-100px' }}
              transition={{ duration: 0.6 }}
              className={`flex gap-4 md:gap-6 cursor-pointer group ${
                activeIndex === index ? 'opacity-100' : 'opacity-50'
              } transition-opacity duration-300`}
              onClick={() => setActiveIndex(index)}
            >
              {/* Icon/Number */}
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="flex-shrink-0 w-12 h-12 md:w-16 md:h-16 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center text-primary font-black text-lg md:text-xl group-hover:bg-primary/20 group-hover:border-primary/50 transition-all"
              >
                {item.icon || index + 1}
              </motion.div>

              {/* Text Content */}
              <div className="flex-1 pt-2">
                <motion.h3
                  className="text-lg md:text-2xl font-black text-on-surface mb-2 uppercase tracking-tight group-hover:text-primary transition-colors"
                >
                  {item.title}
                </motion.h3>
                <p className="text-sm md:text-base text-on-surface-variant/70 leading-relaxed">
                  {item.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Sticky Content Column */}
        <div className="hidden lg:block">
          <div className="sticky top-20 h-full">
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className={`h-full rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5 p-8 flex items-center justify-center overflow-hidden ${contentClassName}`}
            >
              {items[activeIndex]?.content ? (
                items[activeIndex].content
              ) : (
                <div className="text-center">
                  <div className="text-6xl font-black text-primary/20 mb-4">
                    {activeIndex + 1}
                  </div>
                  <p className="text-on-surface font-medium">
                    {items[activeIndex]?.title}
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
