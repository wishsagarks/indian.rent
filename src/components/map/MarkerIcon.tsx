import React from 'react';
import { Shield, ShieldAlert, Building2 } from 'lucide-react';
import { PropertyCategory } from '@/types';

interface MarkerIconProps {
  category: PropertyCategory;
  isVacant?: boolean;
}

export default function MarkerIcon({ category, isVacant }: MarkerIconProps) {
  const getIcon = () => {
    switch (category) {
      case 'gated':
        return <Shield className="h-4 w-4" />;
      case 'semi-gated':
        return <ShieldAlert className="h-4 w-4" />;
      case 'standalone':
        return <Building2 className="h-4 w-4" />;
      default:
        return <Building2 className="h-4 w-4" />;
    }
  };

  const getColorClass = () => {
    if (isVacant) return 'bg-green-500 hover:bg-green-600';
    return 'bg-blue-500 hover:bg-blue-600';
  };

  return (
    <div className={`flex h-8 w-8 items-center justify-center rounded-full text-white shadow-xl transition-all hover:scale-110 ring-2 ring-white cursor-pointer ${getColorClass()}`}>
      {getIcon()}
    </div>
  );
}
