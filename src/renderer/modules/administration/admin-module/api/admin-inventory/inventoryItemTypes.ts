/**
 * ============================================================================
 * INVENTORY ITEM TYPE DEFINITIONS
 * ============================================================================
 * 
 * TypeScript type declarations for inventory item operations in the
 * healthcare facility management system.
 */

/* -------------------------------------------------------------------------- */
/*                                   ENUMS                                    */
/* -------------------------------------------------------------------------- */

/**
 * Inventory item categories
 */
export enum ItemCategory {
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
 * Controlled substance schedules
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
 * Inventory item operational status
 */
export enum ItemStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DISCONTINUED = 'discontinued',
  RECALLED = 'recalled',
}

/**
 * Routes of administration for medications
 */
export enum RouteOfAdministration {
  ORAL = 'oral',
  INTRAVENOUS = 'intravenous',
  INTRAMUSCULAR = 'intramuscular',
  SUBCUTANEOUS = 'subcutaneous',
  TOPICAL = 'topical',
  INHALATION = 'inhalation',
  RECTAL = 'rectal',
  VAGINAL = 'vaginal',
  OCULAR = 'ocular',
  OTIC = 'otic',
  NASAL = 'nasal',
  TRANSDERMAL = 'transdermal',
}

/**
 * Dosage forms for medications
 */
export enum DosageForm {
  TABLET = 'tablet',
  CAPSULE = 'capsule',
  SYRUP = 'syrup',
  INJECTION = 'injection',
  CREAM = 'cream',
  OINTMENT = 'ointment',
  SOLUTION = 'solution',
  SUSPENSION = 'suspension',
  POWDER = 'powder',
  INHALER = 'inhaler',
  PATCH = 'patch',
  SUPPOSITORY = 'suppository',
  DROPS = 'drops',
  SPRAY = 'spray',
  GEL = 'gel',
  LOTION = 'lotion',
}

/* -------------------------------------------------------------------------- */
/*                              CORE DATA TYPES                               */
/* -------------------------------------------------------------------------- */

/**
 * Inventory item entity as returned by API
 */
export interface InventoryItem {
  // Primary identifiers
  id: number;
  item_uuid: string;
  facility_id: number;

  // Item identification
  item_code: string | undefined;
  item_name: string;
  item_description: string | null;
  item_category: ItemCategory;
  item_subcategory: string | null;

  // Medication-specific fields
  generic_name: string | null;
  brand_name: string | null;
  ndc_code: string | null;
  drug_class: string | null;
  controlled_substance_schedule: ControlledSubstanceSchedule | null;
  active_ingredients: Record<string, unknown>[] | null;
  dosage_form?: string | undefined | DosageForm;
  strength: string | null;
  route_of_administration: RouteOfAdministration | string | null;

  // Manufacturing and sourcing
  manufacturer: string | null;
  manufacturer_item_number: string | null;
  supplier: string | null;

  // Inventory management
  unit_of_measure: string;
  package_quantity: number;
  packaging_type: string | null;
  unit_cost: number | null;
  average_wholesale_price: number | null;
  currency_code: string;

  // Storage requirements
  storage_requirements: string | null | undefined;
  requires_refrigeration: boolean;
  requires_controlled_access: boolean;
  storage_location_type: string | null;

  // Regulatory and safety
  requires_prescription: boolean;
  regulatory_approvals: Record<string, unknown> | null;
  fda_approval_number: string | null;
  is_hazardous: boolean;
  safety_warnings: string | null | undefined;
  contraindications:string | null | undefined;
  special_handling_instructions: string | null;

  // Billing and tracking
  is_billable: boolean;
  track_by_lot: boolean;
  track_by_serial: boolean;

  // Stock management
  reorder_point: number | null;
  reorder_quantity: number | null;
  safety_stock_level: number | null;
  max_stock_level: number | null;

  // Live stock balance from ledger (appended by resource)
  current_balance: number;

  // Status
  status: ItemStatus;

  // Metadata
  metadata: Record<string, unknown> | null;

  // Audit timestamps
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  created_by_staff_id: number | null;
}

/**
 * Simplified inventory item for lists
 */
export interface InventoryItemListItem {
  item_uuid: string;
  item_code: string;
  item_name: string;
  item_category: ItemCategory;
  generic_name: string | null;
  brand_name: string | null;
  unit_of_measure: string;
  package_quantity: number;
  unit_cost: number | null;
  currency_code: string;
  status: ItemStatus;
  requires_refrigeration: boolean;
  requires_prescription: boolean;
  is_hazardous: boolean;
}

/* -------------------------------------------------------------------------- */
/*                          REQUEST/RESPONSE TYPES                            */
/* -------------------------------------------------------------------------- */

/**
 * Query parameters for filtering inventory items
 */
export interface InventoryItemFilters {
  status?: ItemStatus;
  item_category?: ItemCategory;
  is_controlled_substance?: boolean;
  requires_prescription?: boolean;
  requires_refrigeration?: boolean;
  requires_controlled_access?: boolean;
  is_hazardous?: boolean;
  is_billable?: boolean;
  controlled_substance_schedule?: ControlledSubstanceSchedule;
  manufacturer?: string;
  supplier?: string;
  min_cost?: number;
  max_cost?: number;
  min_quantity?: number;
  max_quantity?: number;
  search?: string;
  per_page?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

/**
 * Request payload for creating an inventory item
 */
export interface CreateInventoryItemRequest {
  // Required fields
  item_name: string;
  item_category: ItemCategory;
  unit_of_measure: string;
  package_quantity: number;
  currency_code: string;
  status: ItemStatus;

