'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Map as MapboxMap, NavigationControl as MapboxNavigationControl, Marker as MapboxMarker } from 'react-map-gl';
import { APIProvider, Map as GoogleMap, AdvancedMarker } from '@vis.gl/react-google-maps';
import { motion, AnimatePresence } from 'framer-motion';
import 'mapbox-gl/dist/mapbox-gl.css';
import useSupercluster from 'use-supercluster';
import { reverseGeocode } from '@/app/actions/map-actions';
import AddPropertyForm from './AddPropertyForm';
import FilterPanel, { MapFilters, DEFAULT_FILTERS } from './FilterPanel';
import MetroOverlay from './MetroOverlay';
import CircleAreaSelector from './CircleAreaSelector';
import LiveStatsPanel from './LiveStatsPanel';
import ConsentSplash from './ConsentSplash';
import ShareButtons from '@/components/ShareButtons';
import Link from 'next/link';
import { Plus, RefreshCcw, Search, MapPin as MapPinIcon, Heart, Link as LinkIcon, Award, X, Settings, Crosshair, Navigation, SlidersHorizontal, Train, BarChart3, Users, Share2, Trash2, Bell, Menu, LayoutDashboard, Info, Landmark, Shield, ShieldAlert, Building2, Home, Hotel, AlertCircle, MessageCircle } from 'lucide-react';
import UnifiedMenu from '@/components/UnifiedMenu';
import ThemeToggle from '@/components/ThemeToggle';
import { TourHelpButton } from '@/components/TourHelpButton';
import { getMapIntel, deployNode, searchLocalities, deleteOwnPin, subscribeToArea, trackApiUsage, getSeekerPins } from '@/app/actions/map-actions';
import { createClient } from '@/utils/supabase/client';
import { getIpHash } from '@/utils/ip-hash';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useTheme } from '@/hooks/useTheme';
import { PlaceAutocomplete } from './PlaceAutocomplete';
import { useDriverJS } from '@/hooks/useDriverJS';

type PlaceResult = {
  geometry?: {
    location?: {
      lat: () => number;
      lng: () => number;
    };
  };
  name?: string;
  formatted_address?: string;
};

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const MAP_PROVIDER = process.env.NEXT_PUBLIC_MAP_PROVIDER || 'mapbox';

function relativeDate(iso?: string): string {
  if (!iso) return '';
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}


