'use client';

import React from 'react';
import { Marker as MapboxMarker, Source, Layer } from 'react-map-gl';

const METRO_LINES = {
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
  if (!visible) return null;

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
            {line.stations.map((station, i) => (
              <MapboxMarker key={`${lineId}-${i}`} longitude={station.lng} latitude={station.lat} anchor="center">
                <div className="group relative cursor-pointer">
                  <div className="w-3 h-3 rounded-full border-2 border-white" style={{ backgroundColor: line.color }} />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-surface/95 border border-white/10 rounded text-[8px] font-black text-on-surface whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl">
                    {station.name}
                  </div>
                </div>
              </MapboxMarker>
            ))}
          </React.Fragment>
        );
      })}
    </>
  );
}

export { METRO_LINES };
