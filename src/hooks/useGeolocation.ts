'use client';

import { useState, useCallback } from 'react';

interface GeolocationState {
  loading: boolean;
  error: string | null;
  coords: {
    latitude: number;
    longitude: number;
  } | null;
}

export const useGeolocation = () => {
  const [state, setState] = useState<GeolocationState>({
    loading: false,
    error: null,
    coords: null,
  });

  const getPosition = useCallback((options?: PositionOptions) => {
    return new Promise<GeolocationPosition>((resolve, reject) => {
      if (!navigator.geolocation) {
        const error = 'Geolocation is not supported by your browser';
        setState(s => ({ ...s, error }));
        console.error('❌ Geolocation not supported:', error);
        reject(error);
        return;
      }

      setState(s => ({ ...s, loading: true, error: null }));

      navigator.geolocation.getCurrentPosition(
        (position) => {
          setState({
            loading: false,
            error: null,
            coords: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            },
          });
          resolve(position);
        },
        (error) => {
          let errorMessage = 'Failed to get your location';
          console.error('📍 Geolocation error code:', error.code);

          switch (error.code) {
            case 1: // PERMISSION_DENIED
              errorMessage = 'Location permission denied';
              console.error('❌ User denied location permission');
              break;
            case 2: // POSITION_UNAVAILABLE
              errorMessage = 'Location information is unavailable';
              console.error('❌ Location information unavailable');
              break;
            case 3: // TIMEOUT
              errorMessage = 'Location request timed out';
              console.error('❌ Geolocation timeout');
              break;
          }
          setState({
            loading: false,
            error: errorMessage,
            coords: null,
          });
          console.error('Location error:', errorMessage);
          reject(errorMessage);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
          ...options,
        }
      );
    });
  }, []);

  return { ...state, getPosition };
};
