import React from 'react';

interface ExperimentBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ExperimentBadge({ size = 'sm', className = '' }: ExperimentBadgeProps) {
  const sizeClasses = {
    sm: 'text-[9px] px-2.5 py-1.5',
    md: 'text-[10px] px-3.5 py-2',
    lg: 'text-xs px-5 py-2.5',
  };

  return (
    <button
      className={`font-black bg-primary/20 text-primary rounded-lg inline-flex items-center gap-1.5 border border-primary/30 hover:bg-primary/30 hover:border-primary/50 transition-all cursor-default ${sizeClasses[size]} ${className}`}
      aria-label="Experimental feature"
    >
      <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
      EXPERIMENT
    </button>
  );
}
