import type { Ward } from '../../../../administration/admin-module/api/wards/wardTypes';
import {
  AgeGroup,
  SexRestriction,
  WardStatus,
} from '../../../../administration/admin-module/api/wards/wardTypes';
import type { FacilityWardFormData } from '../../../../administration/admin-module/ui/clinical-space/ward-components/ward.types';

/** Maps a ward API entity to the admin WardFormDrawer form shape (same as FacilityWard edit flow). */
export function mapWardToFacilityFormData(ward: Ward): FacilityWardFormData {
  return {
    facility_id: ward.facility_id,
    name: ward.name ?? '',
    code: ward.code ?? '',
    ward_type: ward.ward_type ?? '',
    building: ward.building ?? '',
    floor: ward.floor ?? '',
    status: ward.status ?? WardStatus.ACTIVE,
    capacity_declared: ward.capacity_declared?.toString() ?? '',
    capacity_operational: ward.capacity_operational?.toString() ?? '',
    sex_restriction: ward.sex_restriction ?? SexRestriction.MIXED,
    age_group: ward.age_group ?? AgeGroup.ALL,
    note: ward.note ?? '',
  };
}
