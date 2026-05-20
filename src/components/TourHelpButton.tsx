'use client';

import { HelpCircle } from 'lucide-react';
import { useDriverJS } from '@/hooks/useDriverJS';
import { motion } from 'framer-motion';
import { useState } from 'react';

export function TourHelpButton({ tourName, className = '' }: { tourName: 'explore' | 'listing' | 'landing' | 'analytics'; className?: string }) {
  const { startTour, isEnabled } = useDriverJS();
  const [showTooltip, setShowTooltip] = useState(false);

  if (!isEnabled) return null;

  return (
    <motion.div
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      className="relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <button
        onClick={() => startTour(tourName)}
        className={`p-2.5 rounded-lg border border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 hover:border-primary/60 transition-all active:scale-90 flex items-center justify-center ${className}`}
        title="Start guided tour"
        aria-label="Start guided tour"
      >
        <HelpCircle size={18} strokeWidth={2} />
      </button>
      {showTooltip && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="absolute top-full mt-2 right-0 bg-surface border border-primary/30 rounded-lg px-3 py-2 text-xs font-technical uppercase tracking-wider text-on-surface whitespace-nowrap shadow-lg z-50 pointer-events-none"
        >
          Start tour
        </motion.div>
      )}
    </motion.div>
  );
}
