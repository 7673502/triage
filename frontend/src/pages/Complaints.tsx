import ComplaintCard from '../components/ComplaintCard';
import Paginator from '../components/Paginator';
import useCityRequests from '../hooks/useCityRequests';
import { useCity } from '../CityContext';
import { useState, useEffect } from 'react';

const PAGE_SIZE = 20;

export default function Complaints() {
  const { city } = useCity();
  const { items, loading, error } = useCityRequests();
  const [page, setPage] = useState(0);

  /* reset to first page when the city changes */
  useEffect(() => setPage(0), [city]);

  if (city === null)
    return <p style={{ textAlign: 'center', paddingTop: 80 }}>Pick a city to view complaints</p>;

  if (loading) return <p style={{ textAlign: 'center', paddingTop: 80 }}>Loading…</p>;
  if (error)   return <p style={{ textAlign: 'center', paddingTop: 80 }}>🚨 {error}</p>;

  const start = page * PAGE_SIZE;
  const current = items.slice(start, start + PAGE_SIZE);
  const pageCount = Math.ceil(items.length / PAGE_SIZE);

  return (
    <>
      <section
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          maxWidth: 800,
          margin: '0 auto',
        }}
      >
        {current.map((req) => (
          <ComplaintCard key={req.service_request_id} request={req} />
        ))}
      </section>

      {pageCount > 1 && (
        <Paginator pageCount={pageCount} current={page} onPage={setPage} />
      )}
    </>
  );
}
