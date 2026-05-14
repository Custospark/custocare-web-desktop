// FacilityIdentity.tsx (Complete rewrite)

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { XCircle } from 'lucide-react';

import type { RootState } from '../../../../../app/store/rootReducer';
import LoadingSkeleton from '../../../../../shared/components/Loading/LoadingSkeletons';
import { cn } from '../../../../../shared/utils/classNameUtils';

import {
  useGetFacilitySettings,
  useUpdateFacilitySettings,
  useUploadFacilityLogo,
} from '../../api/facility-settings/FacilitySettingsQuery';

import {
  settingsToFormState,
  buildUpdatePayload,
  type FacilitySettingsFormState,
} from './components/FacilitySettingsHelpers';

import FacilitySettingsHeaderBar from './components/FacilitySettingsHeaderBar';
import FacilityBasicsCard from './components/FacilityBasicsCard';
import FacilityLocationContactCard from './components/FacilityLocationContactCard';
import FacilityBrandingAndOpsCard from './components/FacilityBrandingAndOpsCard';

// Import Redux actions
import {
  updateFacilityById,
  updateActiveFacilityCurrency,
  updateActiveFacilityLogoPath,
  updateActiveFacilityTaxEnabled,
  updateActiveFacilityPrimaryBrandColor,
  updateActiveFacilitySecondaryBrandColor,
} from '../../../../../app/store/slices/activeContextSlice';

/* -------------------------------------------------------------------------- */
/*                               Main Component                               */
/* -------------------------------------------------------------------------- */