export default function RefinedMapEngine() {
  const { theme } = useTheme();
  const shouldShowTour = typeof window !== 'undefined' && !localStorage.getItem('indian_rent_toured');
  useDriverJS(shouldShowTour ? 'explore' : null);
  const [mapReady, setMapReady] = useState(false);
  const [consented, setConsented] = useState(false);
  const [points, setPoints] = useState<any[]>([]);
  const [seekerPins, setSeekerPins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [isAddingProperty, setIsAddingProperty] = useState(false);
  const [isSubmittingProperty, setIsSubmittingProperty] = useState(false);
  const [showBrowseSearch, setShowBrowseSearch] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<MapFilters>(() => {
    if (typeof window === 'undefined') return DEFAULT_FILTERS;
    const savedBhk = localStorage.getItem('ir_filter_bhk');
    const savedMaxRent = localStorage.getItem('ir_filter_maxrent');
    if (!savedBhk && !savedMaxRent) return DEFAULT_FILTERS;
    return {
      ...DEFAULT_FILTERS,
      ...(savedBhk && { bhk: savedBhk }),
      ...(savedMaxRent && { rentMax: savedMaxRent })
    };
  });
  const [showMetro, setShowMetro] = useState(false);
  const [showAreaStats, setShowAreaStats] = useState(false);
  const [areaStatsCenter, setAreaStatsCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [showLiveStats, setShowLiveStats] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [newlyCreatedFlatId, setNewlyCreatedFlatId] = useState<string | null>(null);
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState('');
  const [notifyRadius, setNotifyRadius] = useState(5);
  const [notifySubmitting, setNotifySubmitting] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [geoStatus, setGeoStatus] = useState<string>('');
  const [googleBounds, setGoogleBounds] = useState<[number, number, number, number]>([-180, -85, 180, 85]);
  const [showLegend, setShowLegend] = useState(true);
  const [legendPopCount, setLegendPopCount] = useState(0);
  const [legendManual, setLegendManual] = useState(false);
  const [streetViewFailed, setStreetViewFailed] = useState(false);
  const [selectedCity, setSelectedCity] = useState<'bengaluru' | 'hyderabad' | 'bhubaneswar' | 'cuttack'>(() => {
    if (typeof window === 'undefined') return 'hyderabad';
    const saved = localStorage.getItem('ir_city');
    const validCities: ('bengaluru' | 'hyderabad' | 'bhubaneswar' | 'cuttack')[] = ['bengaluru', 'hyderabad', 'bhubaneswar', 'cuttack'];
    const city = saved as any;
    return validCities.includes(city) ? city : 'hyderabad';
  });
  const geocodeCacheRef = useRef<Map<string, string>>(new Map());
  const [mapToast, setMapToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Mark tour as completed on first visit
  useEffect(() => {
    if (shouldShowTour) {
      localStorage.setItem('indian_rent_toured', 'true');
    }
  }, [shouldShowTour]);

  // Auto-dismiss toast after 3 seconds
  useEffect(() => {
    if (mapToast) {
      const timer = setTimeout(() => setMapToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [mapToast]);

  // Persist city selection to localStorage; ensure city selector stays in sync with map
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ir_city', selectedCity);
    }
  }, [selectedCity]);

  // Reset to hyderabad on first visit if no valid city in localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && shouldShowTour) {
      localStorage.removeItem('ir_city');
      setSelectedCity('hyderabad');
    }
  }, [shouldShowTour]);

  // Persist filters to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (filters.bhk && filters.bhk !== DEFAULT_FILTERS.bhk) {
        localStorage.setItem('ir_filter_bhk', filters.bhk);
      } else {
        localStorage.removeItem('ir_filter_bhk');
      }
      if (filters.rentMax && filters.rentMax !== DEFAULT_FILTERS.rentMax) {
        localStorage.setItem('ir_filter_maxrent', filters.rentMax);
      } else {
        localStorage.removeItem('ir_filter_maxrent');
      }
    }
  }, [filters]);

  const { getPosition, loading: geolocating } = useGeolocation();

  const mapRef = useRef<any>(null);

  // City coordinates and zoom levels - EXTENDED TO 4 CITIES
  const cityConfig = {
    bengaluru: {
      latitude: 12.9716,
      longitude: 77.5946,
      zoom: 11,
      pitch: 0,
      bounds: [[76.8, 12.4], [78.3, 13.4]]
    },
    hyderabad: {
      latitude: 17.3850,
      longitude: 78.4867,
      zoom: 11,
      pitch: 0,
      bounds: [[77.8, 16.9], [79.2, 17.9]]
    },
    bhubaneswar: {
      latitude: 20.2961,
      longitude: 85.8245,
      zoom: 11,
      pitch: 0,
      bounds: [[85.5, 19.95], [86.2, 20.65]]
    },
    cuttack: {
      latitude: 20.4625,
      longitude: 85.8830,
      zoom: 11,
      pitch: 0,
      bounds: [[85.65, 20.15], [86.1, 20.75]]
    }
  };

  const [viewState, setViewState] = useState({
    longitude: cityConfig.hyderabad.longitude,
    latitude: cityConfig.hyderabad.latitude,
    zoom: cityConfig.hyderabad.zoom,
    pitch: 0
  });

  // Handle city selection with data refresh
  const handleCityChange = useCallback((city: 'bengaluru' | 'hyderabad' | 'bhubaneswar' | 'cuttack') => {
    setSelectedCity(city);
    const config = cityConfig[city];
    setViewState({
      longitude: config.longitude,
      latitude: config.latitude,
      zoom: config.zoom,
      pitch: config.pitch
    });
  }, []);

  const reverseGeocodeLocation = useCallback(async (lat: number, lng: number): Promise<string> => {
    const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
    if (geocodeCacheRef.current.has(cacheKey)) return geocodeCacheRef.current.get(cacheKey)!;

    try {
      const address = await reverseGeocode(lat, lng);
      if (address) {
        geocodeCacheRef.current.set(cacheKey, address);
        // Bound cache at 200 entries (LRU-lite: delete first entry if over limit)
        if (geocodeCacheRef.current.size > 200) {
          const firstKey = geocodeCacheRef.current.keys().next().value as string;
          if (firstKey) geocodeCacheRef.current.delete(firstKey);
        }
        return address;
      }
    } catch (err) {
      console.warn('Reverse geocoding failed:', err);
    }

    return `Property at ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }, []);

  const ipHash = typeof window !== 'undefined' ? getIpHash() : '';

  const mapId = theme === 'dark' ? 'TACTICAL_HUD_MAP' : 'LIGHT_HUD_MAP';

  const processIntelData = useCallback((data: any[]) => {
    try {
      if (data && Array.isArray(data) && data.length > 0) {
        const featurePoints = data.map((b: any, idx: number) => {
          if (!b || !b.location || !b.location.coordinates || !Array.isArray(b.location.coordinates)) return null;
          
          const allFlats: any[] = [];
          try {
            b.floors?.forEach((f: any) => {
              f.flats?.forEach((fl: any) => {
                allFlats.push({
                  ...fl,
                  floorNumber: f.floor_number,
                  buildingId: b.id,
                  buildingName: b.name,
                  category: b.category,
                  address: b.address,
                  city: b.city
                });
              });
            });
          } catch (e) {
            console.error('Error processing floors/flats for building:', b.id, e);
          }

          const isEmpty = allFlats.length === 0;

          return {
            type: "Feature",
            properties: {
              cluster: false,
              propertyId: b.id || `building-${idx}`,
              category: b.category || 'standalone',
              name: b.name || 'Unknown Building',
              allFlats: allFlats,
              isEmpty: isEmpty,
              // Initial values
              rent: isEmpty ? 'NODE' : `₹${allFlats[0]?.rent_amount?.toLocaleString() || '0'}`,
              rentNum: isEmpty ? 0 : (allFlats[0]?.rent_amount || 0),
              bhk: isEmpty ? null : (allFlats[0]?.bhk || null),
              furnishing: isEmpty ? null : (allFlats[0]?.furnishing || null),
              flatmateNeeded: !isEmpty && allFlats.some(f => f.flatmate_needed),
              ipHash: b.ip_hash || (isEmpty ? '' : allFlats[0]?.ip_hash) || '',
              updatedAt: b.updated_at || (isEmpty ? null : allFlats[0]?.updated_at),
              image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=800&auto=format&fit=crop',
              user: { name: 'User', image: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop' }
            },
            geometry: { 
              type: "Point", 
              coordinates: [
                parseFloat(b.location.coordinates[0]) || 0, 
                parseFloat(b.location.coordinates[1]) || 0
              ] 
            }
          };
        }).filter(Boolean);
        setPoints(featurePoints);
      } else {
        setPoints([]);
      }
    } catch (err) {
      console.error('Critical failure in processIntelData:', err);
    }
  }, []);

  const fetchIntel = useCallback(async () => {
    setLoading(true);
    try {
      const [data, seekers] = await Promise.all([getMapIntel(), getSeekerPins()]);
      processIntelData(data);
      setSeekerPins(seekers);
    } catch (err) {
      console.error('Intel Fetch Failed:', err);
    } finally {
      setLoading(false);
    }
  }, [processIntelData, selectedCity]);

  useEffect(() => {
    if (consented) {
      fetchIntel();
      // Track API usage for quota monitoring
      const mapProvider = MAP_PROVIDER === 'google' ? 'google_maps' : 'mapbox';
      trackApiUsage(mapProvider as any).catch(() => {});
    }
  }, [fetchIntel, consented]);

  // Reset map bounds when city changes to ensure proper clustering
  useEffect(() => {
    const config = cityConfig[selectedCity];
    setGoogleBounds([config.bounds[0][0], config.bounds[0][1], config.bounds[1][0], config.bounds[1][1]]);
    // Sync map center to selected city
    setViewState({
      longitude: config.longitude,
      latitude: config.latitude,
      zoom: config.zoom,
      pitch: config.pitch
    });
  }, [selectedCity]);

  // Keepalive: Wake DB on mount to avoid cold-start hangs
  useEffect(() => {
    const wakeDatabase = async () => {
      try {
        const supabase = createClient();
        await supabase.from('buildings').select('id').limit(1);
      } catch (e) {
        // Expected failure during idle periods
      }
    };
    wakeDatabase();
  }, []);

  // Legend auto-pop and close effect
  useEffect(() => {
    if (!showLegend || legendManual) {
      if (!showLegend) setLegendPopCount(0);
      return;
    }

    let popInterval: NodeJS.Timeout;
    let closeTimeout: NodeJS.Timeout;

    // Start popping animation 4 times
    let popCount = 0;
    popInterval = setInterval(() => {
      popCount++;
      setLegendPopCount(popCount);
      if (popCount >= 4) {
        clearInterval(popInterval);
        // Close after last pop animation completes (500ms)
        closeTimeout = setTimeout(() => {
          if (!legendManual) {
            setShowLegend(false);
            setLegendPopCount(0);
          }
        }, 500);
      }
    }, 800); // Slightly slower pop for better visibility

    return () => {
      clearInterval(popInterval);
      clearTimeout(closeTimeout);
    };
  }, [showLegend, legendManual]);

  useEffect(() => {
    if (!consented || typeof window === 'undefined') return;

    // Skip real-time in insecure contexts (development with HTTP)
    if (window.location.protocol !== 'https:' && process.env.NODE_ENV === 'development') {
      return;
    }

    const supabase = createClient();
    try {
      const channel = supabase.channel('map-snapshot-changes').on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'map_snapshot', filter: 'id=eq.1' }, (payload: any) => {
        if (payload.new && (payload.new as any).data) processIntelData((payload.new as any).data);
      }).subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          // Fall back to REST polling if WebSocket fails
        }
      });
      return () => { supabase.removeChannel(channel); };
    } catch (error) {
      // Continue without realtime if subscription fails
      return () => {};
    }
  }, [processIntelData, consented]);

  // Reverse geocode building names when needed
  useEffect(() => {
    if (selectedProperty && (selectedProperty.name.startsWith('Property at') || !selectedProperty.name)) {
      reverseGeocodeLocation(selectedProperty.lat, selectedProperty.lng).then(name => {
        setSelectedProperty((prev: any) => prev ? { ...prev, name } : null);
      });
    }
  }, [selectedProperty?.id, reverseGeocodeLocation]);

  // Apply filters
  const filteredPoints = useMemo(() => {
    return points.map(p => {
      const props = { ...p.properties };
      const flats = props.allFlats || [];
      const isEmptyNode = props.isEmpty;

      // Filter by selected city
      // If city field is missing, infer from building location based on proximity to city centers
      let buildingCity = typeof props.city === 'string' ? props.city.toLowerCase() : null;

      // If no city data, try to infer from coordinates
      if (!buildingCity && p.geometry?.coordinates) {
        const [lng, lat] = p.geometry.coordinates;
        const cities = {
          bengaluru: { lat: 12.9716, lng: 77.5946 },
          hyderabad: { lat: 17.3850, lng: 78.4867 },
          bhubaneswar: { lat: 20.2961, lng: 85.8245 },
          cuttack: { lat: 20.4625, lng: 85.8830 }
        };

        let closestCity = 'hyderabad';
        let closestDist = Infinity;

        Object.entries(cities).forEach(([city, center]) => {
          const latDiff = Math.abs(lat - center.lat);
          const lngDiff = Math.abs(lng - center.lng);
          const dist = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
          if (dist < closestDist) {
            closestDist = dist;
            closestCity = city;
          }
        });

        buildingCity = closestDist < 5 ? closestCity : null;
      }

      if (buildingCity && buildingCity !== selectedCity) return null;

      const matchedFlats = flats.filter((f: any) => {
        if (filters.bhk !== 'any') {
          const bhkVal = filters.bhk === '4+' ? 4 : parseInt(filters.bhk);
          if (filters.bhk === '4+') { if (f.bhk && f.bhk < 4) return false; }
          else { if (f.bhk && f.bhk !== bhkVal) return false; }
        }
        if (filters.rentMin && f.rent_amount && f.rent_amount < parseInt(filters.rentMin)) return false;
        if (filters.rentMax && f.rent_amount && f.rent_amount > parseInt(filters.rentMax)) return false;
        if (filters.furnishing !== 'any' && f.furnishing && f.furnishing !== filters.furnishing) return false;
        if (filters.category !== 'any') {
          if (filters.category === 'gated' && props.category !== 'gated') return false;
          if (filters.category === 'standalone' && (props.category === 'gated' || props.category === 'pg' || props.category === 'hostel')) return false;
          if (filters.category === 'pg' && props.category !== 'pg') return false;
          if (filters.category === 'hostel' && props.category !== 'hostel') return false;
        }
        if (filters.flatmateNeeded && !f.flatmate_needed) return false;
        if (filters.tenantPreference !== 'any' && f.tenant_preference !== filters.tenantPreference && f.tenant_preference !== 'any') return false;
        if (filters.petsAllowed && !f.pets_allowed) return false;
        if (filters.postedWithin !== 'all' && f.updated_at) {
          const days = parseInt(filters.postedWithin);
          const diff = (Date.now() - new Date(f.updated_at).getTime()) / (1000 * 60 * 60 * 24);
          if (diff > days) return false;
        }
        return true;
      });

      // Show if it has matched flats, OR if it's an empty node and we are in adding mode
      if (matchedFlats.length === 0 && (!isEmptyNode || !isAddingProperty)) return null;

      matchedFlats.sort((a: any, b: any) => a.rent_amount - b.rent_amount);
      
      const isActuallyEmpty = matchedFlats.length === 0;

      return {
        ...p,
        properties: {
          ...props,
          matchedFlats,
          isActuallyEmpty,
          isStacked: matchedFlats.length > 1,
          flatCount: matchedFlats.length,
          rent: isActuallyEmpty ? 'GRID' : (matchedFlats.length > 1 
            ? `₹${(matchedFlats[0].rent_amount/1000).toFixed(0)}k+` 
            : `₹${matchedFlats[0].rent_amount.toLocaleString()}`),
          rentNum: isActuallyEmpty ? 0 : matchedFlats[0].rent_amount,
          bhk: isActuallyEmpty ? null : matchedFlats[0].bhk,
          flatmateNeeded: !isActuallyEmpty && matchedFlats.some((f: any) => f.flatmate_needed),
          updatedAt: isActuallyEmpty ? props.updatedAt : matchedFlats[0].updated_at
        }
      };
    }).filter(Boolean);
  }, [points, filters, isAddingProperty, selectedCity]);

  // For Mapbox, get bounds from ref; for Google Maps, use state (which is updated from onCameraChanged)
  const bounds: [number, number, number, number] = useMemo(() => {
    try {
      if (MAP_PROVIDER === 'mapbox' && mapRef.current) {
        const map = mapRef.current.getMap();
        if (map && map.getBounds) {
          return map.getBounds().toArray().flat() as [number, number, number, number];
        }
      }
    } catch (e) {
      console.error('Error getting Mapbox bounds:', e);
    }
    return googleBounds;
  }, [googleBounds, mapRef.current]);

  // Dynamic cluster radius based on zoom level - more clustered at lower zoom, less at higher zoom
  const clusterRadius = viewState.zoom > 16 ? 25 : viewState.zoom > 14 ? 40 : 60;
  const { clusters, supercluster } = useSupercluster({ points: filteredPoints, bounds, zoom: viewState.zoom, options: { radius: clusterRadius, maxZoom: 20 } });

  const handleLocateMe = async () => {
    try {
      // Check if geolocation is available
      if (!navigator.geolocation) {
        setGeoStatus('❌ Your browser does not support geolocation.');
        setTimeout(() => setGeoStatus(''), 5000);
        return;
      }

      // Show permission request message
      setGeoStatus('📍 Please allow location access in the browser permission dialog...');

      // Request position
      const pos = await getPosition();
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;

      setUserLocation({ lat, lng });

      // Calculate optimal zoom based on nearby clusters
      // Find all clusters within ~5km radius of user location
      const earthRadiusKm = 6371;
      const nearbyPoints = filteredPoints.filter(p => {
        if (!p.geometry || !p.geometry.coordinates) return false;
        const [pLng, pLat] = p.geometry.coordinates;
        const dLat = (pLat - lat) * Math.PI / 180;
        const dLng = (pLng - lng) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(lat * Math.PI / 180) * Math.cos(pLat * Math.PI / 180) *
                  Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = earthRadiusKm * c;
        return distance < 5;
      });

      // Determine optimal zoom level
      let optimalZoom = 16;
      if (nearbyPoints.length > 20) optimalZoom = 15;
      else if (nearbyPoints.length > 10) optimalZoom = 15.5;
      else if (nearbyPoints.length < 3) optimalZoom = 17;

      setViewState({ latitude: lat, longitude: lng, zoom: optimalZoom, pitch: 45 });

      // Show success
      setGeoStatus('✅ Your location found! You are here on the map.');
      setTimeout(() => setGeoStatus(''), 3000);
    } catch (err: any) {
      console.error('🚨 Geolocation error:', err);
      let message = '❌ Unable to get location';

      if (typeof err === 'string') {
        if (err.includes('permission')) {
          message = '📍 Location permission denied. To enable:\n1. Click location icon in browser address bar\n2. Select "Allow" for this site\n3. Refresh and try again';
        } else if (err.includes('unavailable')) {
          message = '⚠️ Location unavailable. Make sure GPS is enabled on your device.';
        } else if (err.includes('timeout')) {
          message = '⏱️ Request timed out. Check GPS/internet and try again.';
        } else if (err.includes('not supported')) {
          message = '❌ Your browser does not support geolocation.';
        }
      }

      setGeoStatus(message);
      setTimeout(() => setGeoStatus(''), 6000);
    }
  };

  const [addFormInitialData, setAddFormInitialData] = useState<{ buildingName?: string; address?: string; existingBuildingId?: string | null; category?: string } | null>(null);

  const handlePlaceSelect = (place: google.maps.places.PlaceResult) => {
    if (place.geometry?.location) {
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();

      if (showBrowseSearch) {
        setViewState({ ...viewState, latitude: lat, longitude: lng, zoom: 15 });
        setShowBrowseSearch(false);
      } else if (isAddingProperty) {
        setViewState({ ...viewState, latitude: lat, longitude: lng, zoom: 16 });
        setAddFormInitialData({
          buildingName: place.name,
          address: place.formatted_address
        });
      }
    }
  };

  const handleAddPropertySubmit = async (data: any) => {
    setIsSubmittingProperty(true);
    setLoading(true);
    try {
      console.log('=== FORM_SUBMISSION_INITIATED ===');
      console.log('FORM_DATA:', JSON.stringify(data, null, 2));
      console.log('LAT:', viewState.latitude, 'LNG:', viewState.longitude);

      const payload = { ...data, lat: viewState.latitude, lng: viewState.longitude, ipHash };
      console.log('FINAL_PAYLOAD:', JSON.stringify(payload, null, 2));

      const result = await deployNode(payload);
      console.log('DEPLOY_RESULT:', JSON.stringify(result, null, 2));

      if (result.error) {
        setMapToast({ message: result.error, type: 'error' });
      } else {
        setIsAddingProperty(false);
        setAddFormInitialData(null);
        setNewlyCreatedFlatId(result.flatId);
        setShowShareModal(true);
        fetchIntel();
      }
    } catch (err) {
      console.error('FORM_SUBMISSION_ERROR:', err);
      setMapToast({ message: 'Submission failed. Please try again.', type: 'error' });
    } finally {
      setIsSubmittingProperty(false);
      setLoading(false);
    }
  };

  const handleMapClick = (e: any) => {
    const lat = e.lngLat?.lat || e.detail?.latLng?.lat;
    const lng = e.lngLat?.lng || e.detail?.latLng?.lng;

    if (showAreaStats && lat && lng) {
      // Already showing area stats - just update center
      setAreaStatsCenter({ lat, lng });
    }
  };

  const handleDeletePin = async (flatId: string) => {
    if (!confirm('Delete this pin permanently?')) return;
    const result = await deleteOwnPin(flatId);
    if (result.error) setMapToast({ message: result.error, type: 'error' });
    else { setSelectedProperty(null); fetchIntel(); setMapToast({ message: 'Listing deleted!', type: 'success' }); }
  };

  const handleShare = () => {
    const text = `Found this: indian.rent — a live rent map of Hyderabad with real rents from real people. No brokers, no signup. Check it out: ${window.location.origin}/explore`;
    navigator.clipboard?.writeText(text);
    setShowShareModal(false);
  };

  const handleSubscribeToArea = async () => {
    if (!notifyEmail || !notifyEmail.includes('@')) { setMapToast({ message: 'Valid email required', type: 'error' }); return; }
    setNotifySubmitting(true);
    const result = await subscribeToArea(notifyEmail, viewState.latitude, viewState.longitude, notifyRadius);
    setNotifySubmitting(false);
    if (result.error) setMapToast({ message: result.error, type: 'error' });
    else { setMapToast({ message: 'Subscribed! You\'ll get email updates when new listings appear.', type: 'success' }); setShowNotifyModal(false); setNotifyEmail(''); }
  };

  const calculateDecay = (updatedAt: string) => {
    if (!updatedAt) return false;
    return (Date.now() - new Date(updatedAt).getTime()) > (1000 * 60 * 60 * 24 * 30 * 6);
  };

  const getMarkerColor = (category: string, pinIpHash: string) => {
    if (pinIpHash && pinIpHash === ipHash) return 'border-emerald-400';
    if (category === 'gated') return 'border-blue-400';
    if (category === 'pg') return 'border-violet-400';
    if (category === 'hostel') return 'border-amber-400';
    return 'border-orange-400';
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'gated':      return Shield;
      case 'semi-gated': return ShieldAlert;
      case 'standalone': return Building2;
      case 'pg':         return Home;
      case 'hostel':     return Hotel;
      default:           return Building2;
    }
  };

  const getCategoryColors = (category: string) => {
    switch (category) {
      case 'gated':      return 'from-blue-600 to-blue-900';
      case 'semi-gated': return 'from-cyan-600 to-blue-900';
      case 'standalone': return 'from-emerald-600 to-emerald-900';
      case 'pg':         return 'from-violet-600 to-violet-900';
      case 'hostel':     return 'from-orange-600 to-orange-900';
      default:           return 'from-primary to-blue-900';
    }
  };

  const getMarkerSizes = (zoom: number) => {
    let scale = 1;
    if (zoom < 12) scale = 0.7;
    else if (zoom < 13) scale = 0.85;
    else if (zoom < 14) scale = 0.95;
    else if (zoom < 15) scale = 1;
    else if (zoom < 16) scale = 1.1;
    else if (zoom < 17) scale = 1.25;
    else scale = 1.4;

    return {
      iconContainerSize: Math.round(28 * scale),
      iconSize: Math.round(14 * scale),
      textSize: Math.round(10 * scale),
      badgeSize: Math.round(6.5 * scale),
      gapPx: scale < 0.9 ? 4 : scale < 1.05 ? 6 : 8,
      scale
    };
  };

  const AliveMarker = ({ prop, onClick }: { prop: any; onClick: () => void }) => {
    const isStale = calculateDecay(prop.updatedAt);
    const isOwn = prop.ipHash && prop.ipHash === ipHash;
    const colorClass = getMarkerColor(prop.category, prop.ipHash);
    const isEmpty = prop.isActuallyEmpty;
    const sizes = getMarkerSizes(viewState.zoom);

    return (
      <motion.button whileHover={{ scale: 1.05 }} className={`group focus:outline-none ${isStale && !isEmpty ? 'grayscale opacity-60' : ''} ${isEmpty ? 'opacity-40' : ''}`} onClick={onClick} style={{ transform: `scale(${sizes.scale})`, transformOrigin: 'top center' }}>
        <div className="flex flex-col items-center">
          <div className={`flex items-center p-1 pr-2.5 bg-surface rounded-full border ${isEmpty ? 'border-white/20' : colorClass} shadow-2xl transition-all group-hover:shadow-primary/40 group-hover:-translate-y-1 relative`} style={{ gap: `${sizes.gapPx}px` }}>
            {prop.isStacked && (
              <div className="absolute -top-2 -right-1 bg-primary text-on-primary font-black px-1.5 py-0.5 rounded-full border border-white/20 shadow-lg z-10 animate-pulse" style={{ fontSize: `${sizes.badgeSize}px` }}>
                +{prop.flatCount - 1} FLATS
              </div>
            )}
            <div className={`rounded-full border-2 ${isEmpty ? 'border-white/10' : colorClass} flex items-center justify-center bg-background`} style={{ width: `${sizes.iconContainerSize}px`, height: `${sizes.iconContainerSize}px` }}>
              {(() => {
                const Icon = isEmpty ? Landmark : getCategoryIcon(prop.category);
                return <Icon size={sizes.iconSize} className={isEmpty ? 'text-white/20' : 'text-on-surface opacity-80'} />;
              })()}
            </div>
            <div className="flex flex-col text-left">
              <span className={`font-black leading-none font-technical ${isEmpty ? 'text-white/20' : 'text-on-surface'}`} style={{ fontSize: `${sizes.textSize}px` }}>{prop.rent}</span>
              {!isEmpty && (
                <div className="flex items-center gap-1 mt-0.5">
                  {prop.flatmateNeeded && <span className="bg-secondary/30 text-secondary px-1.5 py-0.5 rounded-md font-black shadow-[0_0_8px_rgba(47,248,1,0.4)] animate-pulse" style={{ fontSize: `${sizes.badgeSize}px` }}>FM★</span>}
                  {isOwn && <span className="bg-primary/20 text-primary px-1 rounded font-black" style={{ fontSize: `${sizes.badgeSize}px` }}>YOU</span>}
                  {!prop.flatmateNeeded && !isOwn && (
                    <>
                      <div className={`w-1 h-1 rounded-full ${isStale ? 'bg-gray-500' : 'bg-secondary animate-pulse'}`} />
                      <span className="uppercase font-black tracking-widest text-on-surface-variant opacity-40" style={{ fontSize: `${sizes.badgeSize}px` }}>{isStale ? 'Stale' : 'Live'}</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className={`w-px h-5 bg-gradient-to-b ${isEmpty ? 'from-white/10' : 'from-primary/50'} to-transparent`} />
        </div>
      </motion.button>
    );
  };

  if (!consented) {
    return <ConsentSplash onAccept={() => setConsented(true)} />;
  }

  if (MAP_PROVIDER === 'mapbox' && !MAPBOX_TOKEN) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-background text-on-surface p-8 text-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="skeuo-raised glass-plate rounded-lg p-12 max-w-md border border-white/10 shadow-2xl bg-surface/50">
          <h2 className="text-headline-lg font-black uppercase mb-6 tracking-tighter text-on-background">Satellite Link Offline</h2>
          <Link href="/" className="inline-block py-5 px-10 bg-primary text-on-primary rounded-DEFAULT font-black uppercase tracking-widest text-[10px]">Return to HQ</Link>
        </motion.div>
      </div>
    );
  }

  if (MAP_PROVIDER === 'google' && !GOOGLE_MAPS_API_KEY) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-background text-on-surface p-8 text-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="skeuo-raised glass-plate rounded-lg p-12 max-w-md border border-white/10 shadow-2xl bg-surface/50">
          <h2 className="text-headline-lg font-black uppercase mb-6 tracking-tighter text-on-background">Google Auth Offline</h2>
          <Link href="/" className="inline-block py-5 px-10 bg-primary text-on-primary rounded-DEFAULT font-black uppercase tracking-widest text-[10px]">Return to HQ</Link>
        </motion.div>
      </div>
    );
  }

  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY || ''} libraries={['places', 'marker']}>
      <div className="h-screen w-full overflow-hidden bg-background relative">
        {/* Map */}
        <div id="map-container" className="absolute inset-0 z-0 bg-background">
          {MAP_PROVIDER === 'mapbox' ? (
            <MapboxMap {...viewState} ref={mapRef} onMove={evt => setViewState(evt.viewState)} onClick={handleMapClick} style={{ width: '100%', height: '100%' }} mapStyle="mapbox://styles/mapbox/dark-v11" mapboxAccessToken={MAPBOX_TOKEN} maxBounds={cityConfig[selectedCity].bounds as any}>
              <MapboxNavigationControl position="top-right" />
              <MetroOverlay visible={showMetro} />


              {/* User Location Marker */}
              {userLocation && (
                <MapboxMarker longitude={userLocation.lng} latitude={userLocation.lat} anchor="center">
                  <div className="relative flex items-center justify-center">
                    {/* Outer pulse ring */}
                    <div className="absolute w-14 h-14 bg-blue-500/20 rounded-full animate-ping" />
                    {/* Middle ring */}
                    <div className="absolute w-8 h-8 bg-blue-500/30 rounded-full" />
                    {/* Core dot */}
                    <div className="w-5 h-5 bg-blue-500 border-3 border-white rounded-full shadow-lg relative z-10" />
                  </div>
                </MapboxMarker>
              )}

              {/* Listing Clusters & Markers */}
              {clusters.map((cluster: any) => {
                try {
                  const coordinates = cluster.geometry?.coordinates;
                  if (!coordinates || !Array.isArray(coordinates)) return null;
                  const [longitude, latitude] = coordinates;
                  const { cluster: isCluster, point_count: pointCount } = cluster.properties || {};
                  
                  if (isCluster) {
                    const size = Math.max(36, 28 + (pointCount || 0) * 1.5);
                    return (
                      <MapboxMarker key={`cluster-${cluster.id}`} longitude={longitude} latitude={latitude}>
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          className="flex flex-col items-center justify-center bg-surface border-2 border-primary text-primary rounded-full font-black text-xs cursor-pointer shadow-[0_0_25px_rgba(0,102,255,0.4)] hover:shadow-[0_0_35px_rgba(0,102,255,0.6)] transition-all active:scale-90"
                          style={{ width: size, height: size }}
                          onClick={() => {
                            try {
                              let z = supercluster.getClusterExpansionZoom(cluster.id);
                              // For small clusters (2-3 pins), ensure minimum zoom to ungroup
                              if ((cluster.properties?.point_count || 0) <= 3) {
                                z = Math.max(z, 16);
                              }
                              z = Math.min(z, 20);
                              setViewState({ ...viewState, longitude, latitude, zoom: z });
                            } catch (e) {
                              // Fallback: zoom in enough to separate pins
                              setViewState({ ...viewState, longitude, latitude, zoom: Math.min(viewState.zoom + 3, 18) });
                            }
                          }}
                        >
                          <span className="leading-none">{pointCount}</span>
                          <span className="text-[6px] opacity-60 font-black uppercase tracking-widest mt-0.5">pins</span>
                        </motion.div>
                      </MapboxMarker>
                    );
                  }

                  if (!cluster.properties?.propertyId) return null;

                  return (
                    <MapboxMarker 
                      key={`prop-${cluster.properties.propertyId}`} 
                      longitude={longitude} 
                      latitude={latitude} 
                      anchor="bottom"
                    >
                      <AliveMarker
                        prop={cluster.properties}
                        onClick={() => {
                          if (isAddingProperty) {
                            setAddFormInitialData({
                              existingBuildingId: cluster.properties.propertyId,
                              buildingName: cluster.properties.name,
                              category: cluster.properties.category
                            });
                          } else {
                            setSelectedProperty({ ...cluster.properties, id: cluster.properties.propertyId, lat: latitude, lng: longitude });
                            setStreetViewFailed(false);
                          }
                        }}
                      />
                    </MapboxMarker>
                  );
                } catch (e) {
                  console.error('Error rendering Mapbox cluster:', e);
                  return null;
                }
              })}
            </MapboxMap>
          ) : (
            <GoogleMap
              key={selectedCity}
              center={{ lat: viewState.latitude, lng: viewState.longitude }}
              zoom={viewState.zoom}
              mapId={mapId}
              disableDefaultUI={true}
              minZoom={3}
              maxZoom={18}
              onCameraChanged={(ev) => {
                if (ev.detail.center && typeof ev.detail.center.lat === 'number' && typeof ev.detail.center.lng === 'number') {
                  setViewState(prev => ({ ...prev, latitude: ev.detail.center.lat, longitude: ev.detail.center.lng, zoom: ev.detail.zoom }));
                }
              }}
              onTilesLoaded={() => setMapReady(true)}
              style={{ width: '100%', height: '100%' }}
            >
              {mapReady && Array.isArray(clusters) && clusters.map((cluster: any, clusterIdx: number) => {
                try {
                  const coordinates = cluster.geometry?.coordinates;
                  if (!coordinates || !Array.isArray(coordinates)) return null;
                  const [longitude, latitude] = coordinates;
                  const { cluster: isCluster, point_count: pointCount } = cluster.properties || {};
                  
                  if (isCluster) {
                    const size = Math.max(36, 28 + (pointCount || 0) * 1.5);
                    return (
                      <AdvancedMarker
                        key={`cluster-${cluster.id || clusterIdx}`}
                        position={{ lat: latitude, lng: longitude }}
                        onClick={() => {
                          try {
                            const expansionZoom = Math.min(supercluster.getClusterExpansionZoom(cluster.id), 20);
                            setViewState({ ...viewState, latitude, longitude, zoom: expansionZoom });
                          } catch (e) {
                            setViewState({ ...viewState, latitude, longitude, zoom: viewState.zoom + 2 });
                          }
                        }}
                      >
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          className="flex flex-col items-center justify-center bg-surface border-2 border-primary text-primary rounded-full font-black text-xs cursor-pointer shadow-[0_0_25px_rgba(0,102,255,0.4)] hover:shadow-[0_0_35px_rgba(0,102,255,0.6)] transition-all"
                          style={{ width: size, height: size }}
                        >
                          <span className="leading-none">{pointCount}</span>
                          <span className="text-[6px] opacity-60 font-black uppercase tracking-widest mt-0.5">pins</span>
                        </motion.div>
                      </AdvancedMarker>
                    );
                  }

                  if (!cluster.properties?.propertyId) return null;

                  // Zoom-aware rendering: compact at low zoom, full detail at high zoom
                  return (
                    <AdvancedMarker
                      key={`prop-${cluster.properties.propertyId}`}
                      position={{ lat: latitude, lng: longitude }}
                    >
                      {viewState.zoom >= 15.5 ? (
                        <AliveMarker
                          prop={cluster.properties}
                          onClick={() => {
                            if (isAddingProperty) {
                              setAddFormInitialData({
                                existingBuildingId: cluster.properties.propertyId,
                                buildingName: cluster.properties.name,
                                category: cluster.properties.category
                              });
                            } else {
                              setSelectedProperty({ ...cluster.properties, id: cluster.properties.propertyId, lat: latitude, lng: longitude });
                              setStreetViewFailed(false);
                            }
                          }}
                        />
                      ) : (
                        <motion.div
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          whileHover={{ scale: 1.1 }}
                          onClick={() => {
                            if (!isAddingProperty) setSelectedProperty({ ...cluster.properties, id: cluster.properties.propertyId, lat: latitude, lng: longitude });
                          }}
                          className={`px-2 py-1 rounded-full bg-surface border-2 text-[10px] font-black text-on-surface shadow-lg whitespace-nowrap cursor-pointer transition-all ${getMarkerColor(cluster.properties.category, cluster.properties.ipHash)}`}
                        >
                          {cluster.properties.isEmpty ? '·' : cluster.properties.rent}
                        </motion.div>
                      )}
                    </AdvancedMarker>
                  );
                } catch (e) {
                  console.error('Error rendering Google cluster:', e);
                  return null;
                }
              })}
              {/* User Location Marker */}
              {mapReady && userLocation && (
                <AdvancedMarker position={{ lat: userLocation.lat, lng: userLocation.lng }}>
                  <div className="relative flex items-center justify-center">
                    {/* Outer pulse ring */}
                    <div className="absolute w-14 h-14 bg-blue-500/20 rounded-full animate-ping" />
                    {/* Middle ring */}
                    <div className="absolute w-8 h-8 bg-blue-500/30 rounded-full" />
                    {/* Core dot */}
                    <div className="w-5 h-5 bg-blue-500 border-3 border-white rounded-full shadow-lg relative z-10" />
                  </div>
                </AdvancedMarker>
              )}
              {/* Seeker Pins for Google Maps */}
              {mapReady && seekerPins.map(sp => (
                <AdvancedMarker key={sp.id} position={{ lat: sp.latitude, lng: sp.longitude }}>
                  <div className="w-6 h-6 rounded-full bg-emerald-400/80 border-2 border-white flex items-center justify-center shadow-lg">
                    <Search size={10} className="text-white" />
                  </div>
                </AdvancedMarker>
              ))}
              {/* Metro Overlay for Google Maps */}
              <MetroOverlay visible={showMetro} />
            </GoogleMap>
          )}
        </div>

        {/* Area Stats Indicator */}
        {showAreaStats && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-primary text-background px-4 py-2 rounded-lg font-technical text-[10px] font-black uppercase tracking-widest shadow-xl">
            Click map to change area
          </div>
        )}


        {/* Target Reticle */}
        <AnimatePresence>
          {isAddingProperty && (
            <motion.div initial={{ opacity: 0, scale: 2 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 2 }} className="fixed inset-0 flex items-center justify-center z-10 pointer-events-none">
              <div className="relative">
                <Crosshair className="w-12 h-12 animate-pulse text-primary" strokeWidth={1} />
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-4 px-3 py-1 bg-primary text-background font-technical text-[9px] font-black uppercase tracking-widest rounded-sm whitespace-nowrap shadow-xl">
                  {`${viewState.latitude.toFixed(4)}, ${viewState.longitude.toFixed(4)}`}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top HUD */}
        {!isAddingProperty && (
          <header className="fixed top-0 w-full z-50 flex justify-center h-20 px-mobile md:px-desktop pointer-events-none pt-3 md:pt-4 font-technical">
            <div className="max-w-container w-full flex justify-between items-center pointer-events-auto h-14 md:h-16 bg-background backdrop-blur-xl rounded-full md:rounded-xl border border-primary/20 shadow-2xl px-3 md:px-6">
              <div className="flex items-center gap-2 md:gap-2 pl-1 md:pl-0">
                <UnifiedMenu />
                <div className="flex flex-col -gap-1 hidden md:flex">
                  <Link href="/" className="font-display text-base md:text-lg text-primary font-black tracking-tight cursor-pointer uppercase">indian.rent</Link>
                  <span className="text-[7px] uppercase tracking-[0.3em] text-primary/40 font-black hidden lg:block">by WishLabs</span>
                </div>
                {/* Mobile minimal text logo */}
                <Link href="/" className="md:hidden font-display text-xs text-primary font-black tracking-tight cursor-pointer uppercase">IR.</Link>
              </div>

              <div className="flex items-center gap-1 md:gap-2 pr-1 md:pr-0">
                {/* City Selector */}
                <select
                  value={selectedCity}
                  onChange={(e) => handleCityChange(e.target.value as 'bengaluru' | 'hyderabad' | 'bhubaneswar' | 'cuttack')}
                  title={selectedCity}
                  className="px-2 py-1 rounded-lg bg-surface/50 border border-white/10 text-on-surface font-technical text-[9px] md:text-[10px] font-bold focus:outline-none focus:border-primary/50 cursor-pointer hover:border-white/30 transition-all appearance-none"
                >
                  <option value="bengaluru">BLR</option>
                  <option value="hyderabad">HYD</option>
                  <option value="bhubaneswar">BBS</option>
                  <option value="cuttack">CTK</option>
                </select>

                <button onClick={() => setShowBrowseSearch(!showBrowseSearch)} data-tour="search-button" title="Search location" className={`p-1.5 rounded-full md:rounded-lg transition-all ${showBrowseSearch ? 'bg-primary/20 text-primary' : 'text-on-surface-variant hover:text-primary'}`}><Search size={15} /></button>
                <button onClick={() => setShowFilters(!showFilters)} data-tour="filter-button" className={`p-1.5 rounded-full md:rounded-lg transition-all ${showFilters ? 'bg-primary/20 text-primary' : 'text-on-surface-variant hover:text-primary'}`} title="Filters"><SlidersHorizontal size={15} /></button>
                <div className="hidden md:flex items-center gap-2">
                  <button onClick={() => setShowMetro(!showMetro)} data-tour="metro-button" className={`p-1.5 rounded-lg transition-all ${showMetro ? 'bg-primary/20 text-primary' : 'text-on-surface-variant hover:text-primary'}`} title="Metro"><Train size={14} /></button>
                  <button onClick={() => { setShowAreaStats(!showAreaStats); if (!showAreaStats && viewState) { setAreaStatsCenter({ lat: viewState.latitude, lng: viewState.longitude }); } }} data-tour="area-stats-button" className={`p-1.5 rounded-lg transition-all ${showAreaStats ? 'bg-primary/20 text-primary' : 'text-on-surface-variant hover:text-primary'}`} title="Area Stats"><BarChart3 size={14} /></button>
                  <button onClick={() => setShowLiveStats(!showLiveStats)} className={`p-1.5 rounded-lg transition-all ${showLiveStats ? 'bg-primary/20 text-primary' : 'text-on-surface-variant hover:text-primary'}`} title="Analytics"><BarChart3 size={14} /></button>
                  <button onClick={() => setShowNotifyModal(true)} className="p-1.5 rounded-lg transition-all text-on-surface-variant hover:text-primary" title="Notify"><Bell size={14} /></button>
                </div>
                <div className="w-px h-3 bg-white/10" />
                <button onClick={fetchIntel} className={`p-1.5 rounded-full md:rounded-lg text-primary transition-all active:rotate-180 ${loading ? 'animate-spin' : ''}`}><RefreshCcw size={15} strokeWidth={2.5} /></button>
                <div className="w-px h-3 bg-white/10" />
                <TourHelpButton tourName="explore" />
                <ThemeToggle />
              </div>
            </div>
          </header>
        )}

      {/* Loading Overlay */}
      <AnimatePresence>
        {loading && points.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/70 backdrop-blur-sm z-40 flex flex-col items-center justify-center"
          >
            <div className="bg-surface border border-white/10 rounded-lg p-8 text-center space-y-4 shadow-xl">
              <div className="w-12 h-12 rounded-full border-3 border-primary/30 border-t-primary animate-spin mx-auto" />
              <div>
                <h3 className="font-technical text-[10px] uppercase tracking-[0.3em] text-primary font-black mb-2">Initializing Map</h3>
                <p className="text-on-surface-variant text-sm">Loading property data from network...</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter Panel */}
      <AnimatePresence>
        {showFilters && <FilterPanel filters={filters} onChange={setFilters} onClose={() => setShowFilters(false)} />}
      </AnimatePresence>

      {/* Live Stats Panel */}
      <AnimatePresence>
        {showLiveStats && <LiveStatsPanel points={filteredPoints} onClose={() => setShowLiveStats(false)} />}
      </AnimatePresence>

      {/* Area Stats Modal */}
      <AnimatePresence>
        {showAreaStats && areaStatsCenter && <CircleAreaSelector center={areaStatsCenter} onClose={() => setShowAreaStats(false)} />}
      </AnimatePresence>

      {/* Browse Search Overlay */}
      <AnimatePresence>
        {showBrowseSearch && !isAddingProperty && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className="fixed top-12 md:top-6 left-1/2 z-[110] w-[calc(100%-2rem)] max-w-lg"
          >
            <div className="bg-background backdrop-blur-xl border border-primary/20 rounded-lg p-2 shadow-3xl">
              <PlaceAutocomplete onPlaceSelect={handlePlaceSelect} className="skeuo-concave" />
              <div className="mt-2 px-3 flex justify-between items-center">
                <span className="font-technical text-[8px] uppercase tracking-[0.3em] text-primary font-black">Search Locality</span>
                <button onClick={() => setShowBrowseSearch(false)} className="text-[8px] uppercase tracking-[0.3em] text-on-surface-variant hover:text-primary font-black">Close</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Property Sidebar / Bottom Sheet */}
      <AnimatePresence>
        {isAddingProperty && (
          <div className="fixed inset-0 z-[100] flex md:items-center items-end justify-start pointer-events-none">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setIsAddingProperty(false); setAddFormInitialData(null); }} className="absolute inset-0 bg-black/70 backdrop-blur-sm pointer-events-auto" />
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full md:w-[440px] h-[85vh] md:h-full bg-surface md:border-r border-t md:border-t-0 border-white/10 shadow-3xl pointer-events-auto flex flex-col rounded-t-3xl md:rounded-none overflow-hidden"
            >
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                <AddPropertyForm
                  onClose={() => { setIsAddingProperty(false); setAddFormInitialData(null); }}
                  onSubmit={handleAddPropertySubmit}
                  lat={viewState.latitude}
                  lng={viewState.longitude}
                  initialData={addFormInitialData}
                  isSubmitting={isSubmittingProperty}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Share Modal */}
      <AnimatePresence>
        {showShareModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[150] flex items-center justify-center">
            <div onClick={() => { setShowShareModal(false); setNewlyCreatedFlatId(null); if (newlyCreatedFlatId) window.location.href = `/flat/${newlyCreatedFlatId}`; }} className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="relative bg-surface border border-white/10 rounded-lg p-8 max-w-sm w-full mx-4 shadow-2xl text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPinIcon size={24} className="text-primary" />
              </div>
              <h3 className="text-xl font-black text-on-surface uppercase tracking-tighter mb-2">Pin Dropped!</h3>
              {newlyCreatedFlatId && <p className="text-on-surface-variant text-xs mb-4 font-technical">ID: {newlyCreatedFlatId.slice(0, 8)}</p>}
              <p className="text-on-surface-variant text-sm mb-6">Help others find honest rents — share this with your groups</p>
              <button
                onClick={() => {
                  const flatLink = newlyCreatedFlatId ? `${window.location.origin}/flat/${newlyCreatedFlatId}` : `${window.location.origin}/explore`;
                  const text = `Found this rent on indian.rent — real rents from real people, no brokers, no signup. Check it out: ${flatLink}`;
                  const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
                  window.open(url, '_blank');
                  setShowShareModal(false);
                  if (newlyCreatedFlatId) setTimeout(() => window.location.href = `/flat/${newlyCreatedFlatId}`, 500);
                }}
                className="w-full py-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-lg font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-2 mb-3 transition-all hover:bg-emerald-500/20"
              >
                <MessageCircle size={14} /> Share on WhatsApp
              </button>
              <button onClick={() => { handleShare(); if (newlyCreatedFlatId) setTimeout(() => window.location.href = `/flat/${newlyCreatedFlatId}`, 500); }} className="w-full py-3 bg-primary text-on-primary rounded-lg font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-2 mb-3">
                <Share2 size={14} /> Copy Share Message
              </button>
              <button onClick={() => { setShowShareModal(false); setNewlyCreatedFlatId(null); if (newlyCreatedFlatId) window.location.href = `/flat/${newlyCreatedFlatId}`; }} className="w-full py-3 bg-white/5 border border-white/10 rounded-lg font-black uppercase tracking-[0.2em] text-[10px] text-on-surface-variant">View Listing</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notify Modal */}
      <AnimatePresence>
        {showNotifyModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <div onClick={() => setShowNotifyModal(false)} className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="relative bg-surface border border-white/10 rounded-lg p-8 max-w-sm w-full shadow-2xl">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell size={24} className="text-primary" />
              </div>
              <h3 className="text-xl font-black text-on-surface uppercase tracking-tighter mb-2 text-center">Watch This Area</h3>
              <p className="text-on-surface-variant text-sm mb-6 text-center">Get emailed when new listings appear near this location</p>
              <div className="space-y-4">
                <div>
                  <label className="font-technical text-[9px] uppercase tracking-widest text-on-surface-variant font-black">Your Email</label>
                  <input
                    type="email"
                    value={notifyEmail}
                    onChange={e => setNotifyEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full mt-2 bg-surface-container-low border border-white/5 rounded-lg px-4 py-2.5 text-on-surface placeholder:text-on-surface-variant/30 focus:border-primary outline-none"
                  />
                </div>
                <div>
                  <label className="font-technical text-[9px] uppercase tracking-widest text-on-surface-variant font-black">Radius: {notifyRadius} km</label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={notifyRadius}
                    onChange={e => setNotifyRadius(Number(e.target.value))}
                    className="w-full mt-2"
                  />
                </div>
              </div>
              <button
                onClick={handleSubscribeToArea}
                disabled={notifySubmitting}
                className="w-full mt-6 py-3 bg-primary text-on-primary rounded-lg font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Bell size={14} /> {notifySubmitting ? 'Subscribing...' : 'Subscribe'}
              </button>
              <button onClick={() => setShowNotifyModal(false)} className="w-full mt-2 py-3 bg-white/5 border border-white/10 rounded-lg font-black uppercase tracking-[0.2em] text-[10px] text-on-surface-variant">Close</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State Message */}
      {filteredPoints.length === 0 && clusters.length === 0 && !isAddingProperty && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 bg-surface border border-white/10 rounded-lg p-8 text-center max-w-sm shadow-2xl"
        >
          {JSON.stringify(filters) !== JSON.stringify(DEFAULT_FILTERS) ? (
            <>
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="text-xl font-black uppercase tracking-tighter text-on-surface mb-2">No Results for Your Filters</h3>
              <p className="text-sm text-on-surface-variant mb-6">Try adjusting your search criteria or clearing filters to see all listings.</p>
              <button
                onClick={() => setFilters(DEFAULT_FILTERS)}
                className="w-full py-3 bg-primary text-on-primary rounded-lg font-black uppercase tracking-widest text-[11px] hover:scale-105 active:scale-95 transition-all shadow-lg"
              >
                Clear Filters
              </button>
            </>
          ) : (
            <>
              <div className="text-5xl mb-4">🏘️</div>
              <h3 className="text-xl font-black uppercase tracking-tighter text-on-surface mb-2">No Listings Yet</h3>
              <p className="text-sm text-on-surface-variant mb-6">Be the first to add a property in this area!</p>
              <button
                onClick={() => setIsAddingProperty(true)}
                className="w-full py-3 bg-primary text-on-primary rounded-lg font-black uppercase tracking-widest text-[11px] hover:scale-105 active:scale-95 transition-all shadow-lg"
              >
                + Add Property
              </button>
            </>
          )}
        </motion.div>
      )}

      {/* Map Legend */}
      <div className="fixed bottom-20 left-4 sm:left-16 z-50">
        <AnimatePresence>
          {showLegend && (
            <motion.div
              key="legend"
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{
                opacity: 1,
                y: 0,
                scale: legendPopCount > 0 ? [1, 1.1, 1] : 1
              }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: legendPopCount > 0 ? 0.4 : 0.3 }}
              className="mb-3 bg-surface border border-white/10 rounded-lg p-4 shadow-xl min-w-[220px]"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="font-technical text-[9px] uppercase tracking-[0.4em] text-primary font-black">
                  Map Legend {legendPopCount > 0 && <span className="text-[10px] text-primary ml-1 opacity-100 border-b border-primary/40">({legendPopCount}/4)</span>}
                </div>
                <button 
                  onClick={() => setShowLegend(false)}
                  className="p-1 text-on-surface-variant hover:text-primary transition-colors active:scale-90"
                  title="Close legend"
                >
                  <X size={14} />
                </button>
              </div>
              {[
                { label: 'Gated Society',   Icon: Shield,      color: 'text-blue-400',   border: 'border-blue-400'   },
                { label: 'Semi-Gated',      Icon: ShieldAlert, color: 'text-orange-400', border: 'border-orange-400' },
                { label: 'Standalone',      Icon: Building2,   color: 'text-orange-400', border: 'border-orange-400' },
                { label: 'PG / Guest House',Icon: Home,        color: 'text-violet-400', border: 'border-violet-400' },
                { label: 'Hostel',          Icon: Hotel,       color: 'text-amber-400',  border: 'border-amber-400'  },
                { label: 'Your Pin',        Icon: Building2,   color: 'text-emerald-400',border: 'border-emerald-400'},
                { label: 'Multiple Listings',Icon: Users,      color: 'text-cyan-400',   border: 'border-cyan-400'   },
                { label: 'May Be Stale',    Icon: AlertCircle, color: 'text-white/40',  border: 'border-white/20'   },
              ].map(({ label, Icon, color, border }) => (
                <div key={label} className="flex items-center gap-3 py-1.5">
                  <div className={`w-7 h-7 rounded-full border-2 ${border} flex items-center justify-center bg-background flex-shrink-0`}>
                    <Icon size={13} className={color} />
                  </div>
                  <span className="font-technical text-[10px] text-on-surface font-black uppercase tracking-widest">{label}</span>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          data-tour="legend-button"
          onClick={() => {
            setShowLegend(true);
            setLegendManual(true);
          }}
          className={`w-10 h-10 sm:w-11 sm:h-11 rounded-lg border shadow-lg flex items-center justify-center transition-all ${showLegend ? 'bg-primary text-background border-primary' : 'bg-surface text-on-surface-variant border-white/20 hover:text-primary hover:border-primary/40'}`}
          title="Show Map Legend"
        >
          <Info size={16} className="sm:w-5 sm:h-5" />
        </motion.button>
      </div>

      {/* Floating Action Buttons */}
      {!isAddingProperty && (
        <div className="flex fixed bottom-20 right-4 sm:right-16 z-50 flex-col gap-3 sm:gap-4">
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            data-tour="locate-button"
            onClick={handleLocateMe}
            className={`bg-surface text-on-surface-variant w-12 h-12 sm:w-16 sm:h-16 rounded-lg sm:rounded-xl shadow-lg flex items-center justify-center border border-white/20 transition-all hover:text-primary hover:bg-primary/10 ${geolocating ? 'animate-pulse text-primary' : ''}`}
            title="Locate me"
          >
            <Navigation size={20} className="sm:w-6 sm:h-6" />
          </motion.button>
          <motion.button
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            whileHover={{ scale: 1.1, y: -5 }}
            whileTap={{ scale: 0.95 }}
            data-tour="add-property-button-desktop"
            onClick={() => setIsAddingProperty(true)}
            className="bg-primary text-on-primary w-12 h-12 sm:w-16 sm:h-16 rounded-lg sm:rounded-xl shadow-[0_30px_60px_-10px_rgba(0,102,255,0.4)] flex items-center justify-center border border-white/30"
            title="Add property"
          >
            <Plus size={24} strokeWidth={3} className="sm:w-8 sm:h-8" />
          </motion.button>

          {/* Analytics Dashboard Button - Animated Promo */}
          <Link href="/analytics/v2">
            <motion.button
              animate={{
                boxShadow: [
                  '0 0 20px rgba(0, 102, 255, 0.4)',
                  '0 0 40px rgba(0, 102, 255, 0.8)',
                  '0 0 20px rgba(0, 102, 255, 0.4)'
                ],
                scale: [1, 1.05, 1]
              }}
              transition={{
                repeat: Infinity,
                duration: 2,
                ease: "easeInOut"
              }}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.95 }}
              data-tour="analytics-button"
              className="bg-gradient-to-br from-primary to-blue-600 text-on-primary w-12 h-12 sm:w-16 sm:h-16 rounded-lg sm:rounded-xl flex flex-col items-center justify-center border border-white/40 relative overflow-hidden group"
              title="Market Analytics Dashboard"
            >
              {/* Animated shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer opacity-0 group-hover:opacity-100 transition-opacity" />

              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                className="relative z-10"
              >
                <BarChart3 size={18} strokeWidth={2.5} className="sm:w-6 sm:h-6" />
              </motion.div>

              <span className="text-[7px] sm:text-[8px] font-black uppercase tracking-wider mt-0 sm:mt-0.5 relative z-10">Analytics</span>

              {/* Blinking indicator dot */}
              <motion.div
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="absolute top-1 right-1 w-2 h-2 bg-yellow-300 rounded-full shadow-lg shadow-yellow-400/50"
              />
            </motion.button>
          </Link>
        </div>
      )}

      {/* Geolocation Status Toast */}
      <AnimatePresence>
        {geoStatus && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-32 left-1/2 -translate-x-1/2 max-w-lg bg-surface-container border border-primary/40 rounded-lg p-5 shadow-xl z-50 text-on-surface text-sm font-medium backdrop-blur-sm"
          >
            <div className="whitespace-pre-wrap leading-relaxed">{geoStatus}</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detail Card */}
      <AnimatePresence>
        {selectedProperty && !isAddingProperty && (
          <motion.div initial={{ opacity: 0, x: 50, scale: 0.95 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: 50, scale: 0.95 }} className="fixed lg:absolute right-2 lg:right-8 left-2 lg:left-auto bottom-28 sm:bottom-36 md:bottom-auto lg:bottom-auto top-auto lg:top-24 w-auto lg:w-[380px] max-h-[70vh] sm:max-h-[75vh] md:max-h-[80vh] lg:max-h-none bg-surface rounded-lg overflow-hidden z-30 shadow-[0_40px_100px_-15px_rgba(0,0,0,0.7)] flex flex-col border border-white/10 p-1">
            <div className="bg-background rounded-lg flex flex-col h-full overflow-hidden flex-col">
              <div className="h-16 sm:h-24 lg:h-48 relative m-2 rounded-lg overflow-hidden border border-white/5 flex-shrink-0">
                {selectedProperty.lat && GOOGLE_MAPS_API_KEY && !streetViewFailed ? (
                  <img
                    key={`sv-${selectedProperty.id}`}
                    alt={selectedProperty.name}
                    className="w-full h-full object-cover"
                    src={`https://maps.googleapis.com/maps/api/streetview?size=800x400&location=${selectedProperty.lat},${selectedProperty.lng}&fov=80&key=${GOOGLE_MAPS_API_KEY}`}
                    loading="lazy"
                    onError={() => setStreetViewFailed(true)}
                  />
                ) : (
                  <div className={`w-full h-full flex flex-col items-center justify-center gap-4 bg-gradient-to-br ${getCategoryColors(selectedProperty.category)} relative`}>
                    {(() => { const Icon = getCategoryIcon(selectedProperty.category); return <Icon size={56} className="text-white/80 drop-shadow-lg" />; })()}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-4">
                      <h4 className="font-display font-black text-white text-lg leading-tight tracking-tight uppercase mb-1">{selectedProperty.name}</h4>
                      <div className="flex items-center gap-2">
                        <span className="font-technical text-[10px] uppercase tracking-widest text-white/90 font-black">{selectedProperty.category.replace('-', ' ')}</span>
                        {selectedProperty.updatedAt && <span className="text-[9px] text-white/60">· {relativeDate(selectedProperty.updatedAt)}</span>}
                      </div>
                    </div>
                  </div>
                )}
                <div className="absolute top-3 right-3 bg-background backdrop-blur-md border border-primary/20 rounded-full px-3 py-1 flex items-center gap-1.5 shadow-lg">
                  <span className={`w-2 h-2 rounded-full ${calculateDecay(selectedProperty.updatedAt) ? 'bg-gray-500' : 'bg-secondary animate-pulse'}`} />
                  <span className="font-technical text-[8px] text-on-surface uppercase font-black tracking-widest">{calculateDecay(selectedProperty.updatedAt) ? 'Stale' : 'Live'}</span>
                </div>
                <button onClick={() => setSelectedProperty(null)} className="absolute top-3 left-3 bg-background backdrop-blur-md border border-primary/20 rounded-lg p-1.5 text-on-surface hover:bg-white/20 transition-all"><X size={14} /></button>
              </div>
              <div className="p-4 sm:p-6 text-left flex-1 overflow-y-auto custom-scrollbar">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-2xl font-black text-on-surface tracking-tighter leading-none uppercase font-display">{selectedProperty.name}</h3>
                  <button className="text-on-surface-variant hover:text-primary transition-colors p-2 rounded-lg border border-white/10"><Heart size={16} /></button>
                </div>
                
                <div className="flex items-center gap-2 mb-6">
                  <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${selectedProperty.category === 'gated' ? 'bg-blue-500/20 text-blue-400' : 'bg-orange-500/20 text-orange-400'}`}>{selectedProperty.category}</span>
                  {selectedProperty.isStacked && <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-primary/20 text-primary">{selectedProperty.flatCount} Units Available</span>}
                </div>

                {selectedProperty.isStacked ? (
                  <div className="space-y-3">
                    <div className="font-technical text-[9px] uppercase tracking-[0.4em] text-primary font-black mb-4 opacity-60">
                      Tactical Unit Stack
                    </div>
                    {selectedProperty.matchedFlats.map((flat: any) => (
                      <Link href={`/flat/${flat.id}`} key={flat.id} className="block group">
                        <div className="bg-white/5 border border-white/10 rounded-lg p-4 transition-all hover:border-primary/40 hover:bg-primary/5 flex justify-between items-center">
                          <div>
                            <div className="text-on-surface font-black text-lg tracking-tighter uppercase font-display">
                              {flat.bhk ? `${flat.bhk} BHK` : 'Unit'} • {flat.flat_number || 'N/A'}
                            </div>
                            <div className="text-[8px] uppercase tracking-widest text-on-surface-variant font-black opacity-40 font-technical">
                              Floor {flat.floor_number || 0} • {flat.contributor_name || 'Anon'}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-primary font-black text-xl tracking-tighter">₹{flat.rent_amount?.toLocaleString()}</div>
                            {flat.flatmate_needed && <div className="text-[7px] bg-emerald-400/20 text-emerald-400 px-1 rounded font-black inline-block mt-1">FLATMATE NEEDED</div>}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2 mb-6">
                      {selectedProperty.flatmateNeeded && <span className="px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-wider bg-secondary/20 text-secondary shadow-[0_0_12px_rgba(47,248,1,0.3)]">🤝 Flatmate Wanted</span>}
                      {selectedProperty.ipHash === ipHash && <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-primary/20 text-primary">Your Pin</span>}
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-white/5 border border-white/5 rounded-lg p-4">
                        <div className="text-[9px] uppercase tracking-widest mb-1 font-black opacity-40 font-technical">Rent</div>
                        <div className="text-primary font-black text-2xl tracking-tighter">{selectedProperty.rent}<span className="text-[10px] text-on-surface-variant font-normal ml-1 opacity-50">/mo</span></div>
                      </div>
                      <div className="bg-white/5 border border-white/5 rounded-lg p-4 text-right">
                        <div className="text-[9px] uppercase tracking-widest mb-1 font-black opacity-40 font-technical">Deposit</div>
                        <div className="text-on-surface font-black text-2xl tracking-tighter">{selectedProperty.deposit || '2 Mo'}</div>
                      </div>
                    </div>
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-6 flex items-center gap-4">
                      <div className="bg-primary text-on-primary p-3 rounded-lg shadow-lg"><Award size={20} strokeWidth={2.5} /></div>
                      <div>
                        <div className="font-technical text-[9px] text-primary font-black uppercase tracking-[0.2em] mb-0.5">Good Faith Reward</div>
                        <div className="text-on-surface font-black text-xl tracking-tighter">{selectedProperty.reward || '\u20B92,500'}</div>
                      </div>
                    </div>
                  </>
                )}
              </div>
              {/* Sticky action buttons footer - always visible */}
              {!selectedProperty.isStacked && (
                <div className="border-t border-white/5 bg-background/80 backdrop-blur-sm p-3 sm:p-4 pb-5 sm:pb-6 space-y-2 flex-shrink-0 relative z-40">
                  <Link href={`/flat/${selectedProperty.matchedFlats?.[0]?.id ?? selectedProperty.id}`} className="block w-full">
                    <button className="w-full py-3 bg-primary text-on-primary rounded-lg font-black transition-all flex items-center justify-center gap-2 uppercase tracking-[0.2em] text-[9px] shadow-lg border border-white/20 active:scale-[0.98]"><LinkIcon size={12} strokeWidth={3} /> View Details</button>
                  </Link>
                  <ShareButtons
                    listingId={selectedProperty.matchedFlats?.[0]?.id ?? selectedProperty.id}
                    rent={selectedProperty.rent}
                    bhk={selectedProperty.isStacked ? `${selectedProperty.flatCount} Units` : (selectedProperty.bhk || 'Property')}
                    location={selectedProperty.area || selectedProperty.buildingCity || 'Hyderabad'}
                    buildingName={selectedProperty.name}
                    variant="compact"
                    size="sm"
                    fullUrl={`https://${typeof window !== 'undefined' ? window.location.hostname : 'indian.rent'}/flat/${selectedProperty.matchedFlats?.[0]?.id ?? selectedProperty.id}`}
                  />
                  {selectedProperty.ipHash === ipHash && (
                    <button onClick={() => handleDeletePin(selectedProperty.matchedFlats?.[0]?.id ?? selectedProperty.id)} className="w-full py-2 bg-red-500/10 border border-red-500/20 rounded-lg font-black text-red-400 uppercase tracking-[0.2em] text-[8px] flex items-center justify-center gap-2 transition-all hover:bg-red-500/20">
                      <Trash2 size={11} /> Delete My Pin
                    </button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Nav */}
      <nav data-testid="mobile-nav" className="lg:hidden fixed bottom-0 left-0 w-full z-[70] pb-5 pt-3 px-6 bg-background backdrop-blur-2xl border-t border-primary/20 shadow-[0_-10px_40px_rgba(0,0,0,0.6)] rounded-t-3xl flex justify-between items-end">
        
        <button data-tour="area-stats-button-mobile" onClick={() => {
          const next = !showAreaStats;
          setShowAreaStats(next);
          if (next && !areaStatsCenter) {
            setAreaStatsCenter({ lat: viewState.latitude, lng: viewState.longitude });
          }
        }} className={`flex flex-col items-center justify-center min-h-12 flex-1 transition-all active:scale-90 ${showAreaStats ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'}`} title="Area stats">
          <Landmark size={20} className={showAreaStats ? 'drop-shadow-[0_0_8px_rgba(0,102,255,0.8)]' : ''} />
          <span className="font-technical text-[8px] mt-1.5 font-black uppercase tracking-widest">Area</span>
        </button>

        <button data-tour="metro-button-mobile" onClick={() => setShowMetro(!showMetro)} className={`flex flex-col items-center justify-center min-h-12 flex-1 transition-all active:scale-90 ${showMetro ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'}`} title="Metro">
          <Train size={20} className={showMetro ? 'drop-shadow-[0_0_8px_rgba(0,102,255,0.8)]' : ''} />
          <span className="font-technical text-[8px] mt-1.5 font-black uppercase tracking-widest">Metro</span>
        </button>

        {/* Center Primary Action Button */}
        <div className="relative flex-1 flex justify-center -mt-8">
          <button onClick={() => setIsAddingProperty(true)} data-tour="add-property-button" className="flex flex-col items-center justify-center transition-all active:scale-90 hover:scale-105">
            <div className="w-14 h-14 bg-primary text-on-primary rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(0,102,255,0.5)] border-4 border-background">
              <Plus size={26} strokeWidth={3} />
            </div>
          </button>
        </div>

        <button data-tour="live-stats-button-mobile" onClick={() => setShowLiveStats(!showLiveStats)} className={`flex flex-col items-center justify-center min-h-12 flex-1 transition-all active:scale-90 ${showLiveStats ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'}`} title="Live Stats">
          <BarChart3 size={20} className={showLiveStats ? 'drop-shadow-[0_0_8px_rgba(0,102,255,0.8)]' : ''} />
          <span className="font-technical text-[8px] mt-1.5 font-black uppercase tracking-widest">Live</span>
        </button>

        <button data-tour="alerts-button-mobile" onClick={() => setShowNotifyModal(true)} className={`flex flex-col items-center justify-center min-h-12 flex-1 transition-all active:scale-90 text-on-surface-variant hover:text-on-surface`} title="Notify">
          <Bell size={20} />
          <span className="font-technical text-[8px] mt-1.5 font-black uppercase tracking-widest">Alerts</span>
        </button>
      </nav>

      {/* Toast Notification */}
      <AnimatePresence>
        {mapToast && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-lg font-black text-[13px] uppercase tracking-wider shadow-lg ${
              mapToast.type === 'success'
                ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/30'
                : 'bg-red-400/10 text-red-400 border border-red-400/30'
            }`}
          >
            {mapToast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </APIProvider>
  );
}
