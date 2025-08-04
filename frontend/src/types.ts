export enum RequestFlag {
  VALID = 'VALID',
  CATEGORY_MISMATCH = 'CATEGORY_MISMATCH',
  IMAGE_MISMATCH = 'IMAGE_MISMATCH',
  OVERSTATED_SEVERITY = 'OVERSTATED_SEVERITY',
  UNCLEAR = 'UNCLEAR',
  DUPLICATE = 'DUPLICATE',
  SPAM = 'SPAM',
  MISSING_INFO = 'MISSING_INFO',
  MISCLASSIFIED_LOCATION = 'MISCLASSIFIED_LOCATION',
  NON_ISSUE = 'NON_ISSUE',
  OTHER = 'OTHER',
}


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
  flag?: RequestFlag[];
}

export interface Stats {
  num_open: number;
  avg_priority: number;
  recent_requests: number;
}

export type CityName = string; 
