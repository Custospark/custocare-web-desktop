/**
 * ============================================================================
 * INVENTORY ITEM TYPE DEFINITIONS
 * ============================================================================
 * 
 * This file contains all TypeScript type declarations for inventory item-related
 * operations in the healthcare inventory management system.
 * 
 * @module inventoryItemTypes
 * @description Comprehensive type definitions for inventory items, including
 * request/response types, enums, and utility types for type-safe API interactions.
 */

/* -------------------------------------------------------------------------- */
/*                                   ENUMS                                    */
/* -------------------------------------------------------------------------- */

/**
 * Available inventory item categories in the healthcare system.
 * Maps to backend enum values for item classification.
 */
export enum InventoryItemCategory {
  MEDICATION = 'medication',
  MEDICAL_SUPPLY = 'medical_supply',
  SURGICAL_INSTRUMENT = 'surgical_instrument',
  DIAGNOSTIC_EQUIPMENT = 'diagnostic_equipment',
  IMPLANTABLE_DEVICE = 'implantable_device',
  PROSTHETIC = 'prosthetic',
  LABORATORY_REAGENT = 'laboratory_reagent',
  PERSONAL_PROTECTIVE_EQUIPMENT = 'personal_protective_equipment',
  ADMINISTRATIVE_SUPPLY = 'administrative_supply',
  OTHER = 'other',
}

/**
 * Controlled substance schedule classification.
 * Maps to DEA schedules for controlled substances.
 */
export enum ControlledSubstanceSchedule {
  SCHEDULE_I = 'I',
  SCHEDULE_II = 'II',
  SCHEDULE_III = 'III',
  SCHEDULE_IV = 'IV',
  SCHEDULE_V = 'V',
  NON_CONTROLLED = 'non_controlled',
}

/**
 * Inventory item operational status.
 * Determines whether the item is available for use.
 */
export enum InventoryItemStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DISCONTINUED = 'discontinued',
  RECALLED = 'recalled',
}

/**
 * Storage location types for inventory items.
 */
export enum StorageLocationType {
  PHARMACY_SHELF = 'pharmacy_shelf',
  MEDICATION_ROOM = 'medication_room',
  NURSING_STATION = 'nursing_station',
  EMERGENCY_ROOM = 'emergency_room',
  OPERATING_ROOM = 'operating_room',
  CENTRAL_STORE = 'central_store',
  REFRIGERATED = 'refrigerated',
  FREEZER = 'freezer',
  CONTROLLED_ACCESS = 'controlled_access',
  DISPENSARY = 'dispensary',
}

/* -------------------------------------------------------------------------- */
/*                              NESTED TYPES                                  */
/* -------------------------------------------------------------------------- */

/**
 * Active ingredients structure for medications.
 * Flexible JSON structure to accommodate various medication compositions.
 */
export type ActiveIngredients = Array<{
  name: string;
  strength: string;
  unit?: string;
}>;

/**
 * Storage requirements for temperature-sensitive items.
 */
export interface StorageRequirements {
  temperature_min?: number;
  temperature_max?: number;
  temperature_unit?: 'celsius' | 'fahrenheit';
  humidity_min?: number;
  humidity_max?: number;
  light_sensitive?: boolean;
  special_instructions?: string;
}

/**
 * Regulatory approvals for inventory items.
 */
export type RegulatoryApprovals = Array<{
  authority: string;
  approval_number: string;
  approval_date?: string;
  expiry_date?: string;
}>;

/**
 * Safety warnings and contraindications.
 */
export type SafetyWarnings = Array<{
  type: 'warning' | 'contraindication' | 'precaution' | 'side_effect';
  description: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}>;

/**
 * Metadata structure for storing additional inventory item information.
 */
export type InventoryItemMetadata = Record<string, unknown>;

/**
 * Simplified facility reference for nested responses.
 */
export interface FacilityReference {
  id: number;
  facility_uuid: string;
  facility_code: string;
  facility_name: string;
  facility_type: string;
}

/**
 * Simplified staff reference for created_by relationship.
 */
export interface StaffReference {
  id: number;
  staff_uuid: string;
  employee_id: string;
  professional_title: string;
  full_name: string;
}

/* -------------------------------------------------------------------------- */
/*                           CORE INVENTORY ITEM TYPE                         */
/* -------------------------------------------------------------------------- */

/**
 * Complete inventory item entity as returned by the API.
 * Includes all fields, computed properties, and optional relationships.
 */
export interface InventoryItem {
  // Primary identifiers
  id: number;
  item_uuid: string;
  facility_id: number;

  // Item identification
  item_code: string;
  item_name: string;
  item_description?: string | null;

  // Classification
  item_category: InventoryItemCategory;
  item_category_label: string;
  item_subcategory?: string | null;

  // Medication-specific fields
  generic_name?: string | null;
  brand_name?: string | null;
  ndc_code?: string | null;
  drug_class?: string | null;
  controlled_substance_schedule?: ControlledSubstanceSchedule | null;
  active_ingredients?: ActiveIngredients | null;
  dosage_form?: string | null;
  strength?: string | null;
  route_of_administration?: string | null;