const FacilityIdentity: React.FC = () => {
  const dispatch = useDispatch();
  const theme = useSelector((state: RootState) => state.ui.theme);
  const isDark = theme === 'dark';

  const activeFacilityId = useSelector((state: RootState) => state.activeContext.activeFacilityId);
  const activeFacilityName = useSelector((state: RootState) => {
    const cap = state.activeContext.capabilities.staff;
    const id = state.activeContext.activeFacilityId;
    if (!cap || !id) return null;
    const f = cap.facilities?.find((x) => x.facility_id === id);
    return f?.facility_name ?? null;
  });

  const { data: settingsResponse, isLoading, isError, error } = useGetFacilitySettings();
  const settings = settingsResponse?.data ?? null;

  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<FacilitySettingsFormState | null>(null);
  const [originalForm, setOriginalForm] = useState<FacilitySettingsFormState | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  // logo upload
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { mutate: uploadLogo, isPending: isUploadingLogo } = useUploadFacilityLogo();

  // Save settings - update Redux with the sent data, not the response
  const { mutate: saveSettings } = useUpdateFacilitySettings({
    onSuccess: () => {
      // Use the form data we sent to update Redux context
      if (form && originalForm && activeFacilityId) {
        updateReduxContextWithFormData(form, originalForm, activeFacilityId);
      }
      setEditMode(false);
      setIsSaving(false);
    },
    onError: () => {
      setIsSaving(false);
    }
  });

  // Update Redux context using the form data we sent
  const updateReduxContextWithFormData = useCallback((
    currentForm: FacilitySettingsFormState,
    originalFormState: FacilitySettingsFormState,
    facilityId: number
  ) => {
    // Build updates object with only changed fields
    const updates: Record<string, any> = {};

    // Core Identity
    if (currentForm.facility_name !== originalFormState.facility_name) {
      updates.facility_name = currentForm.facility_name;
    }
    if (currentForm.legal_entity_name !== originalFormState.legal_entity_name) {
      updates.legal_entity_name = currentForm.legal_entity_name;
    }
    if (currentForm.health_system_name !== originalFormState.health_system_name) {
      updates.health_system_name = currentForm.health_system_name;
    }

    // Classification
    if (currentForm.nature_of_facility !== originalFormState.nature_of_facility) {
      updates.nature_of_facility = currentForm.nature_of_facility;
    }
    if (currentForm.facility_type !== originalFormState.facility_type) {
      updates.facility_type = currentForm.facility_type;
    }
    if (currentForm.facility_tier !== originalFormState.facility_tier) {
      updates.facility_tier = currentForm.facility_tier;
    }

    // Capacity
    if (currentForm.bed_capacity !== originalFormState.bed_capacity) {
      updates.bed_capacity = currentForm.bed_capacity ? parseInt(currentForm.bed_capacity) : null;
    }
    if (JSON.stringify(currentForm.available_services) !== JSON.stringify(originalFormState.available_services)) {
      updates.available_services = currentForm.available_services;
    }
    if (JSON.stringify(currentForm.specialty_services) !== JSON.stringify(originalFormState.specialty_services)) {
      updates.specialty_services = currentForm.specialty_services;
    }
    if (JSON.stringify(currentForm.equipment_inventory_summary) !== JSON.stringify(originalFormState.equipment_inventory_summary)) {
      updates.equipment_inventory_summary = currentForm.equipment_inventory_summary;
    }

    // Location
    if (currentForm.address_line1 !== originalFormState.address_line1) {
      updates.address_line1 = currentForm.address_line1;
    }
    if (currentForm.address_line2 !== originalFormState.address_line2) {
      updates.address_line2 = currentForm.address_line2;
    }
    if (currentForm.city !== originalFormState.city) {
      updates.city = currentForm.city;
    }
    if (currentForm.state_province !== originalFormState.state_province) {
      updates.state_province = currentForm.state_province;
    }
    if (currentForm.postal_code !== originalFormState.postal_code) {
      updates.postal_code = currentForm.postal_code;
    }
    if (currentForm.country_code !== originalFormState.country_code) {
      updates.country_code = currentForm.country_code;
    }
    if (currentForm.latitude !== originalFormState.latitude) {
      updates.latitude = currentForm.latitude ? parseFloat(currentForm.latitude) : null;
    }
    if (currentForm.longitude !== originalFormState.longitude) {
      updates.longitude = currentForm.longitude ? parseFloat(currentForm.longitude) : null;
    }

    // Contact
    if (currentForm.main_phone !== originalFormState.main_phone) {
      updates.main_phone = currentForm.main_phone;
    }
    if (currentForm.emergency_phone !== originalFormState.emergency_phone) {
      updates.emergency_phone = currentForm.emergency_phone;
    }
    if (currentForm.fax !== originalFormState.fax) {
      updates.fax = currentForm.fax;
    }
    if (currentForm.email !== originalFormState.email) {
      updates.email = currentForm.email;
    }
    if (currentForm.website !== originalFormState.website) {
      updates.website = currentForm.website;
    }

    // Operations
    if (JSON.stringify(currentForm.operating_hours) !== JSON.stringify(originalFormState.operating_hours)) {
      updates.operating_hours = currentForm.operating_hours;
    }
    if (JSON.stringify(currentForm.emergency_services_hours) !== JSON.stringify(originalFormState.emergency_services_hours)) {
      updates.emergency_services_hours = currentForm.emergency_services_hours;
    }
    if (currentForm.is_24_7 !== originalFormState.is_24_7) {
      updates.is_24_7 = currentForm.is_24_7;
    }
    if (currentForm.operational_status !== originalFormState.operational_status) {
      updates.operational_status = currentForm.operational_status;
    }
    if (currentForm.average_wait_time_minutes !== originalFormState.average_wait_time_minutes) {
      updates.average_wait_time_minutes = currentForm.average_wait_time_minutes ? parseFloat(currentForm.average_wait_time_minutes) : null;
    }
    if (currentForm.monthly_patient_volume !== originalFormState.monthly_patient_volume) {
      updates.monthly_patient_volume = currentForm.monthly_patient_volume ? parseInt(currentForm.monthly_patient_volume) : null;
    }

    // Licensing
    if (currentForm.license_number !== originalFormState.license_number) {
      updates.license_number = currentForm.license_number;
    }
    if (currentForm.license_issuing_authority !== originalFormState.license_issuing_authority) {
      updates.license_issuing_authority = currentForm.license_issuing_authority;
    }
    if (currentForm.license_expiry_date !== originalFormState.license_expiry_date) {
      updates.license_expiry_date = currentForm.license_expiry_date;
    }
    if (JSON.stringify(currentForm.regulatory_identifiers) !== JSON.stringify(originalFormState.regulatory_identifiers)) {
      updates.regulatory_identifiers = currentForm.regulatory_identifiers;
    }
    if (currentForm.participates_in_medicare !== originalFormState.participates_in_medicare) {
      updates.participates_in_medicare = currentForm.participates_in_medicare;
    }
    if (currentForm.participates_in_medicaid !== originalFormState.participates_in_medicaid) {
      updates.participates_in_medicaid = currentForm.participates_in_medicaid;
    }

    // Clinical Capabilities
    if (currentForm.has_emergency_department !== originalFormState.has_emergency_department) {
      updates.has_emergency_department = currentForm.has_emergency_department;
    }
    if (currentForm.has_trauma_center !== originalFormState.has_trauma_center) {
      updates.has_trauma_center = currentForm.has_trauma_center;
    }
    if (currentForm.trauma_center_level !== originalFormState.trauma_center_level) {
      updates.trauma_center_level = currentForm.trauma_center_level ? parseInt(currentForm.trauma_center_level) : null;
    }
    if (currentForm.has_intensive_care !== originalFormState.has_intensive_care) {
      updates.has_intensive_care = currentForm.has_intensive_care;
    }
    if (currentForm.has_neonatal_icu !== originalFormState.has_neonatal_icu) {
      updates.has_neonatal_icu = currentForm.has_neonatal_icu;
    }
    if (currentForm.has_cardiac_cath_lab !== originalFormState.has_cardiac_cath_lab) {
      updates.has_cardiac_cath_lab = currentForm.has_cardiac_cath_lab;
    }

    // Financial Configuration
    if (currentForm.currency !== originalFormState.currency) {
      updates.facility_currency = currentForm.currency;
      dispatch(updateActiveFacilityCurrency(currentForm.currency));
    }
    if (currentForm.tax_enabled !== originalFormState.tax_enabled) {
      updates.tax_enabled = currentForm.tax_enabled;
      dispatch(updateActiveFacilityTaxEnabled(currentForm.tax_enabled));
    }
    if (currentForm.tax_name !== originalFormState.tax_name) {
      updates.tax_name = currentForm.tax_name;
    }
    if (currentForm.tax_rate !== originalFormState.tax_rate) {
      updates.tax_rate = currentForm.tax_rate ? parseFloat(currentForm.tax_rate) : null;
    }

    // Branding
    if (currentForm.facility_logo_url !== originalFormState.facility_logo_url) {
      updates.facility_logo_path = currentForm.facility_logo_url;
      dispatch(updateActiveFacilityLogoPath(currentForm.facility_logo_url));
    }
    if (currentForm.primary_brand_color !== originalFormState.primary_brand_color) {
      updates.primary_brand_color = currentForm.primary_brand_color;
      dispatch(updateActiveFacilityPrimaryBrandColor(currentForm.primary_brand_color));
    }
    if (currentForm.secondary_brand_color !== originalFormState.secondary_brand_color) {
      updates.secondary_brand_color = currentForm.secondary_brand_color;
      dispatch(updateActiveFacilitySecondaryBrandColor(currentForm.secondary_brand_color));
    }

    // System Configuration
    if (currentForm.timezone !== originalFormState.timezone) {
      updates.timezone = currentForm.timezone;
    }
    if (currentForm.data_residency_region !== originalFormState.data_residency_region) {
      updates.data_residency_region = currentForm.data_residency_region;
    }

    // Dispatch the updates to Redux
    if (Object.keys(updates).length > 0 && facilityId) {
      dispatch(updateFacilityById({
        facilityId: facilityId,
        updates: updates
      }));
    }
  }, [dispatch]);

  // Sync form when facility/settings change
  useEffect(() => {
    if (settings) {
      const formState = settingsToFormState(settings);
      setForm(formState);
      setOriginalForm(formState);
      setFieldErrors({});
      setEditMode(false);
    } else {
      setForm(null);
      setOriginalForm(null);
    }
  }, [activeFacilityId, settingsResponse?.data,settings]);

  const handleField = useCallback(
    <K extends keyof FacilitySettingsFormState>(key: K, value: FacilitySettingsFormState[K]) => {
      setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[String(key)];
        return next;
      });
    },
    [],
  );

  const handleCancel = useCallback(() => {
    if (originalForm) {
      setForm({ ...originalForm });
      setFieldErrors({});
      setEditMode(false);
    }
  }, [originalForm]);

  const handleSave = useCallback(() => {
    if (!form || !settings) return;

    setIsSaving(true);
    const { payload, fieldErrors: errs } = buildUpdatePayload(form, settings);
    setFieldErrors(errs);

    if (Object.keys(errs).length > 0) {
      setIsSaving(false);
      return;
    }

    if (Object.keys(payload).length === 0) {
      setEditMode(false);
      setIsSaving(false);
      return;
    }

    saveSettings({ data: payload });
  }, [form, settings, saveSettings]);

