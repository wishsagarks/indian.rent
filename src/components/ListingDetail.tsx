'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, Banknote, Link as LinkIcon, Share2, CircleCheck as CheckCircle2,
  ChevronLeft, Check, ShieldAlert, Star, MessageCircle, Send, Ruler,
  Calendar, Sofa, Users, RefreshCcw, Home, Building2, TrendingUp,
  TrendingDown, Minus, Award, Trash2, QrCode, AlertTriangle, Info,
} from 'lucide-react';
import Link from 'next/link';
import {
  lockPlace, flagIntel, getFlatRatings, submitRating,
  getComments, addComment, getFlatDetails, getContributorPaymentDetails,
} from '@/app/actions/map-actions';
import { rewardFromRent } from '@/lib/constants';
import UnifiedMenu from './UnifiedMenu';
import ThemeToggle from './ThemeToggle';
import ShareButtons from './ShareButtons';
import { useToast } from '@/hooks/useToast';
import { useRouter } from 'next/navigation';

interface ListingPageProps { id: string; type: 'flat' | 'flatmate'; }

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=1200&auto=format&fit=crop';
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

function getPhotoUrl(listing: any): string {
  if (listing.buildingLat && listing.buildingLng && GOOGLE_MAPS_API_KEY) {
    return `https://maps.googleapis.com/maps/api/streetview?size=1200x600&location=${listing.buildingLat},${listing.buildingLng}&key=${GOOGLE_MAPS_API_KEY}`;
  }
  return PLACEHOLDER_IMAGE;
}

const FURNISHING_LABELS: Record<string, string> = {
  furnished: 'Furnished', 'semi-furnished': 'Semi-Furnished', unfurnished: 'Unfurnished',
};

function safeLinkHref(url?: string | null): string | null {
  if (!url) return null;
  try { const u = new URL(url); return (u.protocol === 'https:' || u.protocol === 'http:') ? url : null; }
  catch { return null; }
}

function floorLabel(n: number | null | undefined): string {
  if (n == null) return 'Floor N/A';
  if (n === 0) return 'Ground Floor';
  const suffix = n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th';
  return `${n}${suffix} Floor`;
}

