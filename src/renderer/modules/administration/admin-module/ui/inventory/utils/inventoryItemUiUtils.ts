// src/administration/admin-module/inventory-items/inventoryItemUiUtils.ts
import { ItemStatus, type InventoryItem } from '../../../api/admin-inventory/inventoryItemTypes';
import { formatPrice as sharedFormatPrice } from '../../../../../../shared/utils/formatCurrency';

export const normalizeAmount = (value: unknown): number => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

export const formatPrice = (amount: unknown, currency: string) => {
  return sharedFormatPrice(normalizeAmount(amount), currency);
};

export const getStatusColor = (status: ItemStatus, isDark: boolean) => {
  switch (status) {
    case ItemStatus.ACTIVE:
      return isDark ? 'text-green-400' : 'text-green-600';
    case ItemStatus.INACTIVE:
      return isDark ? 'text-yellow-400' : 'text-yellow-600';
    case ItemStatus.DISCONTINUED:
      return isDark ? 'text-gray-400' : 'text-gray-600';
    case ItemStatus.RECALLED:
      return isDark ? 'text-red-400' : 'text-red-600';
    default:
      return isDark ? 'text-gray-400' : 'text-gray-600';
  }
};

export const getStatusBgColor = (status: ItemStatus, isDark: boolean) => {
  switch (status) {
    case ItemStatus.ACTIVE:
      return isDark ? 'bg-green-900/30' : 'bg-green-50';
    case ItemStatus.INACTIVE:
      return isDark ? 'bg-yellow-900/30' : 'bg-yellow-50';
    case ItemStatus.DISCONTINUED:
      return isDark ? 'bg-gray-900/30' : 'bg-gray-50';
    case ItemStatus.RECALLED:
      return isDark ? 'bg-red-900/30' : 'bg-red-50';
    default:
      return isDark ? 'bg-gray-900/30' : 'bg-gray-50';
  }
};

/**
 * Auto-generate a stable item code from a name.
 * Pure function (safe for use in handlers), no React effects needed.
 */
export const generateItemCodeFromName = (name: string) => {
  return name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .substring(0, 8);
};

/**
 * Calculate total inventory value for a set of items
 */
export const calculateTotalInventoryValue = (items: InventoryItem[]): number => {
  return items.reduce((total, item) => {
    const unitCost = normalizeAmount(item.unit_cost || 0);
    const quantity = item.package_quantity || 0;
    return total + (unitCost * quantity);
  }, 0);
};

/**
 * Check if an item requires special handling
 */
export const requiresSpecialHandling = (item: InventoryItem): boolean => {
  return (
    item.is_hazardous ||
    item.requires_refrigeration ||
    item.requires_prescription ||
    item.requires_controlled_access ||
    item.controlled_substance_schedule !== null
  );
};

/**
 * Format controlled substance schedule for display
 */
export const formatControlledSubstanceSchedule = (schedule: string | null): string => {
  if (!schedule) return 'Not Controlled';
  
  switch (schedule) {
    case 'I': return 'Schedule I';
    case 'II': return 'Schedule II';
    case 'III': return 'Schedule III';
    case 'IV': return 'Schedule IV';
    case 'V': return 'Schedule V';
    default: return schedule;
  }
};

/**
 * Get appropriate icon for item category
 */
export const getItemCategoryIcon = (category: string): string => {
  switch (category) {
    case 'medication':
      return '💊';
    case 'medical_supply':
      return '🩹';
    case 'surgical_instrument':
      return '🔪';
    case 'diagnostic_equipment':
      return '🩺';
    case 'implantable_device':
      return '🦴';
    case 'prosthetic':
      return '🦿';
    case 'laboratory_reagent':
      return '🧪';
    case 'personal_protective_equipment':
      return '🛡️';
    case 'administrative_supply':
      return '📋';
    default:
      return '📦';
  }
};

/**
 * Format storage requirements for display
 */
export const formatStorageRequirements = (item: InventoryItem): string => {
  const requirements: string[] = [];
  
  if (item.requires_refrigeration) {
    requirements.push('Refrigeration required');
  }
  
  if (item.storage_location_type) {
    requirements.push(item.storage_location_type.replace('_', ' '));
  }
  
  if (item.requires_controlled_access) {
    requirements.push('Controlled access');
  }
  
  return requirements.length > 0 ? requirements.join(', ') : 'Standard storage';
};

/**
 * Get safety indicators for an item
 */
export const getSafetyIndicators = (item: InventoryItem): Array<{ icon: string; label: string; color: string }> => {
  const indicators: Array<{ icon: string; label: string; color: string }> = [];
  
  if (item.is_hazardous) {
    indicators.push({ icon: '⚠️', label: 'Hazardous', color: 'text-red-600' });
  }
  
  if (item.requires_prescription) {
    indicators.push({ icon: '📋', label: 'Rx Required', color: 'text-purple-600' });
  }
  
  if (item.controlled_substance_schedule) {
    indicators.push({ 
      icon: '🔒', 
      label: `Schedule ${item.controlled_substance_schedule}`, 
      color: 'text-orange-600' 
    });
  }
  
  if (item.requires_refrigeration) {
    indicators.push({ icon: '❄️', label: 'Cold Chain', color: 'text-blue-600' });
  }
  
  return indicators;
};
/**
 * Generate a unique inventory item code
 * Format: INVT-XXXX where XXXX is a random 4-digit number
 * Example: INVT-1234, INVT-5678
 */
export const generateItemCode = (): string => {
  const randomNum = Math.floor(Math.random() * 9999) + 1;
  const paddedNum = randomNum.toString().padStart(4, '0');
  return `INVT-${paddedNum}`;
};

/**
 * Validate item form data before submission
 */
export const validateItemFormData = (formData: any): string[] => {
  const errors: string[] = [];
  
  if (!formData.item_code?.trim()) {
    errors.push('Item code is required');
  }
  
  if (!formData.item_name?.trim()) {
    errors.push('Item name is required');
  }
  
  if (!formData.item_category) {
    errors.push('Item category is required');
  }
  
  if (!formData.unit_of_measure?.trim()) {
    errors.push('Unit of measure is required');
  }
  
  if (formData.package_quantity <= 0) {
    errors.push('Package quantity must be greater than 0');
  }
  
  if (!formData.currency_code?.trim()) {
    errors.push('Currency is required');
  }
  
  return errors;
};

export default {
  normalizeAmount,
  formatPrice,
  getStatusColor,
  getStatusBgColor,
  generateItemCodeFromName,
  calculateTotalInventoryValue,
  requiresSpecialHandling,
  formatControlledSubstanceSchedule,
  getItemCategoryIcon,
  formatStorageRequirements,
  getSafetyIndicators,
  validateItemFormData,
};