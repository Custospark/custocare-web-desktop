import { ROUTES } from "./shared.paths";

export const ADMINISTRATION_CLINICAL_SPACE_MGT_ROUTES = {
  ROOT: `${ROUTES.ADMINISTRATION}/clinical-space-management`,

  // High-level overview
  OVERVIEW: `${ROUTES.ADMINISTRATION}/clinical-space-management/overview`,

  // Clinical Rooms
  CLINICAL_ROOMS: `${ROUTES.ADMINISTRATION}/clinical-space-management/clinical-rooms`,
  CLINICAL_ROOMS_CREATE: `${ROUTES.ADMINISTRATION}/clinical-space-management/clinical-rooms/create`,
  CLINICAL_ROOMS_SEARCH: `${ROUTES.ADMINISTRATION}/clinical-space-management/clinical-rooms/search`,

  // Ward Management
  WARD_MANAGEMENT: `${ROUTES.ADMINISTRATION}/clinical-space-management/wards`,
  WARD_CREATE: `${ROUTES.ADMINISTRATION}/clinical-space-management/wards/create`,
  WARD_OCCUPANCY: `${ROUTES.ADMINISTRATION}/clinical-space-management/wards/occupancy`,

  // Facility Zones (floors, buildings, wings)
  FACILITY_ZONES: `${ROUTES.ADMINISTRATION}/clinical-space-management/facility-zones`,
  FACILITY_ZONES_CREATE: `${ROUTES.ADMINISTRATION}/clinical-space-management/facility-zones/create`,

  // Space Allocation (staff ↔ room assignment)
  SPACE_ALLOCATION: `${ROUTES.ADMINISTRATION}/clinical-space-management/space-allocation`,
  SPACE_ALLOCATION_ASSIGN: `${ROUTES.ADMINISTRATION}/clinical-space-management/space-allocation/assign`,
  SPACE_ALLOCATION_HISTORY: `${ROUTES.ADMINISTRATION}/clinical-space-management/space-allocation/history`,
} as const;


export const ADMINISTRATION_FACILITY_SETTINGS_ROUTES = {
  ROOT: `${ROUTES.ADMINISTRATION}/facility-settings`,

  // Facility Identity (branding, currency, tax)
  FACILITY_IDENTITY: `${ROUTES.ADMINISTRATION}/facility-settings/identity`,

  // Operational Policies (rules, billing policies, guidelines)
  OPERATIONAL_POLICIES: `${ROUTES.ADMINISTRATION}/facility-settings/policies`,
} as const;