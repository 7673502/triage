import { useState } from 'react';
import Select, { components } from 'react-select';
import './FilterBar.css';

/* ───── types & options ───── */
export type OrderKey = 'priority' | 'date';
interface Props {
  onSearch?: (v: string) => void;
  onOrder?: (k: OrderKey) => void;
  onReverse?: () => void;
  value: OrderKey;     
}

const orderOpts = [
  { value: 'date',     label: 'Date' },
  { value: 'priority', label: 'Priority' },
];

/* custom “Sort by: …” renderer */
const SingleValue = (props: any) => (
  <components.SingleValue {...props}>
    <span style={{ fontWeight: 500, color: '#6b7280' }}>Sort&nbsp;by:&nbsp;</span>
    {props.data.label}
  </components.SingleValue>
);

export default function FilterBar({ value, onSearch, onOrder, onReverse }: Props) {
  const [search, setSearch] = useState('');

  return (
    <div className="filter-bar">
      <input
        className="filter-bar__search"
        type="search"
        placeholder="Search…"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          onSearch?.(e.target.value);
        }}
      />

      <Select
        className="filter-bar__select"
        options={orderOpts}
        value={orderOpts.find((o) => o.value === value)}
        onChange={(opt) => onOrder?.(opt?.value as OrderKey)}
        isSearchable={false}
        unstyled
        classNamePrefix="orderby"
        components={{ SingleValue }}
        styles={{
          /* control (button) */
          control: (base, state) => ({
            ...base,
            minHeight: 34,
            border: '1px solid #d1d5db',
            borderRadius: 6,
            paddingInline: 8,
            background: '#fff',
            cursor: 'pointer',
            boxShadow: 'none',
            /* when menu open: merge border with the dropdown */
            ...(state.menuIsOpen && {
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
              borderBottomWidth: 0,
            }),
          }),
          singleValue: (base) => ({ ...base, fontSize: 14 }),
          option: (base, state) => ({
            ...base,
            fontSize: 14,
            background: state.isFocused ? '#f3f4f6' : '#fff',
            cursor: 'pointer',
          }),
          /* dropdown panel */
          menu: (base) => ({
            ...base,
            marginTop: 0,
            border: '1px solid #d1d5db',
            borderTop: 'none',
            borderRadius: '0 0 6px 6px',
            boxShadow: '0 3px 6px rgba(0,0,0,.05)',
            overflow: 'hidden',    
          }),
          menuPortal: (base) => ({ ...base, zIndex: 30 }),
        }}
      />

      <button
        className="filter-bar__reverse"
        aria-label="Reverse order"
        onClick={() => onReverse?.()}
      >
        ⇅
      </button>
    </div>
  );
}
