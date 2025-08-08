import { useEffect, useMemo, useRef, useState } from 'react';
import mapboxgl, { GeoJSONSource, Map as MapboxMap, Popup as MapboxPopup } from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import titlecase from 'titlecase';
import { useCity } from '../CityContext';
import { fetchRequestsByCity } from '../api';
import type { RequestFlag, RequestItem } from '../types';
import FilterSidebar from '../components/FilterSidebar';

const mapboxToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || import.meta.env.VITE_MAPBOX_TOKEN;

const defaultCenter = { lat: 39.5, lng: -98.35 };

export default function MapPage() {
  const { city } = useCity();

  const [complaints, setComplaints] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [drawer, setDrawer] = useState(false);
  const [resetCounter, setResetCounter] = useState(0);

  const [priorityRange, setPriorityRange] = useState<[number, number]>([0, 100]);
  const [flags, setFlags] = useState<RequestFlag[]>([]);
  const [servicesFilter, setServicesFilter] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<{ from: string | null; to: string | null }>({ from: null, to: null });
  const [requestIds, setRequestIds] = useState<string[]>([]);

  // Map refs
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const popupRef = useRef<MapboxPopup | null>(null);
  const sourceAddedRef = useRef(false);

  useEffect(() => {
    if (!mapboxToken) {
      console.error('Mapbox access token is missing. Set VITE_MAPBOX_ACCESS_TOKEN or VITE_MAPBOX_TOKEN.');
    } else {
      mapboxgl.accessToken = mapboxToken;
    }
  }, []);

  // Filtering logic
  const filtered = useMemo(() => {
    return complaints.filter((c) => {
      if (requestIds.length > 0) {
        return requestIds.includes(c.service_request_id.toString());
      }
      if (c.priority < priorityRange[0] || c.priority > priorityRange[1]) return false;
      if (flags.length > 0) {
        const complaintFlags = c.flag || [];
        const hasMatch = flags.some((f) => complaintFlags.includes(f));
        if (!hasMatch) return false;
      }
      const name = c.service_name ?? '';
      if (servicesFilter.length > 0 && !servicesFilter.includes(name)) return false;
      if (dateRange.from || dateRange.to) {
        if (!c.requested_datetime) return false;
        const dt = new Date(c.requested_datetime);
        if (dateRange.from && dt < new Date(dateRange.from)) return false;
        if (dateRange.to && dt > new Date(dateRange.to)) return false;
      }
      return true;
    });
  }, [complaints, requestIds, priorityRange, flags, servicesFilter, dateRange]);

  // Fetch complaints when city changes
  useEffect(() => {
    const cityKey = city ?? 'all';
    setLoading(true);
    setError(null);
    fetchRequestsByCity(cityKey)
      .then(setComplaints)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [city]);

  const getPinColor = (priority: number) =>
    priority >= 70 ? '#ef4444' : priority >= 30 ? '#f59e42' : '#22c55e';

  // Calculate center
  const cityLat = complaints.length
    ? complaints.reduce((sum, c) => sum + (c.lat ?? 0), 0) / complaints.length
    : defaultCenter.lat;
  const cityLng = complaints.length
    ? complaints.reduce((sum, c) => sum + (c.long ?? 0), 0) / complaints.length
    : defaultCenter.lng;

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [cityLng, cityLat],
      zoom: complaints.length ? 12 : 4,
      attributionControl: true,
    });

    mapRef.current = map;

    map.addControl(new mapboxgl.NavigationControl({ showCompass: true }), 'top-right');

    map.on('load', () => {
      const initialData = {
        type: 'FeatureCollection',
        features: [] as any[],
      };

      map.addSource('complaints', {
        type: 'geojson',
        data: initialData as any,
        cluster: true,
        clusterRadius: 50,
        clusterMaxZoom: 14,
      });

      // Cluster bubbles
      map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'complaints',
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
        id: 'cluster-count',
        type: 'symbol',
        source: 'complaints',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': ['get', 'point_count'],
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-size': 12,
        },
        paint: {
          'text-color': '#ffffff',
        },
      });

      // Individual points
      map.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'complaints',
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

      // Cursor feedback
      map.on('mouseenter', 'clusters', () => (map.getCanvas().style.cursor = 'pointer'));
      map.on('mouseleave', 'clusters', () => (map.getCanvas().style.cursor = ''));
      map.on('mouseenter', 'unclustered-point', () => (map.getCanvas().style.cursor = 'pointer'));
      map.on('mouseleave', 'unclustered-point', () => (map.getCanvas().style.cursor = ''));

      // Expand clusters
      map.on('click', 'clusters', (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: ['clusters'] });
        const clusterId = features[0]?.properties?.cluster_id;
        const source = map.getSource('complaints') as GeoJSONSource;
        if (clusterId && source) {
          source.getClusterExpansionZoom(clusterId, (err, zoom) => {
            if (err) return;
            const [lng, lat] = (features[0].geometry as any).coordinates;
            map.easeTo({ center: [lng, lat], zoom: zoom! });
          });
        }
      });

      // Click point -> Popup with abbreviated card info
      map.on('click', 'unclustered-point', (e) => {
        const feature = e.features?.[0];
        if (!feature) return;

        const coords = (feature.geometry as any).coordinates as [number, number];
        const props: any = feature.properties || {};
        const id = String(props.id ?? props.service_request_id ?? '');

        // Find the full complaint from state to ensure we have the right data
        const complaint =
          complaints.find((c) => String(c.service_request_id) === id) ||
          filtered.find((c) => String(c.service_request_id) === id);

        // Build DOM content (abbreviated version of the ComplaintCard)
        const content = document.createElement('div');
        content.style.minWidth = '220px';
        content.style.maxWidth = '300px';
        content.style.fontFamily = 'system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial';

        const priority = complaint?.priority ?? Number(props.priority ?? 0);
        const incidentLabel = complaint?.incident_label ?? props.incident_label ?? 'No label';
        const media_url = complaint?.media_url ?? props.media_url ?? '';
        const serviceId = complaint?.service_request_id ?? id;

        const priorityColor = getPinColor(priority);

        content.innerHTML = `
          <div style="font-weight:700;font-size:16px;margin-bottom:6px;display:flex;align-items:center;">
            <span style="
              width:18px;height:18px;display:inline-block;border-radius:4px;margin-right:8px;
              background:${priorityColor};color:#fff;text-align:center;line-height:18px;font-size:13px;font-weight:600;
            ">${Number.isFinite(priority) ? priority : ''}</span>
            <span>${titlecase(String(incidentLabel || ''))}</span>
          </div>
          ${
            media_url
              ? `<img src="${media_url}" alt="complaint" style="max-width:260px;max-height:180px;display:block;margin:0 auto 8px auto;border-radius:8px;object-fit:cover;background:#f3f4f6" onerror="this.style.display='none'"/>`
              : ''
          }
          <p style="margin:0 0 6px 0;font-size:13px;color:#475569;">SR-ID: ${serviceId}</p>
        `;

        // Remove any existing popup
        if (popupRef.current) {
          popupRef.current.remove();
        }

        const popup = new mapboxgl.Popup({ closeOnClick: true, closeButton: true })
          .setLngLat(coords)
          .setDOMContent(content)
          .addTo(map);

        popup.on('close', () => {
          setActiveId(null);
        });

        popupRef.current = popup;
        setActiveId(String(serviceId));
      });

      sourceAddedRef.current = true;
    });

    return () => {
      popupRef.current?.remove();
      popupRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
      sourceAddedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update map source with filtered data
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !sourceAddedRef.current) return;

    const features = filtered
      .filter((c) => typeof c.lat === 'number' && typeof c.long === 'number')
      .map((c) => ({
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [c.long as number, c.lat as number],
        },
        properties: {
          id: String(c.service_request_id),
          priority: c.priority,
          incident_label: c.incident_label ?? 'No label',
          media_url: c.media_url ?? '',
          // Note: Mapbox serializes arrays fine; we don't rely on this for popup rendering
          flag: c.flag ?? [],
          service_name: c.service_name ?? '',
        },
      }));

    const data = {
      type: 'FeatureCollection' as const,
      features,
    };

    const src = map.getSource('complaints') as GeoJSONSource | undefined;
    if (src) {
      src.setData(data as any);
    }

    // If the currently open popup's point is filtered out, close it
    if (activeId && !filtered.some((c) => String(c.service_request_id) === String(activeId))) {
      popupRef.current?.remove();
      popupRef.current = null;
      setActiveId(null);
    }
  }, [filtered, activeId]);

  // Recenter when city (complaints) change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const center: [number, number] = [cityLng, cityLat];
    const zoom = complaints.length ? 12 : 4;
    map.easeTo({ center, zoom, duration: 500 });
  }, [cityLat, cityLng, complaints.length]);

  const uniqueServices = useMemo(
    () => Array.from(new Set(complaints.map((c) => c.service_name).filter((s): s is string => !!s))),
    [complaints],
  );

  return (
    <>
      <div
        className="map-wrapper"
        style={{
          display: 'flex',
          height: 'calc(100vh - var(--nav-height, 56px))',
          position: 'fixed',
          top: 'var(--nav-height)',
          left: 0,
          right: 0,
          background: '#f8fafc',
          overflow: 'visible',
        }}
      >
        {/* Mobile drawer backdrop */}
        {drawer && typeof window !== 'undefined' && window.innerWidth <= 900 && (
          <div
            onClick={() => setDrawer(false)}
            style={{
              position: 'fixed',
              top: 'var(--nav-height)',
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,.15)',
              zIndex: 100,
            }}
          />
        )}

        {/* Mobile toggle button */}
        <button
          onClick={() => {
            window.scrollTo(0, 0);
            setDrawer(true);
          }}
          className="mobile-filter-btn"
          style={{
            position: 'fixed',
            top: 'calc(var(--nav-height) + 12px)',
            left: 12,
            zIndex: 200,
            border: '1px solid #d1d5db',
            padding: '6px 12px',
            borderRadius: 6,
            background: '#fff',
          }}
        >
          Filters
        </button>

        {/* Sidebar */}
        <FilterSidebar
          services={uniqueServices}
          onPriority={setPriorityRange}
          onFlags={setFlags}
          onServices={setServicesFilter}
          onDateRange={(from, to) => setDateRange({ from, to })}
          onRequestIds={setRequestIds}
          onClearAll={() => {
            setPriorityRange([0, 100]);
            setFlags([]);
            setServicesFilter([]);
            setDateRange({ from: null, to: null });
            setRequestIds([]);
            setResetCounter((prev) => prev + 1);
          }}
          resetSignal={resetCounter}
          mobileOpen={drawer}
          closeMobile={() => setDrawer(false)}
        />

        {/* Map container */}
        <div style={{ flex: 1, position: 'relative' }}>
          <div
            ref={mapContainerRef}
            style={{
              width: '100%',
              height: '100%',
            }}
          />
        </div>
      </div>

      <style>{`
        /* hide the mobile button on desktop */
        @media (min-width: 901px) {
          .mobile-filter-btn {
            display: none !important;
          }
        }
        /* DESKTOP: static, scrollable rail */
        @media (min-width: 901px) {
          .filter-rail {
            position: static !important;
            transform: none !important;
            border-radius: 0 !important;
            border-right: 1px solid #e5e7eb;
            width: 300px;
            height: 100%;
            overflow-y: auto;
            box-sizing: border-box;
            padding-bottom: 16px;
            z-index: 300 !important;
          }
        }
        /* MOBILE: when open, make sure the rail sits above the backdrop and button */
        @media (max-width: 900px) {
          .filter-rail.show {
            z-index: 300 !important;
          }
        }
      `}</style>
    </>
  );
}