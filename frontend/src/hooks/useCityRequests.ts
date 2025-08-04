import { useEffect, useState } from 'react';
import { useCity } from '../CityContext';
import { fetchRequestsByCity } from '../api';
import type { RequestItem } from '../types';

export default function useCityRequests() {
  const { city } = useCity();                 // null → global mode
  const [items, setItems]   = useState<RequestItem[]>([]);
  const [loading, setLoad]  = useState(true);
  const [error, setError]   = useState<string | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    setLoad(true);
    setError(null);

    /* if city is null you can either fetch a global feed or early-out; here we early-out */
    if (city === null) {
      setItems([]);
      setLoad(false);
      return () => ctrl.abort();
    }

    fetchRequestsByCity(city, ctrl.signal)
      .then(setItems)
      .catch((e) => {
        if (e.name !== 'AbortError') setError(e.message);
      })
      .finally(() => setLoad(false));

    return () => ctrl.abort();
  }, [city]);

  return { items, loading, error };
}
