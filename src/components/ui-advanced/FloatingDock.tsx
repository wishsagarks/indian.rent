'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface DockItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  href?: string;
  color?: string;
}

interface FloatingDockProps {
  items: DockItem[];
  className?: string;
  position?: 'bottom' | 'top';
}

export function FloatingDock({
  items,
  className = '',
  position = 'bottom'
}: FloatingDockProps) {
  const [hoveredId, setHoveredId] = React.useState<string | null>(null);

  return (
    <motion.div
      initial={{ y: position === 'bottom' ? 100 : -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 25 }}
      className={`fixed ${position}-8 left-1/2 -translate-x-1/2 z-50 ${className}`}
    >
      {/* Dock Container */}
      <motion.div
        className="flex items-center justify-center gap-2 px-4 py-3 rounded-full bg-surface-container/80 backdrop-blur-lg border border-primary/10 shadow-2xl"
        layout
      >
        {items.map((item, index) => (
          <motion.div
            key={item.id}
            onMouseEnter={() => setHoveredId(item.id)}
            onMouseLeave={() => setHoveredId(null)}
            animate={{
              scale: hoveredId === item.id ? 1.2 : 1,
              y: hoveredId === item.id ? -12 : 0,
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="relative"
          >
            {/* Tooltip */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{
                opacity: hoveredId === item.id ? 1 : 0,
                y: hoveredId === item.id ? (position === 'bottom' ? -40 : 40) : (position === 'bottom' ? -30 : 30),
              }}
              transition={{ duration: 0.2 }}
              className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-black bg-on-surface text-surface px-3 py-1.5 rounded-full pointer-events-none"
            >
              {item.label}
            </motion.div>

            {/* Dock Item Button */}
            <motion.button
              onClick={() => {
                if (item.onClick) item.onClick();
                if (item.href) window.location.href = item.href;
              }}
              whileTap={{ scale: 0.85 }}
              className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                item.color || 'bg-primary/10 hover:bg-primary/20 text-primary'
              } border border-primary/20 hover:border-primary/40 hover:shadow-lg`}
            >
              <div className="text-xl">{item.icon}</div>

              {/* Glow effect on hover */}
              <motion.div
                animate={{
                  opacity: hoveredId === item.id ? 1 : 0,
                  scale: hoveredId === item.id ? 1.5 : 1,
                }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 rounded-full bg-primary/20 blur-lg pointer-events-none"
              />
            </motion.button>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}
