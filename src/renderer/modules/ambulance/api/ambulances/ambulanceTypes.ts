export enum AmbulanceStatus {
  AVAILABLE = 'available',
  IN_SERVICE = 'in_service',
  OUT_OF_SERVICE = 'out_of_service',
  MAINTENANCE = 'maintenance',
  DECOMMISSIONED = 'decommissioned',
}

export enum VehicleType {
  BLS = 'bls',
  ALS = 'als',
  CRITICAL_CARE = 'critical_care',
  PATIENT_TRANSPORT = 'patient_transport',
  TYPE_I = 'type_i',
  TYPE_II = 'type_ii',
  TYPE_III = 'type_iii',
  MEDIUM_DUTY = 'medium_duty',
  SPECIALTY = 'specialty',
  OTHER = 'other',
}

export interface Ambulance {
  id: number;
  ambulance_uuid: string;
  facility_id: number;
  crew_team_lead_staff_id: number | null;
  vehicle_identifier: string;
  vehicle_type: string;
  equipment_level: string | null;
  status: string;
  last_service_date: string | null;
  next_service_due_date: string | null;
  current_mileage: number;
  capacity: number;
  features: string[] | null;
  metadata: Record<string, unknown> | null;
  created_at: string | null;
  updated_at: string | null;
  facility?: { id: number; facility_uuid: string; facility_name: string };
  crew_team_lead?: { id: number; first_name: string; last_name: string };
}

export interface AmbulanceCollection {
  data: Ambulance[];
  meta: {
    count: number;
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
    from: number | null;
    to: number | null;
  };
  links: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };
}

export interface CreateAmbulanceRequest {
  facility_id: number;
  crew_team_lead_staff_id?: number | null;
  vehicle_identifier: string;
  vehicle_type: string;
  equipment_level?: string | null;
  status?: string;
  last_service_date?: string | null;
  next_service_due_date?: string | null;
  current_mileage?: number;
  capacity?: number;
  features?: string[] | null;
  metadata?: Record<string, unknown> | null;
}

export interface UpdateAmbulanceRequest extends Partial<CreateAmbulanceRequest> {}
