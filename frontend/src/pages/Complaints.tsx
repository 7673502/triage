import { useEffect, useState, useMemo } from 'react';
import ComplaintCard from '../components/ComplaintCard';
import Paginator from '../components/Paginator';
import FilterBar, { type OrderKey } from '../components/FilterBar';
import useCityRequests from '../hooks/useCityRequests';
import { useCity } from '../CityContext';

const PAGE_SIZE = 20;

export default function Complaints() {
  const { city }           = useCity();
  const { items, loading, error } = useCityRequests();

  /* filter state */
  const [query, setQuery]   = useState('');
  const [order, setOrder]   = useState<OrderKey>('priority');
  const [reverse, setRev]   = useState(false);
  const [page, setPage]     = useState(0);

  /* reset page when filters change */
  useEffect(() => setPage(0), [city, query, order, reverse]);

  /* ---------- derived list (search + sort) ---------- */
  const processed = useMemo(() => {
    /* text filter */
    const q = query.trim().toLowerCase();
    let arr = q
      ? items.filter((it) => {
          const hay =
            (it.description || '') +
            ' ' +
            (it.address || '') +
            ' ' +
            (it.service_name || '');
          return hay.toLowerCase().includes(q);
        })
      : items.slice();

    /* sort */
    arr.sort((a, b) => {
      if (order === 'priority') {
        const pa = a.priority ?? 0;
        const pb = b.priority ?? 0;
        return pa - pb;
      } else {
        /* date newest first by default */
        const da = new Date(a.requested_datetime ?? 0).getTime();
        const db = new Date(b.requested_datetime ?? 0).getTime();
        return da - db;
      }
    });

    if (reverse) arr.reverse();
    return arr;
  }, [items, query, order, reverse]);

  /* paginate */
  const start     = page * PAGE_SIZE;
  const pageCount = Math.ceil(processed.length / PAGE_SIZE);
  const slice     = processed.slice(start, start + PAGE_SIZE);

  /* ---------- early states ---------- */
  if (city === null)
    return <p style={{ textAlign: 'center', paddingTop: 80 }}>Pick a city to view complaints</p>;
  if (loading) return <p style={{ textAlign: 'center', paddingTop: 80 }}>Loading…</p>;
  if (error)   return <p style={{ textAlign: 'center', paddingTop: 80 }}>🚨 {error}</p>;

  /* ---------- render ---------- */
  return (
    <>
      <FilterBar
        onSearch={setQuery}
        onOrder={setOrder}
        onReverse={() => setRev((r) => !r)}
      />

      <section
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          maxWidth: 800,
          margin: '0 auto',
        }}
      >
        {slice.map((req) => (
          <ComplaintCard key={req.service_request_id} request={req} />
        ))}
      </section>

      {pageCount > 1 && (
        <Paginator pageCount={pageCount} current={page} onPage={setPage} />
      )}
    </>
  );
}
