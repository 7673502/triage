import { createContext, useContext, useState, useMemo } from 'react';
import type { ReactNode } from 'react'; 
import { useNavigate, useLocation } from 'react-router-dom';

/* ——— types ——— */
export type CitySlug = string | null;

interface CityCtx {
  city: CitySlug;                   // e.g. 'bos'  | null for “global”
  setCity: (slug: CitySlug) => void;
}

/* ——— context ——— */
const CityContext = createContext<CityCtx | undefined>(undefined);

/* ——— provider ——— */
export function CityProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate  = useNavigate();

  /* read initial city from ?city=... query */
  const params = new URLSearchParams(location.search);
  const initial = params.get('city');

  const [city, setCityState] = useState<CitySlug>(initial);

  /* when UI sets a new city, update URL too */
  const setCity = (slug: CitySlug) => {
    setCityState(slug);

    const next = new URLSearchParams(location.search);
    if (slug) next.set('city', slug);
    else      next.delete('city');

    navigate({ search: next.toString() }, { replace: true });
  };

  const value = useMemo(() => ({ city, setCity }), [city]);

  return <CityContext.Provider value={value}>{children}</CityContext.Provider>;
}

/* ——— convenience hook ——— */
export function useCity() {
  const ctx = useContext(CityContext);
  if (!ctx) throw new Error('useCity must be inside CityProvider');
  return ctx;
}
