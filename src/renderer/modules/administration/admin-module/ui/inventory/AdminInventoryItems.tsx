import React, { useMemo, useState } from 'react';
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
} from  '../../api/admin-inventory/useInventoryItemQueries';

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

interface AdminInventoryItemProps {
  theme: 'light' | 'dark';
}

const emptyForm = (): InventoryItemFormData => ({
  item_code: '',
  item_name: '',
  item_description: '',
  item_category: ItemCategory.MEDICATION,
  item_subcategory: '',
  
  generic_name: '',
  brand_name: '',
  ndc_code: '',
  drug_class: '',
  controlled_substance_schedule: '',
  dosage_form: '',
  strength: '',
  route_of_administration: '',
  
  manufacturer: '',
  manufacturer_item_number: '',
  supplier: '',
  
  unit_of_measure: 'Each',
  package_quantity: 1,
  packaging_type: '',
  unit_cost: 0,
  average_wholesale_price: 0,
  currency_code: 'UGX',
  
  requires_refrigeration: false,
  requires_controlled_access: false,
  storage_location_type: '',
  storage_requirements: '',
  
  requires_prescription: false,
  fda_approval_number: '',
  is_hazardous: false,
  safety_warnings: '',
  contraindications: '',
  special_handling_instructions: '',
  
  is_billable: true,
  track_by_lot: false,
  track_by_serial: false,
  
  reorder_point: null,
  reorder_quantity: null,
  safety_stock_level: null,
  max_stock_level: null,
  
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

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ItemStatus | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<ItemCategory | 'all'>('all');
  const [controlledSubstanceFilter, setControlledSubstanceFilter] = useState<ControlledSubstanceSchedule | 'all' | 'non_controlled'>('all');
  const [showDeleted, setShowDeleted] = useState(false);
  const [effectiveDate, setEffectiveDate] = useState<string>('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [perPage, setPerPage] = useState<number>(10);
  const [requiresRefrigerationFilter, setRequiresRefrigerationFilter] = useState<boolean | 'all'>('all');
  const [requiresPrescriptionFilter, setRequiresPrescriptionFilter] = useState<boolean | 'all'>('all');
  const [isHazardousFilter, setIsHazardousFilter] = useState<boolean | 'all'>('all');

  // UI state
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

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
  // FILTERS
  // ---------------------------------------------------------------------------
  const filters: InventoryItemFilters = useMemo(() => {
    const status = showDeleted
      ? undefined
      : statusFilter !== 'all'
        ? statusFilter
        : ItemStatus.ACTIVE;

    return {
      status,
      item_category: categoryFilter !== 'all' ? categoryFilter : undefined,
      controlled_substance_schedule: controlledSubstanceFilter !== 'all' && controlledSubstanceFilter !== 'non_controlled'
        ? controlledSubstanceFilter
        : undefined,
      requires_refrigeration: requiresRefrigerationFilter !== 'all' ? requiresRefrigerationFilter : undefined,
      requires_prescription: requiresPrescriptionFilter !== 'all' ? requiresPrescriptionFilter : undefined,
      is_hazardous: isHazardousFilter !== 'all' ? isHazardousFilter : undefined,
      search: searchTerm || undefined,
      per_page: perPage,
    };
  }, [
    showDeleted, statusFilter, categoryFilter, controlledSubstanceFilter,
    requiresRefrigerationFilter, requiresPrescriptionFilter, isHazardousFilter,
    searchTerm, perPage,
  ]);

  const listQueryKey = useMemo(() => inventoryItemKeys.list(filters), [filters]);

  const {
    data: itemsResponse,
    isLoading,
    error,
    refetch,
  } = useGetInventoryItems(filters, {
    enabled: !!activeFacilityId,
    staleTime: 1000 * 30,
  });

  const items = itemsResponse?.data ?? [];
  const pagination = itemsResponse?.pagination;

  const setListCache = (
    updater: (current: InventoryItemListResponse | undefined) => InventoryItemListResponse | undefined
  ) => {
    queryClient.setQueryData<InventoryItemListResponse>(listQueryKey, updater);
  };

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
      item_code: item.item_code || '',
      item_name: item.item_name,
      item_description: item.item_description || '',
      item_category: item.item_category,
      item_subcategory: item.item_subcategory || '',
      
      generic_name: item.generic_name || '',
      brand_name: item.brand_name || '',
      ndc_code: item.ndc_code || '',
      drug_class: item.drug_class || '',
      controlled_substance_schedule: item.controlled_substance_schedule || '',
        dosage_form: (item.dosage_form as DosageForm) ?? "",
      strength: item.strength || '',
      route_of_administration: (item.route_of_administration as RouteOfAdministration) || '',
      
      manufacturer: item.manufacturer || '',
      manufacturer_item_number: item.manufacturer_item_number || '',
      supplier: item.supplier || '',
      
      unit_of_measure: item.unit_of_measure,
      package_quantity: item.package_quantity,
      packaging_type: item.packaging_type || '',
      unit_cost: item.unit_cost || 0,
      average_wholesale_price: item.average_wholesale_price || 0,
      currency_code: item.currency_code,
      
      requires_refrigeration: item.requires_refrigeration,
      requires_controlled_access: item.requires_controlled_access,
      storage_location_type: item.storage_location_type || '',
      storage_requirements: '',
      
      requires_prescription: item.requires_prescription,
      fda_approval_number: item.fda_approval_number || '',
      is_hazardous: item.is_hazardous,
      safety_warnings: '',
      contraindications: '',
      special_handling_instructions: item.special_handling_instructions || '',
      
      is_billable: item.is_billable,
      track_by_lot: item.track_by_lot,
      track_by_serial: item.track_by_serial,
      
      reorder_point: item.reorder_point,
      reorder_quantity: item.reorder_quantity,
      safety_stock_level: item.safety_stock_level,
      max_stock_level: item.max_stock_level,
      
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
      ...emptyForm(),
      item_code: `${item.item_code}-COPY`,
      item_name: `${item.item_name} (Copy)`,
      item_description: item.item_description || '',
      item_category: item.item_category,
      item_subcategory: item.item_subcategory || '',
      
      generic_name: item.generic_name || '',
      brand_name: item.brand_name || '',
      ndc_code: '',
      drug_class: item.drug_class || '',
      controlled_substance_schedule: item.controlled_substance_schedule || '',
      dosage_form: (item.dosage_form as DosageForm) || DosageForm,
      strength: item.strength || '',
      route_of_administration: (item.route_of_administration as RouteOfAdministration),
      
      manufacturer: item.manufacturer || '',
      manufacturer_item_number: '',
      supplier: item.supplier || '',
      
      unit_of_measure: item.unit_of_measure,
      package_quantity: item.package_quantity,
      packaging_type: item.packaging_type || '',
      unit_cost: item.unit_cost || 0,
      average_wholesale_price: item.average_wholesale_price || 0,
      currency_code: item.currency_code,
      
      requires_refrigeration: item.requires_refrigeration,
      requires_controlled_access: item.requires_controlled_access,
      storage_location_type: item.storage_location_type || '',
      
      requires_prescription: item.requires_prescription,
      fda_approval_number: '',
      is_hazardous: item.is_hazardous,
      
      is_billable: item.is_billable,
      track_by_lot: item.track_by_lot,
      track_by_serial: item.track_by_serial,
      
      reorder_point: item.reorder_point,
      reorder_quantity: item.reorder_quantity,
      safety_stock_level: item.safety_stock_level,
      max_stock_level: item.max_stock_level,
    });

    setDrawerOpen(true);
  };

  const toggleExpand = (uuid: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(uuid)) next.delete(uuid);
      else next.add(uuid);
      return next;
    });
  };

  // ---------------------------------------------------------------------------
  // Submit (instant UI -> server)
  // ---------------------------------------------------------------------------
  const handleSubmit = () => {
    if (!activeFacilityId) return;

    const payload: CreateInventoryItemRequest = {
      item_code: formData.item_code.trim(),
      item_name: formData.item_name.trim(),
      item_category: formData.item_category,
      unit_of_measure: formData.unit_of_measure,
      package_quantity: formData.package_quantity,
      currency_code: formData.currency_code,
      status: formData.status,

      item_description: formData.item_description?.trim() || undefined,
      item_subcategory: formData.item_subcategory?.trim() || undefined,
      
      generic_name: formData.generic_name?.trim() || undefined,
      brand_name: formData.brand_name?.trim() || undefined,
      ndc_code: formData.ndc_code?.trim() || undefined,
      drug_class: formData.drug_class?.trim() || undefined,
      controlled_substance_schedule: formData.controlled_substance_schedule || undefined,
      dosage_form: formData.dosage_form || undefined,
      strength: formData.strength?.trim() || undefined,
      route_of_administration: formData.route_of_administration || undefined,
      
      manufacturer: formData.manufacturer?.trim() || undefined,
      manufacturer_item_number: formData.manufacturer_item_number?.trim() || undefined,
      supplier: formData.supplier?.trim() || undefined,
      
      packaging_type: formData.packaging_type?.trim() || undefined,
      unit_cost: formData.unit_cost || undefined,
      average_wholesale_price: formData.average_wholesale_price || undefined,
      
      requires_refrigeration: formData.requires_refrigeration,
      requires_controlled_access: formData.requires_controlled_access,
      storage_location_type: formData.storage_location_type?.trim() || undefined,
      
      requires_prescription: formData.requires_prescription,
      fda_approval_number: formData.fda_approval_number?.trim() || undefined,
      is_hazardous: formData.is_hazardous,
      special_handling_instructions: formData.special_handling_instructions?.trim() || undefined,
      
      is_billable: formData.is_billable,
      track_by_lot: formData.track_by_lot,
      track_by_serial: formData.track_by_serial,
      
      reorder_point: formData.reorder_point,
      reorder_quantity: formData.reorder_quantity,
      safety_stock_level: formData.safety_stock_level,
      max_stock_level: formData.max_stock_level,
    };

    if (drawerMode === 'create') {
      const previous = queryClient.getQueryData<InventoryItemListResponse>(listQueryKey);
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
        dosage_form: payload.dosage_form ?? undefined,
        strength: payload.strength ?? null,
        route_of_administration: payload.route_of_administration ?? null,
        
        manufacturer: payload.manufacturer ?? null,
        manufacturer_item_number: payload.manufacturer_item_number ?? null,
        supplier: payload.supplier ?? null,
        
        unit_of_measure: payload.unit_of_measure,
        package_quantity: payload.package_quantity,
        packaging_type: payload.packaging_type ?? null,
        unit_cost: payload.unit_cost ?? null,
        average_wholesale_price: payload.average_wholesale_price ?? null,
        currency_code: payload.currency_code,
        
        storage_requirements: null,
        requires_refrigeration: payload.requires_refrigeration ?? false,
        requires_controlled_access: payload.requires_controlled_access ?? false,
        storage_location_type: payload.storage_location_type ?? null,
        
        requires_prescription: payload.requires_prescription ?? false,
        regulatory_approvals: null,
        fda_approval_number: payload.fda_approval_number ?? null,
        is_hazardous: payload.is_hazardous ?? false,
        safety_warnings: null,
        contraindications: null,
        special_handling_instructions: payload.special_handling_instructions ?? null,
        
        is_billable: payload.is_billable ?? true,
        track_by_lot: payload.track_by_lot ?? false,
        track_by_serial: payload.track_by_serial ?? false,
        
        reorder_point: payload.reorder_point ?? null,
        reorder_quantity: payload.reorder_quantity ?? null,
        safety_stock_level: payload.safety_stock_level ?? null,
        max_stock_level: payload.max_stock_level ?? null,
        
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
          queryClient.setQueryData(listQueryKey, previous);
        },
      });

      return;
    }

    if (drawerMode === 'edit' && selectedItem) {
      const uuid = selectedItem.item_uuid;
      const previous = queryClient.getQueryData<InventoryItemListResponse>(listQueryKey);

      setListCache(current => {
        if (!current) return current;
        return {
          ...current,
          data: current.data.map(i =>
            i.item_uuid === uuid ? { ...i, ...payload, updated_at: new Date().toISOString() } : i
          ),
        };
      });

      updateMutation.mutate(
        { uuid, data: payload as UpdateInventoryItemRequest },
        {
          onError: () => {
            queryClient.setQueryData(listQueryKey, previous);
          },
        }
      );
    }
  };

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

    const previous = queryClient.getQueryData<InventoryItemListResponse>(listQueryKey);

    setListCache(current => {
      if (!current) return current;
      return {
        ...current,
        data: current.data.map(i =>
          i.item_uuid === item.item_uuid ? { ...i, deleted_at: new Date().toISOString() } : i
        ),
      };
    });

    deleteMutation.mutate(
      { uuid: item.item_uuid },
      {
        onError: () => {
          queryClient.setQueryData(listQueryKey, previous);
        },
      }
    );
  };

  const handleRestore = (item: InventoryItem) => {
    const previous = queryClient.getQueryData<InventoryItemListResponse>(listQueryKey);

    setListCache(current => {
      if (!current) return current;
      return {
        ...current,
        data: current.data.map(i =>
          i.item_uuid === item.item_uuid ? { ...i, deleted_at: null } : i
        ),
      };
    });

    restoreMutation.mutate(
      { uuid: item.item_uuid },
      {
        onError: () => {
          queryClient.setQueryData(listQueryKey, previous);
        },
      }
    );
  };

  // ---------------------------------------------------------------------------
  // Filter handlers
  // ---------------------------------------------------------------------------
  const handleSearchSubmit = () => {
    refetch();
  };

  const handlePerPageChange = (n: number) => {
    setPerPage(Math.max(1, Math.min(500, n)));
  };

  // ---------------------------------------------------------------------------
  // Validation
  // ---------------------------------------------------------------------------
  const canSubmit =
    !!formData.item_code.trim() &&
    !!formData.item_name.trim() &&
    formData.package_quantity > 0;

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
          // Hook your import modal here
          // eslint-disable-next-line no-console
          console.log('Open import dialog');
        }}
      />

      <InventoryItemFiltersBar
        theme={theme}
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        onSearchSubmit={handleSearchSubmit}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        controlledSubstanceFilter={controlledSubstanceFilter}
        onControlledSubstanceFilterChange={setControlledSubstanceFilter}
        effectiveDate={effectiveDate}
        onEffectiveDateChange={setEffectiveDate}
        showDeleted={showDeleted}
        onToggleShowDeleted={() => setShowDeleted(v => !v)}
        viewMode={viewMode}
        onToggleViewMode={() => setViewMode(v => (v === 'list' ? 'grid' : 'list'))}
        perPage={perPage}
        onPerPageChange={handlePerPageChange}
        requiresRefrigerationFilter={requiresRefrigerationFilter}
        onRequiresRefrigerationChange={setRequiresRefrigerationFilter}
        requiresPrescriptionFilter={requiresPrescriptionFilter}
        onRequiresPrescriptionChange={setRequiresPrescriptionFilter}
        isHazardousFilter={isHazardousFilter}
        onIsHazardousChange={setIsHazardousFilter}
        itemCategoryOptions={itemCategoryOptions.map(({ value, label }) => ({ value, label }))}
        statusOptions={statusOptions}
        controlledSubstanceOptions={controlledSubstanceOptions}
      />

      <InventoryCatalogList
        theme={theme}
        viewMode={viewMode}
        isLoading={isLoading}
        error={error ? new Error(error.message) : null}
        items={items}
        expandedItems={expandedItems}
        onToggleExpand={toggleExpand}
        onEdit={openEdit}
        onDuplicate={handleDuplicate}
        onDelete={handleDelete}
        onRestore={handleRestore}
        onRetry={() => refetch()}
        itemCategoryOptions={itemCategoryOptions}
        pagination={pagination}
        onPageChange={() => {
          // Backend does not support paging => intentionally no-op.
          // Keep the UI element hidden/disabled in InventoryCatalogList if you want.
        }}
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
        onClose={closeDrawer}
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        canSubmit={canSubmit}
      />
    </div>
  );
};

export default AdminInventoryItem;