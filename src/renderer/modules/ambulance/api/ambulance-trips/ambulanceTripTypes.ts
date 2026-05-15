export enum TripType {
  EMERGENCY = 'emergency',
  NON_EMERGENCY = 'non_emergency',
  INTER_FACILITY_TRANSFER = 'inter_facility_transfer',
  STANDBY = 'standby',
  SPECIAL_EVENT = 'special_event',
}

export enum TripStatus {
  REQUESTED = 'requested',
  DISPATCHED = 'dispatched',
  EN_ROUTE = 'en_route',
  ON_SCENE = 'on_scene',
  TRANSPORTING = 'transporting',
  AT_DESTINATION = 'at_destination',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum TripPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export interface AmbulanceTrip {
  id: number;
  trip_uuid: string;
  facility_id: number;
  patient_id: number;
  visit_id: number | null;
  ambulance_id: number | null;
  dispatch_staff_id: number | null;
  requesting_staff_id: number | null;
  trip_type: string;
  priority: string;
  status: string;
  pickup_location: string | null;
  pickup_facility_id: number | null;
  destination_location: string | null;
  destination_facility_id: number | null;
  dispatch_notes: string | null;
  trip_notes: string | null;
  mileage: number | null;
  estimated_duration_minutes: number | null;
  dispatched_at: string | null;
  en_route_at: string | null;
  on_scene_at: string | null;
  patient_contact_at: string | null;
  depart_scene_at: string | null;
  at_destination_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string | null;
  updated_at: string | null;

  facility?: { id: number; facility_name: string };
  patient?: { id: number; first_name?: string; last_name?: string };
  ambulance?: { id: number; vehicle_identifier: string };
  dispatch_staff?: { id: number; first_name: string; last_name: string };
  requesting_staff?: { id: number; first_name: string; last_name: string };
}

export interface AmbulanceTripCollection {
  data: AmbulanceTrip[];
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

export interface CreateAmbulanceTripRequest {
  facility_id: number;
  patient_id: number;
  visit_id?: number | null;
  ambulance_id?: number | null;
  dispatch_staff_id?: number | null;
  requesting_staff_id?: number | null;
  trip_type: string;
  priority?: string;
  pickup_location?: string | null;
  pickup_facility_id?: number | null;
  destination_location?: string | null;
  destination_facility_id?: number | null;
  dispatch_notes?: string | null;
  trip_notes?: string | null;
  mileage?: number | null;
  estimated_duration_minutes?: number | null;
  metadata?: Record<string, unknown> | null;
}

export interface UpdateAmbulanceTripRequest extends Partial<CreateAmbulanceTripRequest> {}
