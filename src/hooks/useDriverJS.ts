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
        title: '🏠 Welcome to indian.rent Map',
        description: 'You\'re viewing a live rental map of your city. Every orange pin = a rental property with real rent from real landlords. No brokers, 100% transparent. Let\'s explore together!',
        side: 'bottom' as const,
        align: 'center' as const,
      },
    },
    {
      element: '#map-container',
      popover: {
        title: '📍 Understanding the Pins',
        description: 'Orange pins = Available rentals. Stacked pins (with +X) = Multiple properties in same building. Blue/green pins = Different property types (gated, PG, etc). Click any pin to see full details!',
        side: 'bottom' as const,
        align: 'center' as const,
      },
    },
    {
      element: '#map-container',
      popover: {
        title: '🔍 How to Explore',
        description: 'Zoom in (scroll up) to see detailed listings. Zoom out (scroll down) to see clustered areas. Pan by clicking and dragging. Pro tip: Zoom into your favorite neighborhoods to see what\'s available!',
        side: 'bottom' as const,
        align: 'center' as const,
      },
    },
    {
      element: '[data-tour="search-button"]',
      popover: {
        title: '🔎 Quick Search (Top Tip!)',
        description: 'Know the area you want? Click this and type the locality name (e.g., "Indiranagar", "Whitefield"). Map auto-zooms to that area. Saves you scrolling time!',
        side: 'right' as const,
        align: 'start' as const,
      },
    },
    {
      element: '[data-tour="filter-button"]',
      popover: {
        title: '🎯 Smart Filters',
        description: 'Set your preferences once: BHK type (1-5), max rent budget, furnishing (unfurnished/semi/full), property type. All results update instantly. Your filters are saved for next time!',
        side: 'right' as const,
        align: 'start' as const,
      },
    },
    {
      element: '[data-tour="metro-button"]',
      popover: {
        title: '🚇 Metro/Transit Overlay',
        description: 'Toggle this to see metro lines, bus routes, and transit hubs overlaid on the map. Looking for a place near the metro? Click this and filter by metro distance!',
        side: 'right' as const,
        align: 'start' as const,
      },
    },
    {
      element: '[data-tour="area-stats-button"]',
      popover: {
        title: '📊 Area Market Intelligence',
        description: 'Click an area on the map to see: How many listings are there? Average rent by BHK? Is demand high or low? This helps you understand market rates before clicking individual listings.',
        side: 'right' as const,
        align: 'start' as const,
      },
    },
    {
      element: '[data-tour="add-property-button"]',
      popover: {
        title: '➕ Add a Listing (Help Your Community!)',
        description: 'Know about a rental that should be here? Add it! Click the big + button, select location, fill details, and post. You\'re helping your neighbors find honest rents. Takes 2 minutes!',
        side: 'top' as const,
        align: 'center' as const,
      },
    },
    {
      element: '[data-tour="search-button"]',
      popover: {
        title: '💡 Pro Tips for Better Results',
        description: 'Tip 1: Search → Filter → Look. Tip 2: Zoom close to see street names & nearby landmarks. Tip 3: Save listings to your phone (coming soon). Tip 4: Share favorite areas with friends!',
        side: 'right' as const,
        align: 'start' as const,
      },
    },
    {
      element: '#map-container',
      popover: {
        title: '🎉 You\'re Ready!',
        description: 'Now you know the map like a pro. Try clicking a pin → view details → share with friends via WhatsApp. Questions? The ? button at top right restarts this tour anytime. Happy hunting! 🏡',
        side: 'bottom' as const,
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
