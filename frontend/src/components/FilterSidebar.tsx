import { useMemo, useState } from 'react';
import Slider from 'rc-slider';
import Select from 'react-select';
import 'rc-slider/assets/index.css';
import './FilterSidebar.css';
import MultiIdInput from './MultiIdInput';
import { RequestFlag } from '../types';

/* ---------- helpers ---------- */

const allFlags: RequestFlag[] = [
  RequestFlag.CATEGORY_MISMATCH,
  RequestFlag.IMAGE_MISMATCH,
  RequestFlag.OVERSTATED_SEVERITY,
  RequestFlag.UNCLEAR,
  RequestFlag.DUPLICATE,
  RequestFlag.SPAM,
  RequestFlag.MISSING_INFO,
  RequestFlag.MISCLASSIFIED_LOCATION,
  RequestFlag.NON_ISSUE,
  RequestFlag.OTHER,
];

interface Props {
  services: string[];                       // deduped list from data
  onPriority: (range: [number, number]) => void;
  onFlags: (flags: RequestFlag[]) => void;
  onServices: (slugs: string[]) => void;
  onDateRange: (from: string | null, to: string | null) => void;
  mobileOpen: boolean;
  closeMobile: () => void;
  onRequestIds: (ids: string[]) => void; // ← NEW
}

export default function FilterSidebar({
  services,
  onPriority,
  onFlags,
  onServices,
  onDateRange,
  mobileOpen,
  closeMobile,
}: Props) {
  /* local state */
  const [priority, setPriority] = useState<[number, number]>([0, 100]);
  const [flagSet, setFlagSet] = useState<Set<RequestFlag>>(new Set());
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [requestIds, setRequestIds] = useState<string[]>([]);

  const updateRequestIds = (ids: string[]) => {
    setRequestIds(ids);
    onRequestIds(ids);
  };


  /* react-select opts built once */
  const svcOpts = useMemo(
    () => services.map((s) => ({ value: s, label: s })),
    [services],
  );

  /* handlers propagate upward */
  const updateFlags = (f: RequestFlag) => {
    const next = new Set(flagSet);
    next.has(f) ? next.delete(f) : next.add(f);
    setFlagSet(next);
    onFlags(Array.from(next));
  };

  return (
    <aside className={`filter-rail ${mobileOpen ? 'show' : ''}`}>
      {/* mobile close button */}
      <button className="rail-close" onClick={closeMobile}>×</button>

      <h3 style={{marginTop: 0}}>Filters</h3>

      <label className="rail-label">Service request IDs</label>
      <MultiIdInput ids={requestIds} onChange={updateRequestIds} />

      {/* Priority */}
      <label className="rail-label">Priority</label>
      <Slider
        range
        min={0}
        max={100}
        value={priority}
        onChange={(v) => {
          const val = v as [number, number];
          setPriority(val);
          onPriority(val);
        }}
      />
      <div className="rail-range-readout">
        {priority[0]} – {priority[1]}
      </div>

      {/* Flags */}
<label className="rail-label">Flags</label>
<div className="rail-checkboxes">
  {/* Select All */}
  <label >
    <input
      type="checkbox"
      checked={flagSet.size === allFlags.length}
      onChange={() => {
        if (flagSet.size === allFlags.length) {
          setFlagSet(new Set());
          onFlags([]);
        } else {
          setFlagSet(new Set(allFlags));
          onFlags(allFlags.slice());
        }
      }}
    />
    select all
  </label>
  {/* Individual flags */}
  {allFlags.map((f) => (
    <label key={f}>
      <input
        type="checkbox"
        checked={flagSet.has(f)}
        onChange={() => {
          const next = new Set(flagSet);
          next.has(f) ? next.delete(f) : next.add(f);
          setFlagSet(next);
          onFlags(Array.from(next));
        }}
      />
      {f.replace(/_/g, ' ').toLowerCase()}
    </label>
  ))}
</div>


      {/* Service */}
      <label className="rail-label">Service name</label>
<Select
  options={svcOpts}
  isMulti
  classNamePrefix="svcsel"
  onChange={(vals) => onServices(vals.map((v) => v.value))}
  placeholder="All services"
  unstyled
  menuPortalTarget={document.body}
  menuPosition="fixed"
  menuShouldBlockScroll={false}
  styles={{
    control: (base) => ({
      ...base,
      minHeight: 34,
      border: '1px solid #d1d5db',
      borderRadius: 6,
      paddingInline: 8,
      background: '#fff',
      cursor: 'pointer',
    }),
    /* the outer menu wrapper: rounded & hidden overflow */
    menu: (base) => ({
      ...base,
      marginTop: 2,
      border: '1px solid #d1d5db',
      borderRadius: 6,
      background: '#fff',
      boxShadow: '0 3px 6px rgba(0,0,0,.05)',
      overflow: 'hidden',            // <— keeps bottom corners visible
    }),
    /* the scrollable list inside that wrapper */
    menuList: (base) => ({
      ...base,
      maxHeight: 200,                // adjust as needed
      overflowY: 'auto',
      padding: 0,                    // flush to the rounded edges
      background: '#fff',            // ensure white behind the scrollbar
    }),
    option: (base, state) => ({
      ...base,
      fontSize: 14,
      background: state.isFocused ? '#f3f4f6' : '#fff',
      color: '#1f2937',
      cursor: 'pointer',
    }),
    multiValue: (base) => ({
      ...base,
      background: '#e0e7ff',
      borderRadius: 4,
      paddingInline: 2,
    }),
    multiValueLabel: (base) => ({ ...base, color: '#1f2937', fontSize: 12 }),
    multiValueRemove: (base) => ({
      ...base,
      ':hover': { background: '#c7d2fe', color: '#1f2937' },
    }),
    menuPortal: (base) => ({ ...base, zIndex: 210 }),
  }}
/>

      {/* Date range */}
      <label className="rail-label">Start date</label>
      <input
        type="datetime-local"
        value={from}
        onChange={(e) => {
          setFrom(e.target.value);
          onDateRange(e.target.value || null, to || null);
        }}
      />

      <label className="rail-label">End date</label>
      <input
        type="datetime-local"
        value={to}
        onChange={(e) => {
          setTo(e.target.value);
          onDateRange(from || null, e.target.value || null);
        }}
      />
    </aside>
  );
}