  // Manufacturer information
  manufacturer?: string | null;
  manufacturer_item_number?: string | null;
  supplier?: string | null;

  // Unit information
  unit_of_measure: string;
  package_quantity: number;
  packaging_type?: string | null;

  // Pricing
  unit_cost?: number | null;
  average_wholesale_price?: number | null;
  currency_code: string;

  // Storage & handling
  storage_requirements?: StorageRequirements | null;
  requires_refrigeration: boolean;
  requires_controlled_access: boolean;
  storage_location_type?: StorageLocationType | null;
  storage_location_label?: string | null;

  // Regulatory
  requires_prescription: boolean;
  regulatory_approvals?: RegulatoryApprovals | null;
  fda_approval_number?: string | null;

  // Safety information
  is_hazardous: boolean;
  safety_warnings?: SafetyWarnings | null;
  contraindications?: SafetyWarnings | null;
  special_handling_instructions?: string | null;

  // Inventory management
  is_billable: boolean;
  track_by_lot: boolean;
  track_by_serial: boolean;
  reorder_point?: number | null;
  reorder_quantity?: number | null;
  safety_stock_level?: number | null;
  max_stock_level?: number | null;

  // Status
  status: InventoryItemStatus;
  status_label: string;

  // Audit timestamps
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;

  // Relationships
  facility?: FacilityReference;
  created_by?: StaffReference;
  metadata?: InventoryItemMetadata | null;

  // Computed attributes
  is_controlled_substance: boolean;
  requires_special_handling: boolean;
  total_value?: number; // unit_cost * package_quantity * stock_quantity
  is_low_stock: boolean; // quantity <= reorder_point
  is_out_of_stock: boolean; // quantity === 0
}

/* -------------------------------------------------------------------------- */
/*                          REQUEST/RESPONSE TYPES                            */
/* -------------------------------------------------------------------------- */

/**
 * Request payload for creating a new inventory item.
 * All required fields must be provided; optional fields can be omitted.
 */
export interface CreateInventoryItemRequest {
  // Required fields
  facility_id: number;
  item_code: string;
  item_name: string;
  item_category: InventoryItemCategory;
  unit_of_measure: string;
  package_quantity: number;

  // Optional identification
  item_uuid?: string;
  item_description?: string | null;
  item_subcategory?: string | null;

  // Optional medication fields
  generic_name?: string | null;
  brand_name?: string | null;
  ndc_code?: string | null;
  drug_class?: string | null;
  controlled_substance_schedule?: ControlledSubstanceSchedule | null;
  active_ingredients?: ActiveIngredients | null;
  dosage_form?: string | null;
  strength?: string | null;
  route_of_administration?: string | null;

  // Optional manufacturer info
  manufacturer?: string | null;
  manufacturer_item_number?: string | null;
  supplier?: string | null;

  // Optional packaging
  packaging_type?: string | null;

  // Optional pricing
  unit_cost?: number | null;
  average_wholesale_price?: number | null;
  currency_code?: string;

  // Optional storage & handling
  storage_requirements?: StorageRequirements | null;
  requires_refrigeration?: boolean;
  requires_controlled_access?: boolean;
  storage_location_type?: StorageLocationType | null;

  // Optional regulatory
  requires_prescription?: boolean;
  regulatory_approvals?: RegulatoryApprovals | null;
  fda_approval_number?: string | null;

  // Optional safety
  is_hazardous?: boolean;
  safety_warnings?: SafetyWarnings | null;
  contraindications?: SafetyWarnings | null;
  special_handling_instructions?: string | null;

  // Optional inventory management
  is_billable?: boolean;
  track_by_lot?: boolean;
  track_by_serial?: boolean;
  reorder_point?: number | null;
  reorder_quantity?: number | null;
  safety_stock_level?: number | null;
  max_stock_level?: number | null;

  // Optional status
  status?: InventoryItemStatus;
  metadata?: InventoryItemMetadata | null;
}

/**
 * Request payload for updating an existing inventory item.
 * All fields are optional - only provided fields will be updated.
 */
export interface UpdateInventoryItemRequest {
  item_code?: string;
  item_name?: string;
  item_description?: string | null;
  item_category?: InventoryItemCategory;
  item_subcategory?: string | null;
  generic_name?: string | null;
  brand_name?: string | null;
  ndc_code?: string | null;
  drug_class?: string | null;
  controlled_substance_schedule?: ControlledSubstanceSchedule | null;
  active_ingredients?: ActiveIngredients | null;
  dosage_form?: string | null;
  strength?: string | null;
  route_of_administration?: string | null;
  manufacturer?: string | null;
  manufacturer_item_number?: string | null;
  supplier?: string | null;
  unit_of_measure?: string;
  package_quantity?: number;
  packaging_type?: string | null;
  unit_cost?: number | null;
  average_wholesale_price?: number | null;
  currency_code?: string;
  storage_requirements?: StorageRequirements | null;
  requires_refrigeration?: boolean;
  requires_controlled_access?: boolean;
  storage_location_type?: StorageLocationType | null;
  requires_prescription?: boolean;
  regulatory_approvals?: RegulatoryApprovals | null;
  fda_approval_number?: string | null;
  is_hazardous?: boolean;
  safety_warnings?: SafetyWarnings | null;
  contraindications?: SafetyWarnings | null;
  special_handling_instructions?: string | null;
  is_billable?: boolean;
  track_by_lot?: boolean;
  track_by_serial?: boolean;
  reorder_point?: number | null;
  reorder_quantity?: number | null;
  safety_stock_level?: number | null;
  max_stock_level?: number | null;
  status?: InventoryItemStatus;
  metadata?: InventoryItemMetadata | null;
}

