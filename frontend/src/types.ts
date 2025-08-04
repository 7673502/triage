export interface RequestItem {
  service_request_id: string;
  status: string;
  status_notes?: string;
  service_name?: string;
  service_code?: string;
  description?: string;
  agency_responsible?: string;
  service_notice?: string;
  requested_datetime?: string;
  updated_datetime?: string;
  expected_datetime?: string;
  address?: string;
  address_id?: string;
  zipcode?: string;
  lat?: number;
  long?: number;
  media_url?: string;
  priority: number;
  flag: string[];
}

export interface Stats {
  num_open: number;
  avg_priority: number;
  recent_requests: number;
}

export type CityName = string; 
