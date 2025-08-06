import { GoogleMap, Marker, InfoWindow, MarkerClusterer } from '@react-google-maps/api';
import { useEffect, useState } from 'react';
import type { RequestItem } from '../types';
import { fetchRecents } from '../api';

const containerStyle = {
  width: '100%',
  height: '300px',
  borderRadius: '12px',
};

const center = {
  lat: 39.5,
  lng: -98.35,
};

export default function RecentMapView() {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<RequestItem | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    fetchRecents(ctrl.signal)
      .then(setRequests)
      .catch(() => {});
    return () => ctrl.abort();
  }, []);

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={4}
      options={{
          mapTypeControl: false,   
          streetViewControl: false, 
          fullscreenControl: false, 
          zoomControl: true,        
          controlSize: 24,        
          disableDefaultUI: false,   // use this to disable *everything*, or set individually like above
      }}
    >
<MarkerClusterer>
  {(clusterer) =>
  <>{
    requests
      .filter(r => r.lat && r.long)
      .map((r) => (
        <Marker
          key={r.service_request_id}
          position={{ lat: r.lat!, lng: r.long! }}
          clusterer={clusterer}
          onClick={() => setSelectedRequest(r)}
        />
      ))
  }</>
  }
</MarkerClusterer>

{selectedRequest && (
  <InfoWindow
    position={{ lat: selectedRequest.lat!, lng: selectedRequest.long! }}
    onCloseClick={() => setSelectedRequest(null)}
  >
    <div style={{ maxWidth: 200 }}>
      <strong>{selectedRequest.incident_label || 'No label'}</strong>
      <br />
      Priority: {selectedRequest.priority ?? 'Unknown'}
    </div>
  </InfoWindow>
)}

    </GoogleMap>
  );
}
