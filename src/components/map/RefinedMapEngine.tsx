'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Map as MapboxMap, NavigationControl as MapboxNavigationControl, Marker as MapboxMarker } from 'react-map-gl';
import { APIProvider, Map as GoogleMap, AdvancedMarker } from '@vis.gl/react-google-maps';
import { motion, AnimatePresence } from 'framer-motion';
import 'mapbox-gl/dist/mapbox-gl.css';
import useSupercluster from 'use-supercluster';
import AddPropertyForm from './AddPropertyForm';
import FilterPanel, { MapFilters, DEFAULT_FILTERS } from './FilterPanel';
import MetroOverlay from './MetroOverlay';
import CircleAreaSelector from './CircleAreaSelector';
import LiveStatsPanel from './LiveStatsPanel';
import SeekerPinForm from './SeekerPinForm';
import ConsentSplash from './ConsentSplash';
import Link from 'next/link';
import { Plus, RefreshCcw, Search, MapPin as MapPinIcon, Heart, Link as LinkIcon, Award, X, Settings, Crosshair, Navigation, SlidersHorizontal, Train, BarChart3, Users, Share2, Trash2, Bell, Menu, LayoutDashboard, Info, Landmark, Shield, ShieldAlert, Building2, Home, Hotel, AlertCircle, MessageCircle } from 'lucide-react';
import UnifiedMenu from '@/components/UnifiedMenu';
import { getMapIntel, deployNode, searchLocalities, getSeekerPins, dropSeekerPin, deleteOwnPin, subscribeToArea, trackApiUsage } from '@/app/actions/map-actions';
import { createClient } from '@/utils/supabase/client';
import { getIpHash } from '@/utils/ip-hash';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useSystemTheme } from '@/hooks/useSystemTheme';
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

