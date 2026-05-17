'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Map as MapboxMap, NavigationControl as MapboxNavigationControl, Marker as MapboxMarker } from 'react-map-gl';
import { APIProvider, Map as GoogleMap, AdvancedMarker } from '@vis.gl/react-google-maps';
import { motion, AnimatePresence } from 'framer-motion';
import 'mapbox-gl/dist/mapbox-gl.css';
import useSupercluster from 'use-supercluster';
import AddPropertyForm from './AddPropertyForm';
import Link from 'next/link';
import { Plus, RefreshCcw, Search, MapPin as MapPinIcon, Heart, Link as LinkIcon, Award, X, Settings, Crosshair, Navigation } from 'lucide-react';
import { getMapIntel, deployNode, searchLocalities } from '@/app/actions/map-actions';
import { createBrowserClient } from '@supabase/ssr';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const MAP_PROVIDER = process.env.NEXT_PUBLIC_MAP_PROVIDER || 'mapbox';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const MOCK_INTEL = [
  {
    id: '1',
    name: 'Banjara Hills Residence',
    category: 'semi-gated',
    lat: 17.4156,
    lng: 78.4347,
    rent: '\u20B945,000',
    deposit: '2 Months',
    reward: '\u20B92,500',
    floor: '4th Floor',
    verified: true,
    user: { name: 'Rahul S.', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop' },
    image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=800&auto=format&fit=crop'
  },
  {
    id: '2',
    name: 'Jubilee Towers',
    category: 'gated',
    lat: 17.4284,
    lng: 78.4121,
    rent: '\u20B985,000',
    deposit: '3 Months',
    reward: '\u20B95,000',
    floor: '12th Floor',
    verified: true,
    user: { name: 'Priya D.', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop' },
    image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=800&auto=format&fit=crop'
  }
];

export default function RefinedMapEngine() {
  const [points, setPoints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [isAddingProperty, setIsAddingProperty] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const mapRef = useRef<any>(null);
  const [viewState, setViewState] = useState({
    longitude: 78.4347,
    latitude: 17.4156,
    zoom: 13,
    pitch: 45
  });

  const processIntelData = useCallback((data: any[]) => {
    if (data && data.length > 0) {
      const featurePoints = data.map((b: any) => ({
        type: "Feature",
        properties: {
          cluster: false,
          propertyId: b.id,
          category: b.category,
          name: b.name,
          rent: b.floors?.[0]?.flats?.[0]?.rent_amount ? `\u20B9${b.floors[0].flats[0].rent_amount.toLocaleString()}` : '\u20B945,000',
          updatedAt: b.updated_at || b.floors?.[0]?.flats?.[0]?.updated_at,
          image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=800&auto=format&fit=crop',
          user: { name: 'User', image: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop' }
        },
        geometry: {
          type: "Point",
          coordinates: [parseFloat(b.location.coordinates[0]), parseFloat(b.location.coordinates[1])]
        }
      }));
      setPoints(featurePoints);
    } else {
      setPoints(MOCK_INTEL.map(m => ({
        type: "Feature",
        properties: { ...m, propertyId: m.id },
        geometry: { type: "Point", coordinates: [m.lng, m.lat] }
      })));
    }
  }, []);

  const fetchIntel = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMapIntel();
      processIntelData(data);
    } catch (err) {
      console.error('Intel Fetch Failed:', err);
    } finally {
      setLoading(false);
    }
  }, [processIntelData]);

  useEffect(() => {
    fetchIntel();
  }, [fetchIntel]);

  // Supabase Realtime: subscribe to map_snapshot changes for live updates
  useEffect(() => {
    if (!supabaseUrl || !supabaseAnonKey) return;

    const client = createBrowserClient(supabaseUrl, supabaseAnonKey);
    const channel = client
      .channel('map-snapshot-changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'map_snapshot', filter: 'id=eq.1' },
        (payload) => {
          if (payload.new && (payload.new as any).data) {
            processIntelData((payload.new as any).data);
          }
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, [processIntelData]);

  const bounds = mapRef.current ? (
      MAP_PROVIDER === 'mapbox'
      ? mapRef.current.getMap().getBounds().toArray().flat()
      : null
  ) : null;

  const { clusters, supercluster } = useSupercluster({
    points,
    bounds,
    zoom: viewState.zoom,
    options: { radius: 75, maxZoom: 20 }
  });

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    navigator.geolocation.getCurrentPosition((pos) => {
      setViewState({
        ...viewState,
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        zoom: 16
      });
    });
  };

  const handleSearchInput = async (value: string) => {
    setSearchQuery(value);
    if (value.length >= 2) {
      const results = await searchLocalities(value);
      setSearchResults(results);
      setShowSearchResults(results.length > 0);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  };

  const handleSelectLocality = (locality: { name: string; latitude: number; longitude: number }) => {
    setViewState({ ...viewState, longitude: locality.longitude, latitude: locality.latitude, zoom: 15 });
    setSearchQuery(locality.name);
    setShowSearchResults(false);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;

    // First try local localities search (free, no API key needed)
    const results = await searchLocalities(searchQuery);
    if (results && results.length > 0) {
      setViewState({ ...viewState, longitude: results[0].longitude, latitude: results[0].latitude, zoom: 15 });
      setShowSearchResults(false);
      return;
    }

    // Fallback to Mapbox geocoding only if local search returns nothing
    if (MAP_PROVIDER === 'mapbox' && MAPBOX_TOKEN) {
      try {
        const resp = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?access_token=${MAPBOX_TOKEN}&proximity=${viewState.longitude},${viewState.latitude}`);
        const data = await resp.json();
        if (data.features && data.features.length > 0) {
          const [lng, lat] = data.features[0].center;
          setViewState({ ...viewState, longitude: lng, latitude: lat, zoom: 16 });
        }
      } catch (err) {
        console.error("Geocoding failed:", err);
      }
    }
  };

  const handleAddPropertySubmit = async (data: any) => {
    setLoading(true);
    const payload = { ...data, lat: viewState.latitude, lng: viewState.longitude };
    const result = await deployNode(payload);
    if (result.error) {
      alert(result.error);
      setLoading(false);
    } else {
      setIsAddingProperty(false);
      fetchIntel();
    }
  };

  const calculateDecay = (updatedAt: string) => {
    if (!updatedAt) return false;
    const lastUpdate = new Date(updatedAt).getTime();
    const now = new Date().getTime();
    const sixMonths = 1000 * 60 * 60 * 24 * 30 * 6;
    return (now - lastUpdate) > sixMonths;
  };

  const AliveMarker = ({ prop, onClick }: { prop: any, onClick: () => void }) => {
    const isStale = calculateDecay(prop.updatedAt);
    return (
        <motion.button
            whileHover={{ scale: 1.05 }}
            className={`group focus:outline-none ${isStale ? 'grayscale opacity-60' : ''}`}
            onClick={onClick}
        >
          <div className="flex flex-col items-center">
             <div className="flex items-center gap-1.5 p-1 pr-2.5 bg-surface rounded-full border border-white/10 shadow-2xl transition-all group-hover:shadow-primary/40 group-hover:-translate-y-1">
                <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-primary/20">
                  <img src={prop.user.image} alt={prop.user.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[10px] font-black text-on-surface leading-none font-technical">{prop.rent}</span>
                  <div className="flex items-center gap-1 mt-0.5">
                     <div className={`w-1 h-1 rounded-full ${isStale ? 'bg-gray-500' : 'bg-secondary animate-pulse shadow-[0_0_5px_rgba(16,185,129,1)]'}`} />
                     <span className="text-[7px] uppercase font-black tracking-widest text-on-surface-variant opacity-40">{isStale ? 'Stale Intel' : 'Active'}</span>
                  </div>
                </div>
             </div>
             <div className="w-px h-6 bg-gradient-to-b from-primary/50 to-transparent shadow-[0_0_10px_rgba(179,197,255,0.5)]" />
          </div>
        </motion.button>
    );
  };

  // RENDER LOGIC
  if (MAP_PROVIDER === 'mapbox' && !MAPBOX_TOKEN) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-background text-on-surface p-8 text-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="skeuo-raised glass-plate rounded-lg p-12 max-w-md border border-white/10 shadow-2xl bg-surface/50">
          <div className="font-technical text-primary mb-6 uppercase tracking-[0.4em] font-black text-xs">Access Required</div>
          <h2 className="text-headline-lg font-black uppercase mb-6 tracking-tighter text-on-background">Satellite Link Offline</h2>
          <Link href="/" className="inline-block py-5 px-10 bg-primary text-on-primary rounded-DEFAULT font-black uppercase tracking-widest text-[10px] active:scale-95 transition-all font-technical">Return to HQ</Link>
        </motion.div>
      </div>
    );
  }

  if (MAP_PROVIDER === 'google' && !GOOGLE_MAPS_API_KEY) {
      return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-background text-on-surface p-8 text-center">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="skeuo-raised glass-plate rounded-lg p-12 max-w-md border border-white/10 shadow-2xl bg-surface/50">
            <div className="font-technical text-primary mb-6 uppercase tracking-[0.4em] font-black text-xs">Access Required</div>
            <h2 className="text-headline-lg font-black uppercase mb-6 tracking-tighter text-on-background">Google Auth Offline</h2>
            <p className="text-body-md text-on-surface-variant mb-8 opacity-60 font-medium leading-relaxed">Provide <code className="bg-white/10 px-2 py-1 rounded text-primary">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code></p>
            <Link href="/" className="inline-block py-5 px-10 bg-primary text-on-primary rounded-DEFAULT font-black uppercase tracking-widest text-[10px] active:scale-95 transition-all font-technical">Return to HQ</Link>
          </motion.div>
        </div>
      );
  }

  return (
    <div className="h-screen w-full overflow-hidden bg-background relative selection:bg-primary/20 selection:text-primary">
      {/* Map Area */}
      <div className="absolute inset-0 z-0">
        {MAP_PROVIDER === 'mapbox' ? (
            <MapboxMap
              {...viewState}
              ref={mapRef}
              onMove={evt => setViewState(evt.viewState)}
              style={{ width: '100%', height: '100%' }}
              mapStyle="mapbox://styles/mapbox/dark-v11"
              mapboxAccessToken={MAPBOX_TOKEN}
            >
              <MapboxNavigationControl position="top-right" />

              {clusters.map((cluster) => {
                const [longitude, latitude] = cluster.geometry.coordinates;
                const { cluster: isCluster, point_count: pointCount } = cluster.properties;

                if (isCluster) {
                  return (
                    <MapboxMarker key={`cluster-${cluster.id}`} longitude={longitude} latitude={latitude}>
                      <div
                        className="flex items-center justify-center bg-primary text-background rounded-full font-black text-xs shadow-[0_0_20px_rgba(0,102,255,0.6)] cursor-pointer border-2 border-white/20"
                        style={{ width: `${30 + (pointCount / points.length) * 40}px`, height: `${30 + (pointCount / points.length) * 40}px` }}
                        onClick={() => {
                          const expansionZoom = Math.min(supercluster.getClusterExpansionZoom(cluster.id), 20);
                          setViewState({ ...viewState, longitude, latitude, zoom: expansionZoom });
                        }}
                      >
                        {pointCount}
                      </div>
                    </MapboxMarker>
                  );
                }

                return (
                  <MapboxMarker
                    key={`prop-${cluster.properties.propertyId}`}
                    longitude={longitude}
                    latitude={latitude}
                    anchor="bottom"
                  >
                    <AliveMarker
                        prop={cluster.properties}
                        onClick={() => setSelectedProperty({ ...cluster.properties, id: cluster.properties.propertyId })}
                    />
                  </MapboxMarker>
                );
              })}
            </MapboxMap>
        ) : (
            <APIProvider apiKey={GOOGLE_MAPS_API_KEY!}>
                <GoogleMap
                    defaultCenter={{ lat: viewState.latitude, lng: viewState.longitude }}
                    defaultZoom={viewState.zoom}
                    mapId="TACTICAL_HUD_MAP"
                    disableDefaultUI={true}
                    onCameraChanged={(ev) => {
                        setViewState({
                            ...viewState,
                            latitude: ev.detail.center.lat,
                            longitude: ev.detail.center.lng,
                            zoom: ev.detail.zoom
                        });
                    }}
                    style={{ width: '100%', height: '100%' }}
                >
                    {points.map((p) => (
                        <AdvancedMarker
                            key={p.properties.propertyId}
                            position={{ lat: p.geometry.coordinates[1], lng: p.geometry.coordinates[0] }}
                            onClick={() => setSelectedProperty({ ...p.properties, id: p.properties.propertyId })}
                        >
                            <AliveMarker
                                prop={p.properties}
                                onClick={() => setSelectedProperty({ ...p.properties, id: p.properties.propertyId })}
                            />
                        </AdvancedMarker>
                    ))}
                </GoogleMap>
            </APIProvider>
        )}
      </div>

      {/* Target Reticle for Deployment */}
      <AnimatePresence>
        {isAddingProperty && (
          <motion.div initial={{ opacity: 0, scale: 2 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 2 }} className="fixed inset-0 flex items-center justify-center z-10 pointer-events-none">
            <div className="relative">
                <Crosshair className="text-primary w-12 h-12 animate-pulse" strokeWidth={1} />
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-4 px-3 py-1 bg-primary text-background font-technical text-[9px] font-black uppercase tracking-widest rounded-sm whitespace-nowrap shadow-xl">Targeting Sector: {viewState.latitude.toFixed(4)}, {viewState.longitude.toFixed(4)}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top HUD */}
      {!isAddingProperty && (
        <header className="fixed top-0 w-full z-50 flex justify-center h-20 px-mobile md:px-desktop pointer-events-none pt-4 font-technical">
          <div className="max-w-container w-full flex justify-between items-center pointer-events-auto h-16 bg-background/5 backdrop-blur-xl rounded-DEFAULT border border-white/10 shadow-2xl px-8">
            <Link href="/" className="font-display text-xl text-primary font-black tracking-tighter cursor-pointer uppercase">indian.rent</Link>
            <div className="hidden md:flex items-center gap-4 flex-1 justify-center max-w-xl mx-12">
              <form onSubmit={handleSearch} className="relative w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface opacity-30" size={16} />
                <input
                    className="w-full bg-white/5 border border-white/10 rounded-DEFAULT py-2.5 pl-10 pr-6 text-on-surface focus:bg-white/10 transition-all placeholder:text-on-surface-variant/40 font-medium text-xs tracking-wide uppercase outline-none"
                    placeholder="Search localities..."
                    value={searchQuery}
                    onChange={(e) => handleSearchInput(e.target.value)}
                    onFocus={() => searchResults.length > 0 && setShowSearchResults(true)}
                    onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
                    type="text"
                />
                {/* Locality search dropdown */}
                {showSearchResults && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-surface border border-white/10 rounded-lg shadow-2xl overflow-hidden z-[100]">
                    {searchResults.map((loc, i) => (
                      <button
                        key={i}
                        type="button"
                        className="w-full px-4 py-3 text-left text-xs font-medium text-on-surface hover:bg-white/5 transition-colors flex items-center gap-3 border-b border-white/5 last:border-0"
                        onMouseDown={() => handleSelectLocality(loc)}
                      >
                        <MapPinIcon size={14} className="text-primary shrink-0" />
                        <span className="uppercase tracking-wider">{loc.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </form>
            </div>
            <div className="flex items-center gap-6">
              <button onClick={fetchIntel} className={`text-primary transition-all active:rotate-180 ${loading ? 'animate-spin' : ''}`}><RefreshCcw size={18} strokeWidth={2.5} /></button>
              <div className="w-px h-4 bg-white/10 mx-2" />
              <button onClick={handleLocateMe} className="text-on-surface-variant hover:text-primary transition-colors"><Navigation size={18} /></button>
            </div>
          </div>
        </header>
      )}

      {/* Sidebar Form Overlay */}
      <AnimatePresence>
        {isAddingProperty && (
          <div className="fixed inset-0 z-[100] flex items-center justify-start pointer-events-none">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAddingProperty(false)} className="absolute inset-0 bg-black/70 backdrop-blur-sm pointer-events-auto" />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full md:w-[450px] h-full bg-surface border-r border-white/10 shadow-3xl pointer-events-auto overflow-hidden flex flex-col"
            >
               <div className="p-6 border-b border-white/5 bg-surface-container-low flex justify-between items-center">
                 <div className="font-display font-black text-xl text-primary tracking-tighter uppercase leading-none">Deployment HQ</div>
                 <button onClick={() => setIsAddingProperty(false)} className="p-2 rounded-lg hover:bg-white/5 text-on-surface-variant transition-colors"><X size={20} /></button>
              </div>
              <div className="flex-1 overflow-hidden">
                <AddPropertyForm onClose={() => setIsAddingProperty(false)} onSubmit={handleAddPropertySubmit} lat={viewState.latitude} lng={viewState.longitude} />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating FAB */}
      {!isAddingProperty && (
        <div className="hidden lg:block fixed bottom-12 right-12 z-50">
          <motion.button whileHover={{ scale: 1.05, y: -5 }} whileTap={{ scale: 0.95 }} onClick={() => setIsAddingProperty(true)} className="bg-primary text-on-primary w-20 h-20 rounded-DEFAULT shadow-[0_30px_60px_-10px_rgba(0,102,255,0.4)] flex items-center justify-center glow-primary hover:bg-primary-fixed transition-all border border-white/30 skeuo-raised">
            <Plus size={36} strokeWidth={3} />
          </motion.button>
        </div>
      )}

      {/* Detail Card Overlay */}
      <AnimatePresence>
        {selectedProperty && !isAddingProperty && (
          <motion.div initial={{ opacity: 0, x: 50, scale: 0.95 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: 50, scale: 0.95 }} className="absolute right-4 md:right-12 top-28 w-[calc(100%-2rem)] md:w-[420px] bg-surface rounded-lg overflow-hidden z-30 shadow-[0_40px_100px_-15px_rgba(0,0,0,0.7)] flex flex-col border border-white/10 p-1">
            <div className="bg-background/80 rounded-lg flex flex-col">
              <div className="h-56 md:h-64 relative m-2 rounded-lg overflow-hidden border border-white/5 shadow-inner">
                <img alt={selectedProperty.name} className="w-full h-full object-cover" src={selectedProperty.image} />
                <div className="absolute top-4 right-4 bg-background/80 backdrop-blur-md border border-white/20 rounded-full px-4 py-1.5 flex items-center gap-2 shadow-lg glow-secondary">
                  <span className={`w-2 h-2 rounded-full ${calculateDecay(selectedProperty.updatedAt) ? 'bg-gray-500' : 'bg-secondary animate-pulse shadow-[0_0_10px_#2ff801]'}`}></span>
                  <span className="font-technical text-[9px] text-on-surface uppercase font-black tracking-widest">{calculateDecay(selectedProperty.updatedAt) ? 'Stale Intel' : 'Verified Target'}</span>
                </div>
                <button onClick={() => setSelectedProperty(null)} className="absolute top-4 left-4 bg-background/80 backdrop-blur-md border border-white/20 rounded-DEFAULT p-2 text-on-surface hover:bg-white/20 transition-all active:scale-90 shadow-lg"><X size={16} /></button>
              </div>
              <div className="p-8 text-left">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-3xl font-black text-on-surface tracking-tighter leading-none uppercase font-display">{selectedProperty.name}</h3>
                  <button className="text-on-surface-variant hover:text-primary transition-colors skeuo-raised p-2.5 rounded-lg border border-white/10 glass-plate"><Heart size={20} /></button>
                </div>
                <p className="text-on-surface-variant text-[10px] mb-8 font-black uppercase tracking-[0.3em] opacity-40 font-technical">{selectedProperty.category} // LVL {selectedProperty.floor}</p>
                <div className="grid grid-cols-2 gap-6 mb-10">
                  <div className="skeuo-raised glass-plate p-5 rounded-lg border-white/10 bg-white/5">
                    <div className="text-[10px] uppercase tracking-widest mb-2 font-black opacity-40 font-technical">Rent Protocol</div>
                    <div className="text-primary font-black text-3xl tracking-tighter">{selectedProperty.rent}<span className="text-xs text-on-surface-variant font-normal tracking-normal ml-1 font-sans opacity-50">/MO</span></div>
                  </div>
                  <div className="skeuo-raised glass-plate p-5 rounded-lg border-white/10 bg-white/5 text-right">
                    <div className="text-[10px] uppercase tracking-widest mb-2 font-black opacity-40 font-technical text-right">Deposit Buffer</div>
                    <div className="text-on-surface font-black text-3xl tracking-tighter">{selectedProperty.deposit}</div>
                  </div>
                </div>
                <div className="skeuo-raised bg-primary/10 border border-primary/30 rounded-lg p-6 mb-10 flex items-center gap-6 shadow-inner relative overflow-hidden group">
                  <div className="bg-primary text-on-primary p-4 rounded-lg shadow-lg glow-primary relative z-10 border border-white/20"><Award size={28} strokeWidth={2.5} /></div>
                  <div className="relative z-10 text-left">
                    <div className="font-technical text-[10px] text-primary font-black uppercase tracking-[0.3em] mb-1 leading-none">Good Faith Reward</div>
                    <div className="text-on-surface font-black text-2xl tracking-tighter leading-none uppercase">{selectedProperty.reward} <span className="text-[10px] text-on-surface-variant font-bold tracking-[0.2em] ml-2 opacity-50">ON LOCK</span></div>
                  </div>
                </div>
                <Link href={`/flat/${selectedProperty.id}`} className="block w-full">
                  <button className="w-full py-6 bg-primary text-on-primary rounded-lg text-on-surface font-black transition-all skeuo-raised flex items-center justify-center gap-4 uppercase tracking-[0.3em] text-[10px] shadow-[0_20px_40px_-10px_rgba(0,102,255,0.4)] hover:shadow-[0_30px_60px_-10px_rgba(0,102,255,0.5)] border border-white/20 metallic-edge active:scale-[0.98]"><LinkIcon size={18} strokeWidth={3} /> Get Tactical Link</button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Nav */}
      <nav className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-sm z-[60] flex justify-around items-center p-2 bg-background/60 backdrop-blur-2xl border border-white/10 shadow-3xl rounded-DEFAULT">
        <button className="flex flex-col items-center justify-center text-primary bg-primary/10 rounded-DEFAULT p-3 flex-1 transition-all active:scale-90 border border-primary/20"><MapPinIcon size={20} /><span className="font-technical text-[8px] mt-1 font-black uppercase tracking-widest text-center">Grid</span></button>
        <button onClick={() => setIsAddingProperty(true)} className="flex flex-col items-center justify-center text-on-surface-variant p-3 flex-1 transition-all active:scale-90">
          <div className="w-10 h-10 bg-primary text-on-primary rounded-md flex items-center justify-center shadow-lg mb-1 glow-primary group-active:scale-95 transition-transform"><Plus size={20} strokeWidth={3} /></div>
        </button>
        <button className="flex flex-col items-center justify-center text-on-surface-variant p-3 flex-1 transition-all active:scale-90"><Settings size={20} /><span className="font-technical text-[8px] mt-1 font-black uppercase tracking-widest text-center opacity-40">HQ</span></button>
      </nav>
    </div>
  );
}
