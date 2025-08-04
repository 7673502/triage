import { createContext, useContext, useState, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

/* ——— types ——— */
export type CitySlug = string | null;
interface CityCtx {
  city: CitySlug;
  setCity: (slug: CitySlug) => void;
}

/* ——— context ——— */
const CityContext = createContext<CityCtx | undefined>(undefined);

/* ——— provider ——— */
export function CityProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();

  /* initial city from ?city= */
  const params = new URLSearchParams(location.search);
  const initial = params.get('city');

  const [city, setCityState] = useState<CitySlug>(initial);

  /* update URL when city changes */
  const setCity = (slug: CitySlug) => {
    setCityState(slug);

    const next = new URLSearchParams(location.search);
    slug ? next.set('city', slug) : next.delete('city');

    /* replace just the search part of the current URL */
    const newUrl =
        location.pathname +
        (next.toString() ? `?${next.toString()}` : '') +
        (location.hash || '');

    window.history.replaceState(null, '', newUrl);
  };

  const value = useMemo(() => ({ city, setCity }), [city]);

  return <CityContext.Provider value={value}>{children}</CityContext.Provider>;
}

/* ——— hook ——— */
export function useCity() {
  const ctx = useContext(CityContext);
  if (!ctx) throw new Error('useCity must be inside CityProvider');
  return ctx;
}
