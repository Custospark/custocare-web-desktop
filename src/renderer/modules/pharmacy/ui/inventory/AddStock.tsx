import React, { useState } from 'react';
import { PackagePlus, X, Save, AlertCircle } from 'lucide-react';
import { useCreateInventoryItem } from './api/useInventoryItemQueries';
import { useToast } from '../../../../app/store/contexts/toast/useToast';
import { useSelector } from 'react-redux';
import { getActiveFacilityId } from '../../../../app/store/utils/contextSelectors';
import  { InventoryItemCategory, StorageLocationType, InventoryItemStatus } from './api/InventoryItemTypes';
import { useNavigate } from 'react-router-dom';
import { PHARMACY_ROUTES } from '../../../../app/routes/routeConstants';

interface AddStockProps {
  theme: 'light' | 'dark';
}

// Simplified inventory item type based on your JSON dataset
interface StockFormData {
  item_code: string;
  item_name: string;
  item_category: InventoryItemCategory;
  unit_of_measure: string;
  package_quantity: number;
  unit_cost: number;
  manufacturer: string;
  supplier: string;
  reorder_point: number;
  storage_location_type: StorageLocationType;
  is_billable: boolean;
  currency_code: string;
  status: InventoryItemStatus;
}

const AddStock: React.FC<AddStockProps> = ({ theme }) => {
  const { showToast } = useToast();
  const activeFacilityId = useSelector(getActiveFacilityId);
  const isDark = theme === 'dark';
  const navigate=useNavigate();

  const [formData, setFormData] = useState<StockFormData>({
    item_code: '',
    item_name: '',
    item_category: InventoryItemCategory.MEDICATION,
    unit_of_measure: 'tablet',
    package_quantity: 100,
    unit_cost: 0.05,
    manufacturer: '',
    supplier: '',
    reorder_point: 500,
    storage_location_type: StorageLocationType.PHARMACY_SHELF,
    is_billable: true,
    currency_code: 'UGX',
    status: InventoryItemStatus.ACTIVE,
  });

  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof StockFormData, string>>>({});

  const { mutate: createStock, isPending } = useCreateInventoryItem({
    onSuccess: () => {
     navigate(PHARMACY_ROUTES.DISPENSING_DISPENSE_MEDICATION);
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message || 'Failed to create stock item';
      showToast('error', errorMessage);
    },
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: value === '' ? '' : Number(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // Clear error for this field
    if (errors[name as keyof StockFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof StockFormData, string>> = {};

    if (!formData.item_code.trim()) {
      newErrors.item_code = 'Item code is required';
    }
    
    if (!formData.item_name.trim()) {
      newErrors.item_name = 'Item name is required';
    }
    
    if (!formData.manufacturer.trim()) {
      newErrors.manufacturer = 'Manufacturer is required';
    }
    
    if (!formData.supplier.trim()) {
      newErrors.supplier = 'Supplier is required';
    }
    
    if (formData.package_quantity <= 0) {
      newErrors.package_quantity = 'Package quantity must be greater than 0';
    }
    
    if (formData.unit_cost <= 0) {
      newErrors.unit_cost = 'Unit cost must be greater than 0';
    }
    
    if (formData.reorder_point < 0) {
      newErrors.reorder_point = 'Reorder point cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showToast('error', 'Please fix the errors in the form');
      return;
    }

    if (!activeFacilityId) {
      showToast('error', 'No active facility selected. Please select a facility.');
      return;
    }

    createStock({
      ...formData,
      facility_id: activeFacilityId,
    });
  };

  const handleCancel = () => {
    const hasUnsavedChanges = Object.values(formData).some(value => 
      typeof value === 'string' ? value.trim() !== '' : 
      typeof value === 'number' ? value !== 0 && value !== 100 && value !== 0.05 && value !== 500 :
      value !== true && value !== InventoryItemStatus.ACTIVE
    );

    if (hasUnsavedChanges) {
      setShowCancelConfirm(true);
    } else {
     navigate(PHARMACY_ROUTES.DISPENSING_DISPENSE_MEDICATION);
    }
  };

  const handleConfirmCancel = () => {
    setFormData({
      item_code: '',
      item_name: '',
      item_category: InventoryItemCategory.MEDICATION,
      unit_of_measure: 'tablet',
      package_quantity: 100,
      unit_cost: 0.05,
      manufacturer: '',
      supplier: '',
      reorder_point: 500,
      storage_location_type: StorageLocationType.PHARMACY_SHELF,
      is_billable: true,
      currency_code: 'USD',
      status: InventoryItemStatus.ACTIVE,
    });
    setShowCancelConfirm(false);
     navigate(PHARMACY_ROUTES.DISPENSING_DISPENSE_MEDICATION);
  };

  const handleDismissCancel = () => {
    setShowCancelConfirm(false);
  };

 

  const hasUnsavedChanges = Object.values(formData).some(value => 
    typeof value === 'string' ? value.trim() !== '' : 
    typeof value === 'number' ? value !== 100 && value !== 0.05 && value !== 500 :
    value !== true && value !== InventoryItemStatus.ACTIVE
  );

  // Category options
  const categoryOptions = Object.values(InventoryItemCategory).map(cat => ({
    value: cat,
    label: cat.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }));

  // Storage location options
  const storageOptions = Object.values(StorageLocationType).map(loc => ({
    value: loc,
    label: loc.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }));

  return (
    <div className={`space-y-4 p-4 rounded-lg border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`rounded-xl p-6 max-w-md w-full shadow-2xl ${
            isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'
          }`}>
            <div className="flex items-start gap-3 mb-4">
              <AlertCircle className={`w-6 h-6 ${isDark ? 'text-yellow-400' : 'text-yellow-500'}`} />
              <div>
                <h3 className="text-lg font-semibold mb-1">
                  Discard Changes?
                </h3>
                <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  You have unsaved changes. Are you sure you want to cancel?
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={handleDismissCancel}
                className={`px-4 py-2 rounded-lg font-medium ${
                  isDark
                    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Continue Editing
              </button>
              <button
                onClick={handleConfirmCancel}
                className={`px-4 py-2 rounded-lg font-medium ${
                  isDark
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                Discard Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <PackagePlus className="w-6 h-6" />
            Add New Stock Item
          </h2>
          <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Add a new inventory item to the system
          </p>
        </div>
        <button
          onClick={handleCancel}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${
            isDark
              ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          type="button"
        >
          <X className="w-4 h-4" />
          Cancel
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Basic Information */}
        <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
          <h3 className="font-medium mb-3">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Item Code *
              </label>
              <input
                type="text"
                name="item_code"
                value={formData.item_code}
                onChange={handleInputChange}
                className={`w-full p-2 rounded border ${errors.item_code ? 'border-red-500' : ''} ${
                  isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300'
                }`}
                placeholder="e.g., PARA-500-TAB"
                required
              />
              {errors.item_code && (
                <p className="text-red-500 text-sm mt-1">{errors.item_code}</p>
              )}
            </div>

            <div>
              <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Item Name *
              </label>
              <input
                type="text"
                name="item_name"
                value={formData.item_name}
                onChange={handleInputChange}
                className={`w-full p-2 rounded border ${errors.item_name ? 'border-red-500' : ''} ${
                  isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300'
                }`}
                placeholder="e.g., Paracetamol 500mg Tablets"
                required
              />
              {errors.item_name && (
                <p className="text-red-500 text-sm mt-1">{errors.item_name}</p>
              )}
            </div>

            <div>
              <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Category *
              </label>
              <select
                name="item_category"
                value={formData.item_category}
                onChange={handleInputChange}
                className={`w-full p-2 rounded border ${
                  isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300'
                }`}
              >
                {categoryOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Unit of Measure *
              </label>
              <input
                type="text"
                name="unit_of_measure"
                value={formData.unit_of_measure}
                onChange={handleInputChange}
                className={`w-full p-2 rounded border ${
                  isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300'
                }`}
                placeholder="e.g., tablet, pack, unit"
                required
              />
            </div>
          </div>
        </div>

        {/* Package & Pricing */}
        <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
          <h3 className="font-medium mb-3">Package & Pricing</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Package Quantity *
              </label>
              <input
                type="number"
                name="package_quantity"
                value={formData.package_quantity}
                onChange={handleInputChange}
                min="1"
                step="1"
                className={`w-full p-2 rounded border ${errors.package_quantity ? 'border-red-500' : ''} ${
                  isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300'
                }`}
                required
              />
              {errors.package_quantity && (
                <p className="text-red-500 text-sm mt-1">{errors.package_quantity}</p>
              )}
            </div>

            <div>
              <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Unit Cost (per item) *
              </label>
              <div className="flex items-center">
                <span className={`p-2 border border-r-0 rounded-l ${
                  isDark ? 'bg-gray-700 border-gray-600 text-gray-300' : 'bg-gray-100 border-gray-300 text-gray-700'
                }`}>
                  {formData.currency_code}
                </span>
                <input
                  type="number"
                  name="unit_cost"
                  value={formData.unit_cost}
                  onChange={handleInputChange}
                  min="0.01"
                  step="0.01"
                  className={`flex-1 p-2 rounded-r border ${errors.unit_cost ? 'border-red-500' : ''} ${
                    isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300'
                  }`}
                  required
                />
              </div>
              {errors.unit_cost && (
                <p className="text-red-500 text-sm mt-1">{errors.unit_cost}</p>
              )}
            </div>

            <div>
              <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Reorder Point *
              </label>
              <input
                type="number"
                name="reorder_point"
                value={formData.reorder_point}
                onChange={handleInputChange}
                min="0"
                step="1"
                className={`w-full p-2 rounded border ${errors.reorder_point ? 'border-red-500' : ''} ${
                  isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300'
                }`}
                required
              />
              {errors.reorder_point && (
                <p className="text-red-500 text-sm mt-1">{errors.reorder_point}</p>
              )}
            </div>
          </div>
        </div>

        {/* Supplier Information */}
        <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
          <h3 className="font-medium mb-3">Supplier Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Manufacturer *
              </label>
              <input
                type="text"
                name="manufacturer"
                value={formData.manufacturer}
                onChange={handleInputChange}
                className={`w-full p-2 rounded border ${errors.manufacturer ? 'border-red-500' : ''} ${
                  isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300'
                }`}
                placeholder="e.g., ABC Pharmaceuticals Ltd"
                required
              />
              {errors.manufacturer && (
                <p className="text-red-500 text-sm mt-1">{errors.manufacturer}</p>
              )}
            </div>

            <div>
              <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Supplier *
              </label>
              <input
                type="text"
                name="supplier"
                value={formData.supplier}
                onChange={handleInputChange}
                className={`w-full p-2 rounded border ${errors.supplier ? 'border-red-500' : ''} ${
                  isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300'
                }`}
                placeholder="e.g., Global Med Supplies"
                required
              />
              {errors.supplier && (
                <p className="text-red-500 text-sm mt-1">{errors.supplier}</p>
              )}
            </div>
          </div>
        </div>

        {/* Storage & Status */}
        <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
          <h3 className="font-medium mb-3">Storage & Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Storage Location
              </label>
              <select
                name="storage_location_type"
                value={formData.storage_location_type}
                onChange={handleInputChange}
                className={`w-full p-2 rounded border ${
                  isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300'
                }`}
              >
                {storageOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="is_billable"
                  checked={formData.is_billable}
                  onChange={handleInputChange}
                  className="w-4 h-4"
                />
                <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                  Billable Item
                </span>
              </label>

              <label className="flex items-center gap-2">
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className={`p-1 rounded border text-sm ${
                    isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300'
                  }`}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </label>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-gray-700">
          <button
            type="button"
            onClick={handleCancel}
            className={`flex-1 px-4 py-2 rounded-lg font-medium ${
              isDark
                ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className={`flex-1 px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2 ${
              isPending
                ? 'bg-gray-400 cursor-not-allowed'
                : isDark 
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            <Save className="w-4 h-4" />
            {isPending ? 'Creating...' : 'Create Stock Item'}
          </button>
        </div>

        {/* Unsaved changes indicator */}
        {hasUnsavedChanges && !isPending && (
          <div className={`text-sm p-3 rounded flex items-center gap-2 ${
            isDark ? 'bg-yellow-900/30 text-yellow-400 border border-yellow-800' : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
          }`}>
            <AlertCircle className="w-4 h-4" />
            You have unsaved changes
          </div>
        )}
      </form>
    </div>
  );
};

export default AddStock;