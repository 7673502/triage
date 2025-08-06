import { type RequestItem, RequestFlag } from '../types';
import { Info } from 'lucide-react'; // or use any icon library you prefer
import { useState } from 'react';
import titlecase from 'titlecase';

interface Props {
  request: RequestItem;
}

/* colour helpers */
function priorityColor(score: number): string {
  if (score >= 70) return '#dc2626';   // red-600
  if (score >= 30) return '#d97706';   // amber-600
  return '#16a34a';                    // green-600
}

function formatDateTime(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

const flagLabel: Record<RequestFlag, string> = {
  VALID: 'valid',
  CATEGORY_MISMATCH: 'category mismatch',
  IMAGE_MISMATCH: 'image mismatch',
  OVERSTATED_SEVERITY: 'overstated severity',
  UNCLEAR: 'unclear',
  DUPLICATE: 'duplicate',
  SPAM: 'spam',
  MISSING_INFO: 'missing info',
  MISCLASSIFIED_LOCATION: 'misclassified location',
  NON_ISSUE: 'non-issue',
  OTHER: 'other',
};

const flagColor: Record<RequestFlag, string> = {
  VALID: '#16a34a',
  CATEGORY_MISMATCH: '#d97706',
  IMAGE_MISMATCH: '#d97706',
  OVERSTATED_SEVERITY: '#d97706',
  UNCLEAR: '#d97706',
  DUPLICATE: '#dc2626',
  SPAM: '#dc2626',
  MISSING_INFO: '#d97706',
  MISCLASSIFIED_LOCATION: '#d97706',
  NON_ISSUE: '#dc2626',
  OTHER: '#6b7280',
};

export default function ComplaintCard({ request }: Props) {
  const priority = request.priority ?? 0;
  const color = priorityColor(priority);

  const flags = request.flag?.filter((f) => f !== RequestFlag.VALID) ?? [];
  const hasFlags = flags.length > 0;

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
      {/* Priority badge with tooltip */}
      <div
        title={request.priority_explanation || 'This is the estimated priority of the complaint (higher = more urgent)'}
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
          cursor: 'help',
        }}
      >
        {priority}
      </div>

      {/* Main content column */}
      <div style={{ flex: 1 }}>
        {/* Title (incident label) */}
        <h3 style={{ margin: '0 0 2px', fontSize: 16, fontWeight: 600 }}>
          {titlecase(request.incident_label ?? '') || 'No Label'}
        </h3>

        {/* SR# subheading */}
        <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: '#64748b' }}>
          SR-ID: {request.service_request_id}
        </p>

        {/* Description text */}
        {request.description && (
          <p style={{ margin: '6px 0 4px', fontSize: 14 }}>{request.description}</p>
        )}

        {/* Metadata: address • date */}
        <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>
          {request.address && <>{request.address} &bull; </>}
          {formatDateTime(request.requested_datetime)}
        </p>

        {/* Flags and info icon */}
        {hasFlags && (
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
            {flags.map((f) => (
              <span
                key={f}
                style={{
                  fontSize: 11,
                  padding: '2px 6px',
                  borderRadius: 4,
                  background: flagColor[f] + '22',
                  color: flagColor[f],
                  fontWeight: 500,
                }}
              >
                {flagLabel[f]}
              </span>
            ))}

            {/* Tooltip icon for flag explanation */}
            {request.flag_explanation && (
              <div
                title={request.flag_explanation}
                style={{
                  width: 16,
                  height: 16,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'help',
                  color: '#6b7280',
                }}
              >
                <Info size={32} color="#6b7280" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Optional thumbnail */}
      {request.media_url && (
        <img
          src={request.media_url}
          alt=""
          style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8 }}
          onError={(e) => (e.currentTarget.style.display = 'none')}
        />
      )}
    </article>
  );
}
