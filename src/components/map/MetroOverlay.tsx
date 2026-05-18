'use client';

import React, { useState } from 'react';
import { Marker as MapboxMarker, Source, Layer } from 'react-map-gl';
import { AdvancedMarker, Pin } from '@vis.gl/react-google-maps';

// Detect map provider from environment
const MAP_PROVIDER = typeof window !== 'undefined' ?
  document.documentElement.getAttribute('data-map-provider') || 'google' : 'google';

const METRO_LINES = {
  // Bengaluru Metro Lines
  blr_purple: {
    name: 'Bengaluru Purple Line (YPR - JP Nagar)',
    color: '#a855f7',
    stations: [
      { name: 'Yaswantpur', lat: 13.0033, lng: 77.5740 },
      { name: 'Rajajinagar', lat: 13.0037, lng: 77.5641 },
      { name: 'Kuvempu Road', lat: 12.9970, lng: 77.5490 },
      { name: 'Dr. Ambedkar Veedhi', lat: 12.9850, lng: 77.5370 },
      { name: 'Vidhana Soudha', lat: 12.9850, lng: 77.5945 },
      { name: 'Cubbon Park', lat: 12.9840, lng: 77.5945 },
      { name: 'MG Road', lat: 12.9352, lng: 77.6287 },
      { name: 'Lavelle Road', lat: 12.9500, lng: 77.5900 },
      { name: 'Indiranagar', lat: 12.9716, lng: 77.6412 },
      { name: 'Trinity', lat: 12.9735, lng: 77.6430 },
      { name: 'JP Nagar', lat: 12.8808, lng: 77.6086 },
    ],
  },
  blr_green: {
    name: 'Bengaluru Green Line (WH - Nagavara)',
    color: '#22c55e',
    stations: [
      { name: 'Whitefield', lat: 12.9698, lng: 77.7499 },
      { name: 'Hoodi', lat: 12.9680, lng: 77.7200 },
      { name: 'Indiranagar', lat: 12.9716, lng: 77.6412 },
      { name: 'CV Raman Nagar', lat: 12.9640, lng: 77.6430 },
      { name: 'Silk Board', lat: 12.8450, lng: 77.6330 },
      { name: 'Jayadeva', lat: 12.8490, lng: 77.6240 },
      { name: 'Domlur', lat: 12.9800, lng: 77.6400 },
      { name: 'Nagavara', lat: 13.0050, lng: 77.6400 },
    ],
  },
  blr_red: {
    name: 'Bengaluru Red Line (Dum Dum - Chikballapur)',
    color: '#ef4444',
    stations: [
      { name: 'Peenya', lat: 13.0235, lng: 77.5307 },
      { name: 'Yeshwantpur', lat: 13.0185, lng: 77.5800 },
      { name: 'Malleswaram', lat: 13.0015, lng: 77.6000 },
      { name: 'Vijayanagar', lat: 13.0056, lng: 77.5735 },
      { name: 'Rashtriya Vidyapeeth', lat: 13.0050, lng: 77.5900 },
      { name: 'Majestic', lat: 12.9850, lng: 77.5945 },
      { name: 'MG Road', lat: 12.9352, lng: 77.6287 },
      { name: 'Koramangala', lat: 12.9352, lng: 77.6245 },
      { name: 'Sankey Road', lat: 13.0000, lng: 77.5800 },
    ],
  },

  // Hyderabad Metro Lines (existing)
  red: {
    name: 'Red Line (Miyapur - LB Nagar)',
    color: '#ef4444',
    stations: [
      { name: 'Miyapur', lat: 17.4969, lng: 78.3544 },
      { name: 'JNTU', lat: 17.4944, lng: 78.3731 },
      { name: 'KPHB', lat: 17.4938, lng: 78.3886 },
      { name: 'Kukatpally', lat: 17.4947, lng: 78.3996 },
      { name: 'Balanagar', lat: 17.4736, lng: 78.4421 },
      { name: 'Moosapet', lat: 17.4682, lng: 78.4322 },
      { name: 'Bharat Nagar', lat: 17.4595, lng: 78.4349 },
      { name: 'Erragadda', lat: 17.4522, lng: 78.4367 },
      { name: 'ESI Hospital', lat: 17.4473, lng: 78.4428 },
      { name: 'SR Nagar', lat: 17.4400, lng: 78.4515 },
      { name: 'Ameerpet', lat: 17.4375, lng: 78.4482 },
      { name: 'Punjagutta', lat: 17.4285, lng: 78.4517 },
      { name: 'Irrum Manzil', lat: 17.4217, lng: 78.4580 },
      { name: 'Khairatabad', lat: 17.4148, lng: 78.4600 },
      { name: 'Lakdi-ka-pul', lat: 17.4064, lng: 78.4675 },
      { name: 'Assembly', lat: 17.4007, lng: 78.4730 },
      { name: 'Nampally', lat: 17.3927, lng: 78.4771 },
      { name: 'Gandhi Bhavan', lat: 17.3874, lng: 78.4800 },
      { name: 'Osmania Medical', lat: 17.3817, lng: 78.4831 },
      { name: 'MG Bus Station', lat: 17.3782, lng: 78.4870 },
      { name: 'Malakpet', lat: 17.3680, lng: 78.5060 },
      { name: 'New Market', lat: 17.3649, lng: 78.5144 },
      { name: 'Musarambagh', lat: 17.3617, lng: 78.5199 },
      { name: 'Dilsukhnagar', lat: 17.3688, lng: 78.5260 },
      { name: 'Chaitanyapuri', lat: 17.3600, lng: 78.5356 },
      { name: 'Victoria Memorial', lat: 17.3547, lng: 78.5417 },
      { name: 'LB Nagar', lat: 17.3477, lng: 78.5479 },
    ],
  },
  blue: {
    name: 'Blue Line (Nagole - Raidurg)',
    color: '#3b82f6',
    stations: [
      { name: 'Nagole', lat: 17.3944, lng: 78.5632 },
      { name: 'Uppal', lat: 17.4053, lng: 78.5594 },
      { name: 'Stadium', lat: 17.4104, lng: 78.5440 },
      { name: 'NGRI', lat: 17.4150, lng: 78.5334 },
      { name: 'Habsiguda', lat: 17.4152, lng: 78.5234 },
      { name: 'Tarnaka', lat: 17.4261, lng: 78.5134 },
      { name: 'Mettuguda', lat: 17.4320, lng: 78.5040 },
      { name: 'Secunderabad East', lat: 17.4350, lng: 78.5000 },
      { name: 'Parade Ground', lat: 17.4430, lng: 78.4910 },
      { name: 'Paradise', lat: 17.4445, lng: 78.4822 },
      { name: 'Rasoolpura', lat: 17.4440, lng: 78.4748 },
      { name: 'Begumpet', lat: 17.4437, lng: 78.4707 },
      { name: 'Ameerpet', lat: 17.4375, lng: 78.4482 },
      { name: 'Madhura Nagar', lat: 17.4430, lng: 78.4360 },
      { name: 'Yousufguda', lat: 17.4380, lng: 78.4290 },
      { name: 'Road No. 5 Jubilee Hills', lat: 17.4319, lng: 78.4150 },
      { name: 'Jubilee Hills Check Post', lat: 17.4290, lng: 78.4071 },
      { name: 'Peddamma Temple', lat: 17.4350, lng: 78.3990 },
      { name: 'Madhapur', lat: 17.4420, lng: 78.3915 },
      { name: 'Durgam Cheruvu', lat: 17.4350, lng: 78.3830 },
      { name: 'Hitech City', lat: 17.4435, lng: 78.3772 },
      { name: 'Raidurg', lat: 17.4280, lng: 78.3800 },
    ],
  },
  green: {
    name: 'Green Line (JBS - MGBS)',
    color: '#22c55e',
    stations: [
      { name: 'JBS Parade Ground', lat: 17.4520, lng: 78.4910 },
      { name: 'Secunderabad West', lat: 17.4399, lng: 78.4983 },
      { name: 'Gandhi Hospital', lat: 17.4344, lng: 78.4910 },
      { name: 'Musheerabad', lat: 17.4260, lng: 78.4870 },
      { name: 'RTC Crossroads', lat: 17.4180, lng: 78.4830 },
      { name: 'Chikkadpally', lat: 17.4100, lng: 78.4830 },
      { name: 'Narayanguda', lat: 17.4000, lng: 78.4830 },
      { name: 'Sultan Bazaar', lat: 17.3900, lng: 78.4860 },
      { name: 'MG Bus Station', lat: 17.3782, lng: 78.4870 },
    ],
  },
};

