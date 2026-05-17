'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Banknote, Link as LinkIcon, Share2, CircleCheck as CheckCircle2, ChevronLeft, Check, X, QrCode, ShieldAlert, Star, MessageCircle, Send } from 'lucide-react';
import Link from 'next/link';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
import { lockPlace, flagIntel, getFlatRatings, submitRating, getComments, addComment } from '@/app/actions/map-actions';

interface ListingPageProps {
  id: string;
  type: 'flat' | 'flatmate';
}

function getIpHash(): string {
  if (typeof window === 'undefined') return '';
  let hash = localStorage.getItem('ir_ip_hash');
  if (!hash) {
    hash = 'u_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    localStorage.setItem('ir_ip_hash', hash);
  }
  return hash;
}

const getListingData = (id: string) => ({
  id,
  building: 'Cybercity Marina Skies',
  location: 'Hitech City, Hyderabad',
  category: 'gated',
  rent: '\u20B955,000',
  deposit: '3 Months',
  bhk: 3,
  floor: '18th Floor',
  reward: '\u20B93,000',
  description: 'Spacious corner flat with lake view. Looking for direct tenants only. No brokers please.',
  ownerContact: 'https://wa.me/910000000000',
  images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=1200&auto=format&fit=crop']
});

export default function ListingDetail({ id, type }: ListingPageProps) {
  const data = getListingData(id);
  const { isCopied, copy } = useCopyToClipboard();
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
    getFlatRatings(id).then(setRatings);
    getComments(id).then(setComments);
  }, [id]);

  const handleShare = () => copy(window.location.href);

  const handleLockPlace = async () => {
    setIsLocking(true);
    const result = await lockPlace(id);
    if (result.error) { alert(result.error); setIsLocking(false); }
    else { setShowRewardModal(true); setIsLocking(false); }
  };

  const handleFlagIntel = async () => {
    if (window.confirm("Are you sure this intelligence is fake or stale?")) {
      const result = await flagIntel(id);
      if (result.success) alert("Intelligence Flagged. Thank you.");
      else alert(result.error || "Flagging failed.");
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

  return (
    <div className="min-h-screen bg-background text-on-background pb-24 selection:bg-primary/30">
      <nav className="fixed top-0 w-full z-50 flex justify-center h-16 bg-background/5 backdrop-blur-xl border-b border-white/10 shadow-2xl px-4 md:px-8">
        <div className="max-w-5xl flex justify-between items-center w-full">
          <Link href="/explore" className="flex items-center gap-2 text-primary font-black uppercase tracking-widest text-[10px] hover:scale-105 transition-transform font-technical">
            <ChevronLeft size={16} /> Back to Map
          </Link>
          <Link href="/" className="font-display text-xl text-primary font-black tracking-tighter">indian.rent</Link>
          <button onClick={handleShare} className="p-2.5 rounded-lg text-primary hover:scale-110 active:scale-90 transition-all border border-white/10 relative">
            {isCopied ? <Check size={18} /> : <Share2 size={18} />}
          </button>
        </div>
      </nav>

      <main className="pt-24 px-4 md:px-8 max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 text-left">
        {/* Left */}
        <div className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="aspect-video w-full rounded-lg overflow-hidden border border-white/10 p-1.5 bg-surface">
            <img src={data.images[0]} alt={data.building} className="w-full h-full object-cover rounded-md" />
          </motion.div>

          <div className="bg-surface border border-white/10 rounded-lg p-8 space-y-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight leading-none mb-3 font-display">{data.building}</h1>
              <div className="flex items-center gap-2 text-on-surface-variant font-bold uppercase tracking-widest text-[10px] opacity-60 font-technical">
                <MapPin size={14} /> {data.location}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-secondary/10 border border-secondary/20 text-secondary px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 size={12} /> Verified
              </span>
            </div>
            <p className="text-sm leading-relaxed text-on-surface-variant font-medium opacity-80">{data.description}</p>
            <div className="grid grid-cols-3 gap-4 border-t border-white/5 pt-6">
              {[{ label: 'Type', value: data.category }, { label: 'Floor', value: data.floor }, { label: 'BHK', value: `${data.bhk} BHK` }].map(item => (
                <div key={item.label} className="bg-white/5 border border-white/5 rounded-lg p-4 text-center">
                  <div className="text-[9px] uppercase tracking-widest text-on-surface-variant font-black mb-1 opacity-50 font-technical">{item.label}</div>
                  <div className="font-black text-primary uppercase text-xs tracking-widest">{item.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Community Rating */}
          <div className="bg-surface border border-white/10 rounded-lg p-8 space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <Star size={18} className="text-amber-400" />
              <span className="font-technical text-[10px] text-on-surface font-black uppercase tracking-[0.2em]">Community Rating</span>
              {ratings.total_ratings > 0 && <span className="text-[10px] text-on-surface-variant">({ratings.total_ratings} ratings)</span>}
            </div>

            {ratings.total_ratings > 0 && (
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-white/5 border border-white/5 rounded-lg p-4 text-center">
                  <div className="text-2xl font-black text-amber-400">{ratings.avg_locality || '—'}</div>
                  <div className="font-technical text-[8px] text-on-surface-variant uppercase tracking-wider mt-1">Locality</div>
                </div>
                <div className="bg-white/5 border border-white/5 rounded-lg p-4 text-center">
                  <div className="text-2xl font-black text-amber-400">{ratings.avg_built_quality || '—'}</div>
                  <div className="font-technical text-[8px] text-on-surface-variant uppercase tracking-wider mt-1">Built Quality</div>
                </div>
              </div>
            )}

            {!ratingSubmitted ? (
              <div className="space-y-4">
                <StarRating value={localityScore} onChange={setLocalityScore} label="Locality (area, amenities, connectivity)" />
                <StarRating value={builtScore} onChange={setBuiltScore} label="Built Quality (construction, interiors)" />
                <button onClick={handleRatingSubmit} disabled={localityScore === 0 || builtScore === 0} className="w-full py-3 bg-amber-400/10 border border-amber-400/30 text-amber-400 rounded-lg font-black uppercase tracking-[0.2em] text-[10px] disabled:opacity-20 transition-all hover:bg-amber-400/20">
                  Submit Rating
                </button>
              </div>
            ) : (
              <div className="text-center py-4 text-[10px] text-emerald-400 font-black uppercase tracking-widest">Rating submitted - thank you!</div>
            )}
          </div>

          {/* Comments */}
          <div className="bg-surface border border-white/10 rounded-lg p-8 space-y-5">
            <div className="flex items-center gap-3">
              <MessageCircle size={18} className="text-primary" />
              <span className="font-technical text-[10px] text-on-surface font-black uppercase tracking-[0.2em]">Comments</span>
              <span className="text-[10px] text-on-surface-variant">({comments.length})</span>
            </div>

            <div className="flex gap-2">
              <input type="text" value={newComment} onChange={e => setNewComment(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCommentSubmit()} placeholder="Add a comment..." maxLength={500} className="flex-1 bg-white/5 border border-white/5 rounded-lg px-4 py-3 text-on-surface text-xs font-medium focus:border-primary outline-none placeholder:text-on-surface-variant/30" />
              <button onClick={handleCommentSubmit} disabled={commentLoading || !newComment.trim()} className="p-3 bg-primary text-on-primary rounded-lg disabled:opacity-20 transition-all hover:bg-blue-400">
                <Send size={14} />
              </button>
            </div>

            {comments.length > 0 ? (
              <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar">
                {comments.map(c => (
                  <div key={c.id} className="bg-white/5 border border-white/5 rounded-lg p-4">
                    <p className="text-xs text-on-surface font-medium">{c.content}</p>
                    <div className="text-[9px] text-on-surface-variant/50 mt-2 font-technical">{new Date(c.created_at).toLocaleDateString()}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-[10px] text-on-surface-variant/40 font-technical uppercase tracking-widest">No comments yet</div>
            )}
          </div>
        </div>

        {/* Right */}
        <div className="lg:sticky lg:top-24 h-fit space-y-6 pb-12">
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="bg-surface border border-white/10 rounded-lg p-8 shadow-2xl">
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="bg-white/5 border border-white/5 rounded-lg p-5">
                <div className="text-[9px] uppercase tracking-widest text-on-surface-variant font-black mb-1 opacity-50 font-technical text-left">Rent</div>
                <div className="text-3xl font-black text-primary tracking-tighter text-left">{data.rent}<span className="text-[10px] text-on-surface-variant font-normal ml-1">/mo</span></div>
              </div>
              <div className="bg-white/5 border border-white/5 rounded-lg p-5 text-right">
                <div className="text-[9px] uppercase tracking-widest text-on-surface-variant font-black mb-1 opacity-50 font-technical">Deposit</div>
                <div className="text-3xl font-black text-on-surface tracking-tighter">{data.deposit}</div>
              </div>
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 mb-8 flex items-center gap-5 relative overflow-hidden">
              <div className="bg-primary text-on-primary p-4 rounded-lg shadow-lg"><Banknote size={24} strokeWidth={2.5} /></div>
              <div className="text-left">
                <div className="font-technical text-[9px] text-primary font-black uppercase tracking-[0.2em] mb-1">Anti-Broker Incentive</div>
                <div className="text-2xl font-black text-on-surface tracking-tighter">{data.reward} <span className="text-primary tracking-widest text-[10px] font-technical">Good Faith</span></div>
              </div>
            </div>
            <p className="text-[9px] text-on-surface-variant font-medium opacity-50 uppercase tracking-wider mb-8 font-technical text-left">
              Direct community value. You pay this reward only if you secure the place. Bypasses broker fees.
            </p>

            <div className="space-y-4">
              <Link href={data.ownerContact} target="_blank" className="block">
                <button className="w-full py-5 bg-primary text-on-primary rounded-lg font-black uppercase tracking-[0.2em] text-[10px] shadow-lg flex items-center justify-center gap-3 border border-white/20 transition-all hover:shadow-xl active:scale-[0.98]">
                  <LinkIcon size={16} strokeWidth={3} /> Get {type === 'flat' ? 'No Broker' : 'Flatmate'} Contact
                </button>
              </Link>
              <button onClick={handleLockPlace} disabled={isLocking} className="w-full py-5 bg-white/5 border border-white/10 rounded-lg font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-30">
                <CheckCircle2 size={16} strokeWidth={3} /> {isLocking ? 'Processing...' : 'I Have Locked This Place'}
              </button>
              <button onClick={handleFlagIntel} className="w-full py-3 bg-red-500/5 text-red-400 rounded-lg font-black uppercase tracking-[0.2em] text-[9px] flex items-center justify-center gap-2 border border-red-500/20 opacity-40 hover:opacity-100 transition-all">
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
                <h2 className="text-3xl font-black uppercase tracking-tighter font-display">Tactical Success</h2>
                <p className="text-on-surface-variant font-bold uppercase tracking-widest text-[10px] opacity-60 font-technical">Listing secured without broker interference.</p>
                <div className="bg-white/5 border border-white/5 rounded-lg p-6 space-y-4">
                  <div className="p-3 bg-white rounded-md inline-block"><QrCode size={120} className="text-black" /></div>
                  <div className="font-technical text-[10px] uppercase tracking-widest text-primary font-black">Scan to Pay Good Faith Reward</div>
                  <div className="text-2xl font-black text-on-surface tracking-tighter">{data.reward}</div>
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
