/**
 * Types for GET /ambulance/facility/{facilityId}/dashboard
 */

export interface SummaryStatBlock {
  value: number;
  change_pct?: number | null;
  change_label?: string | null;
}

export interface AmbulanceDashboardSummary {
  total_vehicles: SummaryStatBlock;
  available_vehicles: SummaryStatBlock;
  active_trips: SummaryStatBlock;
  completed_trips_today: SummaryStatBlock;
  in_service_vehicles: SummaryStatBlock;
  maintenance_vehicles: SummaryStatBlock;
  dispatched_today: SummaryStatBlock;
}

export interface TripActivityDay {
  day: string;
  date: string;
  completed: number;
  dispatched: number;
  cancelled: number;
}

export interface TripActivityBlock {
  bucket: string;
  series: TripActivityDay[];
  totals: {
    completed_week: number;
    dispatched_week: number;
    cancelled_week: number;
    avg_completed_per_day: number;
  };
}

export interface FleetStatusPoint {
  status: string;
  label: string;
  count: number;
}

export interface FleetStatusBlock {
  series: FleetStatusPoint[];
}

export interface AmbulanceRecentTrip {
  id: string;
  trip_uuid: string;
  status: string;
  priority: string;
  trip_type: string;
  pickup_location: string | null;
  destination_location: string | null;
  vehicle_identifier: string | null;
  updated_at: string | null;
}

export interface AmbulanceDashboardData {
  summary: AmbulanceDashboardSummary;
  trip_activity: TripActivityBlock;
  fleet_status: FleetStatusBlock;
  recent_trips: AmbulanceRecentTrip[];
}

export interface AmbulanceDashboardResponse {
  success: boolean;
  message: string;
  data: AmbulanceDashboardData;
}
