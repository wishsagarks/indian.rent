'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Satellite } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

export default function PagePreloader() {
  const [isVisible, setIsVisible] = useState(true);
  const { theme } = useTheme();

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(false), 2400);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
          className="fixed inset-0 z-[9999] bg-background flex items-center justify-center overflow-hidden"
        >
          {/* Animated background gradient */}
          <div className="absolute inset-0 overflow-hidden">
            <motion.div
              animate={{
                background: theme === 'light' ? [
                  'radial-gradient(circle at 20% 50%, rgba(255, 107, 53, 0.15) 0%, transparent 50%)',
                  'radial-gradient(circle at 80% 50%, rgba(255, 107, 53, 0.15) 0%, transparent 50%)',
                  'radial-gradient(circle at 50% 80%, rgba(79, 172, 254, 0.15) 0%, transparent 50%)',
                  'radial-gradient(circle at 20% 50%, rgba(255, 107, 53, 0.15) 0%, transparent 50%)',
                ] : [
                  'radial-gradient(circle at 20% 50%, rgba(204, 120, 92, 0.1) 0%, transparent 50%)',
                  'radial-gradient(circle at 80% 50%, rgba(204, 120, 92, 0.1) 0%, transparent 50%)',
                  'radial-gradient(circle at 50% 80%, rgba(93, 184, 166, 0.1) 0%, transparent 50%)',
                  'radial-gradient(circle at 20% 50%, rgba(204, 120, 92, 0.1) 0%, transparent 50%)',
                ],
              }}
              transition={{ duration: 4, repeat: Infinity }}
              className="absolute inset-0"
            />
          </div>

          {/* Main content */}
          <div className="relative z-10 flex flex-col items-center justify-center gap-8">
            {/* Orbital icon */}
            <div className="relative w-24 h-24 flex items-center justify-center">
              {/* Outer orbit */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 rounded-full border border-primary/30"
              />

              {/* Middle orbit */}
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-2 rounded-full border border-primary/20"
              />

              {/* Inner orbit with dots */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-4 rounded-full border border-transparent border-t-primary/50 border-r-primary/30"
              />

              {/* Center icon */}
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                className="relative z-10 w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center glow-primary shadow-lg"
              >
                <Satellite className="text-white" size={24} strokeWidth={2} />
              </motion.div>

              {/* Floating particles */}
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{
                    rotate: 360,
                    scale: [0.8, 1.2, 0.8],
                  }}
                  transition={{
                    rotate: { duration: 2.5 + i * 0.5, repeat: Infinity, ease: 'linear' },
                    scale: { duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: i * 0.3 },
                  }}
                  className="absolute w-2 h-2 rounded-full bg-primary/60"
                  style={{
                    top: '50%',
                    left: '50%',
                    transformOrigin: `${10 + i * 8}px 0px`,
                  }}
                />
              ))}
            </div>

            {/* Branding */}
            <div className="text-center space-y-2">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="flex items-center justify-center gap-2"
              >
                <span className="font-display text-2xl font-black text-primary uppercase tracking-tighter">
                  indian.rent
                </span>
              </motion.div>

              {/* Animated status text */}
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                className="font-technical text-xs uppercase tracking-[0.3em] text-primary/60"
              >
                Deploying Protocol
              </motion.div>
            </div>

            {/* Progress indicator */}
            <div className="w-48 h-0.5 bg-surface-container-low rounded-full overflow-hidden">
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{
                  duration: 2.3,
                  ease: [0.25, 0.46, 0.45, 0.94]
                }}
                className="h-full bg-gradient-to-r from-transparent via-primary to-transparent rounded-full"
              />
            </div>
          </div>

          {/* Corner accent */}
          <motion.div
            animate={{
              opacity: [0.2, 0.5, 0.2],
              scale: [1, 1.05, 1],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-8 right-8 w-16 h-16 border border-primary/20 rounded-lg pointer-events-none"
          />

          <motion.div
            animate={{
              opacity: [0.2, 0.5, 0.2],
              scale: [1, 1.05, 1],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
            className="absolute bottom-8 left-8 w-16 h-16 border border-primary/20 rounded-lg pointer-events-none"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
