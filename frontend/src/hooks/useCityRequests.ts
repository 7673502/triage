import { useEffect, useState } from 'react';
import { useCity } from '../CityContext';
import { fetchRequestsByCity } from '../api';
import type { RequestItem } from '../types';

export default function useCityRequests() {
  const { city } = useCity();                 // null → "all"
  const [items, setItems]   = useState<RequestItem[]>([]);
  const [loading, setLoad]  = useState(true);
  const [error, setError]   = useState<string | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    setLoad(true);
    setError(null);

    const cityKey = city ?? "all";  // ✅ convert null to "all"

    fetchRequestsByCity(cityKey, ctrl.signal)
      .then((raw) =>
        setItems(
          raw.map((r) => ({
            ...r,
            service_request_id: String(r.service_request_id),
          }))
        )
      )
      .catch((e) => {
        if (e.name !== 'AbortError') setError(e.message);
      })
      .finally(() => setLoad(false));

    return () => ctrl.abort();
  }, [city]);

  return { items, loading, error };
}