  // Optional fields with defaults
  item_code?: string;
  item_description?: string | null;
  item_subcategory?: string | null;
  generic_name?: string | null;
  brand_name?: string | null;
  ndc_code?: string | null;
  drug_class?: string | null;
  controlled_substance_schedule?: ControlledSubstanceSchedule | null;
  active_ingredients?: Record<string, unknown>[] | null;
  dosage_form?: DosageForm | string ;
  strength?: string | null;
  route_of_administration?: RouteOfAdministration | string | null;
  manufacturer?: string | null;
  manufacturer_item_number?: string | null;
  supplier?: string | null;
  packaging_type?: string | null;
  unit_cost?: number | null;
  average_wholesale_price?: number | null;
  storage_requirements?: string | null | undefined;
  requires_refrigeration?: boolean;
  requires_controlled_access?: boolean;
  storage_location_type?: string | null;
  requires_prescription?: boolean;
  regulatory_approvals?: string | null | undefined;
  fda_approval_number?: string | null;
  is_hazardous?: boolean;
  safety_warnings?:string | null | undefined;
  contraindications?:string | null | undefined;
  special_handling_instructions?: string | null;
  is_billable?: boolean;
  track_by_lot?: boolean;
  track_by_serial?: boolean;
  reorder_point?: number | null;
  reorder_quantity?: number | null;
  safety_stock_level?: number | null;
  max_stock_level?: number | null;
  metadata?: Record<string, unknown> | null;
}

/**
 * Request payload for updating an inventory item
 */
export type UpdateInventoryItemRequest = Partial<CreateInventoryItemRequest> & {
  item_code?: string;
  ndc_code?: string | null;
};

/* -------------------------------------------------------------------------- */
/*                            API RESPONSE TYPES                              */
/* -------------------------------------------------------------------------- */

/**
 * Standard API response structure
 */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

/**
 * Paginated list response
 */
export interface PaginatedResponse<T> extends ApiResponse<T> {
  pagination: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
    from: number;
    to: number;
  };
}

/**
 * Single inventory item response
 */
export type InventoryItemResponse = ApiResponse<InventoryItem>;

/**
 * Inventory item list response
 */
export type InventoryItemListResponse = PaginatedResponse<InventoryItem[]>;

/**
 * Inventory item search response
 */
export type InventoryItemSearchResponse = ApiResponse<InventoryItem[]>;

/**
 * Controlled substances response
 */
export type ControlledSubstancesResponse = ApiResponse<InventoryItem[]>;

/**
 * Special handling items response
 */
export type SpecialHandlingItemsResponse = ApiResponse<InventoryItem[]>;

/**
 * Category items response
 */
export type CategoryItemsResponse = ApiResponse<InventoryItem[]>;

/* -------------------------------------------------------------------------- */
/*                              UTILITY TYPES                                 */
/* -------------------------------------------------------------------------- */

/**
 * Item UUID type alias
 */
export type ItemUUID = string;

/**
 * Item code type alias
 */
export type ItemCode = string;

/**
 * Item category parameter type
 */
export type ItemCategoryParam = ItemCategory;

/**
 * Mutation callback options
 */
export interface MutationCallbacks<TData, TError> {
  onSuccess?: (data: TData) => void;
  onError?: (error: TError) => void;
}

/**
 * Parameters for update mutation
 */
export interface UpdateInventoryItemParams {
  uuid: ItemUUID;
  data: UpdateInventoryItemRequest;
}

/**
 * Parameters for restore mutation
 */
export interface RestoreInventoryItemParams {
  uuid: ItemUUID;
}

/**
 * Parameters for delete mutation
 */
export interface DeleteInventoryItemParams {
  uuid: ItemUUID;
}

/**
 * Parameters for search query
 */
export interface SearchInventoryItemsParams {
  query: string;
  filters?: Partial<InventoryItemFilters>;
}

/**
 * Parameters for category query
 */
export interface CategoryItemsParams {
  category: ItemCategoryParam;
  filters?: Partial<InventoryItemFilters>;
}

/**
 * Parameters for controlled substances query
 */
export interface ControlledSubstancesParams {
  filters?: Partial<InventoryItemFilters>;
}

/**
 * Parameters for special handling query
 */
export interface SpecialHandlingParams {
  filters?: Partial<InventoryItemFilters>;
}

/**
 * Error response type
 */
export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
  data: [];
}

/* -------------------------------------------------------------------------- */
/*                       INVENTORY LEDGER TYPES                               */
/* -------------------------------------------------------------------------- */

/**
 * Current balance response from /inventory/ledger/balance/current
 */
export interface CurrentBalanceResponse {
  success: true;
  data: {
    facility_id: number;
    inventory_item_id: number;
    current_balance: number;
    timestamp: string;
  };
}

/**
 * Adjust stock request body for POST /inventory/ledger/adjustment
 * quantity_change: positive = increase stock, negative = decrease stock
 */
export interface AdjustStockRequest {
  facility_id: number;
  inventory_item_id: number;
  quantity: number;
  unit_of_measure: string;
  performed_by_staff_id: number;
  transaction_notes?: string;
  lot_number?: string;
  expiry_date?: string;
}

/**
 * Ledger entry response after recording a transaction
 */
export interface LedgerEntryResponse {
  success: true;
  message: string;
  data: {
    id: number;
    transaction_uuid: string;
    facility_id: number;
    inventory_item_id: number;
    transaction_type: string;
    quantity_change: number;
    balance_after_transaction: number;
    unit_of_measure: string;
    transaction_cause: string;
    transaction_notes: string | null;
    performed_by_staff_id: number;
    transaction_timestamp: string;
    created_at: string;
  };
}

/**
 * Parameters for getting current stock balance
 */
export interface GetCurrentBalanceParams {
  facility_id: number;
  inventory_item_id: number;
}