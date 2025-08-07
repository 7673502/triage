import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

type Point = { lat: number; lng: number; priority?: number };

interface Props {
  points: Point[];
  style?: React.CSSProperties;
}

export default function MapboxHeatmap({ points, style }: Props) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || points.length === 0) return;

    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

    // Convert points to GeoJSON
    const geojson: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: points.map((p) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [p.lng, p.lat],
        },
        properties: {
          weight: Math.max(0, Math.min(1, (p.priority ?? 0) / 100)),
        },
      })),
    };

    // Compute bounds to center and zoom
    const lats = points.map(p => p.lat);
    const lngs = points.map(p => p.lng);
    const bounds: [[number, number], [number, number]] = [
      [Math.min(...lngs), Math.min(...lats)],
      [Math.max(...lngs), Math.max(...lats)],
    ];

    // Initialize map
    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/light-v10',
      center: [(bounds[0][0] + bounds[1][0]) / 2, (bounds[0][1] + bounds[1][1]) / 2],
      zoom: 10,
      bounds: bounds,
      fitBoundsOptions: { padding: 40 },
    });

    mapRef.current.on('load', () => {
      if (!mapRef.current) return;

      mapRef.current.addSource('complaints', {
        type: 'geojson',
        data: geojson,
      });

      mapRef.current.addLayer({
        id: 'complaint-heat',
        type: 'heatmap',
        source: 'complaints',
        maxzoom: 15,
        paint: {
          'heatmap-weight': ['get', 'weight'],
          'heatmap-intensity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, 1,
            15, 3,
          ],
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0.0, 'rgba(205, 255, 205, 0.11)',      // transparent green (low)
            0.2, 'rgba(207, 238, 144, 0.5)', // lightgreen
            0.4, 'rgba(255,255,0,0.6)',   // yellow
            0.6, 'rgba(255,165,0,0.7)',   // orange
            0.8, 'rgba(255,69,0,0.9)',    // orange-red
            1.0, 'rgba(255,0,0,1)',       // red (high)
          ],
          'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 4, 15, 25],
          'heatmap-opacity': 0.8,
        },
      });
    });

    return () => {
      mapRef.current?.remove();
    };
  }, [points]);

  return <div ref={mapContainerRef} style={{ width: '100%', height: 500, ...style }} />;
}
