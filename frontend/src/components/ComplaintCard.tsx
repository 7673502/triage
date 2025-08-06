import { useState } from 'react';
import { type RequestItem, RequestFlag } from '../types';

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
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/* map each flag to a concise pill label & colour  */
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
  VALID: '#16a34a',                     // green
  CATEGORY_MISMATCH: '#d97706',
  IMAGE_MISMATCH: '#d97706',
  OVERSTATED_SEVERITY: '#d97706',
  UNCLEAR: '#d97706',
  DUPLICATE: '#dc2626',                 // red-ish
  SPAM: '#dc2626',
  MISSING_INFO: '#d97706',
  MISCLASSIFIED_LOCATION: '#d97706',
  NON_ISSUE: '#dc2626',
  OTHER: '#6b7280',                     // gray
};

export default function ComplaintCard({ request }: Props) {
  const priority = request.priority ?? 0;
  const color = priorityColor(priority);

  const [showModal, setShowModal] = useState(false);

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
      {/* coloured priority square */}
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

      {/* main column */}
      <div style={{ flex: 1 }}>
        <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 600 }}>
          {request.description || request.service_name || 'No title'}
        </h3>

        {/* address • date */}
        <p style={{ margin: 0, fontSize: 14, color: '#6b7280' }}>
          {request.address && <>{request.address} &bull; </>}
          {formatDateTime(request.requested_datetime) && <>{formatDateTime(request.requested_datetime)} &bull; </>}
          {request.service_request_id}
        </p>

        {/* flag pills */}
        {request.flag && request.flag.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
            {request.flag
            ?.filter((f) => f !== RequestFlag.VALID)
            .map((f) => (
              <span
                key={f}
                style={{
                  fontSize: 11,
                  padding: '2px 6px',
                  borderRadius: 4,
                  background: flagColor[f] + '22', /* 13% alpha */
                  color: flagColor[f],
                  fontWeight: 500,
                }}
              >
                {flagLabel[f]}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* optional thumbnail */}
      {request.media_url && (
        <img
          src={request.media_url}
          alt=""
          style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8, cursor: 'pointer' }}
          onClick={() => setShowModal(true)}
        
          onError={(e) => (e.currentTarget.style.display = 'none')}
        />
      )}
      
      {/* display full image */}
      {showModal && (
        <div
          onClick={() => setShowModal(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            cursor: 'zoom-out',
          }}
        >
          <img
            src={request.media_url}
            alt="full"
            style={{
              maxWidth: '90vw',
              maxHeight: '90vh',
              borderRadius: 12,
              boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    
    </article>
  
    

  );
}