const handleLogoFileChange = useCallback(
  (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      e.target.value = '';
      return;
    }

    const maxBytes = 2 * 1024 * 1024;
    if (file.size > maxBytes) {
      e.target.value = '';
      setFieldErrors((prev) => ({ ...prev, facility_logo: 'Max logo size is 2MB.' }));
      return;
    }

    // Pass the file as an object with 'file' property
    uploadLogo({ file }, {
      onSuccess: (response: any) => {
        if (response?.data?.facility_logo_url && form) {
          // Update form state with new logo URL
          setForm((prev) => prev ? { ...prev, facility_logo_url: response.data.facility_logo_url } : prev);
          // Update Redux context immediately
          if (activeFacilityId) {
            dispatch(updateActiveFacilityLogoPath(response.data.facility_logo_url));
            dispatch(updateFacilityById({
              facilityId: activeFacilityId,
              updates: { facility_logo_path: response.data.facility_logo_url }
            }));
          }
        }
      },
      onError: (error: any) => {
        console.error('Logo upload failed:', error);
        setFieldErrors((prev) => ({ ...prev, facility_logo: 'Failed to upload logo. Please try again.' }));
      }
    });
    
    e.target.value = '';
  },
  [uploadLogo, dispatch, activeFacilityId, form],
);

  const cardBase = cn(
    "rounded-xl border p-6 transition-colors w-full",
    isDark ? 'bg-gray-1000 border-gray-800' : 'bg-white border-gray-50 shadow-sm'
  );

  /* ------------------------------ UI States ------------------------------ */

  if (!activeFacilityId) {
    return (
      <div className={cn(
        "flex flex-col items-center justify-center min-h-[400px] gap-4 p-8 w-full",
        isDark ? 'text-gray-100 bg-gray-1000' : 'text-gray-900 bg-gray-50'
      )}>
        <XCircle className={cn("w-16 h-16", isDark ? 'text-yellow-400' : 'text-yellow-500')} />
        <h2 className="text-xl font-bold">No active facility selected</h2>
        <p className={cn("text-sm text-center max-w-md", isDark ? 'text-gray-400' : 'text-gray-600')}>
          Please select a facility (staff mode) to view and edit facility settings.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="w-full">
        <LoadingSkeleton variant="detail" theme={theme} message="Loading facility settings…" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className={cn(
        "flex flex-col items-center justify-center min-h-[400px] gap-4 p-8 w-full",
        isDark ? 'text-gray-100 bg-gray-1000' : 'text-gray-900 bg-gray-50'
      )}>
        <XCircle className={cn("w-16 h-16", isDark ? 'text-red-400' : 'text-red-500')} />
        <h2 className="text-xl font-bold">Failed to load facility settings</h2>
        <p className={cn("text-sm text-center max-w-md", isDark ? 'text-gray-400' : 'text-gray-600')}>
          {(error as any)?.response?.data?.message ?? (error as any)?.message ?? 'An unexpected error occurred.'}
        </p>
      </div>
    );
  }

  if (!settings || !form) {
    return (
      <div className="w-full">
        <LoadingSkeleton variant="detail" theme={theme} message="Loading facility settings…" />
      </div>
    );
  }

  return (
    <div className={cn(
      "min-h-screen w-full transition-colors",
      isDark ? 'bg-gray-1000 text-gray-100' : 'bg-gray-50 text-gray-900'
    )}>
      <div className="w-full px-4 sm:px-6 lg:px-8 py-4 lg:py-8 space-y-6">
        <FacilitySettingsHeaderBar
          isDark={isDark}
          activeFacilityName={activeFacilityName}
          editMode={editMode}
          setEditMode={setEditMode}
          onCancel={handleCancel}
          onSave={handleSave}
          isSaving={isSaving}
          isUploadingLogo={isUploadingLogo}
        />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            <FacilityBasicsCard
              cardBase={cardBase}
              isDark={isDark}
              editMode={editMode}
              form={form}
              fieldErrors={fieldErrors}
              onField={handleField}
            />

            <FacilityLocationContactCard
              cardBase={cardBase}
              isDark={isDark}
              editMode={editMode}
              form={form}
              fieldErrors={fieldErrors}
              onField={handleField}
            />
          </div>

          <div className="space-y-6">
            <FacilityBrandingAndOpsCard
              cardBase={cardBase}
              isDark={isDark}
              editMode={editMode}
              form={form}
              fieldErrors={fieldErrors}
              onField={handleField}
              fileInputRef={fileInputRef}
              isUploadingLogo={isUploadingLogo}
              onLogoFileChange={handleLogoFileChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

FacilityIdentity.displayName = 'FacilityIdentity';
export default FacilityIdentity;