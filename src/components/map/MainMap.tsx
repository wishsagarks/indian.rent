'use client';

import React, { useState } from 'react';
import Map, { NavigationControl, Marker } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

export default function MainMap() {
  const [viewState, setViewState] = useState({
    longitude: 78.4867,
    latitude: 17.3850,
    zoom: 12
  });

  if (!MAPBOX_TOKEN) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100 text-gray-500">
        Please set NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN in your .env.local file.
      </div>
    );
  }

  return (
    <div className="h-screen w-full overflow-hidden">
      <Map
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/streets-v11"
        mapboxAccessToken={MAPBOX_TOKEN}
      >
        <NavigationControl position="top-right" />
        
        {/* Placeholder Marker for Charminar area */}
        <Marker longitude={78.4744} latitude={17.3616} anchor="bottom">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg ring-2 ring-white">
            H
          </div>
        </Marker>
      </Map>
    </div>
  );
}
