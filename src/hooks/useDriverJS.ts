'use client';

import { useEffect, useRef, useCallback } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

interface TourStep {
  element?: string;
  popover?: {
    title?: string;
    description: string;
    side?: 'left' | 'right' | 'top' | 'bottom';
    align?: 'start' | 'center' | 'end';
  };
}

const TOURS = {
  explore: [
    {
      element: '#map-container',
      popover: {
        title: '🗺️ Interactive Map',
        description: 'Browse rental listings on the map. Click any orange pin to see details. Zoom in/out to explore different areas.',
        side: 'bottom' as const,
        align: 'center' as const,
      },
    },
    {
      element: '[data-tour="search-button"]',
      popover: {
        title: '🔍 Quick Search',
        description: 'Click to search for a specific locality or building. Type an area name to jump to it on the map.',
        side: 'right' as const,
        align: 'start' as const,
      },
    },
    {
      element: '[data-tour="filter-button"]',
      popover: {
        title: '⚙️ Filter Listings',
        description: 'Narrow down results by BHK (1-5), max rent, furnishing type, and other preferences. Filters save automatically!',
        side: 'right' as const,
        align: 'start' as const,
      },
    },
    {
      element: '[data-tour="metro-button"]',
      popover: {
        title: '🚇 Metro Lines',
        description: 'Toggle to see metro routes and public transport on the map. Great for finding properties near transit!',
        side: 'right' as const,
        align: 'start' as const,
      },
    },
    {
      element: '[data-tour="area-stats-button"]',
      popover: {
        title: '📊 Area Statistics',
        description: 'Click on any area to see live stats: average rent by BHK, demand level, and market trends.',
        side: 'right' as const,
        align: 'start' as const,
      },
    },
    {
      element: '[data-tour="add-property-button"]',
      popover: {
        title: '➕ Add Your Rental',
        description: 'Share a rental property you know about. Help your community find honest rents without broker fees!',
        side: 'top' as const,
        align: 'center' as const,
      },
    },
  ] as TourStep[],

  listing: [
    {
      element: '[data-tour="listing-title"]',
      popover: {
        title: '📝 Property Details',
        description: 'See all info: BHK, furnishing, amenities, availability, and landlord verified status.',
        side: 'bottom' as const,
        align: 'center' as const,
      },
    },
    {
      element: '[data-tour="listing-images"]',
      popover: {
        title: '📸 Photo Gallery',
        description: 'Browse high-quality photos. Scroll to see all angles of the property.',
        side: 'bottom' as const,
        align: 'center' as const,
      },
    },
    {
      element: '[data-tour="listing-action-panel"]',
      popover: {
        title: '💬 Share & Connect',
        description: 'Copy link or share on WhatsApp. Contact the landlord directly — no brokers!',
        side: 'left' as const,
        align: 'start' as const,
      },
    },
  ] as TourStep[],

  landing: [
    {
      element: '[data-tour="hero-section"]',
      popover: {
        title: '🏠 Welcome to indian.rent',
        description: 'Find verified rental properties directly. Real rents from real people. Zero broker fees.',
        side: 'bottom' as const,
        align: 'center' as const,
      },
    },
    {
      element: '[data-tour="explore-button"]',
      popover: {
        title: '🚀 Explore Now',
        description: 'Jump to the map and start browsing thousands of live rental listings in your city!',
        side: 'bottom' as const,
        align: 'center' as const,
      },
    },
  ] as TourStep[],

  analytics: [
    {
      element: '[data-tour="kpi-cards"]',
      popover: {
        title: '📊 Market Snapshot',
        description: 'See live supply, demand, median rent, and market quality at a glance.',
        side: 'bottom' as const,
        align: 'center' as const,
      },
    },
    {
      element: '[data-tour="city-selector"]',
      popover: {
        title: '🏙️ Compare Cities',
        description: 'Switch between Bengaluru, Hyderabad, and more to compare markets.',
        side: 'bottom' as const,
        align: 'center' as const,
      },
    },
  ] as TourStep[],
};

export function useDriverJS(tourName: keyof typeof TOURS | null = null) {
  const driverRef = useRef<ReturnType<typeof driver> | null>(null);
  const isEnabledRef = useRef(false);

  useEffect(() => {
    // Check if driver.js is enabled via environment variable
    const isEnabled = process.env.NEXT_PUBLIC_DRIVER_JS_ENABLED === 'true';
    isEnabledRef.current = isEnabled;

    if (!isEnabled) return;

    // Initialize driver.js instance
    const driverInstance = driver({
      showProgress: true,
      progressText: 'Step {{current}} of {{total}}',
      smoothScroll: true,
      allowClose: true,
      doneBtnText: 'Done',
      nextBtnText: 'Next →',
      prevBtnText: '← Previous',
      onCloseClick: () => {
        localStorage.setItem(`indian_rent_tour_dismissed_${tourName}`, 'true');
      },
    });

    driverRef.current = driverInstance;

    // Start tour if tourName is provided
    if (tourName && tourName in TOURS) {
      const timer = setTimeout(() => {
        if (driverRef.current) {
          const steps = TOURS[tourName];
          driverRef.current.setSteps(steps);
          driverRef.current.drive(0);
        }
      }, 500);

      return () => {
        clearTimeout(timer);
        if (driverRef.current) {
          driverRef.current.destroy();
        }
      };
    }

    return () => {
      if (driverRef.current) {
        driverRef.current.destroy();
      }
    };
  }, [tourName]);

  const startTour = useCallback((name: keyof typeof TOURS) => {
    if (!isEnabledRef.current || !driverRef.current) return;
    driverRef.current.setSteps(TOURS[name]);
    driverRef.current.drive(0);
  }, []);

  const stopTour = useCallback(() => {
    if (driverRef.current) {
      driverRef.current.destroy();
    }
  }, []);

  const resetTourState = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('indian_rent_toured');
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('indian_rent_tour_dismissed_')) {
          localStorage.removeItem(key);
        }
      });
    }
  }, []);

  return {
    startTour,
    stopTour,
    resetTourState,
    isEnabled: isEnabledRef.current,
  };
}
