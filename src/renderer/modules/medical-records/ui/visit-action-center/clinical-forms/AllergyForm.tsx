import React, { useCallback, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { User, X, Plus } from 'lucide-react';
import { cn } from '../../../../../shared/utils/classNameUtils';
import { selectActiveVisitPatientId } from '../../../../../app/store/slices/visitSlice';
import { selectUser } from '../../../../../app/store/slices/authSlice';
import { useToast } from '../../../../../app/store/contexts/toast/useToast';
import { useConfirm } from '../../../../../shared/components/Feedback/ConfirmDialog/ConfirmContext';
import LoadingSkeleton from '../../../../../shared/components/Loading/LoadingSkeletons';
import { useQueryClient } from '@tanstack/react-query';

import {
  allergyKeys,
  useCreateAllergy,
  useDeleteAllergy,
  useGetAllergies,
  useUpdateAllergy,
} from '../../../api/allergies/AllergyQueries';
import type { Allergy } from './allergies-form-components/allergiesForm.types';

import {
  AllergiesHeader,
  AllergiesEmptyState,
  AllergiesEditor,
  AllergiesList,
  AllergiesPreviewModal,
} from './allergies-form-components';
import type {
  AllergiesFormData,
  AllergiesMode,
} from './allergies-form-components/allergiesForm.types';
import {
  EMPTY_ALLERGIES_FORM,
  getAllergiesTheme,
  normalizeAllergyResponse,
  extractAllergiesFormValues,
  buildCreateAllergyPayload,
  buildUpdateAllergyPayload,
  getAllergyStatistics,
  canDeleteAllergy as checkCanDeleteAllergy,
} from './allergies-form-components/allergiesForm.utils';

export interface AllergyFormProps {
  theme?: 'light' | 'dark';
  onCancel?: () => void;
}

export const AllergyForm: React.FC<AllergyFormProps> = ({
  theme = 'light',
  onCancel,
}) => {
  const isDark = theme === 'dark';
  const colors = getAllergiesTheme(theme);
  const queryClient = useQueryClient();
  const { confirm } = useConfirm();
  const { showToast } = useToast();

  const patientId = useSelector(selectActiveVisitPatientId);
  const currentUser = useSelector(selectUser);

  const [mode, setMode] = useState<AllergiesMode>('idle');
  const [formData, setFormData] = useState<AllergiesFormData>(EMPTY_ALLERGIES_FORM);
  const [editingAllergy, setEditingAllergy] = useState<Allergy | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof AllergiesFormData, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewAction, setPreviewAction] = useState<'preview' | 'print' | 'download'>('preview');

  // Query allergies
  const allergiesQuery = useGetAllergies(patientId ?? '', {}, {
    enabled: !!patientId,
    refetchOnMount: 'always',
    staleTime: 0,
  });

  const normalized = useMemo(
    () => normalizeAllergyResponse(allergiesQuery.data),
    [allergiesQuery.data]
  );

  const allergies = normalized.allergies;
  const stats = getAllergyStatistics(allergies);

  // Helper function to refresh allergies after mutation
  const refreshAllergies = useCallback(async () => {
    if (!patientId) return;

    await queryClient.invalidateQueries({
      queryKey: allergyKeys.all(patientId),
    });
    await queryClient.refetchQueries({
      queryKey: allergyKeys.all(patientId),
      type: 'active',
    });
  }, [patientId, queryClient]);

  const resetForm = useCallback(() => {
    setFormData(EMPTY_ALLERGIES_FORM);
    setEditingAllergy(null);
    setFieldErrors({});
    setFormError(null);
    setMode('idle');
  }, []);

  const handleMutationError = useCallback((error: unknown) => {
    const err = error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
    const message = err.response?.data?.message || 'Unable to save allergy record.';
    setFormError(message);
    if (err.response?.data?.errors) {
      const apiErrors = err.response.data.errors;
      const mappedErrors: Partial<Record<keyof AllergiesFormData, string>> = {
        allergen: apiErrors.allergen?.[0],
        reaction: apiErrors.reaction?.[0],
        severity: apiErrors.severity?.[0],
        clinicalNotes: apiErrors.clinical_notes?.[0],
        diagnosedAt: apiErrors.diagnosed_at?.[0],
        isActive: apiErrors.is_active?.[0],
      };
      setFieldErrors(mappedErrors);
    }
  }, []);

  const createMutation = useCreateAllergy({
    onSuccess: async () => {
      resetForm();
      await refreshAllergies();
    },
    onError: handleMutationError,
  });

  const updateMutation = useUpdateAllergy({
    onSuccess: async () => {
      resetForm();
      await refreshAllergies();
    },
    onError: handleMutationError,
  });

  const deleteMutation = useDeleteAllergy({
    onSuccess: async () => {
      resetForm();
      await refreshAllergies();
    },
    onError: (error) => {
      const err = error as { response?: { data?: { message?: string } } };
      showToast('error', err.response?.data?.message || 'Failed to delete allergy', 3000);
    },
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const isLoading = allergiesQuery.isLoading && !!patientId;

  const handleChange = useCallback(
    (field: keyof AllergiesFormData, value: string | boolean) => {
      setFormError(null);
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleCreate = useCallback(() => {
    setFormError(null);
    setFieldErrors({});
    setFormData(EMPTY_ALLERGIES_FORM);
    setEditingAllergy(null);
    setMode('create');
  }, []);

  const handleEdit = useCallback((allergy: Allergy) => {
    setFormError(null);
    setFieldErrors({});
    setFormData(extractAllergiesFormValues(allergy));
    setEditingAllergy(allergy);
    setMode('edit');
  }, []);

  const handleCancelEdit = useCallback(() => {
    resetForm();
  }, [resetForm]);

  const handleDelete = useCallback(
    async (allergy: Allergy) => {
      if (!patientId) return;

      const confirmed = await confirm({
        title: 'Delete Allergy',
        message: `Are you sure you want to delete the allergy record for "${allergy.allergen}"?`,
        confirmText: 'Delete Allergy',
        cancelText: 'Cancel',
        variant: 'danger',
        theme,
      });

      if (!confirmed) return;

      deleteMutation.mutate({
        patientId,
        allergyId: allergy.id,
      });
    },
    [confirm, deleteMutation, patientId, theme]
  );

  const handleSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      setFormError(null);
      setFieldErrors({});

      if (!formData.allergen.trim()) {
        setFieldErrors({ allergen: 'Allergen name is required.' });
        return;
      }

      if (!patientId) {
        setFormError('Patient ID is missing. Please select a patient first.');
        return;
      }

      if (mode === 'edit' && editingAllergy) {
        updateMutation.mutate({
          patientId,
          allergyId: editingAllergy.id,
          data: buildUpdateAllergyPayload(formData),
        });
      } else {
        createMutation.mutate({
          patientId,
          data: buildCreateAllergyPayload(formData, null),
        });
      }
    },
    [createMutation, editingAllergy, formData, mode, patientId, updateMutation]
  );

  const openPreview = useCallback((action: 'preview' | 'print' | 'download' = 'preview') => {
    setPreviewAction(action);
    setPreviewOpen(true);
  }, []);

  const closePreview = useCallback(() => {
    setPreviewOpen(false);
    setPreviewAction('preview');
  }, []);

  const handlePrintReport = useCallback(() => {
    openPreview('print');
  }, [openPreview]);

  const handleDownloadReport = useCallback(() => {
    openPreview('download');
  }, [openPreview]);

  const canDeleteAllergy = useCallback(
    (allergy: Allergy) => checkCanDeleteAllergy(allergy, currentUser?.id),
    [currentUser?.id]
  );

  // No patient selected
  if (!patientId) {
    return (
      <div className="p-6">
        <div className={cn('rounded-xl border p-6 text-center', colors.border.primary, colors.bg.card)}>
          <div className={cn('mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full', colors.bg.muted)}>
            <User className={cn('h-6 w-6', colors.text.secondary)} />
          </div>
          <h2 className={cn('mb-2 text-lg font-semibold', colors.text.primary)}>
            No active patient selected
          </h2>
          <p className={cn('text-sm', colors.text.secondary)}>
            Open this form from an active visit to manage allergies.
          </p>
          {onCancel && (
            <div className="mt-5">
              <button
                type="button"
                onClick={onCancel}
                className={cn(
                  'inline-flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all',
                  colors.bg.hover,
                  colors.text.secondary
                )}
              >
                <X className="h-4 w-4" />
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 p-6 xl:grid-cols-5">
        <div className="xl:col-span-2">
          <LoadingSkeleton variant="form" theme={isDark ? 'dark' : 'light'} message="Loading allergy form..." />
        </div>
        <div className="xl:col-span-3">
          <LoadingSkeleton variant="list" theme={isDark ? 'dark' : 'light'} message="Fetching patient allergies..." />
        </div>
      </div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -14 }}
        className="p-6"
      >
        {/* Header with statistics */}
        <AllergiesHeader
          isDark={isDark}
          colors={colors}
          hasActiveVisit={!!patientId}
          hasExistingAllergies={allergies.length > 0}
          allergiesCount={stats.total}
          activeCount={stats.active}
          severeCount={stats.severe}
          isFetching={allergiesQuery.isFetching}
          onRefresh={() => allergiesQuery.refetch()}
          onPreview={() => openPreview('preview')}
          onPrint={handlePrintReport}
          onDownload={handleDownloadReport}
        />

        {/* Main content grid */}
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
      {/* Form Column - Only show when creating or editing */}
      {(mode === 'create' || mode === 'edit') && (
        <div className="xl:col-span-2">
          <AllergiesEditor
            isDark={isDark}
            colors={colors}
            mode={mode}
            formData={formData}
            fieldErrors={fieldErrors}
            formError={formError}
            isSubmitting={isSubmitting}
            editingAllergyId={editingAllergy?.id}
            onChange={handleChange}
            onCancel={handleCancelEdit}
            onPreview={() => openPreview('preview')}
            onSubmit={handleSubmit}
          />
        </div>
      )}

      {/* Add Button Column - Show when idle (no form open) */}
      {mode === 'idle' && (
        <div className="xl:col-span-1">
          <button
            type="button"
            onClick={handleCreate}
            className={cn(
              'w-full rounded-xl border-2 border-dashed p-4 text-center transition-all cursor-pointer',
              'hover:border-blue-400 hover:bg-blue-50/50 flex items-center justify-center gap-2',
              isDark 
                ? 'border-slate-700 hover:bg-slate-800/50' 
                : 'border-slate-300 hover:bg-slate-50'
            )}
          >
            <Plus className={cn('h-5 w-5', colors.text.brand)} />
            <span className={cn('text-sm font-medium', colors.text.secondary)}>
              Add Allergy
            </span>
          </button>
        </div>
      )}

      {/* List Column - Display Allergies */}
      <div className={
        mode === 'idle' 
          ? 'xl:col-span-3' 
          : (mode === 'create' || mode === 'edit') 
            ? 'xl:col-span-2' 
            : 'xl:col-span-4'
      }>
        <div className={cn('rounded-2xl border', colors.border.primary, colors.bg.card)}>
          <div className={cn('border-b p-5', colors.border.primary)}>
            <h3 className={cn('text-base font-semibold', colors.text.primary)}>
              Recorded Allergies
            </h3>
            <p className={cn('text-sm', colors.text.secondary)}>
              Review, edit, or remove patient allergy records
            </p>
          </div>

          <div className="p-5">
            {allergies.length === 0 ? (
              <AllergiesEmptyState
                isDark={isDark}
                colors={colors}
                patientId={patientId}
                onCreate={handleCreate}
              />
            ) : (
              <AllergiesList
                isDark={isDark}
                colors={colors}
                allergies={allergies}
                editingAllergyId={editingAllergy?.id ?? null}
                isMutating={isSubmitting || deleteMutation.isPending}
                onEdit={handleEdit}
                onDelete={handleDelete}
                canDelete={canDeleteAllergy}
              />
            )}
          </div>
        </div>
      </div>
    </div>
      </motion.div>

      {/* Preview Modal */}
      <AllergiesPreviewModal
        open={previewOpen}
        onClose={closePreview}
        allergies={allergies}
        patientName={allergies[0]?.patient?.name || 'Patient'}
        patientNumber={allergies[0]?.patient?.patient_number || 'N/A'}
        initialAction={previewAction}
      />
    </>
  );
};

export type { AllergiesFormData };
export default AllergyForm;