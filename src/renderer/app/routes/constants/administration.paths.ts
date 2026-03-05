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
  
  // Facility Identity - nested under settings
  FACILITY_IDENTITY: `${ROUTES.ADMINISTRATION}/settings/identity`,
  
  // Operational Policies - nested under settings
  OPERATIONAL_POLICIES: `${ROUTES.ADMINISTRATION}/settings/policies`,
  
} as const;

export const ADMINISTRATION_PLANS_SUBSCRIPTIONS_ROUTES = {
  // Root
  ROOT: `${ROUTES.ADMINISTRATION}/plans-subscriptions`,
  // Plans Management
  AVAILABLE_PLANS: `${ROUTES.ADMINISTRATION}/plans-subscriptions/plans`,
 
  // Subscriptions Management
  SUBSCRIPTIONS: `${ROUTES.ADMINISTRATION}/plans-subscriptions/subscriptions`,
  
  // Payment Methods (Global)
  PAYMENTS: `${ROUTES.ADMINISTRATION}/plans-subscriptions/payment-methods`,  
  // Invoices & Billing
  INVOICES: `${ROUTES.ADMINISTRATION}/plans-subscriptions/invoices`,
  BILLING_DETAILS: `${ROUTES.ADMINISTRATION}/plans-subscriptions/billing-details`,
} as const;


export const ADMIN_ROUTES = {
  // Base
  ROOT: ROUTES.ADMINISTRATION,
  
  // Overview
  OVERVIEW: `${ROUTES.ADMINISTRATION}/overview`,
  
  // Team Management
  TEAM: `${ROUTES.ADMINISTRATION}/team`,
  
  // Facility Setup
  FACILITY_SETUP: `${ROUTES.ADMINISTRATION}/facility-setup`,
  
  // Service Catalog
  SERVICE_CATALOG: `${ROUTES.ADMINISTRATION}/service-catalog`,
  
  // Inventory
  INVENTORY: `${ROUTES.ADMINISTRATION}/inventory`,
  
  // Clinical Space Management
  SPACE_GOVERNANCE: `${ROUTES.ADMINISTRATION}/space-governance`,
  CLINICAL_ROOMS: `${ROUTES.ADMINISTRATION}/space-governance/clinical-rooms`,
  WARD_MANAGEMENT: `${ROUTES.ADMINISTRATION}/space-governance/ward-management`,
  FACILITY_ZONES: `${ROUTES.ADMINISTRATION}/space-governance/facility-zones`,
  SPACE_ALLOCATION: `${ROUTES.ADMINISTRATION}/space-governance/space-allocation`,
  
  // Plans & Subscriptions
  PLANS_SUBSCRIPTIONS: `${ROUTES.ADMINISTRATION}/plans-subscriptions`,
  AVAILABLE_PLANS: `${ROUTES.ADMINISTRATION}/plans-subscriptions/available-plans`,
  SUBSCRIPTIONS: `${ROUTES.ADMINISTRATION}/plans-subscriptions/subscriptions`,
  PAYMENTS: `${ROUTES.ADMINISTRATION}/plans-subscriptions/payments`,
  
  // Facility Settings
  FACILITY_SETTINGS: `${ROUTES.ADMINISTRATION}/settings`,
  FACILITY_IDENTITY: `${ROUTES.ADMINISTRATION}/settings/identity`,
  OPERATIONAL_POLICIES: `${ROUTES.ADMINISTRATION}/settings/policies`,
} as const;