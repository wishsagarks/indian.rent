'use client';

import React, { useState } from 'react';
import { MessageCircle, Copy, Share2, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface ShareListingProps {
  listingId: string;
  rent: number;
  bhk: string;
  location: string;
  buildingName?: string;
  variant?: 'button' | 'icon-group' | 'compact';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  fullUrl?: string; // optional: provide full URL, otherwise uses current window.location
  showLabel?: boolean;
}

/**
 * Generates a rich WhatsApp share message with property details
 */
function generateWhatsAppMessage(props: ShareListingProps): string {
  const url = props.fullUrl || (typeof window !== 'undefined' ? window.location.href : '');
  const rent = props.rent ? `₹${Number(props.rent).toLocaleString()}/mo` : 'Check rent';
  const details = [props.bhk, props.location].filter(Boolean).join(' • ');

  return `🏠 Found a great rental on indian.rent!\n\n📍 ${props.buildingName || 'Rental Property'}\n${details}\n💰 ${rent}\n\n✅ No broker fees • Direct from landlord\n\n${url}`;
}

/**
 * Reusable share buttons component - use everywhere
 */
export default function ShareButtons({
  listingId,
  rent,
  bhk,
  location,
  buildingName,
  variant = 'button',
  size = 'md',
  className = '',
  fullUrl,
  showLabel = true,
}: ShareListingProps) {
  const [copied, setCopied] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const handleWhatsApp = () => {
    const message = generateWhatsAppMessage({ listingId, rent, bhk, location, buildingName, fullUrl });
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleCopyLink = () => {
    const linkToCopy = fullUrl || (typeof window !== 'undefined' ? window.location.href : '');
    navigator.clipboard.writeText(linkToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sizeStyles = {
    sm: 'text-[9px] p-2 gap-1.5',
    md: 'text-[10px] p-3 gap-2',
    lg: 'text-[11px] p-4 gap-2.5',
  };

  const iconSizes = {
    sm: 14,
    md: 16,
    lg: 18,
  };

  if (variant === 'icon-group') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleWhatsApp}
          className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 hover:bg-emerald-500/20 transition-all"
          title="Share on WhatsApp"
        >
          <MessageCircle size={iconSizes[size]} strokeWidth={2} />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleCopyLink}
          className="p-2 bg-primary/10 border border-primary/30 rounded-lg text-primary hover:bg-primary/20 transition-all"
          title="Copy link"
        >
          {copied ? <Check size={iconSizes[size]} /> : <Copy size={iconSizes[size]} strokeWidth={2} />}
        </motion.button>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`relative w-full ${className}`}>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowMenu(!showMenu)}
          className={`w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black uppercase tracking-wider rounded-lg flex items-center justify-center gap-2 ${sizeStyles[size]} shadow-lg hover:shadow-xl transition-all`}
        >
          <Share2 size={iconSizes[size]} strokeWidth={2.5} />
          {showLabel && 'Share'}
        </motion.button>

        <AnimatePresence>
          {showMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 5 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 right-0 bottom-full mb-2 bg-surface-container border border-outline/40 rounded-lg shadow-2xl z-50 overflow-hidden"
            >
              <button
                onClick={() => { handleWhatsApp(); setShowMenu(false); }}
                className="w-full px-4 py-3 flex items-center gap-3 text-emerald-400 hover:bg-emerald-500/15 active:bg-emerald-500/25 text-left text-[9px] font-black uppercase tracking-wider border-b border-outline/20 transition-colors"
              >
                <MessageCircle size={16} strokeWidth={2} /> WhatsApp
              </button>
              <button
                onClick={() => { handleCopyLink(); setShowMenu(false); }}
                className="w-full px-4 py-3 flex items-center gap-3 text-primary hover:bg-primary/15 active:bg-primary/25 text-left text-[9px] font-black uppercase tracking-wider transition-colors"
              >
                <Copy size={16} strokeWidth={2} /> {copied ? 'Copied!' : 'Copy Link'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Default: button variant
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleWhatsApp}
        className={`bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 font-black uppercase tracking-widest flex items-center justify-center gap-2 ${sizeStyles[size]} transition-all hover:bg-emerald-500/20 active:scale-[0.98]`}
      >
        <MessageCircle size={iconSizes[size]} strokeWidth={2.5} />
        {showLabel && 'Share on WhatsApp'}
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleCopyLink}
        className={`bg-primary/10 border border-primary/30 rounded-lg text-primary font-black uppercase tracking-widest flex items-center justify-center gap-2 ${sizeStyles[size]} transition-all hover:bg-primary/20 active:scale-[0.98]`}
      >
        {copied ? (
          <>
            <Check size={iconSizes[size]} /> Link Copied!
          </>
        ) : (
          <>
            <Copy size={iconSizes[size]} strokeWidth={2.5} /> Copy Link
          </>
        )}
      </motion.button>
    </div>
  );
}
