import { useEffect, useRef, useState } from 'react';
import mapboxgl, { GeoJSONSource, Map as MapboxMap } from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { fetchRequestsByCity } from '../api';
import type { RequestItem } from '../types';

const mapboxToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || import.meta.env.VITE_MAPBOX_TOKEN;

const defaultCenter = { lat: 39.5, lng: -98.35 };

export default function RecentMapView() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [requests, setRequests] = useState<RequestItem[]>([]);

  useEffect(() => {
    if (!mapboxToken) {
      console.error('Mapbox access token is missing. Set VITE_MAPBOX_ACCESS_TOKEN or VITE_MAPBOX_TOKEN.');
    } else {
      mapboxgl.accessToken = mapboxToken;
    }
  }, []);

  // Initialize the map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [defaultCenter.lng, defaultCenter.lat],
      zoom: 3, // “from afar”
      attributionControl: true,
    });

    mapRef.current = map;

    map.addControl(new mapboxgl.NavigationControl({ showCompass: true }), 'top-right');

    map.on('load', () => {
      // Source with clustering (same look as MapPage)
      map.addSource('complaints-home', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
        cluster: true,
        clusterRadius: 50,
        clusterMaxZoom: 14,
      });

      // Cluster bubbles
      map.addLayer({
        id: 'clusters-home',
        type: 'circle',
        source: 'complaints-home',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': ['step', ['get', 'point_count'], '#8ecae6', 10, '#219ebc', 50, '#023047'],
          'circle-radius': ['step', ['get', 'point_count'], 16, 10, 20, 50, 26],
          'circle-stroke-width': 1,
          'circle-stroke-color': '#0b0f19',
        },
      });

      // Cluster labels
      map.addLayer({
        id: 'cluster-count-home',
        type: 'symbol',
        source: 'complaints-home',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': ['get', 'point_count'],
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-size': 12,
        },
        paint: { 'text-color': '#ffffff' },
      });

      // Individual points with priority color
      map.addLayer({
        id: 'unclustered-point-home',
        type: 'circle',
        source: 'complaints-home',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': [
            'case',
            ['>=', ['get', 'priority'], 70],
            '#ef4444',
            ['>=', ['get', 'priority'], 30],
            '#f59e42',
            '#22c55e',
          ],
          'circle-radius': 6,
          'circle-stroke-width': 1,
          'circle-stroke-color': '#111111',
        },
      });

      // Cursor feedback and cluster expansion (optional, keeps behavior consistent)
      map.on('mouseenter', 'clusters-home', () => (map.getCanvas().style.cursor = 'pointer'));
      map.on('mouseleave', 'clusters-home', () => (map.getCanvas().style.cursor = ''));
      map.on('mouseenter', 'unclustered-point-home', () => (map.getCanvas().style.cursor = 'pointer'));
      map.on('mouseleave', 'unclustered-point-home', () => (map.getCanvas().style.cursor = ''));

      map.on('click', 'clusters-home', (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: ['clusters-home'] });
        const clusterId = features[0]?.properties?.cluster_id;
        const source = map.getSource('complaints-home') as GeoJSONSource;
        if (clusterId && source) {
          source.getClusterExpansionZoom(clusterId, (err, zoom) => {
            if (err) return;
            const [lng, lat] = (features[0].geometry as any).coordinates;
            map.easeTo({ center: [lng, lat], zoom: zoom! });
          });
        }
      });

      setMapReady(true);
      setTimeout(() => map.resize(), 0);
    });

    const onResize = () => mapRef.current?.resize();
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      mapRef.current?.remove();
      mapRef.current = null;
      setMapReady(false);
    };
  }, []);

  // Fetch all-cities complaints (not just recents)
  useEffect(() => {
    let cancelled = false;
    fetchRequestsByCity('all')
      .then((data) => {
        if (!cancelled) setRequests(data || []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // Push data into the map source
  useEffect(() => {
    if (!mapReady) return;
    const map = mapRef.current;
    if (!map) return;

    const src = map.getSource('complaints-home') as GeoJSONSource | undefined;
    if (!src) return;

    const features = (requests || [])
      .filter((c) => typeof c.lat === 'number' && typeof c.long === 'number')
      .map((c) => ({
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: [c.long as number, c.lat as number] },
        properties: {
          id: String(c.service_request_id),
          priority: c.priority ?? 0,
          incident_label: c.incident_label ?? 'No label',
          media_url: c.media_url ?? '',
          flag: c.flag ?? [],
          service_name: c.service_name ?? '',
        },
      }));

    const data = { type: 'FeatureCollection' as const, features };
    src.setData(data as any);
  }, [mapReady, requests]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: 300,
        borderRadius: 12,
        overflow: 'hidden',
      }}
      aria-label="All cities complaint clusters"
    />
  );
}