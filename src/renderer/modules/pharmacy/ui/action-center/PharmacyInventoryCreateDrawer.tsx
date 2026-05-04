/**
 * Inline inventory item creation for pharmacy dispensing — same drawer as Stock & Catalog,
 * without leaving the dispense workflow.
 */
import React, { useMemo, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';

import { useAppSelector } from '../../../../app/store/hooks/useApp';
import {
  useCreateInventoryItem,
  inventoryItemKeys,
} from '../../../administration/admin-module/api/admin-inventory/useInventoryItemQueries';
import type { CreateInventoryItemRequest } from '../../../administration/admin-module/api/admin-inventory/inventoryItemTypes';
import {
  ItemCategory,
  ControlledSubstanceSchedule,
  DosageForm,
  RouteOfAdministration,
  ItemStatus,
} from '../../../administration/admin-module/api/admin-inventory/inventoryItemTypes';

import { InventoryItemFormDrawer, type InventoryItemFormData } from '../../../administration/admin-module/ui/inventory/components/InventoryItemFormDrawer';
import { generateItemCode } from '../../../administration/admin-module/ui/inventory/utils/inventoryItemUiUtils';

import { billingItemsKeys } from '../../../medical-records/api/billable-items/BillableItemsQueries';

const emptyForm = (prefillName?: string): InventoryItemFormData => ({
  item_code: generateItemCode(),
  item_name: prefillName?.trim() ?? '',
  item_description: '',
  item_category: ItemCategory.MEDICATION,
  item_subcategory: '',
  generic_name: '',
  brand_name: '',
  ndc_code: '',
  drug_class: '',
  controlled_substance_schedule: '',
  dosage_form: DosageForm.TABLET,
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

export interface PharmacyInventoryCreateDrawerProps {
  theme: 'light' | 'dark';
  open: boolean;
  onClose: () => void;
  /** Prefills item name from the search box when opening create. */
  initialItemName?: string;
  onSuccess?: () => void;
}

export const PharmacyInventoryCreateDrawer: React.FC<PharmacyInventoryCreateDrawerProps> = ({
  theme,
  open,
  onClose,
  initialItemName,
  onSuccess,
}) => {
  const queryClient = useQueryClient();
  const activeFacilityId = useAppSelector((s) => s.activeContext.activeFacilityId);

  const [formData, setFormData] = useState<InventoryItemFormData>(() => emptyForm());

  React.useEffect(() => {
    if (open) {
      setFormData(emptyForm(initialItemName));
    }
  }, [open, initialItemName]);

  const itemCategoryOptions = useMemo(
    () => [
      { value: ItemCategory.MEDICATION, label: 'Medication' },
      { value: ItemCategory.MEDICAL_SUPPLY, label: 'Medical Supply' },
      { value: ItemCategory.OTHER, label: 'Other' },
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
      { value: 'UGX', label: 'UGX' },
      { value: 'USD', label: 'USD' },
      { value: 'EUR', label: 'EUR' },
      { value: 'KES', label: 'KES' },
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
      { value: DosageForm.SOLUTION, label: 'Solution' },
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
    ],
    []
  );

  const storageTypeOptions = useMemo(
    () => [
      { value: 'room_temperature', label: 'Room Temperature' },
      { value: 'refrigerated', label: 'Refrigerated' },
    ],
    []
  );

  const unitOfMeasureOptions = useMemo(
    () => [
      { value: 'Each', label: 'Each' },
      { value: 'Bottle', label: 'Bottle' },
      { value: 'Vial', label: 'Vial' },
      { value: 'Box', label: 'Box' },
    ],
    []
  );

  const createMutation = useCreateInventoryItem({
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: inventoryItemKeys.all });
      await queryClient.invalidateQueries({ queryKey: billingItemsKeys.lists() });
      onSuccess?.();
      onClose();
    },
  });

  const buildPayload = useCallback((): CreateInventoryItemRequest | null => {
    if (!activeFacilityId) return null;
    const trim = (v: string | undefined | null) => (typeof v === 'string' && v.trim() !== '' ? v.trim() : undefined);
    return {
      item_code: trim(formData.item_code) ?? '',
      item_name: trim(formData.item_name) ?? '',
      item_category: formData.item_category,
      unit_of_measure: formData.unit_of_measure,
      package_quantity: formData.package_quantity,
      currency_code: formData.currency_code,
      status: formData.status,
      item_description: trim(formData.item_description),
      generic_name: trim(formData.generic_name),
      brand_name: trim(formData.brand_name),
      ndc_code: trim(formData.ndc_code),
      dosage_form: formData.dosage_form || undefined,
      strength: trim(formData.strength),
      route_of_administration: formData.route_of_administration || undefined,
      unit_cost: formData.unit_cost || undefined,
      average_wholesale_price: formData.average_wholesale_price || undefined,
      requires_refrigeration: formData.requires_refrigeration,
      requires_prescription: formData.requires_prescription,
      is_billable: formData.is_billable,
      is_hazardous: formData.is_hazardous,
    };
  }, [activeFacilityId, formData]);

  const handleSubmit = () => {
    const payload = buildPayload();
    if (!payload) return;
    createMutation.mutate(payload);
  };

  const canSubmit =
    !!activeFacilityId &&
    !!formData.item_name?.trim() &&
    !!formData.item_code?.trim() &&
    !createMutation.isPending;

  return (
    <InventoryItemFormDrawer
      theme={theme}
      mode="create"
      open={open}
      currencyOptions={currencyOptions}
      dosageFormOptions={dosageFormOptions}
      routeOfAdministrationOptions={routeOfAdministrationOptions}
      controlledSubstanceOptions={controlledSubstanceOptions}
      statusOptions={statusOptions}
      itemCategoryOptions={itemCategoryOptions}
      storageTypeOptions={storageTypeOptions}
      unitOfMeasureOptions={unitOfMeasureOptions}
      formData={formData}
      onChange={setFormData}
      onClose={onClose}
      onSubmit={handleSubmit}
      isSubmitting={createMutation.isPending}
      canSubmit={canSubmit}
    />
  );
};

/** Compact button used under SearchBar empty state */
export function CreateInventoryItemButton({
  theme,
  disabled,
  onClick,
}: {
  theme: 'light' | 'dark';
  disabled?: boolean;
  onClick: () => void;
}) {
  const isDark = theme === 'dark';
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
        disabled
          ? isDark
            ? 'cursor-not-allowed bg-gray-800 text-gray-500'
            : 'cursor-not-allowed bg-gray-100 text-gray-400'
          : isDark
            ? 'bg-emerald-700 text-white hover:bg-emerald-600'
            : 'bg-emerald-600 text-white hover:bg-emerald-700'
      }`}
    >
      <Plus className="h-4 w-4" />
      Create inventory &amp; billable item
    </button>
  );
}
