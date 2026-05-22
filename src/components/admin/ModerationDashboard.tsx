'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

interface FlaggedListing {
  id: string;
  flat_id: string;
  flag_count: number;
  status: 'pending' | 'reviewed' | 'approved' | 'rejected';
  created_at: string;
  reviewed_at?: string;
  reviewer_notes?: string;
  flat?: {
    rent: string;
    bhk: string;
    area: string;
  };
}

export default function ModerationDashboard() {
  const [listings, setListings] = useState<FlaggedListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');

  useEffect(() => {
    fetchFlaggedListings();
  }, []);

  const fetchFlaggedListings = async () => {
    const supabase = await createClient();
    try {
      const { data, error } = await supabase
        .from('moderation_queue')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setListings(data || []);
    } catch (err) {
      console.error('Failed to fetch flagged listings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (id: string, newStatus: 'approved' | 'rejected') => {
    const supabase = await createClient();
    try {
      const { error } = await supabase
        .from('moderation_queue')
        .update({
          status: newStatus,
          reviewed_at: new Date().toISOString(),
          reviewer_notes: reviewNotes,
        })
        .eq('id', id);

      if (error) throw error;
      setSelectedId(null);
      setReviewNotes('');
      fetchFlaggedListings();
    } catch (err) {
      console.error('Failed to update listing status:', err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30';
      case 'approved':
        return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30';
      case 'rejected':
        return 'text-red-400 bg-red-400/10 border-red-400/30';
      default:
        return 'text-primary bg-primary/10 border-primary/30';
    }
  };

  const pendingCount = listings.filter(l => l.status === 'pending').length;

  return (
    <div className="min-h-screen bg-background text-on-background pt-24 pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-3">
            Moderation Hub
          </h1>
          <p className="text-on-surface-variant font-medium text-sm uppercase tracking-wider">
            Review flagged listings and manage community safety
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-plate border border-primary/40 p-6 rounded-lg"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-black uppercase tracking-wider text-on-surface-variant">
                Pending Review
              </span>
              <Clock size={20} className="text-primary" />
            </div>
            <div className="text-3xl font-black text-primary">{pendingCount}</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-plate border border-secondary/40 p-6 rounded-lg"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-black uppercase tracking-wider text-on-surface-variant">
                Total Flagged
              </span>
              <AlertTriangle size={20} className="text-secondary" />
            </div>
            <div className="text-3xl font-black text-secondary">{listings.length}</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-plate border border-emerald-400/40 p-6 rounded-lg"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-black uppercase tracking-wider text-on-surface-variant">
                Resolved
              </span>
              <CheckCircle2 size={20} className="text-emerald-400" />
            </div>
            <div className="text-3xl font-black text-emerald-400">
              {listings.filter(l => l.status !== 'pending').length}
            </div>
          </motion.div>
        </div>

        {/* Listings Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-plate border border-primary/20 rounded-lg overflow-hidden"
        >
          {loading ? (
            <div className="p-12 text-center text-on-surface-variant">
              Loading flagged listings...
            </div>
          ) : listings.length === 0 ? (
            <div className="p-12 text-center text-on-surface-variant">
              No flagged listings. Community is clean! ✨
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-surface/50 border-b border-primary/10">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wider text-on-surface-variant">
                      Listing ID
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wider text-on-surface-variant">
                      Flags
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wider text-on-surface-variant">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wider text-on-surface-variant">
                      Flagged
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-black uppercase tracking-wider text-on-surface-variant">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {listings.map((listing, idx) => (
                    <motion.tr
                      key={listing.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      className="border-b border-primary/10 hover:bg-primary/5 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <code className="text-xs font-mono text-primary">
                          {listing.flat_id.slice(0, 8)}...
                        </code>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-lg text-secondary">
                            {listing.flag_count}
                          </span>
                          <span className="text-xs text-on-surface-variant">/3</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-md text-xs font-black uppercase tracking-wider border ${getStatusColor(
                            listing.status
                          )}`}
                        >
                          {listing.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-on-surface-variant">
                        {new Date(listing.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {listing.status === 'pending' && (
                          <button
                            onClick={() => setSelectedId(listing.id)}
                            className="px-4 py-2 bg-primary/20 text-primary rounded-md text-xs font-black uppercase hover:bg-primary/30 transition-all"
                          >
                            Review
                          </button>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* Review Modal */}
        <AnimatePresence>
          {selectedId && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
              onClick={() => setSelectedId(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={e => e.stopPropagation()}
                className="bg-surface rounded-lg p-8 max-w-md w-full border border-primary/20"
              >
                <h3 className="text-xl font-black uppercase mb-4">Review Listing</h3>
                <textarea
                  value={reviewNotes}
                  onChange={e => setReviewNotes(e.target.value)}
                  placeholder="Add notes (optional)..."
                  className="w-full bg-background border border-primary/20 rounded-lg p-3 text-on-surface text-sm mb-6 resize-none h-24"
                />
                <div className="flex gap-4">
                  <button
                    onClick={() => handleReview(selectedId, 'approved')}
                    className="flex-1 px-4 py-3 bg-emerald-400/20 text-emerald-400 rounded-lg font-black uppercase text-sm hover:bg-emerald-400/30 transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 size={16} /> Approve
                  </button>
                  <button
                    onClick={() => handleReview(selectedId, 'rejected')}
                    className="flex-1 px-4 py-3 bg-red-400/20 text-red-400 rounded-lg font-black uppercase text-sm hover:bg-red-400/30 transition-all flex items-center justify-center gap-2"
                  >
                    <XCircle size={16} /> Reject
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
