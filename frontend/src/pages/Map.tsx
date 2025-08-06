import { useState, useEffect } from 'react';
import { GoogleMap, MarkerClusterer, Marker, InfoWindow } from '@react-google-maps/api';
import { useCity } from '../CityContext';
import { fetchRequestsByCity } from '../api';
import type { RequestFlag, RequestItem } from '../types';
import FilterSidebar from '../components/FilterSidebar';

const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const containerStyle = {
  width: '100%',
  height: 'calc(100vh - var(--nav-height, 56px))',
};
const defaultCenter = { lat: 39.5, lng: -98.35 }; // fallback

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

  const filtered = complaints.filter((c) => {
    // If filtering by request IDs, override all others
    if (requestIds.length > 0) {
      return requestIds.includes(c.service_request_id.toString());
    }

    // Priority range filter
    if (c.priority < priorityRange[0] || c.priority > priorityRange[1]) return false;

    // Flag match
    if (flags.length > 0) {
      const complaintFlags = c.flag || [];
      const hasMatch = flags.some((f) => complaintFlags.includes(f));
      if (!hasMatch) return false;
    }

    // Service name filter
    const name = c.service_name ?? '';
    if (servicesFilter.length > 0 && !servicesFilter.includes(name)) return false;

    // Date range filter
    if (dateRange.from || dateRange.to) {
      if (!c.requested_datetime) return false;
      const dt = new Date(c.requested_datetime);
      if (dateRange.from && dt < new Date(dateRange.from)) return false;
      if (dateRange.to && dt > new Date(dateRange.to)) return false;
    }

    return true;
  });

  // Fetch complaints when city changes
  useEffect(() => {
    if (!city) return;
    setLoading(true);
    setError(null);
    fetchRequestsByCity(city)
      .then(setComplaints)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [city]);

  // Marker color
  const getPinColor = (priority: number) =>
    priority >= 70 ? '#ef4444'
    : priority >= 30 ? '#f59e42'
    : '#22c55e';

  // SVG pin
  const pinSvg = (color: string) => ({
    path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z",
    fillColor: color,
    fillOpacity: 1,
    strokeWeight: 1,
    strokeColor: "#111",
    scale: 1.5,
    anchor: new google.maps.Point(12, 22),
  });

  // InfoWindow data
  const activeComplaint = filtered.find((c) => c.service_request_id === activeId);

  // Calculate city center (mean lat/lng, or fallback)
  const cityLat = complaints.length
    ? complaints.reduce((sum, c) => sum + (c.lat ?? 0), 0) / complaints.length
    : defaultCenter.lat;
  const cityLng = complaints.length
    ? complaints.reduce((sum, c) => sum + (c.long ?? 0), 0) / complaints.length
    : defaultCenter.lng;

  

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
    {drawer && window.innerWidth <= 900 && (
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
        services={Array.from(new Set(complaints.map(c => c.service_name).filter((s): s is string => !!s)))}
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
      <div
        style={{
          flex: 1,
          position: 'relative',
        }}
      >
        <GoogleMap
          mapContainerStyle={{
            width: '100%',
            height: '100%',
          }}
          center={{ lat: cityLat, lng: cityLng }}
          zoom={complaints.length ? 12 : 8}
          options={{
            streetViewControl: false,
            mapTypeControl: false,
          }}
        >
          <MarkerClusterer>
            {(clusterer) =>
              <>
              {filtered.filter(c => c.lat && c.long).map((c) => (
                <Marker
                  key={c.service_request_id}
                  position={{ lat: c.lat!, lng: c.long! }}
                  clusterer={clusterer}
                  icon={pinSvg(getPinColor(c.priority))}
                  onClick={() => setActiveId(c.service_request_id)}
                />
              ))}
              </>
            }
          </MarkerClusterer>

          {activeComplaint && activeComplaint.lat && activeComplaint.long && (
            <InfoWindow
              position={{ lat: activeComplaint.lat, lng: activeComplaint.long }}
              onCloseClick={() => setActiveId(null)}
            >
              <div style={{ minWidth: 200, maxWidth: 300 }}>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>
                  <span style={{
                    width: 18, height: 18, display: 'inline-block', borderRadius: 4, marginRight: 8,
                    background: getPinColor(activeComplaint.priority),
                    fontWeight: 600, color: '#fff', textAlign: 'center', lineHeight: '18px', fontSize: 13
                  }}>
                    {activeComplaint.priority}
                  </span>
                  {activeComplaint.incident_label ?? "No label"}
                </div>

                {activeComplaint.media_url && (
                  <img
                    src={activeComplaint.media_url}
                    alt="complaint"
                    style={{
                      maxWidth: '260px',
                      maxHeight: '180px',
                      display: 'block',
                      margin: '0 auto 8px auto',
                      borderRadius: 8,
                      objectFit: 'contain',
                      background: '#f3f4f6'
                    }}
                  />
                )}

                <p>ID: {activeComplaint.service_request_id}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                  {activeComplaint.flag && activeComplaint.flag.filter(f => f !== 'VALID').map(f =>
                    <span key={f} style={{
                      background: '#e0e7ff', color: '#1e293b', borderRadius: 8,
                      fontSize: 12, padding: '3px 8px', fontWeight: 500
                    }}>
                      {f.replace(/_/g, ' ').toLowerCase()}
                    </span>
                  )}
                </div>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
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
      z-index: 300 !important;   /* bump it above the button/backdrop */
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
