import type { RequestItem } from '../types';

interface Props {
  request: RequestItem;
}

/* pick a colour based on numeric priority */
function priorityColor(score: number): string {
  if (score >= 70) return '#dc2626';   // red-600
  if (score >= 30) return '#d97706';   // amber-600
  return '#16a34a';                    // green-600
}

/* ISO → “YYYY-MM-DD HH:MM” (no seconds) */
function formatDateTime(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function ComplaintCard({ request }: Props) {
  const priority = request.priority ?? 0;            /* backend should supply */
  const color = priorityColor(priority);

  return (
    <article
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: 16,
        border: '1px solid #e5e7eb',
        borderRadius: 12,
        background: '#fff',
      }}
    >
      {/* left coloured square */}
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 4,
          background: color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontWeight: 600,
          fontSize: 14,
        }}
      >
        {priority}
      </div>

      {/* main content */}
      <div style={{ flex: 1 }}>
        {/* title (prefer description, fallback service_name) */}
        <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 600 }}>
          {request.description || request.service_name || 'No title'}
        </h3>

        {/* subtitle row */}
        <p style={{ margin: 0, fontSize: 14, color: '#6b7280' }}>
          {request.address && <>{request.address} &bull; </>}
          {formatDateTime(request.requested_datetime)}
        </p>
      </div>

      {/* optional image thumbnail */}
      {request.media_url && (
        <img
          src={request.media_url}
          alt="request thumbnail"
          style={{
            width: 72,
            height: 72,
            objectFit: 'cover',
            borderRadius: 8,
          }}
          onError={(e) => (e.currentTarget.style.display = 'none')}
        />
      )}
    </article>
  );
}
