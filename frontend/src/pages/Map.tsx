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

  // Map refs/state
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const popupRef = useRef<MapboxPopup | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const hasFittedRef = useRef(false);
  const userMovedRef = useRef(false);

  useEffect(() => {
    if (!mapboxToken) {
      console.error('Mapbox access token is missing. Set VITE_MAPBOX_ACCESS_TOKEN or VITE_MAPBOX_TOKEN.');
    } else {
      mapboxgl.accessToken = mapboxToken;
    }
  }, []);

  // ---- Flags label + color maps (copied from your ComplaintCard) ----
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
  // -----------------------------------------------------------------

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

  // Helper: compute padding that accounts for the sidebar on desktop
  function computePadding(): mapboxgl.PaddingOptions {
    const isDesktop = typeof window !== 'undefined' && window.matchMedia('(min-width: 901px)').matches;
    return {
      top: 40,
      bottom: 40,
      left: isDesktop ? 320 : 12,
      right: 12,
    };
  }

  // Helper: fit map to complaints' extent (adaptive zoom)
  function fitToComplaints(points: RequestItem[], map: MapboxMap) {
    const coords = points
      .filter((c) => typeof c.lat === 'number' && typeof c.long === 'number')
      .map((c) => [c.long as number, c.lat as number] as [number, number]);

    if (coords.length === 0) {
      map.easeTo({ center: [defaultCenter.lng, defaultCenter.lat], zoom: 3, duration: 600 });
      return;
    }
    if (coords.length === 1) {
      map.easeTo({ center: coords[0], zoom: 12, duration: 600 });
      return;
    }

    const bounds = coords.reduce((b, coord) => b.extend(coord), new mapboxgl.LngLatBounds(coords[0], coords[0]));
    map.fitBounds(bounds, {
      padding: computePadding(),
      duration: 700,
      maxZoom: 13,
    });
  }

  // Initialize map and layers
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [defaultCenter.lng, defaultCenter.lat],
      zoom: 3,
      attributionControl: true,
    });
    mapRef.current = map;

    map.addControl(new mapboxgl.NavigationControl({ showCompass: true }), 'top-right');

    // Mark when the user has interacted so we don't keep auto-fitting unexpectedly
    const markUserMoved = () => {
      userMovedRef.current = true;
    };
    map.on('dragstart', markUserMoved);
    map.on('zoomstart', markUserMoved);
    map.on('rotatestart', markUserMoved);
    map.on('pitchstart', markUserMoved);

    map.on('load', () => {
      // Add empty source; data will be injected when mapReady && filtered updates
      map.addSource('complaints', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
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
        paint: { 'text-color': '#ffffff' },
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

      // Helpers for popup content: escape HTML, snippet, date formatting
      const escapeHtml = (s: string) =>
        s
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#039;');

      const makeSnippet = (text: string, wordLimit = 15) => {
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
        const hours = d.getHours();
        const minutes = `${d.getMinutes()}`.padStart(2, '0');
        return `${month}/${day}/${year}, ${hours}:${minutes}`;
      };

      // Click point -> Popup with abbreviated Complaint info + flags pills + date
      map.on('click', 'unclustered-point', (e) => {
        const feature = e.features?.[0];
        if (!feature) return;

        const coords = (feature.geometry as any).coordinates as [number, number];
        const props: any = feature.properties || {};

        const id = String(props.id ?? props.service_request_id ?? '');
        const complaint =
          complaints.find((c) => String(c.service_request_id) === id) ||
          filtered.find((c) => String(c.service_request_id) === id);

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
        const snippet = description ? makeSnippet(String(description), 15) : '';
        const dateStr = formatMDYHM(complaint?.requested_datetime ?? props.requested_datetime ?? '');

        // Determine flags (prefer the complaint object; otherwise try to parse props.flag)
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

        // Exclude VALID flag similar to the card
        const visibleFlags = (flagArray || []).filter((f) => f !== 'VALID');

        // Build HTML for pills
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
      // Give Mapbox a tick to compute layout if the container just became visible
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
      hasFittedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Push data into the map when either the data changes OR the map becomes ready
  useEffect(() => {
    if (!mapReady) return;
    const map = mapRef.current;
    if (!map) return;
    const src = map.getSource('complaints') as GeoJSONSource | undefined;
    if (!src) return;

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
          // keep flags in properties too (Mapbox will stringify if necessary)
          flag: c.flag ?? [],
          service_name: c.service_name ?? '',
          // include description and datetime for popup fallback
          description: c.description ?? '',
          requested_datetime: c.requested_datetime ?? '',
        },
      }));

    const data = { type: 'FeatureCollection' as const, features };
    src.setData(data as any);

    // Close popup if its feature is no longer present in the filtered set
    if (activeId && !filtered.some((c) => String(c.service_request_id) === String(activeId))) {
      popupRef.current?.remove();
      popupRef.current = null;
      setActiveId(null);
    }
  }, [filtered, activeId, mapReady]);

  // Reset auto-fit when city changes so the map adapts for the new extent
  useEffect(() => {
    hasFittedRef.current = false;
    userMovedRef.current = false;
  }, [city]);

  // Auto-fit once when the (new) city's data is loaded, or on first load
  useEffect(() => {
    if (!mapReady || loading) return;
    const map = mapRef.current;
    if (!map) return;
    if (!hasFittedRef.current && !userMovedRef.current) {
      fitToComplaints(filtered, map);
      hasFittedRef.current = true;
    }
  }, [mapReady, filtered, loading]);

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

          {/* Legend */}
          <div
            aria-label="Map legend"
            style={{
              position: 'absolute',
              bottom: 12,
              left: 12,
              background: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              boxShadow: '0 2px 6px rgba(0,0,0,.06)',
              padding: 10,
              fontSize: 12,
              color: '#1f2937',
              zIndex: 250,
              maxWidth: 260,
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Legend</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span
                aria-hidden
                style={{
                  display: 'inline-block',
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  background: '#219ebc',
                  border: '1px solid #0b0f19',
                } as any}
              />
              <span>Cluster (multiple complaints) — click to zoom</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span
                aria-hidden
                style={{
                  display: 'inline-block',
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: '#ef4444',
                  border: '1px solid #111',
                }}
              />
              <span>High priority (≥ 70)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span
                aria-hidden
                style={{
                  display: 'inline-block',
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: '#f59e42',
                  border: '1px solid #111',
                }}
              />
              <span>Medium priority (30–69)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                aria-hidden
                style={{
                  display: 'inline-block',
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: '#22c55e',
                  border: '1px solid #111',
                }}
              />
              <span>Low priority (&lt; 30)</span>
            </div>
          </div>
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
