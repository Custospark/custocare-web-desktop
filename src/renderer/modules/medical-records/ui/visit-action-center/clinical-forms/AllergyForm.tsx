import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  AlertCircle,
  Activity,
  FileText,
  CalendarDays,
  Plus,
  Save,
  X,
  Pencil,
  Trash2,
  RefreshCw,
  Shield,
  CheckCircle2,
  User,
} from 'lucide-react';
import { selectUser } from '../../../../../app/store/slices/authSlice';
import { useSelector } from 'react-redux';
import { useQueryClient } from '@tanstack/react-query';

import LoadingSkeleton from '../../../../../shared/components/Loading/LoadingSkeletons';
import { useConfirm } from '../../../../../shared/components/Feedback/ConfirmDialog/ConfirmContext';
import { cn } from '../../../../../shared/utils/classNameUtils';
import { type RootState } from '../../../../../app/store/rootReducer';
import {
  selectActivePatient,
  selectActiveVisitId,
  selectActiveVisitPatientId,
} from '../../../../../app/store/slices/visitSlice';
import {
  allergyKeys,
  getSeverityLabel,
  useCreateAllergy,
  useDeleteAllergy,
  useGetAllergies,
  useUpdateAllergy,
} from '../../../api/allergies/AllergyQueries';
import {
  AllergySeverity,
  type Allergy,
  type CreateAllergyRequest,
  type UpdateAllergyRequest,
} from '../../../api/allergies/AllergyTypes';

interface AllergyFormProps {
  theme?: 'light' | 'dark';
  onCancel?: () => void;
}

interface AllergyFormData {
  allergen: string;
  reaction: string;
  severity: AllergySeverity;
  clinical_notes: string;
  diagnosed_at: string;
  is_active: boolean;
}

interface NormalizedAllergyPayload {
  allergies: Allergy[];
  meta: {
    total: number;
    active_count: number;
    severe_count: number;
  };
}

const EMPTY_FORM: AllergyFormData = {
  allergen: '',
  reaction: '',
  severity: AllergySeverity.MILD,
  clinical_notes: '',
  diagnosed_at: '',
  is_active: true,
};

const normalizeAllergyResponse = (response: unknown): NormalizedAllergyPayload => {
  const payload = response as
    | {
        data?: {
          data?: Allergy[];
          meta?: {
            total?: number;
            active_count?: number;
            severe_count?: number;
          };
        };
        meta?: {
          total?: number;
          active_count?: number;
          severe_count?: number;
        };
      }
    | undefined;

  const nestedItems = payload?.data?.data;
  const flatItems = Array.isArray((payload as { data?: unknown[] } | undefined)?.data)
    ? ((payload as { data?: Allergy[] }).data ?? [])
    : [];

  const allergies = Array.isArray(nestedItems) ? nestedItems : flatItems;

  const nestedMeta = payload?.data?.meta;
  const flatMeta = payload?.meta;

  return {
    allergies,
    meta: {
      total: Number(nestedMeta?.total ?? flatMeta?.total ?? allergies.length ?? 0),
      active_count: Number(
        nestedMeta?.active_count ??
          flatMeta?.active_count ??
          allergies.filter((item) => item.is_active).length
      ),
      severe_count: Number(
        nestedMeta?.severe_count ??
          flatMeta?.severe_count ??
          allergies.filter(
            (item) => item.is_severe || item.severity === AllergySeverity.SEVERE
          ).length
      ),
    },
  };
};

const toDateInputValue = (value?: string | null): string => {
  if (!value) return '';
  try {
    return new Date(value).toISOString().split('T')[0];
  } catch {
    return '';
  }
};

const formatDate = (value?: string | null): string => {
  if (!value) return 'N/A';
  try {
    return new Date(value).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return 'N/A';
  }
};


