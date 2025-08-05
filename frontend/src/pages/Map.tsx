import { useState, useEffect } from 'react';
import { GoogleMap, LoadScript, MarkerClusterer, Marker, InfoWindow } from '@react-google-maps/api';
import { useCity } from '../CityContext';
import { fetchRequestsByCity } from '../api';
import type { RequestItem } from '../types';

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
    scale: 1.4,
    anchor: { x: 12, y: 22 },
  });

  // InfoWindow data
  const activeComplaint = complaints.find((c) => c.service_request_id === activeId);

  // Calculate city center (mean lat/lng, or fallback)
  const cityLat = complaints.length
    ? complaints.reduce((sum, c) => sum + (c.lat ?? 0), 0) / complaints.length
    : defaultCenter.lat;
  const cityLng = complaints.length
    ? complaints.reduce((sum, c) => sum + (c.long ?? 0), 0) / complaints.length
    : defaultCenter.lng;

  return (
    <LoadScript googleMapsApiKey={apiKey}>
      <div
        style={{
          position: 'fixed',
          top: 'var(--nav-height, 56px)',
          left: 0,
          width: '100vw',
          height: 'calc(100vh - var(--nav-height, 56px))',
          zIndex: 1,
          background: '#f8fafc'
        }}
      >
        {!city && (
          <div style={{
            position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, zIndex: 999,
            background: 'rgba(255,255,255,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <span style={{ fontSize: 20, color: '#1e293b' }}>
              Select a city to view complaints on the map
            </span>
          </div>
        )}
        {loading && (
          <div style={{
            position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, zIndex: 999,
            background: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>Loading…</div>
        )}
        {error && (
          <div style={{
            position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, zIndex: 999,
            background: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b91c1c'
          }}>{error}</div>
        )}
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={{ lat: cityLat, lng: cityLng }}
          zoom={complaints.length ? 12 : 8}
          options={{
            streetViewControl: false,
            mapTypeControl: false,
          }}
        >
          <MarkerClusterer>
            {(clusterer) =>
              complaints.filter(c => c.lat && c.long).map((c) => (
                <Marker
                  key={c.service_request_id}
                  position={{ lat: c.lat!, lng: c.long! }}
                  clusterer={clusterer}
                  icon={pinSvg(getPinColor(c.priority))}
                  onClick={() => setActiveId(c.service_request_id)}
                />
              ))
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
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4
                }}>
                </div>
                {activeComplaint.media_url && (
                <img
                  src={activeComplaint.media_url}
                  alt="complaint"
                  style={{
                    maxWidth: '260px',        // or another max width for popup, prevents overflow
                    maxHeight: '180px',       // reasonable max height for popup
                    display: 'block',
                    margin: '0 auto 8px auto',
                    borderRadius: 8,
                    objectFit: 'contain',     // ensures the whole image fits
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
                    }}>{f.replace(/_/g, ' ').toLowerCase()}</span>
                  )}
                </div>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </div>
    </LoadScript>
  );
}
