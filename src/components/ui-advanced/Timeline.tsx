'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface TimelineItem {
  id: string;
  title: string;
  description: string;
  date: string;
  icon?: React.ReactNode;
  color?: string;
  status?: 'completed' | 'active' | 'pending';
}

interface TimelineProps {
  items: TimelineItem[];
  className?: string;
  orientation?: 'vertical' | 'horizontal';
}

export function Timeline({
  items,
  className = '',
  orientation = 'vertical'
}: TimelineProps) {
  return (
    <div
      className={`relative ${
        orientation === 'vertical' ? 'space-y-8' : 'flex gap-6 overflow-x-auto pb-4'
      } ${className}`}
    >
      {orientation === 'vertical' && (
        <div className="absolute left-6 md:left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-primary via-secondary to-primary" />
      )}

      {items.map((item, index) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, margin: '-50px' }}
          transition={{ duration: 0.6, delay: index * 0.1 }}
          className={`relative ${orientation === 'horizontal' ? 'flex-shrink-0 w-80' : ''}`}
        >
          {/* Timeline dot */}
          <motion.div
            className={`absolute ${
              orientation === 'vertical' ? 'left-0 top-0' : 'left-0 top-1/2 -translate-y-1/2'
            } w-12 md:w-14 h-12 md:h-14 rounded-full border-4 border-background flex items-center justify-center ${
              item.status === 'completed'
                ? 'bg-primary'
                : item.status === 'active'
                ? 'bg-secondary'
                : 'bg-surface-container'
            } shadow-lg`}
            whileHover={{ scale: 1.2 }}
            animate={
              item.status === 'active'
                ? { scale: [1, 1.1, 1] }
                : {}
            }
            transition={{
              duration: 2,
              repeat: item.status === 'active' ? Infinity : 0
            }}
          >
            {item.icon ? (
              <span className="text-white text-lg">{item.icon}</span>
            ) : (
              <div
                className={`w-2 h-2 rounded-full ${
                  item.status === 'completed'
                    ? 'bg-on-primary'
                    : item.status === 'active'
                    ? 'bg-on-secondary'
                    : 'bg-on-surface-variant'
                }`}
              />
            )}
          </motion.div>

          {/* Content */}
          <motion.div
            className={`${
              orientation === 'vertical'
                ? 'ml-20 md:ml-24'
                : 'pt-16'
            } p-6 rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5 backdrop-blur-sm hover:shadow-lg transition-shadow`}
            whileHover={{ y: -4 }}
          >
            <div className="flex items-start justify-between gap-4 mb-2">
              <h3 className="text-lg md:text-xl font-black text-on-surface uppercase tracking-tight">
                {item.title}
              </h3>
              {item.status === 'active' && (
                <motion.span
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-xs font-black px-2 py-1 rounded bg-secondary/20 text-secondary uppercase whitespace-nowrap"
                >
                  Active
                </motion.span>
              )}
            </div>

            <p className="text-sm text-on-surface-variant/70 mb-3 leading-relaxed">
              {item.description}
            </p>

            <span className="text-xs font-technical uppercase tracking-wider text-primary/70">
              {item.date}
            </span>
          </motion.div>

          {/* Connector line (horizontal only) */}
          {orientation === 'horizontal' && index < items.length - 1 && (
            <div className="absolute top-1/2 left-full w-6 h-0.5 bg-gradient-to-r from-primary to-transparent -translate-y-1/2" />
          )}
        </motion.div>
      ))}
    </div>
  );
}