/**
 * Query parameters for filtering inventory items list.
 * Used in GET /inventory-items endpoint.
 */
export interface InventoryItemFilters {
  facility_id?: number;
  status?: InventoryItemStatus;
  category?: InventoryItemCategory;
  is_controlled_substance?: boolean;
  requires_prescription?: boolean;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  per_page?: number;
  page?: number;
}

/**
 * Query parameters for searching inventory items.
 * Used in GET /inventory-items/search endpoint.
 */
export interface InventoryItemSearchParams {
  q: string;
  status?: InventoryItemStatus;
  category?: InventoryItemCategory;
  per_page?: number;
  page?: number;
}

/**
 * Pagination metadata returned with inventory item lists.
 */
export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from?: number;
  to?: number;
}

/* -------------------------------------------------------------------------- */
/*                            API RESPONSE TYPES                              */
/* -------------------------------------------------------------------------- */

/**
 * Standard success response structure.
 * Generic type parameter T represents the data payload.
 */
export interface ApiSuccessResponse<T> {
  success: true;
  message: string;
  data: T;
  meta?: PaginationMeta;
}

/**
 * Standard error response structure.
 * Includes error message and optional validation errors.
 */
export interface ApiErrorResponse {
  success: false;
  message: string;
  error_code?: string;
  errors?: Record<string, string[]>;
  error?: string;
}

/**
 * Response for inventory item list endpoint (GET /inventory-items).
 */
export type GetInventoryItemsResponse = ApiSuccessResponse<InventoryItem[]>;

/**
 * Response for single inventory item operations (GET, POST, PUT, PATCH).
 */
export type InventoryItemResponse = ApiSuccessResponse<InventoryItem>;

/**
 * Response for delete operation (DELETE /inventory-items/:uuid).
 */
export type DeleteInventoryItemResponse = ApiSuccessResponse<null>;

/**
 * Response for restore operation (POST /inventory-items/:uuid/restore).
 */
export type RestoreInventoryItemResponse = InventoryItemResponse;

/**
 * Response for category-filtered items (GET /inventory-items/category/:category).
 */
export type GetInventoryItemsByCategoryResponse = GetInventoryItemsResponse;

/**
 * Response for controlled substances (GET /inventory-items/controlled-substances).
 */
export type GetControlledSubstancesResponse = GetInventoryItemsResponse;

/**
 * Response for search operation (GET /inventory-items/search).
 */
export type SearchInventoryItemsResponse = GetInventoryItemsResponse;

/* -------------------------------------------------------------------------- */
/*                              UTILITY TYPES                                 */
/* -------------------------------------------------------------------------- */

/**
 * Type for inventory item UUID parameter in API calls.
 */
export type InventoryItemUUID = string;

/**
 * Type for facility ID parameter in filtered queries.
 */
export type FacilityId = number;

/**
 * Type for category parameter in filtered queries.
 */
export type Category = InventoryItemCategory | string;

/**
 * Union type of all possible API responses.
 * Useful for comprehensive error handling.
 */
export type InventoryItemApiResponse =
  | GetInventoryItemsResponse
  | InventoryItemResponse
  | DeleteInventoryItemResponse
  | RestoreInventoryItemResponse
  | GetInventoryItemsByCategoryResponse
  | GetControlledSubstancesResponse
  | SearchInventoryItemsResponse;

/**
 * Type guard to check if response is an error.
 */
export function isApiErrorResponse(
  response: ApiSuccessResponse<unknown> | ApiErrorResponse
): response is ApiErrorResponse {
  return response.success === false;
}

/**
 * Options for mutation callbacks.
 */
export interface MutationCallbacks<TData, TError = ApiErrorResponse> {
  onSuccess?: (data: TData) => void;
  onError?: (error: TError) => void;
}

/**
 * Parameters for update and delete mutations.
 */
export interface UpdateInventoryItemParams {
  uuid: InventoryItemUUID;
  data: UpdateInventoryItemRequest;
}

/**
 * Parameters for restore mutation.
 */
export interface RestoreInventoryItemParams {
  uuid: InventoryItemUUID;
}

/**
 * Parameters for delete mutation.
 */
export interface DeleteInventoryItemParams {
  uuid: InventoryItemUUID;
}

/**
 * Parameters for search mutation.
 */
export interface SearchInventoryItemsParams {
  params: InventoryItemSearchParams;
}