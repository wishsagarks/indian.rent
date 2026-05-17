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
import AreaStatsModal from './AreaStatsModal';
import LiveStatsPanel from './LiveStatsPanel';
import SeekerPinForm from './SeekerPinForm';
import ConsentSplash from './ConsentSplash';
import Link from 'next/link';
import { Plus, RefreshCcw, Search, MapPin as MapPinIcon, Heart, Link as LinkIcon, Award, X, Settings, Crosshair, Navigation, SlidersHorizontal, Train, BarChart3, Users, Share2, Trash2 } from 'lucide-react';
import { getMapIntel, deployNode, searchLocalities, getSeekerPins, dropSeekerPin, deleteOwnPin } from '@/app/actions/map-actions';
import { createBrowserClient } from '@supabase/ssr';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const MAP_PROVIDER = process.env.NEXT_PUBLIC_MAP_PROVIDER || 'mapbox';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function getIpHash(): string {
  if (typeof window === 'undefined') return '';
  let hash = localStorage.getItem('ir_ip_hash');
  if (!hash) {
    hash = 'u_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    localStorage.setItem('ir_ip_hash', hash);
  }
  return hash;
}

const MOCK_INTEL = [
  { id: '1', name: 'Banjara Hills Residence', category: 'semi-gated', lat: 17.4156, lng: 78.4347, rent: '\u20B945,000', deposit: '2 Months', reward: '\u20B92,500', floor: '4th Floor', verified: true, user: { name: 'Rahul S.', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop' }, image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=800&auto=format&fit=crop' },
  { id: '2', name: 'Jubilee Towers', category: 'gated', lat: 17.4284, lng: 78.4121, rent: '\u20B985,000', deposit: '3 Months', reward: '\u20B95,000', floor: '12th Floor', verified: true, user: { name: 'Priya D.', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop' }, image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=800&auto=format&fit=crop' }
];

export default function RefinedMapEngine() {
  const [consented, setConsented] = useState(false);
  const [points, setPoints] = useState<any[]>([]);
  const [seekerPins, setSeekerPins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [isAddingProperty, setIsAddingProperty] = useState(false);
  const [isSeekerMode, setIsSeekerMode] = useState(false);
  const [showSeekerForm, setShowSeekerForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<MapFilters>(DEFAULT_FILTERS);
  const [showMetro, setShowMetro] = useState(false);
  const [showAreaStats, setShowAreaStats] = useState(false);
  const [areaStatsBounds, setAreaStatsBounds] = useState<any>(null);
  const [areaStatsStep, setAreaStatsStep] = useState(0);
  const [areaCorner1, setAreaCorner1] = useState<{ lat: number; lng: number } | null>(null);
  const [showLiveStats, setShowLiveStats] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const mapRef = useRef<any>(null);
  const [viewState, setViewState] = useState({
    longitude: 78.4347,
    latitude: 17.4156,
    zoom: 13,
    pitch: 45
  });

  const ipHash = typeof window !== 'undefined' ? getIpHash() : '';

  const processIntelData = useCallback((data: any[]) => {
    if (data && data.length > 0) {
      const featurePoints = data.map((b: any) => {
        const flat = b.floors?.[0]?.flats?.[0];
        return {
          type: "Feature",
          properties: {
            cluster: false,
            propertyId: b.id,
            category: b.category,
            name: b.name,
            rent: flat?.rent_amount ? `\u20B9${flat.rent_amount.toLocaleString()}` : '\u20B945,000',
            rentNum: flat?.rent_amount || 0,
            bhk: flat?.bhk || null,
            furnishing: flat?.furnishing || null,
            flatmateNeeded: flat?.flatmate_needed || false,
            ipHash: flat?.ip_hash || b.building_ip_hash || '',
            updatedAt: b.updated_at || flat?.updated_at,
            image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=800&auto=format&fit=crop',
            user: { name: 'User', image: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop' }
          },
          geometry: { type: "Point", coordinates: [parseFloat(b.location.coordinates[0]), parseFloat(b.location.coordinates[1])] }
        };
      });
      setPoints(featurePoints);
    } else {
      setPoints(MOCK_INTEL.map(m => ({ type: "Feature", properties: { ...m, propertyId: m.id, rentNum: 0, bhk: null, furnishing: null, flatmateNeeded: false, ipHash: '' }, geometry: { type: "Point", coordinates: [m.lng, m.lat] } })));
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
  }, [processIntelData]);

  useEffect(() => {
    if (consented) fetchIntel();
  }, [fetchIntel, consented]);

  useEffect(() => {
    if (!consented || !supabaseUrl || !supabaseAnonKey) return;
    const client = createBrowserClient(supabaseUrl, supabaseAnonKey);
    const channel = client.channel('map-snapshot-changes').on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'map_snapshot', filter: 'id=eq.1' }, (payload) => {
      if (payload.new && (payload.new as any).data) processIntelData((payload.new as any).data);
    }).subscribe();
    return () => { client.removeChannel(channel); };
  }, [processIntelData, consented]);

  // Apply filters
  const filteredPoints = useMemo(() => {
    return points.filter(p => {
      const props = p.properties;
      if (filters.bhk !== 'any') {
        const bhkVal = filters.bhk === '4+' ? 4 : parseInt(filters.bhk);
        if (filters.bhk === '4+') { if (props.bhk && props.bhk < 4) return false; }
        else { if (props.bhk && props.bhk !== bhkVal) return false; }
      }
      if (filters.rentMin && props.rentNum && props.rentNum < parseInt(filters.rentMin)) return false;
      if (filters.rentMax && props.rentNum && props.rentNum > parseInt(filters.rentMax)) return false;
      if (filters.furnishing !== 'any' && props.furnishing && props.furnishing !== filters.furnishing) return false;
      if (filters.category !== 'any') {
        if (filters.category === 'standalone' && props.category === 'gated') return false;
        if (filters.category === 'gated' && props.category !== 'gated') return false;
      }
      if (filters.flatmateNeeded && !props.flatmateNeeded) return false;
      if (filters.postedWithin !== 'all' && props.updatedAt) {
        const days = parseInt(filters.postedWithin);
        const diff = (Date.now() - new Date(props.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
        if (diff > days) return false;
      }
      return true;
    });
  }, [points, filters]);

  const bounds = mapRef.current ? (MAP_PROVIDER === 'mapbox' ? mapRef.current.getMap().getBounds().toArray().flat() : null) : null;
  const { clusters, supercluster } = useSupercluster({ points: filteredPoints, bounds, zoom: viewState.zoom, options: { radius: 75, maxZoom: 20 } });

  const handleLocateMe = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      setViewState({ ...viewState, latitude: pos.coords.latitude, longitude: pos.coords.longitude, zoom: 16 });
    });
  };

  const handleSearchInput = async (value: string) => {
    setSearchQuery(value);
    if (value.length >= 2) {
      const results = await searchLocalities(value);
      setSearchResults(results);
      setShowSearchResults(results.length > 0);
    } else { setSearchResults([]); setShowSearchResults(false); }
  };

  const handleSelectLocality = (locality: { name: string; latitude: number; longitude: number }) => {
    setViewState({ ...viewState, longitude: locality.longitude, latitude: locality.latitude, zoom: 15 });
    setSearchQuery(locality.name);
    setShowSearchResults(false);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;
    const results = await searchLocalities(searchQuery);
    if (results && results.length > 0) {
      setViewState({ ...viewState, longitude: results[0].longitude, latitude: results[0].latitude, zoom: 15 });
      setShowSearchResults(false);
      return;
    }
    if (MAP_PROVIDER === 'mapbox' && MAPBOX_TOKEN) {
      try {
        const resp = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?access_token=${MAPBOX_TOKEN}&proximity=${viewState.longitude},${viewState.latitude}`);
        const data = await resp.json();
        if (data.features?.length > 0) {
          const [lng, lat] = data.features[0].center;
          setViewState({ ...viewState, longitude: lng, latitude: lat, zoom: 16 });
        }
      } catch (err) { console.error("Geocoding failed:", err); }
    }
  };

  const handleAddPropertySubmit = async (data: any) => {
    setLoading(true);
    const payload = { ...data, lat: viewState.latitude, lng: viewState.longitude, ipHash };
    const result = await deployNode(payload);
    if (result.error) { alert(result.error); setLoading(false); }
    else { setIsAddingProperty(false); setShowShareModal(true); fetchIntel(); }
  };

  const handleSeekerSubmit = async (data: any) => {
    const result = await dropSeekerPin({ ...data, ipHash });
    if (result.error) { alert(result.error); }
    else { setShowSeekerForm(false); setIsSeekerMode(false); fetchIntel(); }
  };

  const handleMapClick = (e: any) => {
    if (areaStatsStep === 1) {
      const lat = e.lngLat?.lat || e.detail?.latLng?.lat;
      const lng = e.lngLat?.lng || e.detail?.latLng?.lng;
      if (lat && lng) { setAreaCorner1({ lat, lng }); setAreaStatsStep(2); }
    } else if (areaStatsStep === 2 && areaCorner1) {
      const lat = e.lngLat?.lat || e.detail?.latLng?.lat;
      const lng = e.lngLat?.lng || e.detail?.latLng?.lng;
      if (lat && lng) {
        setAreaStatsBounds({ minLat: Math.min(areaCorner1.lat, lat), maxLat: Math.max(areaCorner1.lat, lat), minLng: Math.min(areaCorner1.lng, lng), maxLng: Math.max(areaCorner1.lng, lng) });
        setShowAreaStats(true);
        setAreaStatsStep(0);
        setAreaCorner1(null);
      }
    } else if (isSeekerMode) {
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

  const calculateDecay = (updatedAt: string) => {
    if (!updatedAt) return false;
    return (Date.now() - new Date(updatedAt).getTime()) > (1000 * 60 * 60 * 24 * 30 * 6);
  };

  const getMarkerColor = (category: string, pinIpHash: string) => {
    if (pinIpHash && pinIpHash === ipHash) return 'border-emerald-400';
    if (category === 'gated') return 'border-blue-400';
    return 'border-orange-400';
  };

  const AliveMarker = ({ prop, onClick }: { prop: any; onClick: () => void }) => {
    const isStale = calculateDecay(prop.updatedAt);
    const isOwn = prop.ipHash && prop.ipHash === ipHash;
    const colorClass = getMarkerColor(prop.category, prop.ipHash);
    return (
      <motion.button whileHover={{ scale: 1.05 }} className={`group focus:outline-none ${isStale ? 'grayscale opacity-60' : ''}`} onClick={onClick}>
        <div className="flex flex-col items-center">
          <div className={`flex items-center gap-1.5 p-1 pr-2.5 bg-surface rounded-full border ${colorClass} shadow-2xl transition-all group-hover:shadow-primary/40 group-hover:-translate-y-1`}>
            <div className={`w-7 h-7 rounded-full overflow-hidden border-2 ${colorClass}`}>
              <img src={prop.user.image} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[10px] font-black text-on-surface leading-none font-technical">{prop.rent}</span>
              <div className="flex items-center gap-1 mt-0.5">
                {prop.flatmateNeeded && <span className="text-[7px] bg-emerald-400/20 text-emerald-400 px-1 rounded font-black">FM</span>}
                {isOwn && <span className="text-[7px] bg-primary/20 text-primary px-1 rounded font-black">YOU</span>}
                {!prop.flatmateNeeded && !isOwn && (
                  <>
                    <div className={`w-1 h-1 rounded-full ${isStale ? 'bg-gray-500' : 'bg-secondary animate-pulse'}`} />
                    <span className="text-[7px] uppercase font-black tracking-widest text-on-surface-variant opacity-40">{isStale ? 'Stale' : 'Live'}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="w-px h-5 bg-gradient-to-b from-primary/50 to-transparent" />
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
    <div className="h-screen w-full overflow-hidden bg-background relative selection:bg-primary/20 selection:text-primary">
      {/* Map */}
      <div className="absolute inset-0 z-0">
        {MAP_PROVIDER === 'mapbox' ? (
          <MapboxMap {...viewState} ref={mapRef} onMove={evt => setViewState(evt.viewState)} onClick={handleMapClick} style={{ width: '100%', height: '100%' }} mapStyle="mapbox://styles/mapbox/dark-v11" mapboxAccessToken={MAPBOX_TOKEN}>
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

            {/* Listing Clusters & Markers */}
            {clusters.map((cluster) => {
              const [longitude, latitude] = cluster.geometry.coordinates;
              const { cluster: isCluster, point_count: pointCount } = cluster.properties;
              if (isCluster) {
                return (
                  <MapboxMarker key={`cluster-${cluster.id}`} longitude={longitude} latitude={latitude}>
                    <div className="flex items-center justify-center bg-primary text-background rounded-full font-black text-xs shadow-[0_0_20px_rgba(0,102,255,0.6)] cursor-pointer border-2 border-white/20" style={{ width: `${30 + (pointCount / filteredPoints.length) * 40}px`, height: `${30 + (pointCount / filteredPoints.length) * 40}px` }} onClick={() => { const z = Math.min(supercluster.getClusterExpansionZoom(cluster.id), 20); setViewState({ ...viewState, longitude, latitude, zoom: z }); }}>
                      {pointCount}
                    </div>
                  </MapboxMarker>
                );
              }
              return (
                <MapboxMarker key={`prop-${cluster.properties.propertyId}`} longitude={longitude} latitude={latitude} anchor="bottom">
                  <AliveMarker prop={cluster.properties} onClick={() => setSelectedProperty({ ...cluster.properties, id: cluster.properties.propertyId })} />
                </MapboxMarker>
              );
            })}
          </MapboxMap>
        ) : (
          <APIProvider apiKey={GOOGLE_MAPS_API_KEY!}>
            <GoogleMap defaultCenter={{ lat: viewState.latitude, lng: viewState.longitude }} defaultZoom={viewState.zoom} mapId="TACTICAL_HUD_MAP" disableDefaultUI={true} onCameraChanged={(ev) => setViewState({ ...viewState, latitude: ev.detail.center.lat, longitude: ev.detail.center.lng, zoom: ev.detail.zoom })} style={{ width: '100%', height: '100%' }}>
              {filteredPoints.map((p) => (
                <AdvancedMarker key={p.properties.propertyId} position={{ lat: p.geometry.coordinates[1], lng: p.geometry.coordinates[0] }} onClick={() => setSelectedProperty({ ...p.properties, id: p.properties.propertyId })}>
                  <AliveMarker prop={p.properties} onClick={() => setSelectedProperty({ ...p.properties, id: p.properties.propertyId })} />
                </AdvancedMarker>
              ))}
            </GoogleMap>
          </APIProvider>
        )}
      </div>

      {/* Area Stats Step Indicator */}
      {areaStatsStep > 0 && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-primary text-background px-4 py-2 rounded-lg font-technical text-[10px] font-black uppercase tracking-widest shadow-xl">
          {areaStatsStep === 1 ? 'Tap to set first corner' : 'Tap again to set opposite corner'}
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
          <div className="max-w-5xl w-full flex justify-between items-center pointer-events-auto h-14 bg-background/5 backdrop-blur-xl rounded-lg border border-white/10 shadow-2xl px-4 md:px-6">
            <Link href="/" className="font-display text-lg text-primary font-black tracking-tighter cursor-pointer uppercase">indian.rent</Link>
            <div className="hidden md:flex items-center gap-3 flex-1 justify-center max-w-md mx-6">
              <form onSubmit={handleSearch} className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface opacity-30" size={14} />
                <input className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-9 pr-4 text-on-surface focus:bg-white/10 transition-all placeholder:text-on-surface-variant/40 font-medium text-xs tracking-wide uppercase outline-none" placeholder="Search localities..." value={searchQuery} onChange={(e) => handleSearchInput(e.target.value)} onFocus={() => searchResults.length > 0 && setShowSearchResults(true)} onBlur={() => setTimeout(() => setShowSearchResults(false), 200)} type="text" />
                {showSearchResults && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-surface border border-white/10 rounded-lg shadow-2xl overflow-hidden z-[100]">
                    {searchResults.map((loc, i) => (
                      <button key={i} type="button" className="w-full px-4 py-3 text-left text-xs font-medium text-on-surface hover:bg-white/5 transition-colors flex items-center gap-3 border-b border-white/5 last:border-0" onMouseDown={() => handleSelectLocality(loc)}>
                        <MapPinIcon size={14} className="text-primary shrink-0" />
                        <span className="uppercase tracking-wider">{loc.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </form>
            </div>
            <div className="flex items-center gap-2 md:gap-4">
              <button onClick={() => setShowFilters(!showFilters)} className={`p-2 rounded-lg transition-all ${showFilters ? 'bg-primary/20 text-primary' : 'text-on-surface-variant hover:text-primary'}`} title="Filters"><SlidersHorizontal size={16} /></button>
              <button onClick={() => setShowMetro(!showMetro)} className={`p-2 rounded-lg transition-all ${showMetro ? 'bg-primary/20 text-primary' : 'text-on-surface-variant hover:text-primary'}`} title="Metro"><Train size={16} /></button>
              <button onClick={() => { setAreaStatsStep(1); }} className={`p-2 rounded-lg transition-all ${areaStatsStep > 0 ? 'bg-primary/20 text-primary' : 'text-on-surface-variant hover:text-primary'}`} title="Area Stats"><BarChart3 size={16} /></button>
              <button onClick={() => setShowLiveStats(!showLiveStats)} className={`p-2 rounded-lg transition-all ${showLiveStats ? 'bg-primary/20 text-primary' : 'text-on-surface-variant hover:text-primary'}`} title="Live Stats"><BarChart3 size={16} /></button>
              <div className="w-px h-4 bg-white/10 hidden md:block" />
              <button onClick={() => { setIsSeekerMode(!isSeekerMode); setShowSeekerForm(false); }} className={`p-2 rounded-lg transition-all ${isSeekerMode ? 'bg-emerald-400/20 text-emerald-400' : 'text-on-surface-variant hover:text-emerald-400'}`} title="Flat Hunt"><Users size={16} /></button>
              <button onClick={fetchIntel} className={`text-primary transition-all active:rotate-180 ${loading ? 'animate-spin' : ''}`}><RefreshCcw size={16} strokeWidth={2.5} /></button>
              <button onClick={handleLocateMe} className="text-on-surface-variant hover:text-primary transition-colors"><Navigation size={16} /></button>
            </div>
          </div>
        </header>
      )}

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
        {showAreaStats && areaStatsBounds && <AreaStatsModal bounds={areaStatsBounds} onClose={() => { setShowAreaStats(false); setAreaStatsBounds(null); }} />}
      </AnimatePresence>

      {/* Add Property Sidebar */}
      <AnimatePresence>
        {isAddingProperty && (
          <div className="fixed inset-0 z-[100] flex items-center justify-start pointer-events-none">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAddingProperty(false)} className="absolute inset-0 bg-black/70 backdrop-blur-sm pointer-events-auto" />
            <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="relative w-full md:w-[420px] h-full bg-surface border-r border-white/10 shadow-3xl pointer-events-auto overflow-hidden flex flex-col">
              <div className="flex-1 overflow-hidden">
                <AddPropertyForm onClose={() => setIsAddingProperty(false)} onSubmit={handleAddPropertySubmit} lat={viewState.latitude} lng={viewState.longitude} />
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
              <button onClick={handleShare} className="w-full py-3 bg-primary text-on-primary rounded-lg font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-2 mb-3">
                <Share2 size={14} /> Copy Share Message
              </button>
              <button onClick={() => setShowShareModal(false)} className="w-full py-3 bg-white/5 border border-white/10 rounded-lg font-black uppercase tracking-[0.2em] text-[10px] text-on-surface-variant">Close</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating FAB */}
      {!isAddingProperty && !showSeekerForm && (
        <div className="hidden lg:block fixed bottom-12 right-12 z-50">
          <motion.button whileHover={{ scale: 1.05, y: -5 }} whileTap={{ scale: 0.95 }} onClick={() => setIsAddingProperty(true)} className="bg-primary text-on-primary w-16 h-16 rounded-lg shadow-[0_30px_60px_-10px_rgba(0,102,255,0.4)] flex items-center justify-center border border-white/30">
            <Plus size={30} strokeWidth={3} />
          </motion.button>
        </div>
      )}

      {/* Detail Card */}
      <AnimatePresence>
        {selectedProperty && !isAddingProperty && !showSeekerForm && (
          <motion.div initial={{ opacity: 0, x: 50, scale: 0.95 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: 50, scale: 0.95 }} className="absolute right-4 md:right-8 top-24 w-[calc(100%-2rem)] md:w-[380px] bg-surface rounded-lg overflow-hidden z-30 shadow-[0_40px_100px_-15px_rgba(0,0,0,0.7)] flex flex-col border border-white/10 p-1">
            <div className="bg-background/80 rounded-lg flex flex-col">
              <div className="h-48 relative m-2 rounded-lg overflow-hidden border border-white/5">
                <img alt={selectedProperty.name} className="w-full h-full object-cover" src={selectedProperty.image} />
                <div className="absolute top-3 right-3 bg-background/80 backdrop-blur-md border border-white/20 rounded-full px-3 py-1 flex items-center gap-1.5 shadow-lg">
                  <span className={`w-2 h-2 rounded-full ${calculateDecay(selectedProperty.updatedAt) ? 'bg-gray-500' : 'bg-secondary animate-pulse'}`} />
                  <span className="font-technical text-[8px] text-on-surface uppercase font-black tracking-widest">{calculateDecay(selectedProperty.updatedAt) ? 'Stale' : 'Live'}</span>
                </div>
                <button onClick={() => setSelectedProperty(null)} className="absolute top-3 left-3 bg-background/80 backdrop-blur-md border border-white/20 rounded-lg p-1.5 text-on-surface hover:bg-white/20 transition-all"><X size={14} /></button>
              </div>
              <div className="p-6 text-left">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-2xl font-black text-on-surface tracking-tighter leading-none uppercase font-display">{selectedProperty.name}</h3>
                  <button className="text-on-surface-variant hover:text-primary transition-colors p-2 rounded-lg border border-white/10"><Heart size={16} /></button>
                </div>
                <div className="flex items-center gap-2 mb-6">
                  <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${selectedProperty.category === 'gated' ? 'bg-blue-500/20 text-blue-400' : 'bg-orange-500/20 text-orange-400'}`}>{selectedProperty.category}</span>
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
                {selectedProperty.ipHash === ipHash && (
                  <button onClick={() => handleDeletePin(selectedProperty.id)} className="w-full py-3 bg-red-500/10 border border-red-500/20 rounded-lg font-black text-red-400 uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-2 transition-all hover:bg-red-500/20">
                    <Trash2 size={12} /> Delete My Pin
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Nav */}
      <nav className="lg:hidden fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] z-[60] flex justify-around items-center p-1.5 bg-background/60 backdrop-blur-2xl border border-white/10 shadow-3xl rounded-lg">
        <button className="flex flex-col items-center justify-center text-primary bg-primary/10 rounded-lg p-2.5 flex-1 transition-all active:scale-90 border border-primary/20"><MapPinIcon size={18} /><span className="font-technical text-[7px] mt-0.5 font-black uppercase tracking-widest">Grid</span></button>
        <button onClick={() => setIsSeekerMode(!isSeekerMode)} className={`flex flex-col items-center justify-center p-2.5 flex-1 transition-all active:scale-90 rounded-lg ${isSeekerMode ? 'text-emerald-400 bg-emerald-400/10' : 'text-on-surface-variant'}`}><Users size={18} /><span className="font-technical text-[7px] mt-0.5 font-black uppercase tracking-widest">Hunt</span></button>
        <button onClick={() => setIsAddingProperty(true)} className="flex flex-col items-center justify-center text-on-surface-variant p-2.5 flex-1 transition-all active:scale-90">
          <div className="w-9 h-9 bg-primary text-on-primary rounded-md flex items-center justify-center shadow-lg"><Plus size={18} strokeWidth={3} /></div>
        </button>
        <button onClick={() => setShowLiveStats(!showLiveStats)} className="flex flex-col items-center justify-center text-on-surface-variant p-2.5 flex-1 transition-all active:scale-90"><BarChart3 size={18} /><span className="font-technical text-[7px] mt-0.5 font-black uppercase tracking-widest opacity-40">Stats</span></button>
        <button onClick={() => setShowFilters(!showFilters)} className="flex flex-col items-center justify-center text-on-surface-variant p-2.5 flex-1 transition-all active:scale-90"><SlidersHorizontal size={18} /><span className="font-technical text-[7px] mt-0.5 font-black uppercase tracking-widest opacity-40">Filter</span></button>
      </nav>
    </div>
  );
}
