'use client';

import React from 'react';

interface State { hasError: boolean; message: string }

export default class MapErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-background text-on-surface p-8 text-center gap-6">
          <div className="text-6xl font-black text-primary/20">⚠</div>
          <h2 className="text-2xl font-black uppercase tracking-tighter">Map Offline</h2>
          <p className="text-on-surface-variant text-sm max-w-xs">The tactical grid encountered an error. Reload to reconnect.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-8 py-4 bg-primary text-on-primary rounded-lg font-black uppercase tracking-[0.2em] text-[10px]"
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