interface MetroOverlayProps {
  visible: boolean;
}

export default function MetroOverlay({ visible }: MetroOverlayProps) {
  const [hoveredStation, setHoveredStation] = useState<string | null>(null);

  if (!visible) return null;

  // For Google Maps - render only markers
  if (MAP_PROVIDER !== 'mapbox') {
    return (
      <>
        {Object.entries(METRO_LINES).map(([lineId, line]) =>
          line.stations.map((station, i) => {
            const stationId = `${lineId}-${i}`;
            const isHovered = hoveredStation === stationId;
            return (
              <AdvancedMarker
                key={stationId}
                position={{ lat: station.lat, lng: station.lng }}
                title={station.name}
              >
                <button
                  onMouseEnter={() => setHoveredStation(stationId)}
                  onMouseLeave={() => setHoveredStation(null)}
                  onClick={() => setHoveredStation(isHovered ? null : stationId)}
                  className="group relative cursor-pointer p-1 rounded-full transition-transform hover:scale-125 active:scale-110"
                  title={station.name}
                >
                  <div
                    className="w-3 h-3 rounded-full border-2 border-white shadow-lg"
                    style={{ backgroundColor: line.color }}
                  />
                  {isHovered && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black/80 border border-white/20 rounded text-[8px] font-bold text-white whitespace-nowrap z-50">
                      {station.name}
                    </div>
                  )}
                </button>
              </AdvancedMarker>
            );
          })
        )}
      </>
    );
  }

  // For Mapbox - render lines and markers
  return (
    <>
      {Object.entries(METRO_LINES).map(([lineId, line]) => {
        const coordinates = line.stations.map(s => [s.lng, s.lat]);
        const geojson: GeoJSON.Feature = {
          type: 'Feature',
          properties: { name: line.name },
          geometry: { type: 'LineString', coordinates },
        };

        return (
          <React.Fragment key={lineId}>
            <Source id={`metro-line-${lineId}`} type="geojson" data={geojson}>
              <Layer
                id={`metro-line-layer-${lineId}`}
                type="line"
                paint={{
                  'line-color': line.color,
                  'line-width': 3,
                  'line-opacity': 0.8,
                }}
              />
            </Source>
            {line.stations.map((station, i) => {
              const stationId = `${lineId}-${i}`;
              const isHovered = hoveredStation === stationId;
              return (
                <MapboxMarker key={stationId} longitude={station.lng} latitude={station.lat} anchor="center">
                  <button
                    onMouseEnter={() => setHoveredStation(stationId)}
                    onMouseLeave={() => setHoveredStation(null)}
                    onClick={() => setHoveredStation(isHovered ? null : stationId)}
                    className="group relative cursor-pointer p-2 rounded-full transition-transform hover:scale-125 active:scale-110"
                    title={station.name}
                  >
                    <div className="w-4 h-4 rounded-full border-2 border-white shadow-lg" style={{ backgroundColor: line.color }} />
                    {isHovered && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-2.5 py-1.5 bg-surface/95 border border-white/20 rounded-lg text-[9px] sm:text-[10px] font-black text-on-surface whitespace-nowrap opacity-100 transition-opacity pointer-events-none shadow-xl z-20">
                        {station.name}
                      </div>
                    )}
                  </button>
                </MapboxMarker>
              );
            })}
          </React.Fragment>
        );
      })}
    </>
  );
}

export { METRO_LINES };
