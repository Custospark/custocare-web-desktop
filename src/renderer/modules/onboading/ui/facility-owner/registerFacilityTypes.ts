export type NatureOfFacility = 
  | 'government'
  | 'private'
  | 'faith_based'
  | 'ngo'
  | 'military'
  | 'academic'
  | 'public_private_partnership';

export type FacilityType = 
  | 'hospital'
  | 'clinic'
  | 'urgent_care'
  | 'emergency_department'
  | 'ambulatory_surgery_center'
  | 'diagnostic_center'
  | 'rehabilitation_center'
  | 'long_term_care'
  | 'hospice'
  | 'community_health_center'
  | 'specialty_center'
  | 'telehealth_hub'
  | 'pharmacy'
  | 'laboratory';

export type FacilityTier = 
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'specialized';

export type OperationalStatus = 
  | 'fully_operational'
  | 'limited_services'
  | 'emergency_only'
  | 'temporarily_closed'
  | 'permanently_closed'
  | 'under_construction';

export interface OperatingHours {
  [day: string]: {
    open: string;
    close: string;
    is_closed: boolean;
  };
}

export interface CountryCode {
  name: string;
  code: string;
  dial_code: string;
  flag: string;
}

export interface RegisterFacilityRequest {
  facility_name: string;
  legal_entity_name: string;
  nature_of_facility: NatureOfFacility;
  facility_type: FacilityType;
  facility_tier: FacilityTier;
  address_line1: string;
  city: string;
  state_province: string;
  postal_code: string;
  country_code: string; // ISO-3166-1 alpha-3
  main_phone: string;
  operating_hours?: OperatingHours;
  available_services: string[];
  data_residency_region: string;
  operational_status: OperationalStatus;
  user_id: string;
}

export interface FacilityResponse {
  id: number;
  facility_uuid: string;
  facility_code: string;
  facility_name: string;
  legal_entity_name: string;
  facility_type: FacilityType;
  facility_tier: FacilityTier;
  nature_of_facility: NatureOfFacility;
  address: {
    line1: string;
    city: string;
    state_province: string;
    postal_code: string;
    country_code: string;
  };
  contact: {
    main_phone: string;
  };
  operations: {
    operational_status: OperationalStatus;
  };
  data_residency: {
    data_residency_region: string;
  };
  audit: {
    created_at: string;
    updated_at: string;
  };
}

export interface RegisterFacilityResponse {
  data: FacilityResponse;
  message: string;
}