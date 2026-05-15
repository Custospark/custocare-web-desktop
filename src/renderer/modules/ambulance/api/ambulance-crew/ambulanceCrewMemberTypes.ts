export enum CrewRole {
  DRIVER = 'driver',
  ATTENDANT = 'attendant',
  PARAMEDIC = 'paramedic',
  EMT = 'emt',
  NURSE = 'nurse',
  DOCTOR = 'doctor',
  CREW_LEAD = 'crew_lead',
}

export interface AmbulanceCrewMember {
  id: number;
  ambulance_id: number | null;
  staff_id: number;
  role: string;
  is_primary_driver: boolean;
  certification_expiry: string | null;
  active: boolean;
  assigned_at: string | null;
  unassigned_at: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string | null;
  staff?: { id: number; first_name: string; last_name: string; email?: string };
  ambulance?: { id: number; vehicle_identifier: string };
}

export interface AmbulanceCrewMemberCollection {
  data: AmbulanceCrewMember[];
  meta: { count: number };
}

export interface CreateAmbulanceCrewMemberRequest {
  ambulance_id: number;
  staff_id: number;
  role: string;
  is_primary_driver?: boolean;
  certification_expiry?: string | null;
  active?: boolean;
  assigned_at?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface UpdateAmbulanceCrewMemberRequest extends Partial<CreateAmbulanceCrewMemberRequest> {
  unassigned_at?: string | null;
}
