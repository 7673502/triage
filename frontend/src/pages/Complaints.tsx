import { useEffect, useState } from 'react';
import ComplaintCard from '../components/ComplaintCard';
import Paginator from '../components/Paginator';
import { fetchRequestsByCity } from '../api';
import type { RequestItem } from '../types';

const DEFAULT_CITY = 'boston';
const PAGE_SIZE = 20;

export default function Complaints() {
  const [items, setItems] = useState<RequestItem[]>([]);
  const [page, setPage]   = useState(0);          // zero-based page index
  const [loading, setLoad]  = useState(true);
  const [error, setError]   = useState<string | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    fetchRequestsByCity(DEFAULT_CITY, ctrl.signal)
      .then((data) => {
        setItems(data);
        setPage(0);                // reset to first page on new fetch
      })
      .catch((e) => {
        if (e.name !== 'AbortError') setError(e.message);
      })
      .finally(() => setLoad(false));
    return () => ctrl.abort();
  }, []);

  if (loading) return <p style={{ textAlign: 'center', paddingTop: 80 }}>Loading…</p>;
  if (error)   return <p style={{ textAlign: 'center', paddingTop: 80 }}>🚨 {error}</p>;

  /* pagination slice */
  const start = page * PAGE_SIZE;
  const currentPageItems = items.slice(start, start + PAGE_SIZE);
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
        {currentPageItems.map((req) => (
          <ComplaintCard key={req.service_request_id} request={req} />
        ))}
      </section>

      {/* paginator */}
      {pageCount > 1 && (
        <Paginator
          pageCount={pageCount}
          current={page}
          onPage={setPage}
        />
      )}
    </>
  );
}
