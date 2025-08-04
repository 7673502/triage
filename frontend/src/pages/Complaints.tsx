import { useEffect, useState } from 'react';
import ComplaintCard from '../components/ComplaintCard';
import { fetchRequestsByCity } from '../api';
import type { RequestItem } from '../types';

/* TEMP: hard-code a city until the city switcher is wired */
const DEFAULT_CITY = 'sfo';

export default function Complaints() {
  const [items, setItems]   = useState<RequestItem[]>([]);
  const [loading, setLoad]  = useState(true);
  const [error, setError]   = useState<string | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    fetchRequestsByCity(DEFAULT_CITY, ctrl.signal)
      .then(setItems)
      .catch((e) => {
        if (e.name !== 'AbortError') setError(e.message);
      })
      .finally(() => setLoad(false));
    return () => ctrl.abort();
  }, []);

  if (loading) return <p style={{ textAlign: 'center', paddingTop: 80 }}>Loading…</p>;
  if (error)   return <p style={{ textAlign: 'center', paddingTop: 80 }}>🚨 {error}</p>;

  return (
    <section
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        maxWidth: 800,
        margin: '0 auto',
      }}
    >
      {items.map((req) => (
        <ComplaintCard key={req.service_request_id} request={req} />
      ))}
    </section>
  );
}