const getSeverityBadgeClasses = (severity: string, isDark: boolean): string => {
  const base = 'border px-2.5 py-1 rounded-full text-xs font-semibold capitalize';

  switch (severity) {
    case AllergySeverity.SEVERE:
      return cn(
        base,
        isDark
          ? 'bg-red-900/30 text-red-300 border-red-800/50'
          : 'bg-red-100 text-red-700 border-red-200'
      );
    case AllergySeverity.MODERATE:
      return cn(
        base,
        isDark
          ? 'bg-yellow-900/30 text-yellow-300 border-yellow-800/50'
          : 'bg-yellow-100 text-yellow-700 border-yellow-200'
      );
    default:
      return cn(
        base,
        isDark
          ? 'bg-blue-900/30 text-blue-300 border-blue-800/50'
          : 'bg-blue-100 text-blue-700 border-blue-200'
      );
  }
};

export const AllergyForm: React.FC<AllergyFormProps> = ({
  theme = 'light',
  onCancel,
}) => {
  const isDark = theme === 'dark';
  const queryClient = useQueryClient();
  const { confirm } = useConfirm();

  const patientId = useSelector((state: RootState) => selectActiveVisitPatientId(state));
  const visitId = useSelector((state: RootState) => selectActiveVisitId(state));
  const patient = useSelector((state: RootState) => selectActivePatient(state));

  const [formData, setFormData] = useState<AllergyFormData>(EMPTY_FORM);
  const [editingAllergy, setEditingAllergy] = useState<Allergy | null>(null);

  const currentUser = useSelector((state: RootState) => selectUser(state));

  const canDeleteAllergy = useCallback((allergy: Allergy): boolean => {
    if (!currentUser) return false;
    
    // Get current user's reference ID from auth slice
    const currentUserRefId = currentUser.id?.toString();
    
    // Get allergy creator's reference ID
    const allergyCreatorRefId =   allergy.recorded_by?.id?.toString();
    
    // Return true only if IDs match
    return currentUserRefId === allergyCreatorRefId;
  }, [currentUser]);

  const colors = {
    bg: {
      card: isDark ? 'bg-gray-900' : 'bg-white',
      input: isDark ? 'bg-gray-800' : 'bg-gray-50',
      subtle: isDark ? 'bg-gray-800/60' : 'bg-gray-50',
      hover: isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-50',
      muted: isDark ? 'bg-gray-800' : 'bg-gray-100',
    },
    text: {
      primary: isDark ? 'text-gray-100' : 'text-gray-900',
      secondary: isDark ? 'text-gray-400' : 'text-gray-600',
      tertiary: isDark ? 'text-gray-500' : 'text-gray-500',
      brand: isDark ? 'text-blue-400' : 'text-blue-600',
    },
    border: {
      primary: isDark ? 'border-gray-700' : 'border-gray-200',
      subtle: isDark ? 'border-gray-800' : 'border-gray-100',
      focus: 'focus:border-blue-500',
    },
  };

  const allergiesQuery = useGetAllergies(patientId ?? '', {}, {
    enabled: !!patientId,
    refetchOnMount: 'always',
    staleTime: 0,
  });

  const normalized = useMemo(
    () => normalizeAllergyResponse(allergiesQuery.data),
    [allergiesQuery.data]
  );

  const refreshLatestAllergies = useCallback(async () => {
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
    setFormData(EMPTY_FORM);
    setEditingAllergy(null);
  }, []);

  const createMutation = useCreateAllergy({
    onSuccess: async () => {
      resetForm();
      await refreshLatestAllergies();
    },
  });

  const updateMutation = useUpdateAllergy({
    onSuccess: async () => {
      resetForm();
      await refreshLatestAllergies();
    },
  });

  const deleteMutation = useDeleteAllergy({
    onSuccess: async () => {
      resetForm();
      await refreshLatestAllergies();
    },
  });

  const isMutating =
    createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  const handleChange = useCallback(
    <K extends keyof AllergyFormData>(field: K, value: AllergyFormData[K]) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const populateForm = useCallback((allergy: Allergy) => {
    setEditingAllergy(allergy);
    setFormData({
      allergen: allergy.allergen ?? '',
      reaction: allergy.reaction ?? '',
      severity: allergy.severity ?? AllergySeverity.MILD,
      clinical_notes: allergy.clinical_notes ?? '',
      diagnosed_at: toDateInputValue(allergy.diagnosed_at),
      is_active: allergy.is_active ?? true,
    });
  }, []);

  const handleDelete = useCallback(
    async (allergy: Allergy) => {
      if (!patientId || deleteMutation.isPending) return;

      const confirmed = await confirm({
        title: 'Delete Allergy',
        message: `Are you sure you want to delete the allergy record for "${allergy.allergen}"? This action will remove it from the patient allergy list.`,
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
    (e: React.FormEvent) => {
      e.preventDefault();

      if (!patientId || !formData.allergen.trim()) return;

      const basePayload: UpdateAllergyRequest = {
        allergen: formData.allergen.trim(),
        reaction: formData.reaction.trim() || null,
        severity: formData.severity,
        clinical_notes: formData.clinical_notes.trim() || null,
        diagnosed_at: formData.diagnosed_at
          ? new Date(formData.diagnosed_at).toISOString()
          : null,
        is_active: formData.is_active,
      };

      if (editingAllergy) {
        updateMutation.mutate({
          patientId,
          allergyId: editingAllergy.id,
          data: basePayload,
        });
        return;
      }

      const createPayload: CreateAllergyRequest = {
        ...basePayload,
        severity: formData.severity,
        visit_id: visitId ?? null,
      };

      createMutation.mutate({
        patientId,
        data: createPayload,
      });
    },
    [
      createMutation,
      editingAllergy,
      formData,
      patientId,
      updateMutation,
      visitId,
    ]
  );

  useEffect(() => {
    if (!editingAllergy) return;

    const updatedEditingItem = normalized.allergies.find(
      (item) => item.id === editingAllergy.id
    );

    if (!updatedEditingItem && !isMutating) {
      resetForm();
    }
  }, [editingAllergy, isMutating, normalized.allergies, resetForm]);

  if (!patientId) {
    return (
      <div className="p-6">
        <div
          className={cn(
            'rounded-xl border p-6 text-center',
            colors.border.primary,
            colors.bg.card
          )}
        >
          <div
            className={cn(
              'mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full',
              colors.bg.muted
            )}
          >
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

  if (allergiesQuery.isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 p-6 xl:grid-cols-5">
        <div className="xl:col-span-2">
          <LoadingSkeleton
            variant="form"
            theme={isDark ? 'dark' : 'light'}
            message="Loading allergy form..."
          />
        </div>
        <div className="xl:col-span-3">
          <LoadingSkeleton
            variant="list"
            theme={isDark ? 'dark' : 'light'}
            message="Fetching patient allergies..."
          />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -14 }}
      className="p-6"
    >
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              'rounded-xl p-2.5',
              isDark ? 'bg-red-900/20' : 'bg-red-50'
            )}
          >
            <AlertTriangle
              className={cn(
                'h-5 w-5',
                isDark ? 'text-red-300' : 'text-red-600'
              )}
            />
          </div>

          <div>
            <h2 className={cn('text-lg font-semibold', colors.text.primary)}>
              Allergy Management
            </h2>
            <p className={cn('text-sm', colors.text.secondary)}>
              Add, edit, and remove allergy records for{' '}
              <span className="font-semibold">{patient?.name ?? 'current patient'}</span>
              {patient?.patient_number ? ` • ${patient.patient_number}` : ''}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div
            className={cn(
              'rounded-lg border px-3 py-2 text-sm',
              colors.border.primary,
              colors.bg.subtle
            )}
          >
            <span className={cn('font-semibold', colors.text.primary)}>
              Total:
            </span>{' '}
            <span className={colors.text.secondary}>{normalized.meta.total}</span>
          </div>
          <div
            className={cn(
              'rounded-lg border px-3 py-2 text-sm',
              colors.border.primary,
              colors.bg.subtle
            )}
          >
            <span className={cn('font-semibold', colors.text.primary)}>
              Active:
            </span>{' '}
            <span className={colors.text.secondary}>{normalized.meta.active_count}</span>
          </div>
          <div
            className={cn(
              'rounded-lg border px-3 py-2 text-sm',
              colors.border.primary,
              colors.bg.subtle
            )}
          >
            <span className={cn('font-semibold', colors.text.primary)}>
              Severe:
            </span>{' '}
            <span className={colors.text.secondary}>{normalized.meta.severe_count}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        {/* Form Column */}
        <div className="xl:col-span-2">
          <div
            className={cn(
              'rounded-2xl border p-5',
              colors.border.primary,
              colors.bg.card
            )}
          >
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className={cn('text-base font-semibold', colors.text.primary)}>
                  {editingAllergy ? 'Edit Allergy' : 'Add New Allergy'}
                </h3>
                <p className={cn('text-sm', colors.text.secondary)}>
                  Capture allergen, severity, reaction, and notes
                </p>
              </div>

              {editingAllergy && (
                <button
                  type="button"
                  onClick={resetForm}
                  className={cn(
                    'inline-flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all',
                    colors.bg.hover,
                    colors.text.secondary
                  )}
                >
                  <X className="h-4 w-4" />
                  Cancel Edit
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Allergen */}
              <div>
                <label
                  className={cn(
                    'mb-2 flex items-center gap-2 text-sm font-medium',
                    colors.text.primary
                  )}
                >
                  <AlertTriangle className="h-4 w-4" />
                  Allergen <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.allergen}
                  onChange={(e) => handleChange('allergen', e.target.value)}
                  placeholder="e.g. Penicillin, Peanuts, Latex"
                  className={cn(
                    'w-full cursor-text rounded-lg border p-3 text-sm outline-none transition-all',
                    colors.bg.input,
                    colors.text.primary,
                    colors.border.primary,
                    colors.border.focus
                  )}
                  autoFocus
                />
              </div>

              {/* Reaction */}
              <div>
                <label
                  className={cn(
                    'mb-2 flex items-center gap-2 text-sm font-medium',
                    colors.text.primary
                  )}
                >
                  <AlertCircle className="h-4 w-4" />
                  Reaction
                </label>
                <textarea
                  value={formData.reaction}
                  onChange={(e) => handleChange('reaction', e.target.value)}
                  placeholder="Describe reaction signs and symptoms..."
                  rows={3}
                  className={cn(
                    'w-full cursor-text resize-y rounded-lg border p-3 text-sm outline-none transition-all',
                    colors.bg.input,
                    colors.text.primary,
                    colors.border.primary,
                    colors.border.focus
                  )}
                />
              </div>

              {/* Severity */}
              <div>
                <label
                  className={cn(
                    'mb-2 flex items-center gap-2 text-sm font-medium',
                    colors.text.primary
                  )}
                >
                  <Activity className="h-4 w-4" />
                  Severity
                </label>
                <select
                  value={formData.severity}
                  onChange={(e) =>
                    handleChange('severity', e.target.value as AllergySeverity)
                  }
                  className={cn(
                    'w-full cursor-pointer rounded-lg border p-3 text-sm outline-none transition-all',
                    colors.bg.input,
                    colors.text.primary,
                    colors.border.primary,
                    colors.border.focus
                  )}
                >
                  <option value={AllergySeverity.MILD}>Mild</option>
                  <option value={AllergySeverity.MODERATE}>Moderate</option>
                  <option value={AllergySeverity.SEVERE}>Severe</option>
                </select>
              </div>

              {/* Diagnosed At */}
              <div>
                <label
                  className={cn(
                    'mb-2 flex items-center gap-2 text-sm font-medium',
                    colors.text.primary
                  )}
                >
                  <CalendarDays className="h-4 w-4" />
                  Diagnosis Date
                </label>
                <input
                  type="date"
                  value={formData.diagnosed_at}
                  onChange={(e) => handleChange('diagnosed_at', e.target.value)}
                  className={cn(
                    'w-full cursor-pointer rounded-lg border p-3 text-sm outline-none transition-all',
                    colors.bg.input,
                    colors.text.primary,
                    colors.border.primary,
                    colors.border.focus
                  )}
                />
              </div>

              {/* Clinical Notes */}
              <div>
                <label
                  className={cn(
                    'mb-2 flex items-center gap-2 text-sm font-medium',
                    colors.text.primary
                  )}
                >
                  <FileText className="h-4 w-4" />
                  Additional Notes
                </label>
                <textarea
                  value={formData.clinical_notes}
                  onChange={(e) => handleChange('clinical_notes', e.target.value)}
                  placeholder="Additional notes, precautions, or clinical guidance..."
                  rows={4}
                  className={cn(
                    'w-full cursor-text resize-y rounded-lg border p-3 text-sm outline-none transition-all',
                    colors.bg.input,
                    colors.text.primary,
                    colors.border.primary,
                    colors.border.focus
                  )}
                />
              </div>

              {/* Active */}
              <div
                className={cn(
                  'rounded-xl border p-3',
                  colors.border.primary,
                  colors.bg.subtle
                )}
              >
                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => handleChange('is_active', e.target.checked)}
                    className="h-4 w-4 cursor-pointer rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <p className={cn('text-sm font-medium', colors.text.primary)}>
                      Allergy is active
                    </p>
                    <p className={cn('text-xs', colors.text.secondary)}>
                      Uncheck if the allergy has been resolved or is no longer active
                    </p>
                  </div>
                </label>
              </div>

              {!formData.allergen.trim() && (
                <div
                  className={cn(
                    'flex items-center gap-2 rounded-lg p-3 text-xs',
                    isDark ? 'bg-yellow-900/20 text-yellow-300' : 'bg-yellow-50 text-yellow-700'
                  )}
                >
                  <AlertCircle className="h-4 w-4" />
                  Allergen name is required before saving
                </div>
              )}

              <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                {onCancel && (
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
                )}

                <button
                  type="button"
                  onClick={resetForm}
                  className={cn(
                    'inline-flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all',
                    colors.bg.hover,
                    colors.text.secondary
                  )}
                >
                  <RefreshCw className="h-4 w-4" />
                  Reset
                </button>

                <button
                  type="submit"
                  disabled={!formData.allergen.trim() || isMutating}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-all',
                    !formData.allergen.trim() || isMutating
                      ? 'cursor-not-allowed bg-gray-400'
                      : editingAllergy
                      ? 'cursor-pointer bg-amber-600 hover:bg-amber-700'
                      : 'cursor-pointer bg-blue-600 hover:bg-blue-700'
                  )}
                >
                  {editingAllergy ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  {editingAllergy ? 'Update Allergy' : 'Save Allergy'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* List Column */}
        <div className="xl:col-span-3">
          <div
            className={cn(
              'rounded-2xl border',
              colors.border.primary,
              colors.bg.card
            )}
          >
            <div
              className={cn(
                'flex flex-wrap items-center justify-between gap-3 border-b p-5',
                colors.border.primary
              )}
            >
              <div>
                <h3 className={cn('text-base font-semibold', colors.text.primary)}>
                  Recorded Allergies
                </h3>
                <p className={cn('text-sm', colors.text.secondary)}>
                  Review, edit, or remove patient allergy records
                </p>
              </div>

              <button
                type="button"
                onClick={() => allergiesQuery.refetch()}
                disabled={allergiesQuery.isFetching}
                className={cn(
                  'inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-all',
                  colors.border.primary,
                  colors.text.secondary,
                  allergiesQuery.isFetching ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'
                )}
              >
                <RefreshCw
                  className={cn('h-4 w-4', allergiesQuery.isFetching && 'animate-spin')}
                />
                Refresh
              </button>
            </div>

            {(allergiesQuery.isFetching || isMutating) && (
              <div className="px-5 pt-4">
                <LoadingSkeleton
                  variant="minimal"
                  theme={isDark ? 'dark' : 'light'}
                  message="Refreshing latest allergies..."
                />
              </div>
            )}

            <div className="p-5">
              {normalized.allergies.length === 0 ? (
                <div
                  className={cn(
                    'rounded-xl border border-dashed p-8 text-center',
                    colors.border.primary,
                    colors.bg.subtle
                  )}
                >
                  <CheckCircle2
                    className={cn(
                      'mx-auto mb-3 h-10 w-10',
                      isDark ? 'text-green-400' : 'text-green-600'
                    )}
                  />
                  <h4 className={cn('mb-1 text-base font-semibold', colors.text.primary)}>
                    No allergy records yet
                  </h4>
                  <p className={cn('text-sm', colors.text.secondary)}>
                    Use the form to add the patient's first allergy.
                  </p>
                </div>
              ) : (
              <div className="space-y-4">
              {normalized.allergies.map((allergy) => {
                const isEditing = editingAllergy?.id === allergy.id;
                const isSevere = allergy.severity === AllergySeverity.SEVERE;
                
                return (
                  <div
                    key={allergy.id}
                    className={cn(
                      'rounded-xl border transition-all duration-200',
                      colors.border.primary,
                      isEditing
                        ? isDark
                          ? 'bg-blue-900/10 ring-2 ring-blue-700/40'
                          : 'bg-blue-50 ring-2 ring-blue-200'
                        : colors.bg.subtle,
                      isSevere && !isEditing && (isDark ? 'border-red-800/30' : 'border-red-200')
                    )}
                  >
                    {/* Header Section */}
                    <div className="p-4 pb-3">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        {/* Left side - Main info */}
                        <div className="min-w-0 flex-1">
                          {/* Title row with allergen and badges */}
                          <div className="mb-3 flex flex-wrap items-center gap-2">
                            <div className="flex items-center gap-2">
                              {/* Allergen icon based on severity */}
                              {isSevere ? (
                                <AlertTriangle className={cn('h-5 w-5', isDark ? 'text-red-400' : 'text-red-600')} />
                              ) : allergy.severity === AllergySeverity.MODERATE ? (
                                <AlertCircle className={cn('h-5 w-5', isDark ? 'text-yellow-400' : 'text-yellow-600')} />
                              ) : (
                                <Shield className={cn('h-5 w-5', isDark ? 'text-blue-400' : 'text-blue-600')} />
                              )}
                              <h4 className={cn('text-base font-semibold', colors.text.primary)}>
                                {allergy.allergen}
                              </h4>
                            </div>

                            {/* Severity badge */}
                            <span className={getSeverityBadgeClasses(allergy.severity, isDark)}>
                              {getSeverityLabel(allergy.severity)}
                            </span>

                            {/* Status badge */}
                            <span
                              className={cn(
                                'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium',
                                allergy.is_active
                                  ? isDark
                                    ? 'border-green-800/50 bg-green-900/20 text-green-300'
                                    : 'border-green-200 bg-green-100 text-green-700'
                                  : isDark
                                  ? 'border-gray-700 bg-gray-800 text-gray-400'
                                  : 'border-gray-200 bg-gray-100 text-gray-600'
                              )}
                            >
                              <Activity className="h-3 w-3" />
                              {allergy.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </div>

                          {/* Reaction section */}
                          {allergy.reaction && (
                            <div className="mb-3 flex items-start gap-2">
                              <AlertCircle className={cn('mt-0.5 h-4 w-4 flex-shrink-0', colors.text.tertiary)} />
                              <div className="flex-1">
                                <span className={cn('text-sm font-medium', colors.text.secondary)}>Reaction:</span>
                                <p className={cn('text-sm', colors.text.primary)}>{allergy.reaction}</p>
                              </div>
                            </div>
                          )}

                          {/* Clinical notes section */}
                          {allergy.clinical_notes && (
                            <div className="mb-3 flex items-start gap-2">
                              <FileText className={cn('mt-0.5 h-4 w-4 flex-shrink-0', colors.text.tertiary)} />
                              <div className="flex-1">
                                <span className={cn('text-sm font-medium', colors.text.secondary)}>Notes:</span>
                                <p className={cn('text-sm', colors.text.primary)}>{allergy.clinical_notes}</p>
                              </div>
                            </div>
                          )}

                          {/* Metadata footer */}
                          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-t pt-3 text-xs">
                            {/* Diagnosis date */}
                            <div className="flex items-center gap-1.5">
                              <CalendarDays className={cn('h-3.5 w-3.5', colors.text.tertiary)} />
                              <span className={colors.text.tertiary}>
                                Diagnosed: {formatDate(allergy.diagnosed_at)}
                              </span>
                            </div>

                            {/* Recording doctor */}
                            {allergy.recorded_by?.name && (
                              <div className="flex items-center gap-1.5">
                                <User className={cn('h-3.5 w-3.5', colors.text.tertiary)} />
                                <span className={colors.text.tertiary}>
                                  Recorded by: Dr. {allergy.recorded_by.name}
                                </span>
                              </div>
                            )}

                            {/* Facility info */}
                            {allergy.visit?.facility_name && (
                              <div className="flex items-center gap-1.5">
                                <div className={cn('h-3.5 w-3.5', colors.text.tertiary)}>🏥</div>
                                <span className={colors.text.tertiary}>
                                  {allergy.visit.facility_name}
                                  {allergy.visit?.facility_main_phone && (
                                    <span className="ml-1">
                                      ({allergy.visit.facility_main_phone})
                                    </span>
                                  )}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Right side - Action buttons */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => populateForm(allergy)}
                            className={cn(
                              'inline-flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all',
                              isDark
                                ? 'bg-amber-900/20 text-amber-300 hover:bg-amber-900/30'
                                : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                            )}
                          >
                            <Pencil className="h-4 w-4" />
                            Edit
                          </button>

                          {canDeleteAllergy(allergy) && (
                            <button
                              type="button"
                              onClick={() => handleDelete(allergy)}
                              disabled={deleteMutation.isPending}
                              className={cn(
                                'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all',
                                deleteMutation.isPending
                                  ? 'cursor-not-allowed bg-gray-400 text-white'
                                  : isDark
                                  ? 'cursor-pointer bg-red-900/20 text-red-300 hover:bg-red-900/30'
                                  : 'cursor-pointer bg-red-50 text-red-700 hover:bg-red-100'
                              )}
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Editing indicator */}
                    {isEditing && (
                      <div
                        className={cn(
                          'mx-4 mb-4 flex items-center gap-2 rounded-lg border px-3 py-2 text-xs',
                          isDark
                            ? 'border-blue-800/40 bg-blue-900/20 text-blue-300'
                            : 'border-blue-200 bg-blue-50 text-blue-700'
                        )}
                      >
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        Currently editing this allergy record - changes will update the existing record
                      </div>
                    )}

                    {/* Severe allergy warning banner */}
                    {isSevere && allergy.is_active && !isEditing && (
                      <div
                        className={cn(
                          'flex items-center gap-2 rounded-b-xl border-t px-4 py-2 text-xs',
                          isDark
                            ? 'border-red-800/30 bg-red-900/20 text-red-300'
                            : 'border-red-200 bg-red-50 text-red-700'
                        )}
                      >
                        <AlertTriangle className="h-3.5 w-3.5" />
                        <span className="font-medium">Severe Allergy Alert:</span>
                        <span>This allergy requires immediate attention and precautions</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AllergyForm;
