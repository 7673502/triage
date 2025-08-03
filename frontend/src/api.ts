import type { CityName, RequestItem, Stats } from './types';

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

export async function fetchCityQuickStats(city: CityName, signal?: AbortSignal): Promise<Stats> {
  const res = await fetch(`${API_BASE}/cities/${encodeURIComponent(city)}/quick_stats`, { signal });
  if (!res.ok) throw new Error(`City stats fetch failed: ${res.status}`);
  return res.json();
}

export async function fetchGlobalStats(signal?: AbortSignal): Promise<Stats> {
  const res = await fetch(`${API_BASE}/stats`, { signal });
  if (!res.ok) throw new Error(`Global stats fetch failed: ${res.status}`);
  return res.json();
}
