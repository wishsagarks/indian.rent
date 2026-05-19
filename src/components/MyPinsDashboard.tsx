'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { MapPin, ChevronLeft, Trash2, Edit2, Check, X, Users, Clock, AlertTriangle, Award } from 'lucide-react';
import { getMyListings, getMySeekerPins, updateMyListing, deleteMySeekerPin, deleteOwnPin } from '@/app/actions/map-actions';
import { rewardFromRent } from '@/lib/constants';
import UnifiedMenu from './UnifiedMenu';

const STATUS_STYLE: Record<string, string> = {
  vacant: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/30',
  partial: 'bg-amber-400/10 text-amber-400 border-amber-400/30',
  occupied: 'bg-red-400/10 text-red-400 border-red-400/30',
};

export default function MyPinsDashboard() {
  const [listings, setListings] = useState<any[]>([]);
  const [seekerPins, setSeekerPins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRent, setEditRent] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([getMyListings(), getMySeekerPins()]).then(([l, s]) => {
      setListings(l);
      setSeekerPins(s);
      setLoading(false);
    });
  }, []);

  const handleDeleteListing = async (id: string) => {
    if (!confirm('Delete this listing permanently?')) return;
    const result = await deleteOwnPin(id);
    if (result.error) alert(result.error);
    else setListings(prev => prev.filter(l => l.id !== id));
  };

  const handleDeleteSeekerPin = async (id: string) => {
    if (!confirm('Remove this seeker pin?')) return;
    const result = await deleteMySeekerPin(id);
    if (result.error) alert(result.error);
    else setSeekerPins(prev => prev.filter(p => p.id !== id));
  };

  const handleSaveEdit = async (id: string) => {
    const rent = parseFloat(editRent.replace(/[^0-9.]/g, ''));
    if (!rent || rent < 1000) { alert('Enter a valid rent (min ₹1,000)'); return; }
    setSaving(true);
    const result = await updateMyListing(id, { rentAmount: rent });
    if (result.error) alert(result.error);
    else {
      setListings(prev => prev.map(l => l.id === id ? { ...l, rentAmount: rent } : l));
      setEditingId(null);
    }
    setSaving(false);
  };

  const handleToggleFlatmate = async (id: string, current: boolean) => {
    const result = await updateMyListing(id, { flatmateNeeded: !current });
    if (result.error) alert(result.error);
    else setListings(prev => prev.map(l => l.id === id ? { ...l, flatmateNeeded: !current } : l));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="font-technical text-[10px] uppercase tracking-widest text-primary animate-pulse">Loading your pins...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-on-background pb-24">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 h-16 bg-background/5 backdrop-blur-xl border-b border-white/10 flex items-center px-4 md:px-8 gap-4">
        <div className="flex items-center gap-3">
          <UnifiedMenu />
          <Link href="/explore" className="flex items-center gap-2 text-primary font-black uppercase tracking-widest text-[10px] hover:scale-105 transition-transform font-technical">
            <ChevronLeft size={16} /> Map
          </Link>
        </div>
        <span className="font-display text-xl text-primary font-black tracking-tighter mx-auto">My Pins</span>
        <div className="w-16" />
      </nav>

      <main className="pt-24 px-4 md:px-8 max-w-3xl mx-auto space-y-10">
        {listings.length === 0 && seekerPins.length === 0 ? (
          <div className="text-center py-20 text-on-surface-variant">
            <MapPin size={40} className="mx-auto mb-4 opacity-20" />
            <p className="text-sm">No pins yet. <Link href="/explore" className="text-primary underline">Deploy a pin</Link> to get started.</p>
          </div>
        ) : (
          <>
            {/* Listings */}
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <MapPin size={16} className="text-primary" />
                <h2 className="font-technical text-[10px] uppercase tracking-[0.3em] text-primary font-black">Your Listings ({listings.length})</h2>
              </div>

              {listings.length === 0 ? (
                <div className="bg-surface border border-white/10 rounded-lg p-8 text-center text-on-surface-variant text-sm">
                  No listings yet. <Link href="/explore" className="text-primary underline">Deploy a pin</Link> to get started.
                </div>
              ) : (
                <div className="space-y-3">
                  {listings.map(l => (
                    <motion.div key={l.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-surface border border-white/10 rounded-lg p-5 space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="font-black text-sm text-on-surface truncate">{l.buildingName || `Flat ${l.flatNumber}`}</div>
                          <div className="text-[10px] text-on-surface-variant font-technical uppercase tracking-wider mt-0.5">{l.buildingAddress || 'Hyderabad'}</div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${STATUS_STYLE[l.status] || ''}`}>{l.status}</span>
                          {l.intelFlags > 0 && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border bg-red-400/10 text-red-400 border-red-400/30">
                              <AlertTriangle size={10} />{l.intelFlags} flags
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-xs">
                        {editingId === l.id ? (
                          <div className="flex items-center gap-2 flex-1">
                            <input
                              type="number"
                              value={editRent}
                              onChange={e => setEditRent(e.target.value)}
                              className="bg-surface-container-low border border-primary rounded-md px-3 py-1.5 text-primary font-black text-sm w-32 outline-none"
                              placeholder="₹ Rent"
                              autoFocus
                            />
                            <button onClick={() => handleSaveEdit(l.id)} disabled={saving} className="p-1.5 rounded-md bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 transition-colors">
                              <Check size={14} />
                            </button>
                            <button onClick={() => setEditingId(null)} className="p-1.5 rounded-md bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => { setEditingId(l.id); setEditRent(String(l.rentAmount || '')) }}
                            className="flex items-center gap-1.5 text-on-surface font-black hover:text-primary transition-colors group"
                          >
                            <span className="text-base">₹{Number(l.rentAmount || 0).toLocaleString()}</span>
                            <Edit2 size={12} className="opacity-0 group-hover:opacity-60 transition-opacity" />
                          </button>
                        )}
                        <span className="text-on-surface-variant opacity-40">·</span>
                        <span className="text-on-surface-variant">{l.bhk ? `${l.bhk} BHK` : '—'}</span>
                        <span className="text-on-surface-variant opacity-40">·</span>
                        <span className="text-on-surface-variant">{new Date(l.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => handleToggleFlatmate(l.id, l.flatmateNeeded)}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-[9px] font-black uppercase tracking-wider border transition-all ${l.flatmateNeeded ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/30' : 'bg-white/5 border-white/10 text-on-surface-variant'}`}
                        >
                          <Users size={12} /> {l.flatmateNeeded ? 'Flatmate Wanted' : 'No Flatmate'}
                        </button>
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1 text-[9px] text-on-surface-variant font-technical">
                            <Award size={12} className="text-amber-400" />
                            ₹{rewardFromRent(l.rentAmount || 0).toLocaleString()} reward
                          </span>
                          <Link href={`/flat/${l.id}`} className="px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-md text-[9px] font-black uppercase tracking-wider hover:bg-primary/20 transition-colors">View</Link>
                          <button onClick={() => handleDeleteListing(l.id)} className="p-1.5 rounded-md bg-red-400/5 border border-red-400/20 text-red-400 hover:bg-red-400/10 transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </section>

            {/* Seeker Pins */}
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <Users size={16} className="text-emerald-400" />
                <h2 className="font-technical text-[10px] uppercase tracking-[0.3em] text-emerald-400 font-black">Your Seeker Pins ({seekerPins.length})</h2>
              </div>

              {seekerPins.length === 0 ? (
                <div className="bg-surface border border-white/10 rounded-lg p-8 text-center text-on-surface-variant text-sm">
                  No active seeker pins. Enter Hunt mode on the map to drop one.
                </div>
              ) : (
                <div className="space-y-3">
                  {seekerPins.map(p => (
                    <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-surface border border-white/10 rounded-lg p-5 flex items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="font-black text-sm">{p.bhk_preference !== 'any' ? `${p.bhk_preference} BHK` : 'Any BHK'}{p.budget ? ` · up to ₹${Number(p.budget).toLocaleString()}` : ''}</div>
                        <div className="flex items-center gap-1 text-[10px] text-on-surface-variant font-technical">
                          <Clock size={10} />
                          Expires {new Date(p.expires_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </div>
                      </div>
                      <button onClick={() => handleDeleteSeekerPin(p.id)} className="p-2 rounded-md bg-red-400/5 border border-red-400/20 text-red-400 hover:bg-red-400/10 transition-colors shrink-0">
                        <Trash2 size={14} />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
