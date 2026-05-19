'use client';

import React from 'react';

interface State { hasError: boolean; message: string }

export default class MapErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Grid Component Failure:', error, errorInfo);
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message || 'Unknown Protocol Error' };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-background text-on-surface p-8 text-center gap-6 overflow-hidden">
          <div className="text-6xl font-black text-primary/20 animate-pulse">⚠</div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black uppercase tracking-tighter">Grid Link Severed</h2>
            <p className="text-on-surface-variant text-sm max-w-xs mx-auto">The tactical interface encountered a fatal exception. Error: <span className="text-primary font-technical">{this.state.message}</span></p>
          </div>
          
          <div className="max-w-md w-full bg-white/5 border border-white/10 rounded-lg p-4 text-left overflow-auto max-h-40 hidden md:block">
            <div className="text-[10px] font-technical uppercase tracking-widest text-primary/60 mb-2">Technical Telemetry</div>
            <pre className="text-[8px] font-technical text-on-surface-variant whitespace-pre-wrap leading-tight opacity-40">
              {this.state.message}
              {"\n"}Environment: {process.env.NODE_ENV}
              {"\n"}Provider: {process.env.NEXT_PUBLIC_MAP_PROVIDER || 'mapbox'}
            </pre>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => window.location.reload()}
              className="px-8 py-4 bg-primary text-on-primary rounded-lg font-black uppercase tracking-[0.2em] text-[10px] shadow-lg hover:scale-105 active:scale-95 transition-all"
            >
              Reconnect
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="px-8 py-4 bg-white/5 border border-white/10 text-on-surface rounded-lg font-black uppercase tracking-[0.2em] text-[10px] hover:bg-white/10 transition-all"
            >
              Abort Mission
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
