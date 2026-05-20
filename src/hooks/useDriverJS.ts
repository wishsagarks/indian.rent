'use client';

import React, { useEffect, useRef, useCallback, useState } from 'react';
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
  device?: 'desktop' | 'mobile' | 'both'; // New: specify which devices show this step
}

const TOURS = {
  explore: [
    {
      element: '#map-container',
      popover: {
        title: '🏠 Welcome to indian.rent Map',
        description: 'You\'re viewing a live rental map of your city. Every orange pin = a rental property with real rent from real landlords. No brokers, 100% transparent. Let\'s explore together!',
        side: 'top' as const,
        align: 'center' as const,
      },
      device: 'both',
    },
    {
      element: '#map-container',
      popover: {
        title: '📍 Understanding the Pins',
        description: 'Orange pins = Available rentals. Stacked pins (with +X) = Multiple properties in same building. Blue/green pins = Different property types (gated, PG, etc). Click any pin to see full details!',
        side: 'top' as const,
        align: 'center' as const,
      },
      device: 'both',
    },
    {
      element: '#map-container',
      popover: {
        title: '🔍 How to Explore',
        description: 'Zoom in (scroll up) to see detailed listings. Zoom out (scroll down) to see clustered areas. Pan by clicking and dragging. Pro tip: Zoom into your favorite neighborhoods to see what\'s available!',
        side: 'top' as const,
        align: 'center' as const,
      },
      device: 'both',
    },
    {
      element: '[data-tour="search-button"]',
      popover: {
        title: '🔎 Quick Search',
        description: 'Know the area you want? Click this and type the locality name (e.g., "Indiranagar", "Whitefield"). Map auto-zooms to that area. Saves you scrolling time!',
        side: 'right' as const,
        align: 'start' as const,
      },
      device: 'both',
    },
    {
      element: '[data-tour="filter-button"]',
      popover: {
        title: '🎯 Smart Filters',
        description: 'Set your preferences: BHK type (1-5), max rent budget, furnishing (unfurnished/semi/full), property type. All results update instantly. Your filters are saved!',
        side: 'right' as const,
        align: 'start' as const,
      },
      device: 'both',
    },
    {
      element: '[data-tour="locate-button"]',
      popover: {
        title: '📍 Find Your Location (GPS)',
        description: 'Click the compass/navigation button to auto-locate yourself on the map. Gets your exact position and shows nearby listings. Permission required. Very helpful when apartment hunting!',
        side: 'right' as const,
        align: 'start' as const,
      },
      device: 'desktop',
    },
    {
      element: '[data-tour="metro-button"]',
      popover: {
        title: '🚇 Metro/Transit Overlay',
        description: 'Toggle to see metro lines, bus routes, and transit hubs on the map. Looking near public transit? Enable this to visualize commute options!',
        side: 'right' as const,
        align: 'start' as const,
      },
      device: 'desktop',
    },
    {
      element: '[data-tour="metro-button-mobile"]',
      popover: {
        title: '🚇 Metro/Transit Overlay',
        description: 'Toggle to see metro lines, bus routes, and transit hubs on the map. Looking near public transit? Enable this to visualize commute options!',
        side: 'top' as const,
        align: 'center' as const,
      },
      device: 'mobile',
    },
    {
      element: '[data-tour="area-stats-button"]',
      popover: {
        title: '📊 Area Market Intelligence',
        description: 'Click any area on map to see live stats: listing count, average rent by BHK, demand level. Understand market rates before looking at individual properties!',
        side: 'right' as const,
        align: 'start' as const,
      },
      device: 'desktop',
    },
    {
      element: '[data-tour="area-stats-button-mobile"]',
      popover: {
        title: '📊 Area Market Intelligence',
        description: 'Click any area on map to see live stats: listing count, average rent by BHK, demand level. Understand market rates before looking at individual properties!',
        side: 'top' as const,
        align: 'center' as const,
      },
      device: 'mobile',
    },
    {
      element: '[data-tour="legend-button"]',
      popover: {
        title: '🗺️ Map Legend',
        description: 'View the color-coded guide to all pin types: Gated, Semi-Gated, Standalone, PG, Hostel, Your pins, Multiple listings, and Stale pins. Helps you understand what each marker means!',
        side: 'bottom' as const,
        align: 'center' as const,
      },
      device: 'desktop',
    },
    {
      element: '[data-tour="add-property-button-desktop"]',
      popover: {
        title: '➕ Add Your Rental Listing',
        description: 'Know about a rental property? Click the big + button to select location and add details. Help your community find honest rents!',
        side: 'left' as const,
        align: 'center' as const,
      },
      device: 'desktop',
    },
    {
      element: '[data-tour="add-property-button"]',
      popover: {
        title: '➕ Add Your Rental Listing',
        description: 'Know about a rental property? Tap the big + button to select location and add details. Help your community find honest rents!',
        side: 'top' as const,
        align: 'center' as const,
      },
      device: 'mobile',
    },
    {
      element: '[data-tour="analytics-button"]',
      popover: {
        title: '📈 Market Analytics Dashboard',
        description: 'Click the animated analytics button (desktop only, right sidebar) to view deep market insights: supply/demand trends, price distributions, market segmentation, and seeker demand heatmaps!',
        side: 'left' as const,
        align: 'center' as const,
      },
      device: 'desktop',
    },
    {
      element: '[data-tour="live-stats-button-mobile"]',
      popover: {
        title: '📊 Live Stats (Mobile)',
        description: 'Tap Live Stats to see real-time activity: active seekers, recent listings, market velocity. Understand market heat at a glance!',
        side: 'top' as const,
        align: 'center' as const,
      },
      device: 'mobile',
    },
    {
      element: '[data-tour="alerts-button-mobile"]',
      popover: {
        title: '🔔 Setup Notifications (Mobile)',
        description: 'Tap Alerts to get notified when new listings appear in your preferred area. Never miss a listing again!',
        side: 'top' as const,
        align: 'center' as const,
      },
      device: 'mobile',
    },
    {
      element: '[data-tour="search-button"]',
      popover: {
        title: '💡 Pro Tips for Better Results',
        description: 'Tip 1: Search locality → Apply filters → Browse pins. Tip 2: Zoom close to see street names. Tip 3: Click pins multiple times to view more details. Tip 4: Share listings via WhatsApp!',
        side: 'right' as const,
        align: 'start' as const,
      },
      device: 'both',
    },
    {
      element: '#map-container',
      popover: {
        title: '🎉 You\'re Ready to Find Your Home!',
        description: 'You know the map like a pro now. Start by searching your area, applying filters, clicking pins to explore, and using GPS to find nearby listings. Click ? button to restart tour anytime. Happy hunting! 🏡',
        side: 'top' as const,
        align: 'center' as const,
      },
      device: 'both',
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
      device: 'both',
    },
    {
      element: '[data-tour="listing-images"]',
      popover: {
        title: '📸 Photo Gallery',
        description: 'Browse high-quality photos. Scroll to see all angles of the property.',
        side: 'bottom' as const,
        align: 'center' as const,
      },
      device: 'both',
    },
    {
      element: '[data-tour="listing-action-panel"]',
      popover: {
        title: '💬 Share & Connect',
        description: 'Copy link or share on WhatsApp. Contact the landlord directly — no brokers!',
        side: 'left' as const,
        align: 'start' as const,
      },
      device: 'both',
    },
  ] as TourStep[],

  landing: [
    {
      element: '[data-tour="hero-section"]',
      popover: {
        title: '🏠 Welcome to indian.rent',
        description: 'Find verified rental properties directly. Real rents from real people. Zero broker fees.',
        side: 'top' as const,
        align: 'center' as const,
      },
      device: 'both',
    },
    {
      element: '[data-tour="explore-button"]',
      popover: {
        title: '🚀 Explore Now',
        description: 'Jump to the map and start browsing thousands of live rental listings in your city!',
        side: 'bottom' as const,
        align: 'center' as const,
      },
      device: 'both',
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
      device: 'both',
    },
    {
      element: '[data-tour="city-selector"]',
      popover: {
        title: '🏙️ Compare Cities',
        description: 'Switch between Bengaluru, Hyderabad, and more to compare markets.',
        side: 'bottom' as const,
        align: 'center' as const,
      },
      device: 'both',
    },
  ] as TourStep[],
};

