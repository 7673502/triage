import { useEffect, useState } from 'react';
import type { RequestItem } from '../types';
import { fetchRecents } from '../api';
import titlecase from 'titlecase';
import './RecentListView.css';

function priorityColor(score: number): string {
  if (score >= 70) return '#dc2626';   // red-600
  if (score >= 30) return '#d97706';   // amber-600
  return '#16a34a';                    // green-600
}

function timeAgo(iso: string): string {
  const now = new Date();
  const then = new Date(iso);
  const diffMs = now.getTime() - then.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  return diffMin < 60 ? `${diffMin} min ago` : `${Math.floor(diffMin / 60)} h ago`;
}

export default function RecentListView() {
  const [all, setAll] = useState<RequestItem[]>([]);
  const [visible, setVisible] = useState<RequestItem[]>([]);
  const [indexes, setIndexes] = useState<number[]>([]);
  const [fadingIndex, setFadingIndex] = useState<number | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    fetchRecents(ctrl.signal)
    .then((res) => {
        const normalized = res.map((r) => ({
        ...r,
        priority: r.priority ?? 0,
        flags: r.flag ?? [],
        incident_label: r.incident_label ?? 'Unlabeled',
        }));
        setAll(normalized);
        const count = Math.min(res.length, 5);
        const initial = Array.from({ length: count }, (_, i) => i);
        setIndexes(initial);
        setVisible(initial.map((i) => normalized[i]));
    })
      .catch(console.error);
    return () => ctrl.abort();
  }, []);

useEffect(() => {
const interval = setInterval(() => {
    if (all.length <= 5) return;

    const unused = all.map((_, i) => i).filter((i) => !indexes.includes(i));
    const newIdx = unused[Math.floor(Math.random() * unused.length)];
    const replaceIdx = Math.floor(Math.random() * 5);

    setFadingIndex(replaceIdx);

    setTimeout(() => {
    const newIndexes = [...indexes];
    newIndexes[replaceIdx] = newIdx;
    setIndexes(newIndexes);
    setVisible(newIndexes.map((i) => all[i]));
    setFadingIndex(null);
    }, 400); // match fade-out duration
}, 5000); // slower interval

return () => clearInterval(interval);
}, [all, indexes]);

  return (
    <div style={{
    display: 'flex',
    flexDirection: 'column',
    gap: 16,                 // increase spacing a bit
    padding: 0,              // remove internal padding
    minWidth: 0,             // prevent minimum width pushing layout
    }}>
      {visible.map((c, i) => (
        <div
        key={c.service_request_id}
        className={fadingIndex === i ? 'fade-out' : 'fade-in'}
        style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
        }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 4,
              background: priorityColor(c.priority),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 600,
              fontSize: 13,
              flexShrink: 0,
            }}
          >
            {c.priority}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {titlecase(c.incident_label || '') || 'No label'}
            </div>
            <div style={{ fontSize: 13, color: '#6b7280' }}>
              {c.city} &bull; {c.requested_datetime ? timeAgo(c.requested_datetime) : ''}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