function relativeDate(iso: string): string {
  if (!iso) return '';
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} wk${Math.floor(days / 7) > 1 ? 's' : ''} ago`;
  return `${Math.floor(days / 30)} mo ago`;
}

function fmt(n: number | null | undefined): string {
  if (!n) return '—';
  return `₹${Number(n).toLocaleString('en-IN')}`;
}

export default function ListingDetail({ id, type }: ListingPageProps) {
  const router = useRouter();
  const { success: showSuccess, error: showError } = useToast();

  const [listing, setListing] = useState<any>(null);
  const [listingLoading, setListingLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [showRewardModal, setShowRewardModal] = useState(false);
  const [isLocking, setIsLocking] = useState(false);
  const [upiDetails, setUpiDetails] = useState<{ upiId: string | null; contributorName: string | null } | null>(null);
  const [showFlagConfirm, setShowFlagConfirm] = useState(false);

  const [ratings, setRatings] = useState({ avg_locality: 0, avg_built_quality: 0, total_ratings: 0 });
  const [localityScore, setLocalityScore] = useState(0);
  const [builtScore, setBuiltScore] = useState(0);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);

  useEffect(() => {
    getFlatDetails(id).then(data => {
      if (!data) setNotFound(true);
      else setListing(data);
      setListingLoading(false);
    });
    getFlatRatings(id).then(setRatings);
    getComments(id).then(setComments);
  }, [id]);

  const handleLockPlace = async () => {
    setIsLocking(true);
    const result = await lockPlace(id);
    if (result.error) { showError(result.error); setIsLocking(false); }
    else {
      const pd = await getContributorPaymentDetails(id);
      setUpiDetails({ upiId: pd.upiId, contributorName: listing?.contributorName || 'Contributor' });
      setShowRewardModal(true);
      setIsLocking(false);
    }
  };

  const confirmFlagIntel = async () => {
    setShowFlagConfirm(false);
    const result = await flagIntel(id);
    if (result.success) {
      if (result.removed) { showSuccess('Listing removed after 3 community flags.'); router.push('/explore'); }
      else showSuccess('Listing flagged. Thank you.');
    } else showError(result.error || 'Flagging failed.');
  };

  const handleRatingSubmit = async () => {
    if (localityScore === 0 || builtScore === 0) return;
    const result = await submitRating({ flatId: id, localityScore, builtQualityScore: builtScore });
    if (result.error) showError(result.error);
    else { setRatingSubmitted(true); getFlatRatings(id).then(setRatings); }
  };

  const handleCommentSubmit = async () => {
    if (!newComment.trim()) return;
    setCommentLoading(true);
    const result = await addComment(id, newComment);
    if (result.error) showError(result.error);
    else { setNewComment(''); getComments(id).then(setComments); }
    setCommentLoading(false);
  };

  // ── Nav ────────────────────────────────────────────────────────────────────
  const navBar = (
    <nav className="fixed top-0 w-full z-50 flex justify-center h-16 bg-background backdrop-blur-xl border-b border-primary/20 shadow-2xl px-2 sm:px-4 md:px-8">
      <div className="max-w-5xl flex justify-between items-center w-full gap-2">
        <div className="flex items-center gap-1 sm:gap-3 min-w-0">
          <UnifiedMenu />
          <Link href="/explore" className="flex items-center gap-2 text-primary font-black uppercase tracking-widest text-[10px] hover:scale-105 transition-transform font-technical whitespace-nowrap">
            <ChevronLeft size={16} /> <span className="hidden sm:inline">Back</span>
          </Link>
        </div>
        <div className="flex flex-col items-center min-w-0">
          <Link href="/" className="font-display text-lg sm:text-xl text-primary font-black tracking-tighter whitespace-nowrap">indian.rent</Link>
          <span className="hidden sm:block text-[7px] uppercase tracking-[0.4em] text-primary/40 font-black">by WishLabs</span>
        </div>
        <div className="flex gap-2 min-w-fit items-center">
          {listing && (
            <ShareButtons listingId={id} rent={listing.rentAmount} bhk={listing.bhk ? `${listing.bhk} BHK` : 'Property'}
              location={listing.buildingAddress || listing.buildingCity || 'Hyderabad'}
              buildingName={listing.buildingName || `Flat ${listing.flatNumber}`}
              variant="icon-group" size="sm" showLabel={false} />
          )}
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );

  // ── Loading ────────────────────────────────────────────────────────────────
  if (listingLoading) {
    return (
      <div className="min-h-screen bg-background text-on-background">
        {navBar}
        <div className="pt-16 h-[40vh] bg-on-surface/5 animate-pulse" />
        <div className="pt-6 px-4 md:px-8 max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
          <div className="space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-24 bg-surface border border-outline/10 rounded-xl animate-pulse" />)}
          </div>
          <div className="h-80 bg-surface border border-outline/10 rounded-xl animate-pulse" />
        </div>
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
          <RefreshCcw className="animate-spin text-primary opacity-30" size={32} />
        </div>
      </div>
    );
  }

  // ── 404 ───────────────────────────────────────────────────────────────────
  if (notFound) {
    return (
      <div className="min-h-screen bg-background text-on-background flex flex-col items-center justify-center">
        {navBar}
        <div className="text-center pt-16 px-4">
          <div className="text-6xl font-black text-on-surface-variant/20 mb-6">404</div>
          <h1 className="text-2xl font-black uppercase tracking-tighter text-on-surface mb-3">Listing Not Found</h1>
          <p className="text-on-surface-variant text-sm mb-8">This listing may have been removed or the link is invalid.</p>
          <Link href="/explore" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-on-primary rounded-lg font-black uppercase tracking-widest text-[10px]">
            <MapPin size={14} /> Back to Map
          </Link>
        </div>
      </div>
    );
  }

  // ── Derived values ─────────────────────────────────────────────────────────
  const rent = listing.rentAmount ? fmt(listing.rentAmount) : '—';
  const deposit = listing.depositMonths && listing.rentAmount
    ? fmt(listing.depositMonths * listing.rentAmount)
    : listing.depositMonths ? `${listing.depositMonths} months` : '2 months';
  const reward = rewardFromRent(listing.rentAmount);
  const noBrokerLink = safeLinkHref(listing.noBrokerLink);
  const flatmatesLink = safeLinkHref(listing.flatmatesLink);
  const isOwn = listing.ipHash && listing.ipHash === (typeof window !== 'undefined' ? localStorage.getItem('ir_ip_hash') : '');
  const dq = listing.dataQuality as 'full' | 'cached' | 'partial' | undefined;
  const photoUrl = getPhotoUrl(listing);

  // Area stats comparison
  const areaStats = listing.areaStats;
  const areaAvgRent = areaStats ? (
    listing.bhk === 1 ? areaStats.avg_rent_1bhk :
    listing.bhk === 2 ? areaStats.avg_rent_2bhk :
    listing.bhk === 3 ? areaStats.avg_rent_3bhk :
    areaStats.avg_rent
  ) || areaStats.avg_rent : null;

  const priceDelta = areaAvgRent && listing.rentAmount
    ? Math.round(((listing.rentAmount - areaAvgRent) / areaAvgRent) * 100)
    : null;

  // ── Spec chips ─────────────────────────────────────────────────────────────
  const specChips = [
    listing.bhk && { label: `${listing.bhk} BHK`, icon: Home },
    { label: floorLabel(listing.floorNumber), icon: Building2 },
    listing.furnishing && { label: FURNISHING_LABELS[listing.furnishing] || listing.furnishing, icon: Sofa },
    listing.sizeSqft && { label: `${listing.sizeSqft} sq.ft`, icon: Ruler },
    listing.buildingCategory && { label: listing.buildingCategory.charAt(0).toUpperCase() + listing.buildingCategory.slice(1), icon: Building2 },
    { label: listing.availabilityDate ? `Avail. ${new Date(listing.availabilityDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}` : 'Available Now', icon: Calendar },
  ].filter(Boolean) as { label: string; icon: any }[];

  // ── Star rating component ──────────────────────────────────────────────────
  const StarRating = ({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) => (
    <div className="space-y-1.5">
      <div className="font-technical text-[9px] uppercase tracking-widest text-on-surface-variant font-black">{label}</div>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(s => (
          <button key={s} onClick={() => onChange(s)} className="p-1 transition-transform hover:scale-125 active:scale-95">
            <Star size={18} className={s <= value ? 'fill-amber-400 text-amber-400' : 'text-on-surface/20'} />
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-on-background">
      {navBar}

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div className="relative w-full h-40 sm:h-56 md:h-72 lg:h-96 overflow-hidden mt-16">
        <Image src={photoUrl} alt={listing.buildingName || 'Property'} fill className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />

        {/* Data quality badge */}
        {dq === 'cached' && (
          <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 backdrop-blur-md">
            <Info size={11} className="text-amber-400" />
            <span className="text-[9px] font-black uppercase tracking-widest text-amber-400">Cached data</span>
          </div>
        )}
        {dq === 'partial' && (
          <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/20 border border-blue-500/40 backdrop-blur-md">
            <Info size={11} className="text-blue-400" />
            <span className="text-[9px] font-black uppercase tracking-widest text-blue-400">Partial data</span>
          </div>
        )}

        {/* Building name overlay */}
        <div className="absolute bottom-0 left-0 right-0 px-3 sm:px-6 md:px-8 pb-4 sm:pb-5 md:pb-8">
          <div className="max-w-5xl mx-auto">
            {listing.isTransparencyPin && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 mb-2 rounded-full bg-amber-400/20 border border-amber-400/30">
                <span className="text-[9px] font-black uppercase tracking-widest text-amber-400">Transparency Pin</span>
              </div>
            )}
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-tight leading-none font-display text-white drop-shadow-lg">
              {listing.buildingName || `Flat ${listing.flatNumber}`}
            </h1>
            {(listing.buildingAddress || listing.buildingCity) && (
              <div className="flex items-center gap-1.5 mt-1.5 text-white/70 text-[10px] font-bold uppercase tracking-widest font-technical">
                <MapPin size={11} />
                {[listing.buildingAddress, listing.buildingCity].filter(Boolean).join(', ')}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Status badges ──────────────────────────────────────────────────── */}
      <div className="px-3 sm:px-6 md:px-8 py-3 max-w-5xl mx-auto flex flex-wrap gap-2">
        <span className="bg-secondary/10 border border-secondary/20 text-secondary px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5">
          <CheckCircle2 size={11} /> Verified · {relativeDate(listing.createdAt)}
        </span>
        {listing.flatmateNeeded && (
          <span className="bg-emerald-400/10 border border-emerald-400/20 text-emerald-400 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider">Flatmate Needed</span>
        )}
        {isOwn && (
          <span className="bg-primary/10 border border-primary/20 text-primary px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider">Your Listing</span>
        )}
        {listing.tenantPreference === 'bachelors' && (
          <span className="bg-blue-400/10 border border-blue-400/20 text-blue-400 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider">Bachelors</span>
        )}
        {listing.tenantPreference === 'family' && (
          <span className="bg-purple-400/10 border border-purple-400/20 text-purple-400 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider">Family Only</span>
        )}
        {listing.petsAllowed && (
          <span className="bg-emerald-400/10 border border-emerald-400/20 text-emerald-400 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider">Pets OK</span>
        )}
        {(listing.intelFlags || 0) >= 2 && (
          <span className="bg-red-500/10 border border-red-500/20 text-red-400 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
            <AlertTriangle size={10} /> Community Flagged
          </span>
        )}
      </div>

      {/* ── Removed warning ────────────────────────────────────────────────── */}
      {listing.isRemoved && (
        <div className="mx-3 sm:mx-6 md:mx-8 max-w-5xl mx-auto mb-4 bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle size={18} className="text-red-400 shrink-0" />
          <p className="text-sm text-red-400 font-medium">This listing has been removed and may no longer be available.</p>
        </div>
      )}

      {/* ── Main two-column layout ─────────────────────────────────────────── */}
      <main className="px-3 sm:px-6 md:px-8 max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4 md:gap-6 pb-20 md:pb-24">

        {/* ── LEFT: specs + analytics + community ─────────────────────────── */}
        <div className="space-y-5">

          {/* Spec chips grid */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="bg-surface border border-outline/20 rounded-xl p-5">
            <div className="text-[9px] uppercase tracking-widest text-on-surface-variant font-black mb-4 font-technical">Property Details</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {specChips.map(chip => (
                <div key={chip.label} className="flex items-center gap-2.5 bg-on-surface/5 border border-outline/10 rounded-lg p-3">
                  <chip.icon size={14} className="text-primary shrink-0 opacity-70" />
                  <span className="text-xs font-bold text-on-surface truncate">{chip.label}</span>
                </div>
              ))}
              {listing.maintenanceAmount && (
                <div className="flex items-center gap-2.5 bg-on-surface/5 border border-outline/10 rounded-lg p-3">
                  <Banknote size={14} className="text-primary shrink-0 opacity-70" />
                  <span className="text-xs font-bold text-on-surface truncate">
                    {fmt(listing.maintenanceAmount)}/mo maint.
                  </span>
                </div>
              )}
              {!listing.maintenanceAmount && listing.maintenanceExtra && (
                <div className="flex items-center gap-2.5 bg-on-surface/5 border border-outline/10 rounded-lg p-3">
                  <Banknote size={14} className="text-primary shrink-0 opacity-70" />
                  <span className="text-xs font-bold text-on-surface">Maint. Extra</span>
                </div>
              )}
            </div>
            {listing.contributorName && (
              <div className="mt-4 pt-4 border-t border-outline/10 flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[9px] font-black text-primary uppercase">
                  {listing.contributorName[0]}
                </div>
                <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest">
                  Contributed by {listing.contributorName}
                </span>
              </div>
            )}
          </motion.div>

          {/* ── Area Intelligence ──────────────────────────────────────────── */}
          {areaStats && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
              className="bg-surface border border-outline/20 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={16} className="text-primary" />
                <span className="text-[9px] uppercase tracking-widest text-on-surface font-black font-technical">Area Intelligence</span>
                <span className="text-[9px] text-on-surface-variant ml-auto">{areaStats.total_flats} listings nearby</span>
              </div>

              {/* Price comparison */}
              {areaAvgRent && priceDelta !== null && (
                <div className="mb-4 bg-on-surface/5 border border-outline/10 rounded-lg p-4 flex items-center justify-between gap-4">
                  <div>
                    <div className="text-[9px] uppercase tracking-widest text-on-surface-variant font-black mb-1">Area avg {listing.bhk ? `${listing.bhk}BHK` : 'rent'}</div>
                    <div className="text-xl font-black text-on-surface">{fmt(areaAvgRent)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[9px] uppercase tracking-widest text-on-surface-variant font-black mb-1">This listing</div>
                    <div className={`flex items-center gap-1.5 text-sm font-black ${
                      priceDelta > 15 ? 'text-red-400' : priceDelta < -5 ? 'text-emerald-400' : 'text-amber-400'
                    }`}>
                      {priceDelta > 5 ? <TrendingUp size={14} /> : priceDelta < -5 ? <TrendingDown size={14} /> : <Minus size={14} />}
                      {priceDelta > 0 ? '+' : ''}{priceDelta}% vs area
                    </div>
                  </div>
                </div>
              )}

              {/* BHK breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[1, 2, 3].map(bhk => {
                  const avg = bhk === 1 ? areaStats.avg_rent_1bhk : bhk === 2 ? areaStats.avg_rent_2bhk : areaStats.avg_rent_3bhk;
                  if (!avg) return null;
                  return (
                    <div key={bhk} className={`rounded-lg p-3 text-center border ${listing.bhk === bhk ? 'bg-primary/10 border-primary/30' : 'bg-on-surface/5 border-outline/10'}`}>
                      <div className="text-[8px] uppercase tracking-widest text-on-surface-variant font-black mb-1">{bhk}BHK avg</div>
                      <div className={`text-xs font-black ${listing.bhk === bhk ? 'text-primary' : 'text-on-surface'}`}>{fmt(avg)}</div>
                    </div>
                  );
                })}
              </div>

              {/* Gated split */}
              {(areaStats.gated_count > 0 || areaStats.non_gated_count > 0) && (
                <div className="mt-3 flex gap-3 text-[9px]">
                  <span className="text-on-surface-variant">{areaStats.gated_count} gated</span>
                  <span className="text-on-surface-variant/30">·</span>
                  <span className="text-on-surface-variant">{areaStats.non_gated_count} non-gated</span>
                </div>
              )}
            </motion.div>
          )}

          {/* ── Community Rating ───────────────────────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-surface border border-outline/20 rounded-xl p-5 space-y-5">
            <div className="flex items-center gap-2">
              <Star size={16} className="text-amber-400" />
              <span className="font-technical text-[9px] text-on-surface font-black uppercase tracking-[0.2em]">Community Rating</span>
              {ratings.total_ratings > 0 && (
                <span className="text-[10px] text-on-surface-variant ml-auto">
                  {ratings.total_ratings} {ratings.total_ratings === 1 ? 'rating' : 'ratings'}
                </span>
              )}
            </div>

            {ratings.total_ratings > 0 && (
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-on-surface/5 border border-outline/10 rounded-lg p-4 text-center">
                  <div className="text-2xl font-black text-amber-400">{Number(ratings.avg_locality).toFixed(1)}</div>
                  <div className="font-technical text-[8px] text-on-surface-variant uppercase tracking-wider mt-1">Locality</div>
                </div>
                <div className="bg-on-surface/5 border border-outline/10 rounded-lg p-4 text-center">
                  <div className="text-2xl font-black text-amber-400">{Number(ratings.avg_built_quality).toFixed(1)}</div>
                  <div className="font-technical text-[8px] text-on-surface-variant uppercase tracking-wider mt-1">Build Quality</div>
                </div>
              </div>
            )}

            {!ratingSubmitted ? (
              <div className="space-y-4">
                <StarRating value={localityScore} onChange={setLocalityScore} label="Locality (area, amenities, connectivity)" />
                <StarRating value={builtScore} onChange={setBuiltScore} label="Build Quality (construction, interiors)" />
                <button onClick={handleRatingSubmit} disabled={localityScore === 0 || builtScore === 0}
                  className="w-full py-3 bg-amber-400/10 border border-amber-400/30 text-amber-400 rounded-lg font-black uppercase tracking-[0.2em] text-[10px] disabled:opacity-20 transition-all hover:bg-amber-400/20 active:scale-[0.98]">
                  Submit Rating
                </button>
              </div>
            ) : (
              <div className="text-center py-3 text-[10px] text-emerald-400 font-black uppercase tracking-widest">
                Rating submitted — thank you!
              </div>
            )}
          </motion.div>

          {/* ── Comments ───────────────────────────────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="bg-surface border border-outline/20 rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <MessageCircle size={16} className="text-primary" />
              <span className="font-technical text-[9px] text-on-surface font-black uppercase tracking-[0.2em]">Comments</span>
              <span className="text-[10px] text-on-surface-variant ml-auto">({comments.length})</span>
            </div>

            <div className="flex gap-2">
              <input type="text" value={newComment} onChange={e => setNewComment(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCommentSubmit()}
                placeholder="Add a comment..." maxLength={500}
                className="flex-1 bg-on-surface/5 border border-outline/10 rounded-lg px-4 py-3 text-on-surface text-xs font-medium focus:border-primary outline-none placeholder:text-on-surface-variant/30" />
              <button onClick={handleCommentSubmit} disabled={commentLoading || !newComment.trim()}
                className="p-3 bg-primary text-on-primary rounded-lg disabled:opacity-20 transition-all hover:bg-blue-400 active:scale-95">
                <Send size={14} />
              </button>
            </div>

            {comments.length > 0 ? (
              <div data-lenis-prevent className="space-y-3 max-h-60 overflow-y-auto">
                {comments.map(c => (
                  <div key={c.id} className="bg-on-surface/5 border border-outline/10 rounded-lg p-3">
                    <p className="text-xs text-on-surface font-medium">{c.content}</p>
                    <div className="text-[9px] text-on-surface-variant/50 mt-1.5 font-technical">
                      {new Date(c.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-5 text-[10px] text-on-surface-variant/40 font-technical uppercase tracking-widest">
                No comments yet — be the first
              </div>
            )}
          </motion.div>
        </div>

        {/* ── RIGHT: Sticky pricing + actions ──────────────────────────────── */}
        <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 }}
          className="sticky top-20 sm:top-24 md:top-24 lg:top-24 h-fit space-y-4 pb-8 lg:pb-0 z-30">

          {/* Pricing card */}
          <div className="bg-surface border border-outline/20 rounded-xl p-5 shadow-xl">
            {/* Rent */}
            <div className="mb-4">
              <div className="text-[9px] uppercase tracking-widest text-on-surface-variant font-black mb-1 font-technical">Monthly Rent</div>
              <div className="text-4xl font-black text-primary tracking-tighter leading-none">
                {rent}<span className="text-sm text-on-surface-variant font-normal ml-1.5">/mo</span>
              </div>
            </div>

            {/* Deposit + maintenance row */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-on-surface/5 border border-outline/10 rounded-lg p-3">
                <div className="text-[8px] uppercase tracking-widest text-on-surface-variant font-black mb-1 font-technical">Deposit</div>
                <div className="text-base font-black text-on-surface tracking-tight">{deposit}</div>
              </div>
              {listing.maintenanceAmount ? (
                <div className="bg-on-surface/5 border border-outline/10 rounded-lg p-3">
                  <div className="text-[8px] uppercase tracking-widest text-on-surface-variant font-black mb-1 font-technical">Maintenance</div>
                  <div className="text-base font-black text-on-surface tracking-tight">{fmt(listing.maintenanceAmount)}/mo</div>
                </div>
              ) : (
                <div className="bg-on-surface/5 border border-outline/10 rounded-lg p-3">
                  <div className="text-[8px] uppercase tracking-widest text-on-surface-variant font-black mb-1 font-technical">Type</div>
                  <div className="text-base font-black text-on-surface tracking-tight capitalize">
                    {listing.buildingCategory || 'Standalone'}
                  </div>
                </div>
              )}
            </div>

            {/* Reward box */}
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-5 flex items-center gap-3 relative overflow-hidden">
              <div className="absolute inset-0 bg-primary/5 blur-2xl" />
              <div className="relative bg-primary text-on-primary p-2.5 rounded-lg shadow-lg shrink-0">
                <Award size={18} strokeWidth={2.5} />
              </div>
              <div className="relative">
                <div className="font-technical text-[8px] text-primary font-black uppercase tracking-[0.2em] mb-0.5">Good Faith Reward</div>
                <div className="text-xl font-black text-on-surface tracking-tighter">
                  ₹{reward.toLocaleString()} <span className="text-primary text-[9px] font-technical">to contributor</span>
                </div>
              </div>
            </div>
            <p className="text-[9px] text-on-surface-variant/40 uppercase tracking-wider mb-5 font-technical">
              Pay only if you secure the place. Zero broker fees.
            </p>

            {/* CTAs */}
            <div className="space-y-3">
              {noBrokerLink && (
                <Link href={noBrokerLink} target="_blank" rel="noopener noreferrer" className="block">
                  <button className="w-full py-4 bg-primary text-on-primary rounded-lg font-black uppercase tracking-[0.2em] text-[10px] shadow-lg flex items-center justify-center gap-2.5 border border-white/20 transition-all hover:shadow-xl active:scale-[0.98]">
                    <LinkIcon size={14} strokeWidth={3} /> View on NoBroker
                  </button>
                </Link>
              )}
              {flatmatesLink && (
                <Link href={flatmatesLink} target="_blank" rel="noopener noreferrer" className="block">
                  <button className="w-full py-4 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-lg font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-2.5 transition-all hover:bg-emerald-500/20 active:scale-[0.98]">
                    <Users size={14} strokeWidth={3} /> Find Flatmates
                  </button>
                </Link>
              )}
              {!noBrokerLink && !flatmatesLink && (
                <button disabled className="w-full py-4 bg-on-surface/5 border border-outline/20 text-on-surface-variant rounded-lg font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-2.5 opacity-40 cursor-not-allowed">
                  <LinkIcon size={14} /> Contact Not Available
                </button>
              )}

              {!listing.isTransparencyPin && (
                <>
                  <button onClick={handleLockPlace}
                    disabled={isLocking || listing.status === 'occupied'}
                    className="w-full py-4 bg-on-surface/5 border border-outline/20 rounded-lg font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] disabled:opacity-30">
                    <CheckCircle2 size={14} strokeWidth={3} />
                    {isLocking ? 'Processing...' : listing.status === 'occupied' ? 'Already Locked' : 'I Have Locked This Place'}
                  </button>

                  <ShareButtons listingId={id} rent={listing.rentAmount}
                    bhk={listing.bhk ? `${listing.bhk} BHK` : 'Property'}
                    location={listing.buildingAddress || listing.buildingCity || 'Hyderabad'}
                    buildingName={listing.buildingName || `Flat ${listing.flatNumber}`}
                    variant="button" size="md" showLabel={true} />
                </>
              )}

              {!listing.isRemoved && (
                <button onClick={() => setShowFlagConfirm(true)}
                  className="w-full py-3 bg-red-500/5 text-red-400 rounded-lg font-black uppercase tracking-[0.2em] text-[9px] flex items-center justify-center gap-2 border border-red-500/20 opacity-40 hover:opacity-100 transition-all">
                  <ShieldAlert size={12} /> Report Fake or Stale
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </main>

      {/* ── Reward Modal ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showRewardModal && upiDetails?.upiId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 text-center">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowRewardModal(false)} className="absolute inset-0 bg-black/80 backdrop-blur-xl" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full max-w-md bg-surface border border-outline/20 rounded-xl p-8 shadow-2xl">
              <div className="text-center space-y-5">
                <div className="inline-flex bg-primary/10 p-4 rounded-full text-primary border border-primary/20">
                  <Check size={36} strokeWidth={3} />
                </div>
                <h2 className="text-2xl font-black uppercase tracking-tighter font-display">Listing Shared</h2>
                <p className="text-on-surface-variant text-sm">Pay the contributor only if you secure the flat. Payment is entirely optional and can be made offline.</p>
                <div className="bg-on-surface/5 border border-outline/10 rounded-lg p-5 space-y-4">
                  {(() => {
                    const upiLink = `upi://pay?pa=${encodeURIComponent(upiDetails.upiId!)}&pn=${encodeURIComponent(upiDetails.contributorName || 'Contributor')}&am=${reward}&cu=INR`;
                    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(upiLink)}&size=180x180`;
                    return (
                      <>
                        <Image src={qrUrl} alt="UPI QR Code" width={140} height={140} className="mx-auto rounded-md" />
                        <div className="font-technical text-[10px] uppercase tracking-widest text-primary font-black">Suggested Reward (Optional)</div>
                        <div className="text-2xl font-black text-on-surface tracking-tighter">₹{reward.toLocaleString()}</div>
                        <a href={upiLink} className="w-full block">
                          <button className="w-full py-3 bg-primary/20 text-primary rounded-lg font-black uppercase tracking-[0.2em] text-[10px] transition-all hover:shadow-lg active:scale-95 border border-primary/30">
                            Pay via UPI (Optional)
                          </button>
                        </a>
                      </>
                    );
                  })()}
                </div>
                <button onClick={() => setShowRewardModal(false)}
                  className="w-full py-3 bg-on-surface/5 border border-outline/20 rounded-lg font-black uppercase tracking-[0.2em] text-[10px]">Done</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Flag Confirm Modal ──────────────────────────────────────────── */}
      <AnimatePresence>
        {showFlagConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowFlagConfirm(false)} className="absolute inset-0 bg-black/80 backdrop-blur-xl" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full max-w-sm bg-surface border border-outline/20 rounded-xl p-7 shadow-2xl text-center space-y-4">
              <div className="inline-flex bg-red-500/10 p-3.5 rounded-full border border-red-500/20">
                <ShieldAlert size={28} className="text-red-400" />
              </div>
              <h3 className="text-xl font-black uppercase tracking-tighter">Flag This Listing?</h3>
              <p className="text-on-surface-variant text-sm">Flag if the data is fake, stale, or misleading. After 3 community flags the listing is removed.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowFlagConfirm(false)}
                  className="flex-1 py-3 bg-on-surface/5 border border-outline/20 rounded-lg font-black uppercase tracking-[0.2em] text-[10px]">Cancel</button>
                <button onClick={confirmFlagIntel}
                  className="flex-1 py-3 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg font-black uppercase tracking-[0.2em] text-[10px]">Flag It</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
