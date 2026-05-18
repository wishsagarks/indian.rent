'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Banknote, Link as LinkIcon, Share2, CircleCheck as CheckCircle2, ChevronLeft, Check, QrCode, ShieldAlert, Star, MessageCircle, Send, Ruler, Calendar, Sofa, Users, RefreshCcw } from 'lucide-react';
import Link from 'next/link';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
import { lockPlace, flagIntel, getFlatRatings, submitRating, getComments, addComment, getFlatDetails } from '@/app/actions/map-actions';
import { getIpHash } from '@/utils/ip-hash';
import UnifiedMenu from './UnifiedMenu';
import { useDriverJS } from '@/hooks/useDriverJS';

interface ListingPageProps {
  id: string;
  type: 'flat' | 'flatmate';
}

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=1200&auto=format&fit=crop';

const FURNISHING_LABELS: Record<string, string> = {
  furnished: 'Furnished',
  'semi-furnished': 'Semi-Furnished',
  unfurnished: 'Unfurnished',
};

function floorLabel(n: number | null | undefined): string {
  if (n == null) return '—';
  if (n === 0) return 'Ground Floor';
  const suffix = n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th';
  return `${n}${suffix} Floor`;
}

function rewardFromRent(rent: number | null | undefined): number {
  if (!rent) return 2500;
  return Math.round(Math.min(Math.max(rent * 0.05, 1000), 10000) / 100) * 100;
}

