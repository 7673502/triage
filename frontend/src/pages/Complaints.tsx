import { useEffect, useState } from 'react';
import ComplaintCard from '../components/ComplaintCard';
import Paginator from '../components/Paginator';
import FilterBar from '../components/FilterBar';          /* ← NEW */
import useCityRequests from '../hooks/useCityRequests';
import { useCity } from '../CityContext';

const PAGE_SIZE = 20;

export default function Complaints() {
  const { city } = useCity();
  const { items, loading, error } = useCityRequests();
  const [page, setPage] = useState(0);

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
      {/* NEW filter bar (handlers stubbed for now) */}
      <FilterBar />

      {/* list */}
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

      {/* paginator */}
      {pageCount > 1 && (
        <Paginator pageCount={pageCount} current={page} onPage={setPage} />
      )}
    </>
  );
}
