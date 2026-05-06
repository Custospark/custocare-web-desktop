import type { Visit } from '../../../pharmacy/api/dispensing/visit-queue/visitTypes';

export interface OccupiedBedLabel {
  id?: number;
  bed_label: string;
  visit_uuid: string;
}

export interface BedOption {
  id: number;
  bed_label: string;
  status?: 'available' | 'occupied' | 'maintenance' | 'inactive';
}

export interface WardBedOption {
  id: number;
  name: string;
  code: string | null;
  ward_type: string;
  building: string | null;
  floor: string | null;
  capacity_operational: number;
  occupied_beds: number;
  available_beds: number;
  occupied_bed_labels: OccupiedBedLabel[];
  available_bed_list: BedOption[];
}

export interface CurrentWardLocation {
  ward_id: number | null;
  ward_name: string | null;
  bed_id: number | null;
  bed_label: string | null;
  admission_action: 'admit' | 'assign_bed' | 'transfer' | null;
  transfer_reason: string | null;
  updated_at: string | null;
}

export interface WardBedOptionsResponseData {
  current_location: CurrentWardLocation;
  wards: WardBedOption[];
}

export interface WardBedOptionsApiResponse {
  success: boolean;
  data: WardBedOptionsResponseData;
  message: string;
}

export interface AssignWardBedPayload {
  ward_id: number;
  bed_id: number;
  admission_action: 'admit' | 'assign_bed' | 'transfer';
  transfer_reason?: string;
}

export interface AssignWardBedApiResponse {
  success: boolean;
  data: Visit;
  message: string;
}