export default function ListingDetail({ id, type }: ListingPageProps) {
  const { isCopied, copy } = useCopyToClipboard();
  useDriverJS('listing');

  const [listing, setListing] = useState<any>(null);
  const [listingLoading, setListingLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [showRewardModal, setShowRewardModal] = useState(false);
  const [isLocking, setIsLocking] = useState(false);

  const [ratings, setRatings] = useState<{ avg_locality: number; avg_built_quality: number; total_ratings: number }>({ avg_locality: 0, avg_built_quality: 0, total_ratings: 0 });
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

  const handleShare = () => copy(window.location.href);

  const handleWhatsAppShare = () => {
    const text = `Found a rental on indian.rent — no broker fees! Check it out: ${window.location.href}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleLockPlace = async () => {
    setIsLocking(true);
    const result = await lockPlace(id);
    if (result.error) { alert(result.error); setIsLocking(false); }
    else { setShowRewardModal(true); setIsLocking(false); }
  };

  const handleFlagIntel = async () => {
    if (window.confirm('Are you sure this listing is fake or stale?')) {
      const result = await flagIntel(id);
      if (result.success) alert('Listing flagged. Thank you for keeping the map honest.');
      else alert(result.error || 'Flagging failed.');
    }
  };

  const handleRatingSubmit = async () => {
    if (localityScore === 0 || builtScore === 0) return;
    const ipHash = getIpHash();
    const result = await submitRating({ flatId: id, localityScore, builtQualityScore: builtScore, ipHash });
    if (result.error) alert(result.error);
    else { setRatingSubmitted(true); getFlatRatings(id).then(setRatings); }
  };

  const handleCommentSubmit = async () => {
    if (!newComment.trim()) return;
    setCommentLoading(true);
    const ipHash = getIpHash();
    const result = await addComment(id, newComment, ipHash);
    if (result.error) alert(result.error);
    else { setNewComment(''); getComments(id).then(setComments); }
    setCommentLoading(false);
  };

  const StarRating = ({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) => (
    <div className="space-y-2">
      <div className="font-technical text-[9px] uppercase tracking-widest text-on-surface-variant font-black">{label}</div>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <button key={star} onClick={() => onChange(star)} className="p-1 transition-transform hover:scale-125">
            <Star size={20} className={star <= value ? 'fill-amber-400 text-amber-400' : 'text-white/20'} />
          </button>
        ))}
      </div>
    </div>
  );

  const navBar = (
    <nav className="fixed top-0 w-full z-50 flex justify-center h-16 bg-background/80 backdrop-blur-xl border-b border-white/5 shadow-2xl px-3 sm:px-4 md:px-8">
      <div className="max-w-5xl flex justify-between items-center w-full gap-2">
        <div className="flex items-center gap-1 sm:gap-3 min-w-0">
          <UnifiedMenu />
          <Link href="/explore" className="hidden sm:flex items-center gap-2 text-primary font-black uppercase tracking-widest text-[10px] hover:scale-105 transition-transform font-technical whitespace-nowrap">
            <ChevronLeft size={16} /> Back
          </Link>
        </div>
        <div className="flex flex-col items-center min-w-0">
          <Link href="/" className="font-display text-lg sm:text-xl text-primary font-black tracking-tighter whitespace-nowrap">indian.rent</Link>
          <span className="hidden sm:block text-[7px] uppercase tracking-[0.4em] text-primary/40 font-black">by WishLabs</span>
        </div>
        <div className="flex gap-2 min-w-fit">
          <button onClick={handleShare} title="Copy link" className="p-2 sm:p-2.5 rounded-lg text-primary hover:scale-110 active:scale-90 transition-all border border-white/10 relative">
            {isCopied ? <Check size={16} className="sm:w-[18px] sm:h-[18px]" /> : <Share2 size={16} className="sm:w-[18px] sm:h-[18px]" />}
          </button>
          <button onClick={handleWhatsAppShare} title="Share on WhatsApp" className="p-2 sm:p-2.5 rounded-lg text-emerald-400 hover:scale-110 active:scale-90 transition-all border border-emerald-500/30 hover:border-emerald-400/60 relative">
            <MessageCircle size={16} className="sm:w-[18px] sm:h-[18px]" />
          </button>
        </div>
      </div>
    </nav>
  );

  if (listingLoading) {
    return (
      <div className="min-h-screen bg-background text-on-background">
        {navBar}
        <div className="pt-24 px-4 md:px-8 max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="aspect-video w-full rounded-lg bg-surface border border-white/10 animate-pulse" />
            <div className="bg-surface border border-white/10 rounded-lg p-8 space-y-4">
              <div className="h-8 bg-white/5 rounded animate-pulse w-3/4" />
              <div className="h-4 bg-white/5 rounded animate-pulse w-1/2" />
              <div className="h-4 bg-white/5 rounded animate-pulse w-full" />
              <div className="h-4 bg-white/5 rounded animate-pulse w-5/6" />
            </div>
          </div>
          <div className="bg-surface border border-white/10 rounded-lg p-8 h-fit space-y-4">
            <div className="h-20 bg-white/5 rounded animate-pulse" />
            <div className="h-32 bg-white/5 rounded animate-pulse" />
            <div className="h-12 bg-white/5 rounded animate-pulse" />
          </div>
        </div>
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
          <RefreshCcw className="animate-spin text-primary opacity-30" size={32} />
        </div>
      </div>
    );
  }

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

  const rent = listing.rentAmount ? `₹${Number(listing.rentAmount).toLocaleString()}` : '—';
  const reward = rewardFromRent(listing.rentAmount);
  const noBrokerLink = listing.noBrokerLink || null;
  const flatmatesLink = (listing as any).flatmatesLink || null;
  const isOwn = listing.ipHash && listing.ipHash === (typeof window !== 'undefined' ? localStorage.getItem('ir_ip_hash') : '');

  const specs = [
    { label: 'Type', value: listing.buildingCategory || '—' },
    { label: 'Floor', value: floorLabel(listing.floorNumber) },
    { label: 'BHK', value: listing.bhk ? `${listing.bhk} BHK` : '—' },
  ];

  const extraSpecs = [
    listing.furnishing && { label: 'Furnishing', value: FURNISHING_LABELS[listing.furnishing] || listing.furnishing, icon: Sofa },
    listing.sizeSqft && { label: 'Size', value: `${listing.sizeSqft} sq.ft`, icon: Ruler },
    listing.availabilityDate && { label: 'Available', value: new Date(listing.availabilityDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }), icon: Calendar },
    listing.flatmateNeeded && { label: 'Flatmate', value: 'Needed', icon: Users },
  ].filter(Boolean) as { label: string; value: string; icon: any }[];

  return (
    <div className="min-h-screen bg-background text-on-background pb-24 selection:bg-primary/30">
      {navBar}

      <main className="pt-24 px-3 sm:px-4 md:px-8 max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8 text-left">
        {/* Left */}
        <div className="space-y-6">
          <motion.div data-tour="listing-images" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="aspect-video w-full rounded-lg overflow-hidden border border-white/10 p-1.5 bg-surface">
            <img src={PLACEHOLDER_IMAGE} alt={listing.buildingName} className="w-full h-full object-cover rounded-md" />
          </motion.div>

          <div className="bg-surface border border-white/10 rounded-lg p-4 sm:p-6 md:p-8 space-y-6">
            <div>
              <h1 data-tour="listing-title" className="text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-tight leading-none mb-3 font-display">
                {listing.buildingName || `Flat ${listing.flatNumber}`}
              </h1>
              <div className="flex items-center gap-2 text-on-surface-variant font-bold uppercase tracking-widest text-[10px] opacity-60 font-technical">
                <MapPin size={14} />
                {[listing.buildingAddress, listing.buildingCity].filter(Boolean).join(', ') || 'Hyderabad'}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-secondary/10 border border-secondary/20 text-secondary px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 size={12} /> Verified
              </span>
              {listing.flatmateNeeded && (
                <span className="bg-emerald-400/10 border border-emerald-400/20 text-emerald-400 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider">
                  Flatmate Needed
                </span>
              )}
              {isOwn && (
                <span className="bg-primary/10 border border-primary/20 text-primary px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider">
                  Your Listing
                </span>
              )}
              {listing.maintenanceIncluded && (
                <span className="bg-white/5 border border-white/10 text-on-surface-variant px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider">
                  Maint. Included
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 border-t border-white/5 pt-6">
              {specs.map(item => (
                <div key={item.label} className="bg-white/5 border border-white/5 rounded-lg p-3 sm:p-4 text-center">
                  <div className="text-[8px] sm:text-[9px] uppercase tracking-widest text-on-surface-variant font-black mb-1 opacity-50 font-technical">{item.label}</div>
                  <div className="font-black text-primary uppercase text-xs sm:text-xs tracking-widest">{item.value}</div>
                </div>
              ))}
            </div>

            {extraSpecs.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 border-t border-white/5 pt-4">
                {extraSpecs.map(item => (
                  <div key={item.label} className="flex items-center gap-2 sm:gap-3 bg-white/5 border border-white/5 rounded-lg p-2 sm:p-3">
                    <item.icon size={14} className="text-primary shrink-0 opacity-70" />
                    <div className="min-w-0">
                      <div className="text-[8px] uppercase tracking-widest text-on-surface-variant font-black opacity-50 truncate">{item.label}</div>
                      <div className="font-black text-on-surface text-xs truncate">{item.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {listing.contributorName && (
              <div className="border-t border-white/5 pt-4 flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[9px] font-black text-primary uppercase">{listing.contributorName[0]}</div>
                <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest">Contributed by {listing.contributorName}</span>
              </div>
            )}
          </div>

          {/* Community Rating */}
          <div className="bg-surface border border-white/10 rounded-lg p-4 sm:p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-3">
              <Star size={18} className="text-amber-400" />
              <span className="font-technical text-[10px] text-on-surface font-black uppercase tracking-[0.2em]">Community Rating</span>
              {ratings.total_ratings > 0 && (
                <span className="text-[10px] text-on-surface-variant">({ratings.total_ratings} {ratings.total_ratings === 1 ? 'rating' : 'ratings'})</span>
              )}
            </div>

            {ratings.total_ratings > 0 && (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 border border-white/5 rounded-lg p-4 text-center">
                  <div className="text-2xl font-black text-amber-400">{Number(ratings.avg_locality).toFixed(1)}</div>
                  <div className="font-technical text-[8px] text-on-surface-variant uppercase tracking-wider mt-1">Locality</div>
                </div>
                <div className="bg-white/5 border border-white/5 rounded-lg p-4 text-center">
                  <div className="text-2xl font-black text-amber-400">{Number(ratings.avg_built_quality).toFixed(1)}</div>
                  <div className="font-technical text-[8px] text-on-surface-variant uppercase tracking-wider mt-1">Built Quality</div>
                </div>
              </div>
            )}

            {!ratingSubmitted ? (
              <div className="space-y-4">
                <StarRating value={localityScore} onChange={setLocalityScore} label="Locality (area, amenities, connectivity)" />
                <StarRating value={builtScore} onChange={setBuiltScore} label="Built Quality (construction, interiors)" />
                <button
                  onClick={handleRatingSubmit}
                  disabled={localityScore === 0 || builtScore === 0}
                  className="w-full py-3 bg-amber-400/10 border border-amber-400/30 text-amber-400 rounded-lg font-black uppercase tracking-[0.2em] text-[10px] disabled:opacity-20 transition-all hover:bg-amber-400/20"
                >
                  Submit Rating
                </button>
              </div>
            ) : (
              <div className="text-center py-4 text-[10px] text-emerald-400 font-black uppercase tracking-widest">
                Rating submitted — thank you!
              </div>
            )}
          </div>

          {/* Comments */}
          <div className="bg-surface border border-white/10 rounded-lg p-4 sm:p-6 md:p-8 space-y-5">
            <div className="flex items-center gap-3">
              <MessageCircle size={18} className="text-primary" />
              <span className="font-technical text-[10px] text-on-surface font-black uppercase tracking-[0.2em]">Comments</span>
              <span className="text-[10px] text-on-surface-variant">({comments.length})</span>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCommentSubmit()}
                placeholder="Add a comment..."
                maxLength={500}
                className="flex-1 bg-white/5 border border-white/5 rounded-lg px-4 py-3 text-on-surface text-xs font-medium focus:border-primary outline-none placeholder:text-on-surface-variant/30"
              />
              <button
                onClick={handleCommentSubmit}
                disabled={commentLoading || !newComment.trim()}
                className="p-3 bg-primary text-on-primary rounded-lg disabled:opacity-20 transition-all hover:bg-blue-400"
              >
                <Send size={14} />
              </button>
            </div>

            {comments.length > 0 ? (
              <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar">
                {comments.map(c => (
                  <div key={c.id} className="bg-white/5 border border-white/5 rounded-lg p-4">
                    <p className="text-xs text-on-surface font-medium">{c.content}</p>
                    <div className="text-[9px] text-on-surface-variant/50 mt-2 font-technical">
                      {new Date(c.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-[10px] text-on-surface-variant/40 font-technical uppercase tracking-widest">
                No comments yet — be the first
              </div>
            )}
          </div>
        </div>

        {/* Right — Actions */}
        <div data-tour="listing-action-panel" className="lg:sticky lg:top-24 h-fit space-y-6 pb-8 lg:pb-12">
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }} className="bg-surface border border-white/10 rounded-lg p-4 sm:p-6 md:p-8 shadow-2xl">
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="bg-white/5 border border-white/5 rounded-lg p-5">
                <div className="text-[9px] uppercase tracking-widest text-on-surface-variant font-black mb-1 opacity-50 font-technical text-left">Monthly Rent</div>
                <div className="text-2xl sm:text-3xl font-black text-primary tracking-tighter text-left">
                  {rent}<span className="text-[10px] text-on-surface-variant font-normal ml-1">/mo</span>
                </div>
              </div>
              <div className="bg-white/5 border border-white/5 rounded-lg p-5 text-right">
                <div className="text-[9px] uppercase tracking-widest text-on-surface-variant font-black mb-1 opacity-50 font-technical">Deposit</div>
                <div className="text-2xl font-black text-on-surface tracking-tighter">2 Months</div>
              </div>
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 mb-8 flex items-center gap-5 relative overflow-hidden">
              <div className="absolute inset-0 bg-primary/5 blur-2xl" />
              <div className="relative bg-primary text-on-primary p-4 rounded-lg shadow-lg shrink-0">
                <Banknote size={22} strokeWidth={2.5} />
              </div>
              <div className="relative text-left">
                <div className="font-technical text-[9px] text-primary font-black uppercase tracking-[0.2em] mb-1">Good Faith Reward</div>
                <div className="text-2xl font-black text-on-surface tracking-tighter">
                  ₹{reward.toLocaleString()} <span className="text-primary tracking-widest text-[10px] font-technical">to contributor</span>
                </div>
              </div>
            </div>
            <p className="text-[9px] text-on-surface-variant/50 uppercase tracking-wider mb-8 font-technical text-left">
              Pay this reward only if you secure the place. Bypasses broker fees entirely.
            </p>

            <div className="space-y-4">
              {noBrokerLink ? (
                <Link href={noBrokerLink} target="_blank" rel="noopener noreferrer" className="block">
                  <button className="w-full py-5 bg-primary text-on-primary rounded-lg font-black uppercase tracking-[0.2em] text-[10px] shadow-lg flex items-center justify-center gap-3 border border-white/20 transition-all hover:shadow-xl active:scale-[0.98]">
                    <LinkIcon size={16} strokeWidth={3} /> View on NoBroker
                  </button>
                </Link>
              ) : null}
              {flatmatesLink ? (
                <Link href={flatmatesLink} target="_blank" rel="noopener noreferrer" className="block">
                  <button className="w-full py-5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-lg font-black uppercase tracking-[0.2em] text-[10px] shadow-lg flex items-center justify-center gap-3 transition-all hover:bg-emerald-500/20 active:scale-[0.98]">
                    <LinkIcon size={16} strokeWidth={3} /> Find Flatmates
                  </button>
                </Link>
              ) : null}
              {!noBrokerLink && !flatmatesLink && (
                <button disabled className="w-full py-5 bg-white/5 border border-white/10 text-on-surface-variant rounded-lg font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-3 opacity-40 cursor-not-allowed">
                  <LinkIcon size={16} strokeWidth={3} /> Contact Not Available
                </button>
              )}

              <button
                onClick={handleLockPlace}
                disabled={isLocking || listing.status === 'occupied'}
                className="w-full py-5 bg-white/5 border border-white/10 rounded-lg font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-30"
              >
                <CheckCircle2 size={16} strokeWidth={3} />
                {isLocking ? 'Processing...' : listing.status === 'occupied' ? 'Already Locked' : 'I Have Locked This Place'}
              </button>

              <button
                onClick={handleWhatsAppShare}
                className="w-full py-5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg font-black uppercase tracking-[0.2em] text-[10px] text-emerald-400 flex items-center justify-center gap-3 transition-all active:scale-[0.98] hover:bg-emerald-500/20"
              >
                <MessageCircle size={16} strokeWidth={3} /> Share on WhatsApp
              </button>

              <button
                onClick={handleFlagIntel}
                className="w-full py-3 bg-red-500/5 text-red-400 rounded-lg font-black uppercase tracking-[0.2em] text-[9px] flex items-center justify-center gap-2 border border-red-500/20 opacity-40 hover:opacity-100 transition-all"
              >
                <ShieldAlert size={12} /> Report Fake or Stale
              </button>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Reward Modal */}
      <AnimatePresence>
        {showRewardModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 text-center">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowRewardModal(false)} className="absolute inset-0 bg-black/80 backdrop-blur-xl" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative w-full max-w-md bg-surface border border-white/10 rounded-lg p-10 shadow-2xl">
              <div className="text-center space-y-6">
                <div className="inline-flex bg-primary/10 p-5 rounded-full text-primary border border-primary/20">
                  <Check size={40} strokeWidth={3} />
                </div>
                <h2 className="text-3xl font-black uppercase tracking-tighter font-display">Place Locked</h2>
                <p className="text-on-surface-variant text-sm">Listing secured without broker interference. Pay the contributor their good faith reward.</p>
                <div className="bg-white/5 border border-white/5 rounded-lg p-6 space-y-4">
                  <div className="p-3 bg-white rounded-md inline-block"><QrCode size={120} className="text-black" /></div>
                  <div className="font-technical text-[10px] uppercase tracking-widest text-primary font-black">Scan to Pay Good Faith Reward</div>
                  <div className="text-2xl font-black text-on-surface tracking-tighter">₹{reward.toLocaleString()}</div>
                  {listing.contributorUpiId && (
                    <div className="text-[10px] text-on-surface-variant font-technical">UPI: {listing.contributorUpiId}</div>
                  )}
                </div>
                <button onClick={() => setShowRewardModal(false)} className="w-full py-4 bg-white/5 border border-white/10 rounded-lg font-black uppercase tracking-[0.2em] text-[10px] transition-all">Done</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
