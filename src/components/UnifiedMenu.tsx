'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Menu, Home, Map as MapIcon, LayoutDashboard, Info } from 'lucide-react';

export default function UnifiedMenu() {
  const [showMenu, setShowMenu] = useState(false);

  const menuItems = [
    { href: '/', label: 'HQ Home', icon: Home },
    { href: '/explore', label: 'Explore Map', icon: MapIcon },
    { href: '/analytics', label: 'Intelligence', icon: LayoutDashboard },
    { href: '/terms', label: 'Engagement', icon: Info },
  ];

  return (
    <div className="flex items-center gap-2 relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className={`p-2 rounded-lg transition-all ${showMenu ? 'bg-primary/20 text-primary' : 'text-on-surface-variant hover:text-primary'}`}
        title="Navigation Menu"
      >
        <Menu size={20} />
      </button>
      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute top-full left-0 mt-2 w-48 bg-surface border border-white/10 rounded-lg shadow-3xl overflow-hidden py-1 z-[60]"
          >
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-on-surface hover:bg-primary/10 hover:text-primary transition-colors"
                onClick={() => setShowMenu(false)}
              >
                <item.icon size={14} /> {item.label}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
