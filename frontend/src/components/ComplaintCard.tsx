import { useState } from 'react';
import { type RequestItem, RequestFlag } from '../types';
import { Info } from 'lucide-react';
import { Tooltip } from 'react-tooltip';
import titlecase from 'titlecase';

interface Props {
  request: RequestItem;
}

function priorityColor(score: number): string {
  if (score >= 70) return '#dc2626';
  if (score >= 30) return '#d97706';
  return '#16a34a';
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
  WRONG_CATEGORY: 'wrong category',
  WRONG_LOCATION: 'wrong location',
  IMAGE_CONFLICT: 'image conflict',
  SEVERITY_OVERSTATED: 'severity overstated',
  INSUFFICIENT_INFO: 'insufficient info',
  INVALID_REPORT: 'invalid report',
};

const flagColor: Record<RequestFlag, string> = {
  VALID: '#16a34a',
  WRONG_CATEGORY: '#d97706',
  WRONG_LOCATION: '#d97706',
  IMAGE_CONFLICT: '#d97706',
  SEVERITY_OVERSTATED: '#d97706',
  INSUFFICIENT_INFO: '#d97706',
  INVALID_REPORT: '#dc2626',
};

export default function ComplaintCard({ request }: Props) {
  const priority = request.priority ?? 0;
  const color = priorityColor(priority);
  const flags = request.flag?.filter((f) => f !== RequestFlag.VALID) ?? [];

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
      {/* Priority square with tooltip */}
      <div
        data-tooltip-id={`priority-${request.service_request_id}`}
        data-tooltip-content={request.priority_explanation || 'This is the estimated priority of the complaint (higher = more urgent)'}
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
          flex: '0 0 32px',
        }}
      >
        {priority}
      </div>
      <Tooltip id={`priority-${request.service_request_id}`} place="top" />

      {/* Main column */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <h3 style={{ margin: '0 0 2px', fontSize: 16, fontWeight: 600 }}>
          {titlecase(request.incident_label ?? '') || 'No Label'}
        </h3>

        <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: '#64748b' }}>
          SR-ID: {request.service_request_id}
        </p>
        <p style={{ fontSize: 13, margin: 0, color: '#6b7280' }}>
          {request.service_name}
        </p>

        {request.description && (
          <p style={{ margin: '3px 0 4px', fontSize: 14, overflowWrap: 'anywhere', wordBreak: 'break-word' }}>{request.description}</p>
        )}

        <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>
          {request.address && <>{request.address} &bull; </>}
          {formatDateTime(request.requested_datetime)}
        </p>

        {flags.length > 0 && (
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

            {/* Info tooltip for flag explanation */}
            {request.flag_explanation && (
              <div
                data-tooltip-id={`flag-${request.service_request_id}`}
                data-tooltip-content={request.flag_explanation}
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
            {request.flag_explanation && (
              <Tooltip id={`flag-${request.service_request_id}`} place="top" />
            )}
          </div>
        )}
      </div>

      {request.media_url && (
        <img
          src={request.media_url}
          alt=""
          style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8, cursor: 'pointer', flexShrink: 0 }}
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
