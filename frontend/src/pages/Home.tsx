import { useState, useEffect } from 'react';
import StatCard from '../components/StatCard';
import { fetchAvailableCities, fetchGlobalStats } from '../api';
import { useNavigate } from 'react-router-dom';
import type { Stats } from '../types' 
import RecentListView from '../components/RecentListView';
import RecentMapView from '../components/RecentMapView';

export default function Home() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null)
  const [citiesOnline, setCitiesOnline] = useState(0)
  const navigate = useNavigate();

  useEffect(() => {
    const ctrl = new AbortController();

    fetchGlobalStats(ctrl.signal)
      .then((data) => setStats(data))
      .catch((e)   => {
        if (e.name !== 'AbortError') setError(e.message);
      })
      .finally(()  => setLoading(false));

    return () => ctrl.abort();
  }, []);

  useEffect(() => {
    const ctrl = new AbortController();

    fetchAvailableCities(ctrl.signal)
      .then((data) => setCitiesOnline(data.length))
      .catch(() => {})
    
      return () => ctrl.abort();
  })

  if (error)   return <p style={{ paddingTop: 80, textAlign: 'center' }}>{error}</p>;
  if (loading) return <p style={{ paddingTop: 80, textAlign: 'center' }}>Loading…</p>;

  return (
    <>
    <div style={{margin: '32px'}}>
        <section style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{ margin: 32 }}></div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', verticalAlign: 'center' }}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="-8 -8 96 88" width="80" height="80">  
              <line x1="40" y1="0" x2="0" y2="69.28" stroke="#aaa" strokeWidth="2" />
              <line x1="40" y1="0" x2="80" y2="69.28" stroke="#aaa" strokeWidth="2" />
              <line x1="0" y1="69.28" x2="80" y2="69.28" stroke="#aaa" strokeWidth="2" />

              <circle cx="40" cy="0" r="7" fill="#22c55e" />
              <circle cx="0" cy="69.28" r="7" fill="#facc15" />
              <circle cx="80" cy="69.28" r="7" fill="#ef4444" />
            </svg>
            <h1 style={{ fontSize: '2.25rem', fontWeight: 700, margin: 0, lineHeight: 1  }}>
              triage
            </h1>
          </div>
          <p style={{ color: '#6b7280', marginBottom: '24px' }}>
            Manage and automatically prioritize complaints in your city.    
          </p>
          <button
            onClick={() => navigate('/complaints')}
            style={{
              padding: '10px 20px',
              background: '#1f2937',
              color: '#fff',
              borderRadius: '8px',
              fontWeight: 500,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Explore live data
          </button>
        </section>

        {/* SNAPSHOT CARDS */}
        <section
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '24px',
            justifyContent: 'center',
          }}
        >
          {stats && [
            { value: stats.num_open, label: 'Open', tone: 'red'},
            { value: stats.avg_priority, label: 'Avg. Priority', tone: 'slate'},
            { value: stats.recent_requests, label: 'New (1 hr)', tone: 'yellow'},
            { value: citiesOnline, label: citiesOnline === 1 ? 'City online' : 'Cities online', tone: 'green'}, 
          ].map((s) => (
            <StatCard
              key={s.label}
              value={s.value.toLocaleString()}
              label={s.label}
              tone={s.tone as any}
            />
          ))}
        </section>

        {/* Recent activity block */}
<div
  style={{
    display: 'flex',
    flexWrap: 'wrap',
    gap: 24,
    marginTop: 48,
    paddingBottom: 48,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  }}
>
<div
  style={{
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: 250,
  }}
>
    <h2 style={{ fontSize: 18, marginBottom: 12 }}>Recent Complaints</h2>
    <RecentListView />
  </div>

<div
  style={{
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    minWidth: 300,
  }}
>
  <h2 style={{ fontSize: 5, marginBottom: 12, visibility: 'hidden' }}>Recent Map</h2>
    <RecentMapView />
  </div>
</div>
</div>
    </>
  );
}
