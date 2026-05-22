'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface NavItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
}

interface FloatingNavbarProps {
  items: NavItem[];
  className?: string;
  hideOnScroll?: boolean;
}

export function FloatingNavbar({
  items,
  className = '',
  hideOnScroll = true
}: FloatingNavbarProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    if (!hideOnScroll) return;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down - hide navbar
        setIsVisible(false);
      } else {
        // Scrolling up - show navbar
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY, hideOnScroll]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.nav
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className={`fixed top-0 left-0 right-0 z-40 backdrop-blur-lg bg-background/80 border-b border-primary/10 ${className}`}
        >
          <div className="max-w-container mx-auto px-mobile md:px-desktop h-16 flex items-center justify-between">
            {/* Logo/Brand */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="font-display font-black text-lg text-primary"
            >
              indian.rent
            </motion.div>

            {/* Nav Items */}
            <div className="flex items-center gap-4 md:gap-8">
              {items.map((item, index) => (
                <motion.a
                  key={index}
                  href={item.href}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.1, color: 'var(--primary-color)' }}
                  className="flex items-center gap-2 text-sm md:text-base font-technical font-black uppercase tracking-wider text-on-surface-variant hover:text-primary transition-colors"
                >
                  {item.icon && <span className="text-lg">{item.icon}</span>}
                  <span className="hidden sm:inline">{item.label}</span>
                </motion.a>
              ))}
            </div>
          </div>
        </motion.nav>
      )}
    </AnimatePresence>
  );
}
