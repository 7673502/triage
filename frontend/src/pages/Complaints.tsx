import { useEffect, useState, useMemo } from 'react';
import ComplaintCard from '../components/ComplaintCard';
import Paginator from '../components/Paginator';
import FilterBar, { type OrderKey } from '../components/FilterBar';
import FilterSidebar from '../components/FilterSidebar';
import useCityRequests from '../hooks/useCityRequests';
import { useCity } from '../CityContext';
import type { RequestFlag } from '../types';

const PAGE_SIZE = 20;

export default function Complaints() {
  const { city } = useCity();
  const { items, loading, error } = useCityRequests();

  /* ------- sort & search ------- */
  const [query, setQuery] = useState('');
  const [order, setOrder] = useState<OrderKey>('date');
  const [reverse, setRev] = useState(false);

  /* ------- filter state ------- */
  const [prio, setPrio] = useState<[number, number]>([0, 100]);
  const [flags, setFlags] = useState<RequestFlag[]>([]);
  const [services, setServices] = useState<string[]>([]);
  const [from, setFrom] = useState<string | null>(null);
  const [to, setTo] = useState<string | null>(null);
  const [requestIds, setRequestIds] = useState<string[]>([]);

  /* mobile drawer */
  const [drawer, setDrawer] = useState(false);

  const [resetSignal, setResetSignal] = useState(0);

  const clearAllFilters = () => {
    setPrio([0, 100]);
    setFlags([]);
    setServices([]);
    setFrom(null);
    setTo(null);
    setRequestIds([]);
    setResetSignal((r) => r + 1); // 🚨 increment to trigger reset in child
  };

useEffect(() => {
  if (drawer) {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }
}, [drawer]);

  useEffect(() => {
    const mql = window.matchMedia('(min-width: 901px)');
    const handler = (e: MediaQueryListEvent) => {
      if (e.matches) setDrawer(false);
    };
    mql.addEventListener
      ? mql.addEventListener('change', handler)
      : mql.addListener(handler);
    return () => {
      mql.removeEventListener
        ? mql.removeEventListener('change', handler)
        : mql.removeListener(handler);
    };
  }, []);

  /* ------- list derive ------- */
  const processed = useMemo(() => {
   let arr = items.filter((it) => {
  /* request ID filter */
  if (
  requestIds.length > 0 &&
  !requestIds.includes(String(it.service_request_id))
) return false;

  /* priority range */
  if (it.priority < prio[0] || it.priority > prio[1]) return false;

  /* flags include */
  if (flags.length) {
    if (!it.flag || !it.flag.some((f) => flags.includes(f))) return false;
  }

  /* service names */
  if (services.length && !services.includes(it.service_name || '')) return false;

  /* date range */
  const ts = new Date(it.requested_datetime ?? 0).getTime();
  if (from && ts < new Date(from).getTime()) return false;
  if (to && ts > new Date(to).getTime()) return false;

  /* search query */
  if (query.trim()) {
    const hay =
      (it.description || '') +
      ' ' +
      (it.address || '') +
      ' ' +
      (it.service_name || '');
    if (!hay.toLowerCase().includes(query.trim().toLowerCase())) return false;
  }

  return true;
});


    /* sort */
    arr.sort((a, b) => {
      if (order === 'priority') return (a.priority ?? 0) - (b.priority ?? 0);
      return new Date(b.requested_datetime ?? 0).getTime() -
             new Date(a.requested_datetime ?? 0).getTime();
    });
    if (reverse) arr.reverse();
    return arr;
  }, [items, query, prio, flags, services, from, to, order, reverse, requestIds]);

  /* pagination */
  const [page, setPage] = useState(0);
  useEffect(() => setPage(0), [city, query, prio, flags, services, from, to, order, reverse, requestIds]);

  const pageCount = Math.ceil(processed.length / PAGE_SIZE);
  const slice = processed.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  /* early states */
  if (city === null) return <p style={{ textAlign: 'center', paddingTop: 80 }}>Pick a city</p>;
  if (loading) return <p style={{ textAlign: 'center', paddingTop: 80 }}>Loading…</p>;
  if (error)   return <p style={{ textAlign: 'center', paddingTop: 80 }}>{error}</p>;

  /* service list for dropdown */
  const distinctServices: string[] = Array.from(
  new Set(
    items
      .map((i) => i.service_name)
      .filter((s): s is string => typeof s === 'string' && s.length > 0)
  )
);

  
return (
  <>
    {/* mobile & desktop backdrop */}
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

    {/* two-column wrapper */}
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',   // ← align tops
        gap: 24,
        paddingTop: 24,             // optional spacing under navbar
      }}
    >
      {/* left: filter rail / drawer */}
<FilterSidebar
  services={distinctServices}
  onPriority={setPrio}
  onFlags={setFlags}
  onServices={setServices}
  onDateRange={(f, t) => { setFrom(f); setTo(t) }}
  onRequestIds={setRequestIds}
  mobileOpen={drawer}
  closeMobile={() => setDrawer(false)}
  onClearAll={clearAllFilters} 
  resetSignal={resetSignal}
/>

      {/* right: main content column */}
      <div style={{ flex: 1, maxWidth: 800 }}>
        {/* header sits at top of this column */}
        <header style={{ marginBottom: 16 }}>
          <h2 style={{ margin: 0 }}>
            Complaints {city ? `in ${city}` : '(All cities)'}
          </h2>
        </header>

        {/* search + sort bar */}
        <FilterBar
          value={order}
          onSearch={setQuery}
          onOrder={setOrder}
          onReverse={() => setRev((r) => !r)}
        />

        {/* mobile filter button */}
<button
  onClick={() => {
    window.scrollTo(0, 0);
    setDrawer(true);
  }}
  className={`mobile-filter-btn ${drawer ? 'hide' : ''}`}
  style={{
    marginBottom: 16,
    border: '1px solid #d1d5db',
    padding: '6px 12px',
    borderRadius: 6,
    background: '#fff',
    zIndex: 100,
    width:'100%'
  }}
>
  Filters
</button>
<p style={{marginTop: '-10px', marginLeft: '10px'}}>{processed.length} results</p>

        {/* results */}
        <section
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          {slice.map((req) => (
            <ComplaintCard key={req.service_request_id} request={req} />
          ))}
        </section>

        {/* pagination */}
        {pageCount > 1 && (
          <Paginator
            pageCount={pageCount}
            current={page}
            onPage={setPage}
          />
        )}
      </div>
    </div>

    {/* media styling for the mobile button */}
    <style>{`
      @media (max-width: 900px) {
        .mobile-filter-btn { display: ${drawer ? 'none' : 'block'}; }
      }
      @media (min-width: 901px) {
        .mobile-filter-btn, .drawer-backdrop { display: none !important; }
      }
    `}</style>
  </>
);
}
