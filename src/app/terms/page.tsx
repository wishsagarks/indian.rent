import React from 'react';
import Link from 'next/link';
import { ChevronLeft, Shield } from 'lucide-react';
import UnifiedMenu from '@/components/UnifiedMenu';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background text-on-background font-sans p-6 md:p-24 selection:bg-primary/20">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-12">
          <UnifiedMenu />
          <Link href="/" className="inline-flex items-center gap-2 text-primary font-black uppercase tracking-widest text-[10px] hover:scale-105 transition-transform font-technical">
            <ChevronLeft size={16} /> Back to HQ
          </Link>
        </div>
        
        <header className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="text-primary" size={32} />
            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none font-display">Terms of <br/> Engagement</h1>
          </div>
          <p className="text-on-surface-variant font-medium opacity-60 uppercase tracking-widest text-[10px] font-technical">Protocol Version 1.0.2 // Effective May 2026</p>
        </header>

        <div className="space-y-12 text-on-surface-variant leading-relaxed">
          <section>
            <h2 className="text-on-surface font-black uppercase tracking-widest text-xs mb-4">1. The Neutrality Protocol</h2>
            <p>indian.rent is a decentralized intelligence grid. We do not act as agents, brokers, or intermediaries. All data is crowdsourced and provided &quot;as-is&quot; by the community.</p>
          </section>

          <section>
            <h2 className="text-on-surface font-black uppercase tracking-widest text-xs mb-4">2. Intelligence Integrity</h2>
            <p>Contributors are responsible for the accuracy of their intel. Falsifying rental data or building locations will result in a permanent IP-based deployment ban from the grid.</p>
          </section>

          <section>
            <h2 className="text-on-surface font-black uppercase tracking-widest text-xs mb-4">3. Privacy & Anonymity</h2>
            <p>We do not require user accounts. We use IP hashes to deduplicate contributions and moderate the map. No personal identity data is stored unless explicitly provided for rewards.</p>
          </section>

          <section>
            <h2 className="text-on-surface font-black uppercase tracking-widest text-xs mb-4">4. Liability Limitation</h2>
            <p>WishLabs and the indian.rent protocol are not liable for any disputes, financial losses, or physical incidents occurring from the use of this data. Always verify intel in person.</p>
          </section>
        </div>

        <footer className="mt-24 pt-12 border-t border-white/5 opacity-20 text-[9px] font-technical uppercase tracking-[0.4em]">
          &copy; 2026 WishLabs Intelligence Systems
        </footer>
      </div>
    </div>
  );
}
