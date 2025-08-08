import { useEffect, useRef, useState } from 'react';
import mapboxgl, { GeoJSONSource, Map as MapboxMap, Popup as MapboxPopup } from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import titlecase from 'titlecase';
import { fetchRequestsByCity } from '../api';
import type { RequestFlag, RequestItem } from '../types';

const mapboxToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || import.meta.env.VITE_MAPBOX_TOKEN;
const defaultCenter = { lat: 39.5, lng: -98.35 };

export default function RecentMapView() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const popupRef = useRef<MapboxPopup | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (!mapboxToken) {
      console.error('Mapbox access token is missing. Set VITE_MAPBOX_ACCESS_TOKEN or VITE_MAPBOX_TOKEN.');
    } else {
      mapboxgl.accessToken = mapboxToken;
    }
  }, []);

  // Flags and colors (same as MapPage)
  const flagLabel: Record<RequestFlag, string> = {
    VALID: 'valid',
    CATEGORY_MISMATCH: 'category mismatch',
    IMAGE_MISMATCH: 'image mismatch',
    OVERSTATED_SEVERITY: 'overstated severity',
    UNCLEAR: 'unclear',
    DUPLICATE: 'duplicate',
    SPAM: 'spam',
    MISSING_INFO: 'missing info',
    MISCLASSIFIED_LOCATION: 'misclassified location',
    NON_ISSUE: 'non-issue',
    OTHER: 'other',
  };
  const flagColor: Record<RequestFlag, string> = {
    VALID: '#16a34a',
    CATEGORY_MISMATCH: '#d97706',
    IMAGE_MISMATCH: '#d97706',
    OVERSTATED_SEVERITY: '#d97706',
    UNCLEAR: '#d97706',
    DUPLICATE: '#dc2626',
    SPAM: '#dc2626',
    MISSING_INFO: '#d97706',
    MISCLASSIFIED_LOCATION: '#d97706',
    NON_ISSUE: '#dc2626',
    OTHER: '#6b7280',
  };

  const getPinColor = (priority: number) =>
    priority >= 70 ? '#ef4444' : priority >= 30 ? '#f59e42' : '#22c55e';

  const escapeHtml = (s: string) =>
    s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

  const makeSnippet = (text: string, wordLimit = 25) => {
    const words = text.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return '';
    const truncated = words.length > wordLimit;
    const first = words.slice(0, wordLimit).join(' ');
    return truncated ? `${first} …` : first;
  };

  const formatMDYHM = (dateStr?: string | null) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const year = d.getFullYear();
    const h24 = d.getHours();
    const ampm = h24 >= 12 ? 'PM' : 'AM';
    const h12 = h24 % 12 || 12;
    const minutes = `${d.getMinutes()}`.padStart(2, '0');
    return `${month}/${day}/${year}, ${h12}:${minutes} ${ampm}`;
  };

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

      // Popup on click (matches MapPage behavior)
      map.on('click', 'unclustered-point-home', (e) => {
        const feature = e.features?.[0];
        if (!feature) return;

        const coords = (feature.geometry as any).coordinates as [number, number];
        const props: any = feature.properties || {};
        const id = String(props.id ?? props.service_request_id ?? '');

        const complaint =
          requests.find((c) => String(c.service_request_id) === id) || null;

        const content = document.createElement('div');
        content.style.minWidth = '220px';
        content.style.maxWidth = '320px';
        content.style.overflow = 'hidden';
        content.style.fontFamily = 'system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial';

        const priority = complaint?.priority ?? Number(props.priority ?? 0);
        const incidentLabel = complaint?.incident_label ?? props.incident_label ?? 'No label';
        const media_url = complaint?.media_url ?? props.media_url ?? '';
        const serviceId = complaint?.service_request_id ?? id;
        const priorityColor = getPinColor(priority);
        const description = complaint?.description ?? props.description ?? '';
        const snippet = description ? makeSnippet(String(description), 25) : '';
        const dateStr = formatMDYHM(complaint?.requested_datetime ?? props.requested_datetime ?? '');

        // Flags: prefer complaint object; otherwise parse props.flag
        let flagArray: string[] = [];
        if (complaint?.flag && Array.isArray(complaint.flag)) {
          flagArray = complaint.flag;
        } else if (props.flag) {
          try {
            if (typeof props.flag === 'string') {
              const parsed = JSON.parse(props.flag);
              if (Array.isArray(parsed)) flagArray = parsed;
            } else if (Array.isArray(props.flag)) {
              flagArray = props.flag;
            }
          } catch {
            flagArray = [];
          }
        }
        // Exclude VALID for display
        const visibleFlags = (flagArray || []).filter((f) => f !== 'VALID');

        const pillsHtml = visibleFlags
          .map((f) => {
            const label = (flagLabel as any)[f] ?? String(f).replace(/_/g, ' ').toLowerCase();
            const color = (flagColor as any)[f] ?? '#6b7280';
            return `<span style="
              font-size:12px;
              padding:4px 8px;
              border-radius:999px;
              background:${color}22;
              color:${color};
              font-weight:500;
              margin-right:6px;
              display:inline-block;
              margin-top:6px;
            ">${label}</span>`;
          })
          .join('');

        content.innerHTML = `
          <div style="font-weight:700;font-size:16px;margin-bottom:6px;display:flex;align-items:center;">
            <span style="
              min-width:26px;
              height:18px;
              display:inline-flex;
              align-items:center;
              justify-content:center;
              border-radius:4px;
              margin-right:8px;
              background:${priorityColor};
              color:#fff;
              font-weight:600;
              font-size:12px;
              padding:0 6px;
              box-sizing:border-box;
              white-space:nowrap;
            ">${Number.isFinite(priority) ? priority : ''}</span>
            <span>${titlecase(String(incidentLabel || ''))}</span>
          </div>
          ${
            media_url
              ? `<img
                   src="${media_url}"
                   alt="complaint"
                   style="
                     display:block;
                     width:100%;
                     max-width:100%;
                     height:auto;
                     max-height:200px;
                     margin:0 auto 8px auto;
                     border-radius:8px;
                     object-fit:contain;
                     background:#f3f4f6;
                   "
                   onerror="this.style.display='none'"
                 />`
              : ''
          }
          ${
            dateStr
              ? `<p style="margin:0 0 6px 0;font-size:12px;color:#64748b;">${dateStr}</p>`
              : ''
          }
          ${
            snippet
              ? `<p style="margin:0 0 8px 0;font-size:13px;color:#111827;line-height:1.35;">${escapeHtml(
                  snippet,
                )}</p>`
              : ''
          }
          <p style="margin:0 0 6px 0;font-size:13px;color:#475569;">SR-ID: ${serviceId}</p>
          <div style="display:flex;flex-wrap:wrap;align-items:center;">${pillsHtml}</div>
        `;

        if (popupRef.current) popupRef.current.remove();
        const popup = new mapboxgl.Popup({ closeOnClick: true, closeButton: true })
          .setMaxWidth('340px')
          .setLngLat(coords)
          .setDOMContent(content)
          .addTo(map);

        popup.on('close', () => setActiveId(null));
        popupRef.current = popup;
        setActiveId(String(serviceId));
      });

      setMapReady(true);
      setTimeout(() => map.resize(), 0);
    });

    const onResize = () => mapRef.current?.resize();
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      popupRef.current?.remove();
      popupRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
      setMapReady(false);
      setActiveId(null);
    };
  }, [requests]); // bind to requests so click handler can find up-to-date items

  // Fetch all-cities complaints
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
          description: c.description ?? '',
          requested_datetime: c.requested_datetime ?? '',
        },
      }));

    const data = { type: 'FeatureCollection' as const, features };
    src.setData(data as any);

    // If active popup's feature disappeared (unlikely here), close it
    if (activeId && !requests.some((c) => String(c.service_request_id) === String(activeId))) {
      popupRef.current?.remove();
      popupRef.current = null;
      setActiveId(null);
    }
  }, [mapReady, requests, activeId]);

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
