import { useState, useEffect } from 'react';
import StatCard from '../components/StatCard';
import { fetchGlobalStats } from '../api';
import { useNavigate } from 'react-router-dom';
import type { Stats } from '../types' 

export default function Home() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null)
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

  if (error)   return <p style={{ paddingTop: 80, textAlign: 'center' }}>{error}</p>;
  if (loading) return <p style={{ paddingTop: 80, textAlign: 'center' }}>Loading…</p>;

  return (
    <>
        <section style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 700, marginBottom: '8px' }}>
            triage
          </h1>
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
            { value: 3, label: 'Cities online', tone: 'green'}, // TODO NEED TO ADD NUMBER OF CITIES
          ].map((s) => (
            <StatCard
              key={s.label}
              value={s.value.toLocaleString()}
              label={s.label}
              tone={s.tone as any}
            />
          ))}
        </section>
    </>
  );
}
