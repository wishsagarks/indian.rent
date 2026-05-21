'use client';

import React from 'react';
import Image from 'next/image';
import { MapPin, Banknote, Share2, MessageCircle, Copy } from 'lucide-react';
import { motion } from 'framer-motion';
import ShareButtons from './ShareButtons';

export interface PropertyCardData {
  id: string;
  name: string;
  address: string;
  city?: string;
  rent: number;
  bhk: string;
  buildingType?: string;
  image?: string;
  verified?: boolean;
  isNew?: boolean;
  demandLevel?: 'hot' | 'warm' | 'cold';
  rating?: number;
  onViewDetails?: () => void;
}

interface PropertyCardProps {
  property: PropertyCardData;
  variant?: 'compact' | 'expanded' | 'map-popup' | 'grid';
  showShare?: boolean;
  className?: string;
}

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=400&auto=format&fit=crop';

/**
 * Unified property card component used across map, analytics, and search
 * Includes embedded WhatsApp share button with property details
 */
export default function PropertyCard({
  property,
  variant = 'compact',
  showShare = true,
  className = '',
}: PropertyCardProps) {
  const demandColors = {
    hot: 'bg-red-500/10 text-red-400 border-red-500/30',
    warm: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    cold: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  };

  // Map popup: minimal, focused on sharing
  if (variant === 'map-popup') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`bg-surface border border-outline/20 rounded-lg shadow-xl overflow-hidden ${className}`}
      >
        <div className="relative aspect-video bg-gradient-to-br from-primary/20 to-primary/5 overflow-hidden group">
          <Image
            src={property.image || PLACEHOLDER_IMAGE}
            alt={property.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {property.isNew && (
            <div className="absolute top-2 left-2 bg-emerald-500/90 text-white px-2 py-1 rounded text-[8px] font-black uppercase tracking-wider">
              New
            </div>
          )}
          {property.demandLevel && (
            <div className={`absolute top-2 right-2 px-2 py-1 rounded text-[8px] font-black uppercase tracking-wider border ${demandColors[property.demandLevel]}`}>
              🔥 {property.demandLevel}
            </div>
          )}
        </div>

        <div className="p-4 space-y-3">
          <div>
            <h3 className="font-black text-sm uppercase tracking-tight text-on-background mb-1 line-clamp-1">
              {property.name}
            </h3>
            <div className="flex items-center gap-1.5 text-[9px] text-on-surface-variant opacity-60">
              <MapPin size={12} />
              <span className="line-clamp-1">{property.address}</span>
            </div>
          </div>

          <div className="flex items-baseline gap-1">
            <span className="text-lg font-black text-primary">₹{Number(property.rent).toLocaleString()}</span>
            <span className="text-[8px] text-on-surface-variant opacity-60 font-technical">/mo • {property.bhk}</span>
          </div>

          {showShare && (
            <ShareButtons
              listingId={property.id}
              rent={property.rent}
              bhk={property.bhk}
              location={property.address}
              buildingName={property.name}
              variant="icon-group"
              size="sm"
            />
          )}
        </div>
      </motion.div>
    );
  }

  // Compact: used in analytics cards and lists
  if (variant === 'compact') {
    return (
      <motion.div
        whileHover={{ y: -4 }}
        className={`bg-surface border border-outline/20 rounded-lg overflow-hidden transition-all hover:shadow-lg ${className}`}
      >
        <div className="relative aspect-video bg-gradient-to-br from-primary/20 to-primary/5 overflow-hidden group">
          <Image
            src={property.image || PLACEHOLDER_IMAGE}
            alt={property.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>

        <div className="p-4 space-y-3">
          <div>
            <h3 className="font-black text-xs uppercase tracking-tight text-on-background mb-1 line-clamp-1">
              {property.name}
            </h3>
            <p className="text-[8px] text-on-surface-variant opacity-50 line-clamp-1">{property.address}</p>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-outline/10">
            <div>
              <p className="text-xs font-black text-primary">₹{Number(property.rent).toLocaleString()}</p>
              <p className="text-[8px] text-on-surface-variant">{property.bhk}</p>
            </div>
            {showShare && (
              <ShareButtons
                listingId={property.id}
                rent={property.rent}
                bhk={property.bhk}
                location={property.address}
                buildingName={property.name}
                variant="compact"
                size="sm"
                showLabel={false}
              />
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  // Grid: used in search results and property grids
  if (variant === 'grid') {
    return (
      <motion.div
        whileHover={{ y: -6 }}
        className={`bg-surface border border-outline/20 rounded-lg overflow-hidden transition-all hover:shadow-xl ${className}`}
      >
        <div className="relative aspect-square bg-gradient-to-br from-primary/20 to-primary/5 group cursor-pointer">
          <Image
            src={property.image || PLACEHOLDER_IMAGE}
            alt={property.name}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-300"
          />
          {property.rating && (
            <div className="absolute top-3 left-3 bg-amber-400/90 text-on-background px-2 py-1 rounded-full text-[9px] font-black flex items-center gap-1">
              ⭐ {property.rating.toFixed(1)}
            </div>
          )}
        </div>

        <div className="p-4 space-y-4">
          <div>
            <h3 className="font-black text-sm uppercase tracking-tight text-on-background mb-2 line-clamp-2">
              {property.name}
            </h3>
            <div className="flex items-center gap-1.5 text-[9px] text-on-surface-variant opacity-60 mb-3">
              <MapPin size={12} />
              <span className="line-clamp-1">{property.address}</span>
            </div>
          </div>

          <div className="space-y-2 border-t border-outline/10 pt-3">
            <div className="flex items-baseline justify-between">
              <span className="text-lg font-black text-primary">₹{Number(property.rent).toLocaleString()}</span>
              <span className="text-[9px] text-on-surface-variant opacity-60">{property.bhk}</span>
            </div>

            {showShare && (
              <ShareButtons
                listingId={property.id}
                rent={property.rent}
                bhk={property.bhk}
                location={property.address}
                buildingName={property.name}
                variant="button"
                size="sm"
                showLabel={true}
                className="mt-3"
              />
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  // Default expanded variant
  return (
    <motion.div className={`bg-surface border border-outline/20 rounded-lg overflow-hidden ${className}`}>
      <div className="relative w-full aspect-video">
        <Image
          src={property.image || PLACEHOLDER_IMAGE}
          alt={property.name}
          fill
          className="object-cover"
        />
      </div>

      <div className="p-6 space-y-6">
        <div>
          <h2 className="font-black text-2xl uppercase tracking-tight text-on-background mb-2">
            {property.name}
          </h2>
          <div className="flex items-center gap-2 text-on-surface-variant">
            <MapPin size={14} />
            <span>{property.address}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 border-t border-b border-outline/10 py-4">
          <div>
            <p className="text-[9px] text-on-surface-variant opacity-50 uppercase tracking-wider font-technical mb-1">
              Monthly Rent
            </p>
            <p className="text-xl font-black text-primary">₹{Number(property.rent).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-[9px] text-on-surface-variant opacity-50 uppercase tracking-wider font-technical mb-1">
              Type
            </p>
            <p className="text-lg font-black text-on-background">{property.bhk}</p>
          </div>
          <div>
            <p className="text-[9px] text-on-surface-variant opacity-50 uppercase tracking-wider font-technical mb-1">
              Category
            </p>
            <p className="text-lg font-black text-on-background">{property.buildingType || '—'}</p>
          </div>
        </div>

        {showShare && (
          <div className="space-y-2">
            <p className="text-[9px] text-on-surface-variant uppercase tracking-wider font-technical">Share with friends</p>
            <ShareButtons
              listingId={property.id}
              rent={property.rent}
              bhk={property.bhk}
              location={property.address}
              buildingName={property.name}
              variant="button"
              size="md"
            />
          </div>
        )}
      </div>
    </motion.div>
  );
}
