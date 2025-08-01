import type { CityName, RequestItem } from './types';

const API_BASE = '/v1';

export async function fetchAvailableCities(signal?: AbortSignal): Promise<CityName[]> {
  const res = await fetch(`${API_BASE}/available_cities`, { signal });
  if (!res.ok) throw new Error(`Cities fetch failed: ${res.status}`);
  return res.json();
}

export async function fetchRequestsByCity(city: CityName, signal?: AbortSignal): Promise<RequestItem[]> {
  const encCity = encodeURIComponent(city);
  const res = await fetch(`${API_BASE}/cities/${encCity}/requests`, { signal });
  if (!res.ok) throw new Error(`Requests fetch failed: ${res.status}`);
  return res.json();
}
