'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

interface ExpandableCardProps {
  title: string;
  preview: React.ReactNode;
  details: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
}

export function ExpandableCard({
  title,
  preview,
  details,
  className = '',
  icon
}: ExpandableCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div
      layout
      className={`relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5 backdrop-blur-sm transition-all duration-300 ${
        isExpanded ? 'shadow-2xl' : 'shadow-lg hover:shadow-xl'
      } ${className}`}
    >
      {/* Header - Always Visible */}
      <motion.button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left p-6 flex items-center justify-between group cursor-pointer"
        whileHover={{ backgroundColor: 'rgba(255, 107, 53, 0.05)' }}
      >
        <div className="flex items-center gap-4 flex-1">
          {icon && (
            <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary/20 transition-colors">
              {icon}
            </div>
          )}
          <h3 className="text-lg font-black text-on-surface uppercase tracking-tight group-hover:text-primary transition-colors">
            {title}
          </h3>
        </div>

        {/* Expand Icon */}
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className="flex-shrink-0 text-primary"
        >
          <ChevronDown size={24} />
        </motion.div>
      </motion.button>

      {/* Preview Content */}
      <AnimatePresence mode="wait">
        {!isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="px-6 pb-6 border-t border-primary/10"
          >
            {preview}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expanded Details */}
      <AnimatePresence mode="wait">
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="px-6 pb-6 border-t border-primary/10 space-y-4"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              {details}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
