import { useEffect, useState } from 'react';
import Select from 'react-select';
import { useCity } from '../CityContext';
import { fetchAvailableCities } from '../api';

/* react-select expects { value, label } options */
interface Opt {
  value: string | null;   // null stands for “all cities”
  label: string;
}

export default function CitySwitcher() {
  const { city, setCity } = useCity();
  const [opts, setOpts] = useState<Opt[]>([]);
  const [loading, setLoading] = useState(true);

  /* fetch once */
  useEffect(() => {
    const ctrl = new AbortController();
    fetchAvailableCities(ctrl.signal)
      .then((list) => {
        const items: Opt[] = [
          { value: null, label: 'All cities' },
          ...list.map((c) => ({ value: c, label: c })),
        ];
        setOpts(items);
      })
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, []);

  /* selected option object */
  const selected = opts.find((o) => o.value === city) ?? null;

  return (
    <Select
      isLoading={loading}
      options={opts}
      value={selected}
      onChange={(opt) => setCity(opt?.value ?? null)}
      placeholder="Select city…"
      unstyled                      /* let us style via className */
      classNamePrefix="citysel"
      className="citysel-container"
      menuPlacement="auto"
      menuPortalTarget={document.body}
      maxMenuHeight={300}
      styles={{
        control: (base) => ({
          ...base,
          minHeight: 32,
          paddingInline: 8,
          borderRadius: 6,
          border: '1px solid #e5e7eb',
          background: '#fff',
          cursor: 'pointer',
        }),
        singleValue: (base) => ({ ...base, fontSize: 14 }),
        option: (base, state) => ({
          ...base,
          padding: '6px 10px',
          background: state.isFocused ? '#f3f4f6' : '#fff',
          cursor: 'pointer',
        }),
        menuPortal: (base) => ({ ...base, zIndex: 30 }),
      }}
    />
  );
}