const MOCK_INTEL = [
  { id: '1', name: 'Banjara Hills Residence', category: 'semi-gated', lat: 17.4156, lng: 78.4347, rent: '₹45,000', deposit: '2 Months', reward: '₹2,500', floor: '4th Floor', verified: true, user: { name: 'Rahul S.', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop' }, image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=800&auto=format&fit=crop' },
  { id: '2', name: 'Jubilee Towers', category: 'gated', lat: 17.4284, lng: 78.4121, rent: '₹85,000', deposit: '3 Months', reward: '₹5,000', floor: '12th Floor', verified: true, user: { name: 'Priya D.', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop' }, image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=800&auto=format&fit=crop' }
];

export default function RefinedMapEngine() {
  const systemTheme = useSystemTheme();
  useDriverJS('explore');
  const [consented, setConsented] = useState(false);
  const [points, setPoints] = useState<any[]>([]);
  const [seekerPins, setSeekerPins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [isAddingProperty, setIsAddingProperty] = useState(false);
  const [isSeekerMode, setIsSeekerMode] = useState(false);
  const [showSeekerForm, setShowSeekerForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<MapFilters>(DEFAULT_FILTERS);
  const [showMetro, setShowMetro] = useState(false);
  const [showAreaStats, setShowAreaStats] = useState(false);
  const [areaStatsCenter, setAreaStatsCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [showLiveStats, setShowLiveStats] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState('');
  const [notifyRadius, setNotifyRadius] = useState(5);
  const [notifySubmitting, setNotifySubmitting] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [geoStatus, setGeoStatus] = useState<string>('');
  const [googleBounds, setGoogleBounds] = useState<[number, number, number, number]>([-180, -85, 180, 85]);
  const [showLegend, setShowLegend] = useState(true);
  const [streetViewFailed, setStreetViewFailed] = useState(false);
  const [selectedCity, setSelectedCity] = useState<'bengaluru' | 'hyderabad' | 'bhubaneswar' | 'cuttack'>('bengaluru');

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
      bounds: [[85.4, 20.0], [86.3, 20.6]]
    },
    cuttack: {
      latitude: 20.4625,
      longitude: 85.8830,
      zoom: 11,
      pitch: 0,
      bounds: [[85.5, 20.2], [86.2, 20.7]]
    }
  };

  const [viewState, setViewState] = useState({
    longitude: cityConfig.bengaluru.longitude,
    latitude: cityConfig.bengaluru.latitude,
    zoom: cityConfig.bengaluru.zoom,
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

  const ipHash = typeof window !== 'undefined' ? getIpHash() : '';

  const mapId = systemTheme === 'dark' ? 'TACTICAL_HUD_MAP' : 'LIGHT_HUD_MAP';

  const processIntelData = useCallback((data: any[]) => {
    try {
      if (data && Array.isArray(data) && data.length > 0) {
        const featurePoints = data.map((b: any) => {
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
              propertyId: b.id || Math.random().toString(),
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
        const rentNum = 45000;
        setPoints(MOCK_INTEL.map(m => ({ 
          type: "Feature", 
          properties: { ...m, propertyId: m.id, allFlats: [{ ...m, rent_amount: rentNum }], rentNum, bhk: '2', furnishing: 'semi-furnished', flatmateNeeded: false, ipHash: '' }, 
          geometry: { type: "Point", coordinates: [m.lng, m.lat] } 
        })));
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
      trackApiUsage(mapProvider as any).catch(e => console.warn('Usage tracking failed:', e));
    }
  }, [fetchIntel, consented]);

  // Reset map bounds when city changes to ensure proper clustering
  useEffect(() => {
    const config = cityConfig[selectedCity];
    setGoogleBounds([config.bounds[0][0], config.bounds[0][1], config.bounds[1][0], config.bounds[1][1]]);
  }, [selectedCity]);

  useEffect(() => {
    if (!consented) return;
    const supabase = createClient();
    const channel = supabase.channel('map-snapshot-changes').on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'map_snapshot', filter: 'id=eq.1' }, (payload: any) => {
      if (payload.new && (payload.new as any).data) processIntelData((payload.new as any).data);
    }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [processIntelData, consented]);

  // Refresh data when city changes to ensure latest data for selected city
  useEffect(() => {
    if (consented && !loading) {
      // City change will automatically trigger filteredPoints re-computation
      // This ensures map markers update immediately on city selection
    }
  }, [selectedCity, consented]);

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

      console.log('✅ Location obtained:', lat, lng);
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

      console.log(`📍 Found ${nearbyPoints.length} nearby points, setting zoom to ${optimalZoom}`);
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
      setViewState({ ...viewState, latitude: lat, longitude: lng, zoom: 16 });

      if (isAddingProperty) {
        setAddFormInitialData({
          buildingName: place.name,
          address: place.formatted_address
        });
      }
    }
  };

  const handleAddPropertySubmit = async (data: any) => {
    setLoading(true);
    // Pass maintenance fields directly (no conversion needed)
    const payload = { ...data, lat: viewState.latitude, lng: viewState.longitude, ipHash };
    const result = await deployNode(payload);
    if (result.error) { alert(result.error); setLoading(false); }
    else {
      setIsAddingProperty(false);
      setAddFormInitialData(null);
      setShowShareModal(true);
      fetchIntel();
    }
  };

  const handleSeekerSubmit = async (data: any) => {
    const result = await dropSeekerPin({ ...data, ipHash });
    if (result.error) { alert(result.error); }
    else { setShowSeekerForm(false); setIsSeekerMode(false); fetchIntel(); }
  };

  const handleMapClick = (e: any) => {
    const lat = e.lngLat?.lat || e.detail?.latLng?.lat;
    const lng = e.lngLat?.lng || e.detail?.latLng?.lng;

    if (showAreaStats && lat && lng) {
      // Already showing area stats - just update center
      setAreaStatsCenter({ lat, lng });
    } else if (isSeekerMode && lat && lng) {
      setShowSeekerForm(true);
    }
  };

  const handleDeletePin = async (flatId: string) => {
    if (!confirm('Delete this pin permanently?')) return;
    const result = await deleteOwnPin(flatId, ipHash);
    if (result.error) alert(result.error);
    else { setSelectedProperty(null); fetchIntel(); }
  };

  const handleShare = () => {
    const text = `Found this: indian.rent — a live rent map of Hyderabad with real rents from real people. No brokers, no signup. Check it out: ${window.location.origin}/explore`;
    navigator.clipboard?.writeText(text);
    setShowShareModal(false);
  };

  const handleSubscribeToArea = async () => {
    if (!notifyEmail || !notifyEmail.includes('@')) { alert('Valid email required'); return; }
    setNotifySubmitting(true);
    const result = await subscribeToArea(notifyEmail, viewState.latitude, viewState.longitude, notifyRadius);
    setNotifySubmitting(false);
    if (result.error) alert(result.error);
    else { alert('Subscribed! You\'ll get email updates when new listings appear.'); setShowNotifyModal(false); setNotifyEmail(''); }
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
                  {prop.flatmateNeeded && <span className="bg-emerald-400/20 text-emerald-400 px-1 rounded font-black" style={{ fontSize: `${sizes.badgeSize}px` }}>FM</span>}
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

  console.log('Grid Telemetry:', { 
    provider: MAP_PROVIDER, 
    hasApiKey: !!GOOGLE_MAPS_API_KEY, 
    mapId, 
    city: selectedCity,
    pointsCount: points.length,
    filteredCount: filteredPoints.length
  });

  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY || ''} libraries={['places', 'marker']}>
      <div className="h-screen w-full overflow-hidden bg-background relative selection:bg-primary/20 selection:text-primary">
        {/* Map */}
        <div id="map-container" className="absolute inset-0 z-0 bg-background">
          {MAP_PROVIDER === 'mapbox' ? (
            <MapboxMap {...viewState} ref={mapRef} onMove={evt => setViewState(evt.viewState)} onClick={handleMapClick} style={{ width: '100%', height: '100%' }} mapStyle="mapbox://styles/mapbox/dark-v11" mapboxAccessToken={MAPBOX_TOKEN} maxBounds={cityConfig[selectedCity].bounds as any}>
              <MapboxNavigationControl position="top-right" />
              <MetroOverlay visible={showMetro} />

              {/* Seeker Pins */}
              {seekerPins.map(sp => (
                <MapboxMarker key={sp.id} longitude={sp.longitude} latitude={sp.latitude} anchor="center">
                  <div className="w-6 h-6 rounded-full bg-emerald-400/80 border-2 border-white flex items-center justify-center shadow-lg">
                    <Search size={10} className="text-white" />
                  </div>
                </MapboxMarker>
              ))}

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
                              const z = Math.min(supercluster.getClusterExpansionZoom(cluster.id), 20); 
                              setViewState({ ...viewState, longitude, latitude, zoom: z }); 
                            } catch (e) {
                              setViewState({ ...viewState, longitude, latitude, zoom: viewState.zoom + 2 });
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
              minZoom={5}
              maxZoom={18}
              restriction={{
                latLngBounds: {
                  north: cityConfig[selectedCity].bounds[1][1],
                  south: cityConfig[selectedCity].bounds[0][1],
                  west: cityConfig[selectedCity].bounds[0][0],
                  east: cityConfig[selectedCity].bounds[1][0]
                },
                strictBounds: false
              }}
              onCameraChanged={(ev) => {
                if (ev.detail.center && typeof ev.detail.center.lat === 'number' && typeof ev.detail.center.lng === 'number') {
                  setViewState(prev => ({ ...prev, latitude: ev.detail.center.lat, longitude: ev.detail.center.lng, zoom: ev.detail.zoom }));
                }
                if (ev.detail.bounds) {
                  setGoogleBounds([
                    Number(ev.detail.bounds.west) || -180, 
                    Number(ev.detail.bounds.south) || -85, 
                    Number(ev.detail.bounds.east) || 180, 
                    Number(ev.detail.bounds.north) || 85
                  ]);
                }
              }}
              style={{ width: '100%', height: '100%' }}
            >
              {clusters.map((cluster: any) => {
                try {
                  const coordinates = cluster.geometry?.coordinates;
                  if (!coordinates || !Array.isArray(coordinates)) return null;
                  const [longitude, latitude] = coordinates;
                  const { cluster: isCluster, point_count: pointCount } = cluster.properties || {};
                  
                  if (isCluster) {
                    const size = Math.max(36, 28 + (pointCount || 0) * 1.5);
                    return (
                      <AdvancedMarker
                        key={`cluster-${cluster.id || Math.random()}`}
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
              {userLocation && (
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
            </GoogleMap>
          )}
        </div>

        {/* Area Stats Indicator */}
        {showAreaStats && (
          <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-primary text-background px-4 py-2 rounded-lg font-technical text-[10px] font-black uppercase tracking-widest shadow-xl">
            Click map to change area
          </div>
        )}

        {/* Target Reticle */}
        <AnimatePresence>
          {(isAddingProperty || isSeekerMode) && !showSeekerForm && (
            <motion.div initial={{ opacity: 0, scale: 2 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 2 }} className="fixed inset-0 flex items-center justify-center z-10 pointer-events-none">
              <div className="relative">
                <Crosshair className={`w-12 h-12 animate-pulse ${isSeekerMode ? 'text-emerald-400' : 'text-primary'}`} strokeWidth={1} />
                <div className={`absolute top-full left-1/2 -translate-x-1/2 mt-4 px-3 py-1 ${isSeekerMode ? 'bg-emerald-400' : 'bg-primary'} text-background font-technical text-[9px] font-black uppercase tracking-widest rounded-sm whitespace-nowrap shadow-xl`}>
                  {isSeekerMode ? 'Tap to drop seeker pin' : `${viewState.latitude.toFixed(4)}, ${viewState.longitude.toFixed(4)}`}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top HUD */}
        {!isAddingProperty && !showSeekerForm && (
          <header className="fixed top-0 w-full z-50 flex justify-center h-20 px-4 md:px-8 pointer-events-none pt-4 font-technical">
            <div className="max-w-5xl w-full flex justify-between items-center pointer-events-auto h-14 bg-background/80 backdrop-blur-xl rounded-lg border border-white/10 shadow-2xl px-4 md:px-6">
              <div className="flex items-center gap-3">
                <UnifiedMenu />
                <div className="flex flex-col -gap-1">
                  <Link href="/" className="font-display text-lg text-primary font-black tracking-tighter cursor-pointer uppercase">indian.rent</Link>
                  <span className="text-[7px] uppercase tracking-[0.4em] text-primary/40 font-black hidden md:block">by WishLabs</span>
                </div>
              </div>

              {/* City Selector - Extended to 4 Cities */}
              <select
                value={selectedCity}
                onChange={(e) => handleCityChange(e.target.value as 'bengaluru' | 'hyderabad' | 'bhubaneswar' | 'cuttack')}
                className="px-3 py-1.5 rounded-lg bg-surface border border-white/20 text-on-surface font-technical text-sm font-bold focus:outline-none focus:border-primary/50 cursor-pointer hover:border-white/30 transition-all"
              >
                <option value="bengaluru">🏙️ Bengaluru</option>
                <option value="hyderabad">🏙️ Hyderabad</option>
                <option value="bhubaneswar">🏙️ Bhubaneswar</option>
                <option value="cuttack">🏙️ Cuttack</option>
              </select>
              
              <div className="flex items-center gap-2 md:gap-4">
                <button onClick={() => setShowFilters(!showFilters)} data-tour="filter-button" className={`p-2 rounded-lg transition-all ${showFilters ? 'bg-primary/20 text-primary' : 'text-on-surface-variant hover:text-primary'}`} title="Filters"><SlidersHorizontal size={16} /></button>
                <button onClick={() => setShowMetro(!showMetro)} className={`p-2 rounded-lg transition-all ${showMetro ? 'bg-primary/20 text-primary' : 'text-on-surface-variant hover:text-primary'}`} title="Metro"><Train size={16} /></button>
                <button onClick={() => { setShowAreaStats(!showAreaStats); if (!showAreaStats && viewState) { setAreaStatsCenter({ lat: viewState.latitude, lng: viewState.longitude }); } }} data-tour="area-stats-button" className={`p-2 rounded-lg transition-all ${showAreaStats ? 'bg-primary/20 text-primary' : 'text-on-surface-variant hover:text-primary'}`} title="Area Stats"><BarChart3 size={16} /></button>
                <button onClick={() => setShowLiveStats(!showLiveStats)} className={`p-2 rounded-lg transition-all ${showLiveStats ? 'bg-primary/20 text-primary' : 'text-on-surface-variant hover:text-primary'}`} title="Live Stats"><BarChart3 size={16} /></button>
                <button onClick={() => setShowNotifyModal(true)} className="p-2 rounded-lg transition-all text-on-surface-variant hover:text-primary" title="Notify"><Bell size={16} /></button>
                <div className="w-px h-4 bg-white/10 hidden md:block" />
                <button onClick={() => { setIsSeekerMode(!isSeekerMode); setShowSeekerForm(false); }} className={`p-2 rounded-lg transition-all ${isSeekerMode ? 'bg-emerald-400/20 text-emerald-400' : 'text-on-surface-variant hover:text-emerald-400'}`} title="Flat Hunt"><Users size={16} /></button>
                <button onClick={fetchIntel} className={`text-primary transition-all active:rotate-180 ${loading ? 'animate-spin' : ''}`}><RefreshCcw size={16} strokeWidth={2.5} /></button>
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

      {/* Add Property Sidebar */}
      <AnimatePresence>
        {isAddingProperty && (
          <div className="fixed inset-0 z-[100] flex items-center justify-start pointer-events-none">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setIsAddingProperty(false); setAddFormInitialData(null); }} className="absolute inset-0 bg-black/70 backdrop-blur-sm pointer-events-auto" />
            <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="relative w-full md:w-[420px] h-full bg-surface border-r border-white/10 shadow-3xl pointer-events-auto overflow-hidden flex flex-col">
              <div className="flex-1 overflow-hidden">
                <AddPropertyForm 
                  onClose={() => { setIsAddingProperty(false); setAddFormInitialData(null); }} 
                  onSubmit={handleAddPropertySubmit} 
                  lat={viewState.latitude} 
                  lng={viewState.longitude} 
                  initialData={addFormInitialData}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Seeker Pin Form */}
      <AnimatePresence>
        {showSeekerForm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-start pointer-events-none">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setShowSeekerForm(false); setIsSeekerMode(false); }} className="absolute inset-0 bg-black/70 backdrop-blur-sm pointer-events-auto" />
            <SeekerPinForm lat={viewState.latitude} lng={viewState.longitude} onClose={() => { setShowSeekerForm(false); setIsSeekerMode(false); }} onSubmit={handleSeekerSubmit} />
          </div>
        )}
      </AnimatePresence>

      {/* Share Modal */}
      <AnimatePresence>
        {showShareModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[150] flex items-center justify-center">
            <div onClick={() => setShowShareModal(false)} className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="relative bg-surface border border-white/10 rounded-lg p-8 max-w-sm w-full mx-4 shadow-2xl text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPinIcon size={24} className="text-primary" />
              </div>
              <h3 className="text-xl font-black text-on-surface uppercase tracking-tighter mb-2">Pin Dropped!</h3>
              <p className="text-on-surface-variant text-sm mb-6">Help others find honest rents — share this with your groups</p>
              <button
                onClick={() => {
                  const text = `Found indian.rent — real rents from real people, no brokers, no signup. Drop your rent intel: ${window.location.origin}/explore`;
                  const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
                  window.open(url, '_blank');
                  setShowShareModal(false);
                }}
                className="w-full py-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-lg font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-2 mb-3 transition-all hover:bg-emerald-500/20"
              >
                <MessageCircle size={14} /> Share on WhatsApp
              </button>
              <button onClick={handleShare} className="w-full py-3 bg-primary text-on-primary rounded-lg font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-2 mb-3">
                <Share2 size={14} /> Copy Share Message
              </button>
              <button onClick={() => setShowShareModal(false)} className="w-full py-3 bg-white/5 border border-white/10 rounded-lg font-black uppercase tracking-[0.2em] text-[10px] text-on-surface-variant">Close</button>
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

      {/* Add Property HUD Overlay (Search) */}
      <AnimatePresence>
        {isAddingProperty && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[110] w-full max-w-lg px-4"
          >
            <div className="bg-background/80 backdrop-blur-xl border border-white/10 rounded-lg p-2 shadow-3xl">
              <PlaceAutocomplete onPlaceSelect={handlePlaceSelect} className="skeuo-concave" />
              <div className="mt-2 px-3 flex justify-between items-center">
                <span className="font-technical text-[8px] uppercase tracking-[0.3em] text-primary font-black">Search for building location</span>
                <button onClick={() => { setIsAddingProperty(false); setAddFormInitialData(null); }} className="text-[8px] uppercase tracking-[0.3em] text-on-surface-variant hover:text-white font-black">Cancel</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Map Legend */}
      <div className="hidden lg:block fixed bottom-12 left-12 z-50">
        <AnimatePresence>
          {showLegend && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="mb-3 bg-surface border border-white/10 rounded-lg p-4 shadow-xl min-w-[220px]"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="font-technical text-[9px] uppercase tracking-[0.4em] text-primary font-black opacity-60">Map Legend</div>
                <button
                  onClick={() => setShowLegend(false)}
                  className="p-1 text-on-surface-variant hover:text-primary transition-colors"
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
                { label: 'Looking for Flat',Icon: Search,      color: 'text-emerald-400',border: 'border-emerald-400'},
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
          onClick={() => setShowLegend(v => !v)}
          className={`w-11 h-11 rounded-lg border shadow-lg flex items-center justify-center transition-all ${showLegend ? 'bg-primary text-background border-primary' : 'bg-surface text-on-surface-variant border-white/20 hover:text-primary hover:border-primary/40'}`}
          title="Map Legend"
        >
          <Info size={18} />
        </motion.button>
      </div>

      {/* Floating Action Buttons */}
      {!isAddingProperty && !showSeekerForm && (
        <div className="hidden lg:flex fixed bottom-12 right-12 z-50 flex-col gap-3">
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLocateMe}
            className={`bg-surface text-on-surface-variant w-14 h-14 rounded-lg shadow-lg flex items-center justify-center border border-white/20 transition-all hover:text-primary hover:bg-primary/10 ${geolocating ? 'animate-pulse text-primary' : ''}`}
            title="Locate me"
          >
            <Navigation size={24} />
          </motion.button>
          <motion.button
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            whileHover={{ scale: 1.1, y: -5 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsAddingProperty(true)}
            className="bg-primary text-on-primary w-16 h-16 rounded-lg shadow-[0_30px_60px_-10px_rgba(0,102,255,0.4)] flex items-center justify-center border border-white/30"
            title="Add property"
          >
            <Plus size={30} strokeWidth={3} />
          </motion.button>
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
        {selectedProperty && !isAddingProperty && !showSeekerForm && (
          <motion.div initial={{ opacity: 0, x: 50, scale: 0.95 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: 50, scale: 0.95 }} className="fixed lg:absolute right-2 lg:right-8 left-2 lg:left-auto bottom-24 lg:bottom-auto top-auto lg:top-24 w-auto lg:w-[380px] max-h-[60vh] lg:max-h-none bg-surface rounded-lg overflow-hidden z-30 shadow-[0_40px_100px_-15px_rgba(0,0,0,0.7)] flex flex-col border border-white/10 p-1">
            <div className="bg-background/80 rounded-lg flex flex-col">
              <div className="h-32 lg:h-48 relative m-2 rounded-lg overflow-hidden border border-white/5">
                {selectedProperty.lat && GOOGLE_MAPS_API_KEY && !streetViewFailed ? (
                  <img
                    key={`sv-${selectedProperty.id}`}
                    alt={selectedProperty.name}
                    className="w-full h-full object-cover"
                    src={`https://maps.googleapis.com/maps/api/streetview?size=800x400&location=${selectedProperty.lat},${selectedProperty.lng}&fov=80&key=${GOOGLE_MAPS_API_KEY}`}
                    onError={() => setStreetViewFailed(true)}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-surface-container to-background">
                    {(() => { const Icon = getCategoryIcon(selectedProperty.category); return <Icon size={52} className="text-white/10" />; })()}
                    <span className="font-technical text-[9px] uppercase tracking-[0.4em] text-white/20 font-black">No Street View</span>
                  </div>
                )}
                <div className="absolute top-3 right-3 bg-background/80 backdrop-blur-md border border-white/20 rounded-full px-3 py-1 flex items-center gap-1.5 shadow-lg">
                  <span className={`w-2 h-2 rounded-full ${calculateDecay(selectedProperty.updatedAt) ? 'bg-gray-500' : 'bg-secondary animate-pulse'}`} />
                  <span className="font-technical text-[8px] text-on-surface uppercase font-black tracking-widest">{calculateDecay(selectedProperty.updatedAt) ? 'Stale' : 'Live'}</span>
                </div>
                <button onClick={() => setSelectedProperty(null)} className="absolute top-3 left-3 bg-background/80 backdrop-blur-md border border-white/20 rounded-lg p-1.5 text-on-surface hover:bg-white/20 transition-all"><X size={14} /></button>
              </div>
              <div className="p-6 text-left flex-1 overflow-y-auto custom-scrollbar">
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
                      {selectedProperty.flatmateNeeded && <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-emerald-400/20 text-emerald-400">Flatmate Needed</span>}
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
                    <Link href={`/flat/${selectedProperty.id}`} className="block w-full mb-3">
                      <button className="w-full py-4 bg-primary text-on-primary rounded-lg font-black transition-all flex items-center justify-center gap-3 uppercase tracking-[0.2em] text-[10px] shadow-lg border border-white/20 active:scale-[0.98]"><LinkIcon size={14} strokeWidth={3} /> View Details</button>
                    </Link>
                    <button
                      onClick={() => {
                        const text = `Check out this rental on indian.rent — no broker fees! https://${window.location.hostname}/flat/${selectedProperty.id}`;
                        const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
                        window.open(url, '_blank');
                      }}
                      className="w-full py-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg font-black text-emerald-400 uppercase tracking-[0.2em] text-[10px] mb-3 flex items-center justify-center gap-2 transition-all hover:bg-emerald-500/20"
                    >
                      <MessageCircle size={14} strokeWidth={2} /> Share on WhatsApp
                    </button>
                    {selectedProperty.ipHash === ipHash && (
                      <button onClick={() => handleDeletePin(selectedProperty.id)} className="w-full py-3 bg-red-500/10 border border-red-500/20 rounded-lg font-black text-red-400 uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-2 transition-all hover:bg-red-500/20">
                        <Trash2 size={12} /> Delete My Pin
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Nav */}
      <nav className="lg:hidden fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] z-[70] flex justify-around items-center p-2 bg-background/60 backdrop-blur-2xl border border-white/10 shadow-3xl rounded-lg">
        <button onClick={handleLocateMe} className="flex flex-col items-center justify-center text-on-surface-variant min-h-12 min-w-12 flex-1 transition-all active:scale-90 rounded-lg hover:text-primary hover:bg-white/5"><Navigation size={20} /><span className="font-technical text-[9px] mt-1 font-black uppercase tracking-widest opacity-60">Locate</span></button>
        <button onClick={() => setIsSeekerMode(!isSeekerMode)} className={`flex flex-col items-center justify-center min-h-12 min-w-12 flex-1 transition-all active:scale-90 rounded-lg ${isSeekerMode ? 'text-emerald-400 bg-emerald-400/10' : 'text-on-surface-variant hover:bg-white/5'}`}><Users size={20} /><span className="font-technical text-[9px] mt-1 font-black uppercase tracking-widest">Hunt</span></button>
        <button onClick={() => setIsAddingProperty(true)} data-tour="add-property-button" className="flex flex-col items-center justify-center text-on-surface-variant min-h-12 flex-1 transition-all active:scale-90">
          <div className="w-10 h-10 bg-primary text-on-primary rounded-md flex items-center justify-center shadow-lg"><Plus size={20} strokeWidth={3} /></div>
        </button>
        <button onClick={() => { 
          const next = !showAreaStats;
          setShowAreaStats(next); 
          if (next && !areaStatsCenter) { 
            setAreaStatsCenter({ lat: viewState.latitude, lng: viewState.longitude }); 
          } 
        }} className={`flex flex-col items-center justify-center min-h-12 min-w-12 flex-1 transition-all active:scale-90 rounded-lg ${showAreaStats ? 'text-primary bg-primary/10' : 'text-on-surface-variant hover:bg-white/5'}`} title="Area stats"><Landmark size={20} /><span className="font-technical text-[9px] mt-1 font-black uppercase tracking-widest">Area</span></button>
        <button onClick={() => setShowFilters(!showFilters)} className={`flex flex-col items-center justify-center min-h-12 min-w-12 flex-1 transition-all active:scale-90 rounded-lg ${showFilters ? 'text-primary bg-primary/10' : 'text-on-surface-variant hover:bg-white/5'}`}><SlidersHorizontal size={20} /><span className="font-technical text-[9px] mt-1 font-black uppercase tracking-widest">Filter</span></button>
      </nav>
    </div>
    </APIProvider>
  );
}
