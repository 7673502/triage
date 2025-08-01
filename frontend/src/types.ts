export interface RequestItem {
  service_request_id: string;
  priority: number;
  flags: string[];
  service_name?: string;
  description?: string;
  address?: string;
  city?: string;
  media_url?: string | null;
  updated_datetime?: string;
  requested_datetime?: string;
}

export type CityName = string; 
