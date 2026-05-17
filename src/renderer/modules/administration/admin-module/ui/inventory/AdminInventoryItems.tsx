import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Microscope,
  Pill,
  Scissors,
  Shield,
  Stethoscope,
  Package as PackageIcon,
  Activity,
} from 'lucide-react';

import { useAppSelector } from '../../../../../app/store/hooks/useApp';
import { useConfirm } from '../../../../../shared/components/Feedback/ConfirmDialog/ConfirmContext';
import LoadingSkeleton from '../../../../../shared/components/Loading/LoadingSkeletons';

import {
  useGetInventoryItems,
  useCreateInventoryItem,
  useUpdateInventoryItem,
  useDeleteInventoryItem,
  useRestoreInventoryItem,
  inventoryItemKeys,
} from '../../api/admin-inventory/useInventoryItemQueries';

import {
  type CreateInventoryItemRequest,
  type UpdateInventoryItemRequest,
  type InventoryItemFilters,
  type InventoryItem,
  ItemCategory,
  ControlledSubstanceSchedule,
  DosageForm,
  RouteOfAdministration,
  ItemStatus,
  type InventoryItemListResponse,
} from '../../api/admin-inventory/inventoryItemTypes';

import { InventoryItemHeader } from './components/InventoryItemHeader';
import { InventoryItemFiltersBar } from './components/InventoryItemFiltersBar';
import { InventoryItemFormDrawer, type InventoryItemFormData } from './components/InventoryItemFormDrawer';
import { InventoryCatalogList } from './components/InventoryCatalogList';
import { InventoryStockAdjustModal } from './components/InventoryStockAdjustModal';
import { generateItemCode } from './utils/inventoryItemUiUtils';

interface AdminInventoryItemProps {
  theme: 'light' | 'dark';
}

// Define filter state interface
interface FilterState {
  searchTerm: string;
  categoryFilter: ItemCategory | 'all';
  statusFilter: ItemStatus | 'all';
  controlledSubstanceFilter: ControlledSubstanceSchedule | 'all' | 'non_controlled';
  effectiveDate: string;
  showDeleted: boolean;
  requiresRefrigerationFilter: boolean | 'all';
  requiresPrescriptionFilter: boolean | 'all';
  isHazardousFilter: boolean | 'all';
}

const emptyForm = (): InventoryItemFormData => ({
  item_code: generateItemCode(),
  item_name: '',
  item_description: '',
  item_category: ItemCategory.MEDICATION,
  item_subcategory: '',
  
  // Clinical/Medication fields
  generic_name: '',
  brand_name: '',
  ndc_code: '',
  drug_class: '',
  controlled_substance_schedule: '',
  dosage_form: DosageForm.TABLET,
  strength: '',
  route_of_administration: '',
  
  // Manufacturer & Supplier
  manufacturer: '',
  manufacturer_item_number: '',
  supplier: '',
  
  // Packaging & Pricing
  unit_of_measure: 'Each',
  package_quantity: 1,
  packaging_type: '',
  unit_cost: 0,
  average_wholesale_price: 0,
  currency_code: 'UGX',
  
  // Storage Requirements
  requires_refrigeration: false,
  requires_controlled_access: false,
  storage_location_type: '',
  storage_requirements: '',
  
  // Safety & Compliance
  requires_prescription: false,
  fda_approval_number: '',
  is_hazardous: false,
  safety_warnings: '',
  contraindications: '',
  special_handling_instructions: '',
  
  // Tracking & Billing
  is_billable: true,
  track_by_lot: false,
  track_by_serial: false,
  
  // Stock Management
  reorder_point: null,
  reorder_quantity: null,
  safety_stock_level: null,
  max_stock_level: null,
  
  // Status
  status: ItemStatus.ACTIVE,
});

type DrawerMode = 'create' | 'edit';
type ViewMode = 'list' | 'grid';

