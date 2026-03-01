import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
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

/* -------------------------------------------------------------------------- */
/*                               Main Component                               */
/* -------------------------------------------------------------------------- */

const FacilitySettings: React.FC = () => {
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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  // logo upload
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { mutate: uploadLogo, isPending: isUploadingLogo } = useUploadFacilityLogo();

  // save
  const { mutate: saveSettings } = useUpdateFacilitySettings({
    onSuccess: () => {
      setEditMode(false);
      setIsSaving(false);
    },
    onError: () => {
      setIsSaving(false);
    }
  });

  // Sync form when facility/settings change
  useEffect(() => {
    if (settings) {
      setForm(settingsToFormState(settings));
      setFieldErrors({});
      setEditMode(false);
    } else {
      setForm(null);
    }
  }, [activeFacilityId, settingsResponse?.data]);

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
    if (!settings) return;
    setForm(settingsToFormState(settings));
    setFieldErrors({});
    setEditMode(false);
  }, [settings]);

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

      const maxBytes = 2 * 1024 * 1024; // backend max is 2048 KB
      if (file.size > maxBytes) {
        e.target.value = '';
        setFieldErrors((prev) => ({ ...prev, facility_logo: 'Max logo size is 2MB.' }));
        return;
      }

      uploadLogo({ file });
      e.target.value = '';
    },
    [uploadLogo],
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

  if (isError || !settings || !form) {
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
          {/* Left column - 2/3 width on xl screens, full width on smaller */}
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

          {/* Right column - 1/3 width on xl screens, full width on smaller */}
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

FacilitySettings.displayName = 'FacilitySettings';
export default FacilitySettings;