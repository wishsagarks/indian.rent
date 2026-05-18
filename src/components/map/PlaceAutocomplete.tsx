'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useMapsLibrary } from '@vis.gl/react-google-maps';
import { Search, MapPin } from 'lucide-react';

interface PlaceAutocompleteProps {
  onPlaceSelect: (place: google.maps.places.PlaceResult) => void;
  className?: string;
}

export const PlaceAutocomplete = ({ onPlaceSelect, className }: PlaceAutocompleteProps) => {
  const [placeAutocomplete, setPlaceAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const places = useMapsLibrary('places');

  useEffect(() => {
    if (!places || !inputRef.current) return;

    const options = {
      fields: ['geometry', 'name', 'formatted_address'],
      componentRestrictions: { country: 'in' }, // Restricted to India as per indian.rent
    };

    const autocomplete = new places.Autocomplete(inputRef.current, options);
    setPlaceAutocomplete(autocomplete);

    return () => {
      // Clean up autocomplete listeners if needed
    };
  }, [places]);

  useEffect(() => {
    if (!placeAutocomplete) return;

    const listener = placeAutocomplete.addListener('place_changed', () => {
      onPlaceSelect(placeAutocomplete.getPlace());
    });

    return () => {
      google.maps.event.removeListener(listener);
    };
  }, [onPlaceSelect, placeAutocomplete]);

  return (
    <div className={`relative w-full ${className}`}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface opacity-30 pointer-events-none" size={14} />
      <input
        ref={inputRef}
        className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-9 pr-4 text-on-surface focus:bg-white/10 transition-all placeholder:text-on-surface-variant/40 font-medium text-xs tracking-wide uppercase outline-none"
        placeholder="Search localities or buildings..."
        type="text"
      />
    </div>
  );
};
