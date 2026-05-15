export enum TripLogEventType {
  STATUS_CHANGE = 'status_change',
  LOCATION_UPDATE = 'location_update',
  PATIENT_CONDITION = 'patient_condition',
  NOTE = 'note',
  HANDOFF = 'handoff',
  DELAY = 'delay',
}

export interface AmbulanceTripLog {
  id: number;
  trip_id: number;
  event_type: string;
  description: string | null;
  recorded_at: string | null;
  recorded_by_staff_id: number | null;
  metadata: Record<string, unknown> | null;
  created_at: string | null;
  recorded_by?: { id: number; first_name: string; last_name: string };
}

export interface AmbulanceTripLogCollection {
  data: AmbulanceTripLog[];
  meta: { count: number };
}

export interface CreateAmbulanceTripLogRequest {
  event_type: string;
  description?: string | null;
  recorded_at?: string | null;
  recorded_by_staff_id?: number | null;
  metadata?: Record<string, unknown> | null;
}
