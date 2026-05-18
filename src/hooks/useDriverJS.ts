'use client';

import { useEffect, useRef } from 'react';
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
        title: 'Interactive Map',
        description: 'Browse rental listings on the map. Click on any pin to see details.',
        side: 'bottom' as const,
        align: 'center' as const,
      },
    },
    {
      element: '[data-tour="filter-button"]',
      popover: {
        title: 'Filter Listings',
        description: 'Customize your search by BHK, rent range, furnishing, and more.',
        side: 'right' as const,
        align: 'start' as const,
      },
    },
    {
      element: '[data-tour="area-stats-button"]',
      popover: {
        title: 'Area Statistics',
        description: 'Get detailed stats for any area on the map. Select an area to see average rents by BHK.',
        side: 'right' as const,
        align: 'start' as const,
      },
    },
    {
      element: '[data-tour="add-property-button"]',
      popover: {
        title: 'Add Your Rental',
        description: 'Share a rental property from your area. Help your neighbors find great listings!',
        side: 'right' as const,
        align: 'start' as const,
      },
    },
  ] as TourStep[],

  listing: [
    {
      element: '[data-tour="listing-title"]',
      popover: {
        title: 'Rental Details',
        description: 'View comprehensive information about this property including BHK, furnishing, and amenities.',
        side: 'bottom' as const,
        align: 'center' as const,
      },
    },
    {
      element: '[data-tour="listing-images"]',
      popover: {
        title: 'Property Images',
        description: 'Browse high-quality photos of the property. Scroll to see more images.',
        side: 'bottom' as const,
        align: 'center' as const,
      },
    },
    {
      element: '[data-tour="listing-action-panel"]',
      popover: {
        title: 'Share & Contact',
        description: 'Copy the listing link or share it directly on WhatsApp to your friends.',
        side: 'left' as const,
        align: 'start' as const,
      },
    },
  ] as TourStep[],

  landing: [
    {
      element: '[data-tour="hero-section"]',
      popover: {
        title: 'Welcome to indian.rent',
        description: 'Find verified rental properties directly without broker fees. Real rents from real people.',
        side: 'bottom' as const,
        align: 'center' as const,
      },
    },
    {
      element: '[data-tour="explore-button"]',
      popover: {
        title: 'Start Exploring',
        description: 'Head to the map to browse thousands of rental listings in your area.',
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
      nextBtnText: 'Next',
      prevBtnText: 'Previous',
    });

    driverRef.current = driverInstance;

    // Start tour if tourName is provided
    if (tourName && tourName in TOURS) {
      // Delay to ensure DOM is ready
      const timer = setTimeout(() => {
        if (driverRef.current) {
          const steps = TOURS[tourName];
          // Drive through the tour starting from step 0
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

  const startTour = (name: keyof typeof TOURS) => {
    if (!isEnabledRef.current || !driverRef.current) return;
    driverRef.current.setSteps(TOURS[name]);
    driverRef.current.drive(0);
  };

  const stopTour = () => {
    if (driverRef.current) {
      driverRef.current.destroy();
    }
  };

  return {
    startTour,
    stopTour,
    isEnabled: isEnabledRef.current,
  };
}