export const AdminInventoryItem: React.FC<AdminInventoryItemProps> = ({ theme }) => {
  const isDark = theme === 'dark';
  const queryClient = useQueryClient();
  const { confirm } = useConfirm();

  const activeContext = useAppSelector(state => state.activeContext);
  const activeFacilityId = activeContext.activeFacilityId;

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<DrawerMode>('create');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [formData, setFormData] = useState<InventoryItemFormData>(() => emptyForm());

  // Consolidated filter state
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: '',
    categoryFilter: 'all',
    statusFilter: 'all',
    controlledSubstanceFilter: 'all',
    effectiveDate: '',
    showDeleted: false,
    requiresRefrigerationFilter: 'all',
    requiresPrescriptionFilter: 'all',
    isHazardousFilter: 'all',
  });

  // UI state
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Stock adjust modal state
  const [adjustStockItem, setAdjustStockItem] = useState<InventoryItem | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5); // Start from 5

  // ---------------------------------------------------------------------------
  // OPTIONS
  // ---------------------------------------------------------------------------
  const itemCategoryOptions: {
    value: ItemCategory;
    label: string;
    icon: React.ElementType;
    color: string;
  }[] = useMemo(
    () => [
      { value: ItemCategory.MEDICATION, label: 'Medication', icon: Pill, color: 'text-blue-500' },
      { value: ItemCategory.MEDICAL_SUPPLY, label: 'Medical Supply', icon: Box, color: 'text-green-500' },
      { value: ItemCategory.SURGICAL_INSTRUMENT, label: 'Surgical Instrument', icon: Scissors, color: 'text-red-500' },
      { value: ItemCategory.DIAGNOSTIC_EQUIPMENT, label: 'Diagnostic Equipment', icon: Stethoscope, color: 'text-purple-500' },
      { value: ItemCategory.IMPLANTABLE_DEVICE, label: 'Implantable Device', icon: Activity, color: 'text-indigo-500' },
      { value: ItemCategory.PROSTHETIC, label: 'Prosthetic', icon: Box, color: 'text-teal-500' },
      { value: ItemCategory.LABORATORY_REAGENT, label: 'Laboratory Reagent', icon: Microscope, color: 'text-yellow-500' },
      { value: ItemCategory.PERSONAL_PROTECTIVE_EQUIPMENT, label: 'PPE', icon: Shield, color: 'text-orange-500' },
      { value: ItemCategory.ADMINISTRATIVE_SUPPLY, label: 'Administrative Supply', icon: PackageIcon, color: 'text-gray-500' },
      { value: ItemCategory.OTHER, label: 'Other', icon: PackageIcon, color: 'text-gray-400' },
    ],
    []
  );

  const controlledSubstanceOptions = useMemo(
    () => [
      { value: ControlledSubstanceSchedule.SCHEDULE_I, label: 'Schedule I' },
      { value: ControlledSubstanceSchedule.SCHEDULE_II, label: 'Schedule II' },
      { value: ControlledSubstanceSchedule.SCHEDULE_III, label: 'Schedule III' },
      { value: ControlledSubstanceSchedule.SCHEDULE_IV, label: 'Schedule IV' },
      { value: ControlledSubstanceSchedule.SCHEDULE_V, label: 'Schedule V' },
      { value: 'non_controlled' as const, label: 'Non-Controlled' },
    ],
    []
  );

  const statusOptions = useMemo(
    () => [
      { value: ItemStatus.ACTIVE, label: 'Active' },
      { value: ItemStatus.INACTIVE, label: 'Inactive' },
      { value: ItemStatus.DISCONTINUED, label: 'Discontinued' },
      { value: ItemStatus.RECALLED, label: 'Recalled' },
    ],
    []
  );

  const currencyOptions = useMemo(
    () => [
      { value: 'UGX', label: 'UGX - Ugandan Shilling' },
      { value: 'USD', label: 'USD - US Dollar' },
      { value: 'EUR', label: 'EUR - Euro' },
      { value: 'GBP', label: 'GBP - British Pound' },
      { value: 'KES', label: 'KES - Kenyan Shilling' },
      { value: 'TZS', label: 'TZS - Tanzanian Shilling' },
    ],
    []
  );

  const dosageFormOptions = useMemo(
    () => [
      { value: DosageForm.TABLET, label: 'Tablet' },
      { value: DosageForm.CAPSULE, label: 'Capsule' },
      { value: DosageForm.SYRUP, label: 'Syrup' },
      { value: DosageForm.INJECTION, label: 'Injection' },
      { value: DosageForm.CREAM, label: 'Cream' },
      { value: DosageForm.OINTMENT, label: 'Ointment' },
      { value: DosageForm.SOLUTION, label: 'Solution' },
      { value: DosageForm.SUSPENSION, label: 'Suspension' },
      { value: DosageForm.POWDER, label: 'Powder' },
      { value: DosageForm.INHALER, label: 'Inhaler' },
      { value: DosageForm.PATCH, label: 'Patch' },
      { value: DosageForm.SUPPOSITORY, label: 'Suppository' },
      { value: DosageForm.DROPS, label: 'Drops' },
      { value: DosageForm.SPRAY, label: 'Spray' },
      { value: DosageForm.GEL, label: 'Gel' },
      { value: DosageForm.LOTION, label: 'Lotion' },
    ],
    []
  );

  const routeOfAdministrationOptions = useMemo(
    () => [
      { value: RouteOfAdministration.ORAL, label: 'Oral' },
      { value: RouteOfAdministration.INTRAVENOUS, label: 'Intravenous' },
      { value: RouteOfAdministration.INTRAMUSCULAR, label: 'Intramuscular' },
      { value: RouteOfAdministration.SUBCUTANEOUS, label: 'Subcutaneous' },
      { value: RouteOfAdministration.TOPICAL, label: 'Topical' },
      { value: RouteOfAdministration.INHALATION, label: 'Inhalation' },
      { value: RouteOfAdministration.RECTAL, label: 'Rectal' },
      { value: RouteOfAdministration.VAGINAL, label: 'Vaginal' },
      { value: RouteOfAdministration.OCULAR, label: 'Ocular' },
      { value: RouteOfAdministration.OTIC, label: 'Otic' },
      { value: RouteOfAdministration.NASAL, label: 'Nasal' },
      { value: RouteOfAdministration.TRANSDERMAL, label: 'Transdermal' },
    ],
    []
  );

  const storageTypeOptions = useMemo(
    () => [
      { value: 'room_temperature', label: 'Room Temperature' },
      { value: 'refrigerated', label: 'Refrigerated (2-8°C)' },
      { value: 'frozen', label: 'Frozen (-20°C)' },
      { value: 'controlled_room', label: 'Controlled Room Temperature' },
      { value: 'ambient', label: 'Ambient' },
      { value: 'cool_dry_place', label: 'Cool, Dry Place' },
    ],
    []
  );

  const unitOfMeasureOptions = useMemo(
    () => [
      { value: 'Each', label: 'Each' },
      { value: 'Box', label: 'Box' },
      { value: 'Bottle', label: 'Bottle' },
      { value: 'Vial', label: 'Vial' },
      { value: 'Ampule', label: 'Ampule' },
      { value: 'Tube', label: 'Tube' },
      { value: 'Pack', label: 'Pack' },
      { value: 'Set', label: 'Set' },
      { value: 'Kit', label: 'Kit' },
      { value: 'Pair', label: 'Pair' },
      { value: 'Roll', label: 'Roll' },
      { value: 'Sheet', label: 'Sheet' },
      { value: 'Meter', label: 'Meter' },
      { value: 'Liter', label: 'Liter' },
      { value: 'Milliliter', label: 'Milliliter' },
      { value: 'Gram', label: 'Gram' },
      { value: 'Milligram', label: 'Milligram' },
    ],
    []
  );

  // ---------------------------------------------------------------------------
  // FILTERS (Fetch all data for client-side filtering)
  // ---------------------------------------------------------------------------
  const backendFilters: InventoryItemFilters = useMemo(() => {
    return {
      per_page: 1000, // Fetch a large number to get all data
      show_deleted: filters.showDeleted, // Still let backend know if we want deleted
    };
  }, [filters.showDeleted]);

  const {
    data: itemsResponse,
    isLoading,
    error,
    refetch,
  } = useGetInventoryItems(backendFilters, {
    enabled: !!activeFacilityId,
    staleTime: 1000 * 30, // 30 seconds
  });

  const items = itemsResponse?.data ?? [];

  // ---------------------------------------------------------------------------
  // CLIENT-SIDE FILTERING - Apply all filters to the loaded data
  // ---------------------------------------------------------------------------
  const filteredItems = useMemo(() => {
    let filtered = [...items];

    // Apply category filter
    if (filters.categoryFilter !== 'all') {
      filtered = filtered.filter(item => item.item_category === filters.categoryFilter);
    }

    // Apply status filter
    if (filters.statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status === filters.statusFilter);
    }

    // Apply controlled substance filter
    if (filters.controlledSubstanceFilter === 'non_controlled') {
      filtered = filtered.filter(item => !item.controlled_substance_schedule);
    } else if (filters.controlledSubstanceFilter !== 'all') {
      filtered = filtered.filter(item => item.controlled_substance_schedule === filters.controlledSubstanceFilter);
    }

    // Apply refrigeration filter
    if (filters.requiresRefrigerationFilter !== 'all') {
      filtered = filtered.filter(item => item.requires_refrigeration === filters.requiresRefrigerationFilter);
    }

    // Apply prescription filter
    if (filters.requiresPrescriptionFilter !== 'all') {
      filtered = filtered.filter(item => item.requires_prescription === filters.requiresPrescriptionFilter);
    }

    // Apply hazardous filter
    if (filters.isHazardousFilter !== 'all') {
      filtered = filtered.filter(item => item.is_hazardous === filters.isHazardousFilter);
    }

    // Apply show deleted filter
    if (!filters.showDeleted) {
      filtered = filtered.filter(item => !item.deleted_at);
    } else {
      filtered = filtered.filter(item => item.deleted_at !== null);
    }

    // Apply effective date filter (if provided) - compare with created_at
    if (filters.effectiveDate) {
      const filterDate = new Date(filters.effectiveDate);
      filtered = filtered.filter(item => new Date(item.created_at) <= filterDate);
    }

    // Apply search term (case-insensitive)
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(item => 
        item.item_name.toLowerCase().includes(term) ||
        (item.item_code?.toLowerCase() || '').includes(term) ||
        (item.generic_name?.toLowerCase() || '').includes(term) ||
        (item.ndc_code?.toLowerCase() || '').includes(term) ||
        (item.brand_name?.toLowerCase() || '').includes(term)
      );
    }

    return filtered;
  }, [items, filters]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, itemsPerPage]);

  const setListCache = useCallback(
    (updater: (current: InventoryItemListResponse | undefined) => InventoryItemListResponse | undefined) => {
      queryClient.setQueryData<InventoryItemListResponse>(inventoryItemKeys.list(backendFilters), updater);
    },
    [queryClient, backendFilters]
  );

  // ---------------------------------------------------------------------------
  // MUTATIONS + optimistic UI
  // ---------------------------------------------------------------------------
  const createMutation = useCreateInventoryItem({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryItemKeys.all });
      closeDrawer();
    },
  });

  const updateMutation = useUpdateInventoryItem({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryItemKeys.all });
      closeDrawer();
    },
  });

  const deleteMutation = useDeleteInventoryItem({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryItemKeys.all });
      setSelectedItem(null);
    },
  });

  const restoreMutation = useRestoreInventoryItem({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryItemKeys.all });
    },
  });

  // ---------------------------------------------------------------------------
  // Filter handlers - update consolidated filters object
  // ---------------------------------------------------------------------------
  const handleSearchTermChange = (value: string) => {
    setFilters(prev => ({ ...prev, searchTerm: value }));
  };

  const handleCategoryFilterChange = (value: ItemCategory | 'all') => {
    setFilters(prev => ({ ...prev, categoryFilter: value }));
  };

  const handleStatusFilterChange = (value: ItemStatus | 'all') => {
    setFilters(prev => ({ ...prev, statusFilter: value }));
  };

  const handleControlledSubstanceFilterChange = (value: ControlledSubstanceSchedule | 'all' | 'non_controlled') => {
    setFilters(prev => ({ ...prev, controlledSubstanceFilter: value }));
  };

  const handleEffectiveDateChange = (value: string) => {
    setFilters(prev => ({ ...prev, effectiveDate: value }));
  };

  const handleToggleShowDeleted = () => {
    setFilters(prev => ({ ...prev, showDeleted: !prev.showDeleted }));
  };

  const handleRequiresRefrigerationChange = (value: boolean | 'all') => {
    setFilters(prev => ({ ...prev, requiresRefrigerationFilter: value }));
  };

  const handleRequiresPrescriptionChange = (value: boolean | 'all') => {
    setFilters(prev => ({ ...prev, requiresPrescriptionFilter: value }));
  };

  const handleIsHazardousChange = (value: boolean | 'all') => {
    setFilters(prev => ({ ...prev, isHazardousFilter: value }));
  };

  const handlePerPageChange = (value: number) => {
    setItemsPerPage(Math.max(1, Math.min(500, value)));
  };

  // ---------------------------------------------------------------------------
  // Drawer handlers
  // ---------------------------------------------------------------------------
  const openCreate = () => {
    setDrawerMode('create');
    setSelectedItem(null);
    setFormData(emptyForm());
    setDrawerOpen(true);
  };

  const openEdit = (item: InventoryItem) => {
    setDrawerMode('edit');
    setSelectedItem(item);

    setFormData({
      // Basic Info
      item_code: item.item_code || generateItemCode(),
      item_name: item.item_name,
      item_description: item.item_description || '',
      item_category: item.item_category,
      item_subcategory: item.item_subcategory || '',
      
      // Clinical/Medication Details
      generic_name: item.generic_name || '',
      brand_name: item.brand_name || '',
      ndc_code: item.ndc_code || '',
      drug_class: item.drug_class || '',
      controlled_substance_schedule: item.controlled_substance_schedule || '',
      dosage_form: item.dosage_form as DosageForm || DosageForm.TABLET,
      strength: item.strength || '',
      route_of_administration: item.route_of_administration as RouteOfAdministration,
      
      // Manufacturer & Supplier
      manufacturer: item.manufacturer || '',
      manufacturer_item_number: item.manufacturer_item_number || '',
      supplier: item.supplier || '',
      
      // Packaging & Pricing
      unit_of_measure: item.unit_of_measure,
      package_quantity: item.package_quantity,
      packaging_type: item.packaging_type || '',
      unit_cost: item.unit_cost || 0,
      average_wholesale_price: item.average_wholesale_price || 0,
      currency_code: item.currency_code,
      
      // Storage Requirements
      requires_refrigeration: item.requires_refrigeration,
      requires_controlled_access: item.requires_controlled_access,
      storage_location_type: item.storage_location_type || '',
      storage_requirements: item.storage_requirements as any,
      
      // Safety & Compliance
      requires_prescription: item.requires_prescription,
      fda_approval_number: item.fda_approval_number || '',
      is_hazardous: item.is_hazardous,
      safety_warnings: item.safety_warnings || '',
      contraindications: item.contraindications || '',
      special_handling_instructions: item.special_handling_instructions || '',
      
      // Tracking & Billing
      is_billable: item.is_billable,
      track_by_lot: item.track_by_lot,
      track_by_serial: item.track_by_serial,
      
      // Stock Management
      reorder_point: item.reorder_point,
      reorder_quantity: item.reorder_quantity,
      safety_stock_level: item.safety_stock_level,
      max_stock_level: item.max_stock_level,
      
      // Status
      status: item.status,
    });

    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setSelectedItem(null);
    setFormData(emptyForm());
  };

  const handleDuplicate = (item: InventoryItem) => {
    setDrawerMode('create');
    setSelectedItem(null);

    setFormData({
      // Basic Info - modified for duplicate
      item_code: generateItemCode(),
      item_name: `${item.item_name} (Copy)`,
      item_description: item.item_description || '',
      item_category: item.item_category,
      item_subcategory: item.item_subcategory || '',
      
      // Clinical/Medication Details
      generic_name: item.generic_name || '',
      brand_name: item.brand_name || '',
      ndc_code: '', // Clear NDC for duplicate
      drug_class: item.drug_class || '',
      controlled_substance_schedule: item.controlled_substance_schedule || '',
      dosage_form: item.dosage_form as DosageForm || DosageForm.TABLET,
      strength: item.strength || '',
      route_of_administration: item.route_of_administration as RouteOfAdministration,
      
      // Manufacturer & Supplier
      manufacturer: item.manufacturer || '',
      manufacturer_item_number: '', // Clear for duplicate
      supplier: item.supplier || '',
      
      // Packaging & Pricing
      unit_of_measure: item.unit_of_measure,
      package_quantity: item.package_quantity,
      packaging_type: item.packaging_type || '',
      unit_cost: item.unit_cost || 0,
      average_wholesale_price: item.average_wholesale_price || 0,
      currency_code: item.currency_code,
      
      // Storage Requirements
      requires_refrigeration: item.requires_refrigeration,
      requires_controlled_access: item.requires_controlled_access,
      storage_location_type: item.storage_location_type || '',
      storage_requirements: item.storage_requirements as any,
      
      // Safety & Compliance
      requires_prescription: item.requires_prescription,
      fda_approval_number: '', // Clear for duplicate
      is_hazardous: item.is_hazardous,
      safety_warnings: item.safety_warnings || '',
      contraindications: item.contraindications || '',
      special_handling_instructions: item.special_handling_instructions || '',
      
      // Tracking & Billing
      is_billable: item.is_billable,
      track_by_lot: item.track_by_lot,
      track_by_serial: item.track_by_serial,
      
      // Stock Management
      reorder_point: item.reorder_point,
      reorder_quantity: item.reorder_quantity,
      safety_stock_level: item.safety_stock_level,
      max_stock_level: item.max_stock_level,
      
      // Status
      status: item.status,
    });

    setDrawerOpen(true);
  };

  const toggleExpand = (uuid: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(uuid)) {
        next.delete(uuid);
      } else {
        next.add(uuid);
      }
      return next;
    });
  };

  // ---------------------------------------------------------------------------
  // Submit
  // ---------------------------------------------------------------------------
  const handleSubmit = () => {
    if (!activeFacilityId) return;

    // Helper function to safely trim strings
    const safeTrim = (value: string | undefined | null): string | undefined => {
      if (typeof value === 'string' && value.trim() !== '') {
        return value.trim();
      }
      return undefined;
    };

    const payload: CreateInventoryItemRequest = {
      // Required fields
      item_code: safeTrim(formData.item_code) ?? '',
      item_name: safeTrim(formData.item_name) ?? '',
      item_category: formData.item_category,
      unit_of_measure: formData.unit_of_measure,
      package_quantity: formData.package_quantity,
      currency_code: formData.currency_code,
      status: formData.status,

      // Optional fields
      item_description: safeTrim(formData.item_description),
      item_subcategory: safeTrim(formData.item_subcategory),
      generic_name: safeTrim(formData.generic_name),
      brand_name: safeTrim(formData.brand_name),
      ndc_code: safeTrim(formData.ndc_code),
      drug_class: safeTrim(formData.drug_class),
      controlled_substance_schedule: formData.controlled_substance_schedule || undefined,
      dosage_form: formData.dosage_form || undefined,
      strength: safeTrim(formData.strength),
      route_of_administration: formData.route_of_administration || undefined,
      manufacturer: safeTrim(formData.manufacturer),
      manufacturer_item_number: safeTrim(formData.manufacturer_item_number),
      supplier: safeTrim(formData.supplier),
      packaging_type: safeTrim(formData.packaging_type),
      unit_cost: formData.unit_cost || undefined,
      average_wholesale_price: formData.average_wholesale_price || undefined,
      requires_refrigeration: formData.requires_refrigeration,
      requires_controlled_access: formData.requires_controlled_access,
      storage_location_type: safeTrim(formData.storage_location_type),
      storage_requirements: safeTrim(formData.storage_requirements),
      requires_prescription: formData.requires_prescription,
      fda_approval_number: safeTrim(formData.fda_approval_number),
      is_hazardous: formData.is_hazardous,
      safety_warnings: formData.safety_warnings as any,
      contraindications: formData.contraindications,
      special_handling_instructions: safeTrim(formData.special_handling_instructions),
      is_billable: formData.is_billable,
      track_by_lot: formData.track_by_lot,
      track_by_serial: formData.track_by_serial,
      reorder_point: formData.reorder_point,
      reorder_quantity: formData.reorder_quantity,
      safety_stock_level: formData.safety_stock_level,
      max_stock_level: formData.max_stock_level,
    };

    if (drawerMode === 'create') {
      const previous = queryClient.getQueryData<InventoryItemListResponse>(inventoryItemKeys.list(backendFilters));
      const now = new Date().toISOString();
      const tempUuid = `temp-${crypto.randomUUID()}`;

      const optimistic: InventoryItem = {
        id: -1,
        item_uuid: tempUuid,
        facility_id: Number(activeFacilityId),
        item_code: payload.item_code,
        item_name: payload.item_name,
        item_description: payload.item_description ?? null,
        item_category: payload.item_category,
        item_subcategory: payload.item_subcategory ?? null,
        generic_name: payload.generic_name ?? null,
        brand_name: payload.brand_name ?? null,
        ndc_code: payload.ndc_code ?? null,
        drug_class: payload.drug_class ?? null,
        controlled_substance_schedule: payload.controlled_substance_schedule ?? null,
        active_ingredients: null,
        dosage_form: payload.dosage_form as DosageForm,
        strength: payload.strength ?? null,
        route_of_administration: payload.route_of_administration || null,
        manufacturer: payload.manufacturer ?? null,
        manufacturer_item_number: payload.manufacturer_item_number ?? null,
        supplier: payload.supplier ?? null,
        unit_of_measure: payload.unit_of_measure,
        package_quantity: payload.package_quantity,
        packaging_type: payload.packaging_type ?? null,
        unit_cost: payload.unit_cost ?? null,
        average_wholesale_price: payload.average_wholesale_price ?? null,
        currency_code: payload.currency_code,
        storage_requirements: payload.storage_requirements ?? null,
        requires_refrigeration: payload.requires_refrigeration ?? false,
        requires_controlled_access: payload.requires_controlled_access ?? false,
        storage_location_type: payload.storage_location_type ?? null,
        requires_prescription: payload.requires_prescription ?? false,
        regulatory_approvals: null,
        fda_approval_number: payload.fda_approval_number ?? null,
        is_hazardous: payload.is_hazardous ?? false,
        safety_warnings: payload.safety_warnings ?? null,
        contraindications: payload.contraindications ?? null,
        special_handling_instructions: payload.special_handling_instructions ?? null,
        is_billable: payload.is_billable ?? true,
        track_by_lot: payload.track_by_lot ?? false,
        track_by_serial: payload.track_by_serial ?? false,
        reorder_point: payload.reorder_point ?? null,
        reorder_quantity: payload.reorder_quantity ?? null,
        safety_stock_level: payload.safety_stock_level ?? null,
        max_stock_level: payload.max_stock_level ?? null,
        current_balance: payload.package_quantity,
        status: payload.status,
        metadata: null,
        created_at: now,
        updated_at: now,
        deleted_at: null,
        created_by_staff_id: null,
      };

      setListCache(current => {
        if (!current) return current;
        return { ...current, data: [optimistic, ...current.data] };
      });

      createMutation.mutate(payload, {
        onError: () => {
          queryClient.setQueryData(inventoryItemKeys.list(backendFilters), previous);
        },
      });

      return;
    }

    const mergeItemWithPayload = (
      existingItem: InventoryItem,
      payload: CreateInventoryItemRequest
    ): InventoryItem => {
      return {
        ...existingItem,
        item_code: payload.item_code,
        item_name: payload.item_name,
        item_description: payload.item_description ?? existingItem.item_description,
        item_category: payload.item_category,
        item_subcategory: payload.item_subcategory ?? existingItem.item_subcategory,
        generic_name: payload.generic_name ?? existingItem.generic_name,
        brand_name: payload.brand_name ?? existingItem.brand_name,
        ndc_code: payload.ndc_code ?? existingItem.ndc_code,
        drug_class: payload.drug_class ?? existingItem.drug_class,
        controlled_substance_schedule: payload.controlled_substance_schedule ?? existingItem.controlled_substance_schedule,
        dosage_form: payload.dosage_form ?? existingItem.dosage_form,
        strength: payload.strength ?? existingItem.strength,
        route_of_administration: payload.route_of_administration ?? existingItem.route_of_administration,
        manufacturer: payload.manufacturer ?? existingItem.manufacturer,
        manufacturer_item_number: payload.manufacturer_item_number ?? existingItem.manufacturer_item_number,
        supplier: payload.supplier ?? existingItem.supplier,
        unit_of_measure: payload.unit_of_measure,
        package_quantity: payload.package_quantity,
        packaging_type: payload.packaging_type ?? existingItem.packaging_type,
        unit_cost: payload.unit_cost ?? existingItem.unit_cost,
        average_wholesale_price: payload.average_wholesale_price ?? existingItem.average_wholesale_price,
        currency_code: payload.currency_code,
        requires_refrigeration: payload.requires_refrigeration ?? existingItem.requires_refrigeration,
        requires_controlled_access: payload.requires_controlled_access ?? existingItem.requires_controlled_access,
        storage_location_type: payload.storage_location_type ?? existingItem.storage_location_type,
        storage_requirements: payload.storage_requirements ?? existingItem.storage_requirements,
        requires_prescription: payload.requires_prescription ?? existingItem.requires_prescription,
        regulatory_approvals: existingItem.regulatory_approvals,
        fda_approval_number: payload.fda_approval_number ?? existingItem.fda_approval_number,
        is_hazardous: payload.is_hazardous ?? existingItem.is_hazardous,
        safety_warnings: payload.safety_warnings ?? existingItem.safety_warnings,
        contraindications: payload.contraindications ?? existingItem.contraindications,
        special_handling_instructions: payload.special_handling_instructions ?? existingItem.special_handling_instructions,
        is_billable: payload.is_billable ?? existingItem.is_billable,
        track_by_lot: payload.track_by_lot ?? existingItem.track_by_lot,
        track_by_serial: payload.track_by_serial ?? existingItem.track_by_serial,
        reorder_point: payload.reorder_point ?? existingItem.reorder_point,
        reorder_quantity: payload.reorder_quantity ?? existingItem.reorder_quantity,
        safety_stock_level: payload.safety_stock_level ?? existingItem.safety_stock_level,
        max_stock_level: payload.max_stock_level ?? existingItem.max_stock_level,
        status: payload.status,
        updated_at: new Date().toISOString(),
      };
    };

    if (drawerMode === 'edit' && selectedItem) {
      const uuid = selectedItem.item_uuid;
      const previous = queryClient.getQueryData<InventoryItemListResponse>(inventoryItemKeys.list(backendFilters));

      setListCache(current => {
        if (!current) return current;
        return {
          ...current,
          data: current.data.map(i =>
            i.item_uuid === uuid ? mergeItemWithPayload(i, payload) : i
          ),
        };
      });

      updateMutation.mutate(
        { uuid, data: payload as UpdateInventoryItemRequest },
        {
          onError: () => {
            queryClient.setQueryData(inventoryItemKeys.list(backendFilters), previous);
          },
        }
      );
    }
  };

  const handleAdjustStock = useCallback((item: InventoryItem) => {
    setAdjustStockItem(item);
  }, []);

  const handleDelete = async (item: InventoryItem) => {
    const confirmed = await confirm({
      title: 'Delete Inventory Item',
      message: `Are you sure you want to delete "${item.item_name}"? This action can be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger',
      theme,
    });

    if (!confirmed) return;

    const previous = queryClient.getQueryData<InventoryItemListResponse>(inventoryItemKeys.list(backendFilters));

    setListCache(current => {
      if (!current) return current;
      return {
        ...current,
        data: current.data.map(i =>
          i.item_uuid === item.item_uuid 
            ? { ...i, deleted_at: new Date().toISOString() } 
            : i
        ),
      };
    });

    deleteMutation.mutate(
      { uuid: item.item_uuid },
      {
        onError: () => {
          queryClient.setQueryData(inventoryItemKeys.list(backendFilters), previous);
        },
      }
    );
  };

  const handleRestore = (item: InventoryItem) => {
    const previous = queryClient.getQueryData<InventoryItemListResponse>(inventoryItemKeys.list(backendFilters));

    setListCache(current => {
      if (!current) return current;
      return {
        ...current,
        data: current.data.map(i =>
          i.item_uuid === item.item_uuid 
            ? { ...i, deleted_at: null } 
            : i
        ),
      };
    });

    restoreMutation.mutate(
      { uuid: item.item_uuid },
      {
        onError: () => {
          queryClient.setQueryData(inventoryItemKeys.list(backendFilters), previous);
        },
      }
    );
  };

  // ---------------------------------------------------------------------------
  // Validation
  // ---------------------------------------------------------------------------
  const canSubmit = useMemo(() => {
    return !!formData.item_code?.trim() &&
           !!formData.item_name?.trim() &&
           formData.package_quantity > 0;
  }, [formData.item_code, formData.item_name, formData.package_quantity]);

  // ---------------------------------------------------------------------------
  // Guards + loading
  // ---------------------------------------------------------------------------
  if (!activeFacilityId) {
    return (
      <div className={`rounded-xl p-8 text-center ${isDark ? 'bg-gray-900/50' : 'bg-gray-50'}`}>
        <PackageIcon className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
        <h3 className="text-lg font-medium mb-2">No Facility Selected</h3>
        <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
          Please select a facility from the sidebar to manage inventory items.
        </p>
      </div>
    );
  }

  if (isLoading && !itemsResponse) {
    return <LoadingSkeleton variant="dashboard" theme={theme} message="Loading inventory items..." />;
  }

  return (
    <div className="space-y-6">
      <InventoryItemHeader
        theme={theme}
        items={items}
        onRefresh={() => refetch()}
        onCreate={openCreate}
        onImport={() => {
          console.log('Open import dialog');
        }}
      />

      <InventoryItemFiltersBar
        theme={theme}
        searchTerm={filters.searchTerm}
        onSearchTermChange={handleSearchTermChange}
        categoryFilter={filters.categoryFilter}
        onCategoryFilterChange={handleCategoryFilterChange}
        statusFilter={filters.statusFilter}
        onStatusFilterChange={handleStatusFilterChange}
        controlledSubstanceFilter={filters.controlledSubstanceFilter}
        onControlledSubstanceFilterChange={handleControlledSubstanceFilterChange}
        effectiveDate={filters.effectiveDate}
        onEffectiveDateChange={handleEffectiveDateChange}
        showDeleted={filters.showDeleted}
        onToggleShowDeleted={handleToggleShowDeleted}
        viewMode={viewMode}
        onToggleViewMode={() => setViewMode(v => (v === 'list' ? 'grid' : 'list'))}
        perPage={itemsPerPage}
        onPerPageChange={handlePerPageChange}
        requiresRefrigerationFilter={filters.requiresRefrigerationFilter}
        onRequiresRefrigerationChange={handleRequiresRefrigerationChange}
        requiresPrescriptionFilter={filters.requiresPrescriptionFilter}
        onRequiresPrescriptionChange={handleRequiresPrescriptionChange}
        isHazardousFilter={filters.isHazardousFilter}
        onIsHazardousChange={handleIsHazardousChange}
        itemCategoryOptions={itemCategoryOptions.map(({ value, label }) => ({ value, label }))}
        statusOptions={statusOptions}
        controlledSubstanceOptions={controlledSubstanceOptions}
      />

      <InventoryCatalogList
        theme={theme}
        viewMode={viewMode}
        isLoading={isLoading}
        error={error ? new Error(error.message) : null}
        items={filteredItems}
        expandedItems={expandedItems}
        onToggleExpand={toggleExpand}
        onEdit={openEdit}
        onDuplicate={handleDuplicate}
        onDelete={handleDelete}
        onRestore={handleRestore}
        onAdjustStock={handleAdjustStock}
        onRetry={() => refetch()}
        itemCategoryOptions={itemCategoryOptions}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        itemsPerPage={itemsPerPage}
        onItemsPerPageChange={setItemsPerPage}
      />

      <InventoryItemFormDrawer
        theme={theme}
        mode={drawerMode}
        open={drawerOpen}
        currencyOptions={currencyOptions}
        dosageFormOptions={dosageFormOptions}
        routeOfAdministrationOptions={routeOfAdministrationOptions}
        controlledSubstanceOptions={controlledSubstanceOptions}
        statusOptions={statusOptions}
        itemCategoryOptions={itemCategoryOptions.map(({ value, label }) => ({ value, label }))}
        storageTypeOptions={storageTypeOptions}
        unitOfMeasureOptions={unitOfMeasureOptions}
        formData={formData}
        onChange={setFormData}
        currentBalance={selectedItem?.current_balance}
        onClose={closeDrawer}
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        canSubmit={canSubmit}
      />

      <InventoryStockAdjustModal
        theme={theme}
        open={adjustStockItem != null}
        item={adjustStockItem}
        facilityId={activeFacilityId ? Number(activeFacilityId) : null}
        staffId={activeContext.capabilities.staff?.staff_id ?? null}
        onClose={() => setAdjustStockItem(null)}
      />
    </div>
  );
};

export default AdminInventoryItem;