export function useDriverJS(tourName: keyof typeof TOURS | null = null) {
  const driverRef = useRef<ReturnType<typeof driver> | null>(null);
  const isEnabledRef = useRef(false);
  const isMobileRef = useRef(typeof window !== 'undefined' && window.innerWidth < 1024);
  const [isMobile, setIsMobile] = useState(isMobileRef.current);

  // Filter tour steps based on device size
  const filterStepsByDevice = (steps: TourStep[], isMobileDevice: boolean) => {
    return steps.filter(step => {
      // If no device restriction, always show
      if (!step.device || step.device === 'both') return true;

      // Show only if device matches
      if (isMobileDevice && step.device === 'mobile') return true;
      if (!isMobileDevice && step.device === 'desktop') return true;

      return false;
    });
  };

  // Detect viewport size on mount and on resize
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkMobile = () => {
      const newIsMobile = window.innerWidth < 1024;
      isMobileRef.current = newIsMobile;
      setIsMobile(newIsMobile);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
      allowKeyboardControl: true,
      doneBtnText: 'Done',
      nextBtnText: 'Next →',
      prevBtnText: '← Previous',
      overlayOpacity: 0.6,
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
          // Filter steps based on current device size (use ref for synchronous value)
          const filteredSteps = filterStepsByDevice(steps, isMobileRef.current);
          driverRef.current.setSteps(filteredSteps);
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
    const steps = TOURS[name];
    // Filter steps based on current device size
    const filteredSteps = filterStepsByDevice(steps, isMobileRef.current);
    driverRef.current.setSteps(filteredSteps);
    driverRef.current.drive(0);
  }, [filterStepsByDevice]);

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
