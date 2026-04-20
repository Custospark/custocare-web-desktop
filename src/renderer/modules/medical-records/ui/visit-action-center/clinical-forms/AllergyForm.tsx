// modules/medical-records/ui/allergy/AllergyForm.tsx
import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  Save,
  X,
  AlertCircle,
  Plus,
  Edit2,
  CheckCircle,
  Clock,
  User,
  FileText,
  Trash2,
  RotateCcw,
  Loader2,
} from 'lucide-react';
import { useSelector } from 'react-redux';
import { selectActivePatient, selectActiveVisitId, selectActiveVisitPatientId } from '../../../../../app/store/slices/visitSlice';
import {
  useGetAllergies,
  useCreateAllergy,
  useUpdateAllergy,
  useDeleteAllergy,
  useResolveAllergy,
  useRestoreAllergy,
} from '../../../api/allergies/AllergyQueries';
import { Allergy, CreateAllergyRequest, UpdateAllergyRequest, AllergySeverity } from '../../../api/allergies/AllergyTypes';
import LoadingSkeleton from '../../../../../shared/components/Loading/LoadingSkeletons';

interface AllergyFormProps {
  theme?: 'light' | 'dark';
  onSave?: () => void;
  onCancel?: () => void;
}

export interface AllergyFormData {
  allergen: string;
  reaction: string;
  severity: AllergySeverity;
  clinical_notes: string;
}

const severityOptions = [
  { value: 'mild', label: 'Mild', color: 'text-blue-600 bg-blue-100', icon: AlertCircle },
  { value: 'moderate', label: 'Moderate', color: 'text-yellow-600 bg-yellow-100', icon: Clock },
  { value: 'severe', label: 'Severe', color: 'text-red-600 bg-red-100', icon: AlertTriangle },
] as const;

export const AllergyForm: React.FC<AllergyFormProps> = ({
  theme = 'light',
  onSave,
  onCancel,
}) => {
  const isDark = theme === 'light' ? false : true;
  
  // Get patient info from active visit
  const activePatient = useSelector(selectActivePatient);
  const patientId = useSelector(selectActiveVisitPatientId);
  const activeVisitId = useSelector(selectActiveVisitId);

  // State for form
  const [formData, setFormData] = useState<AllergyFormData>({
    allergen: '',
    reaction: '',
    severity: AllergySeverity.MODERATE,
    clinical_notes: '',
  });

  const [editingAllergyId, setEditingAllergyId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Queries and mutations
  const {
    data: allergiesResponse,
    isLoading: isLoadingAllergies,
    isRefetching: isRefetchingAllergies,
    refetch: refetchAllergies,
  } = useGetAllergies(patientId || 0, { is_active: true }, {
    enabled: !!patientId,
  });

  // Track loading states for buttons
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingActionId, setPendingActionId] = useState<number | null>(null);

  const createAllergy = useCreateAllergy({
    onSuccess: () => {
      refetchAllergies();
      resetForm();
      onSave?.();
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const updateAllergy = useUpdateAllergy({
    onSuccess: () => {
      refetchAllergies();
      resetForm();
      onSave?.();
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const deleteAllergy = useDeleteAllergy({
    onSuccess: () => {
      refetchAllergies();
    },
    onSettled: () => {
      setPendingActionId(null);
    },
  });

  const resolveAllergy = useResolveAllergy({
    onSuccess: () => {
      refetchAllergies();
    },
    onSettled: () => {
      setPendingActionId(null);
    },
  });

  const restoreAllergy = useRestoreAllergy({
    onSuccess: () => {
      refetchAllergies();
    },
    onSettled: () => {
      setPendingActionId(null);
    },
  });

  // FIX: Access the nested data correctly - response.data.data contains the allergies array
  const allergies = allergiesResponse?.data?.data || [];
  const meta = allergiesResponse?.data?.meta || { total: 0, active_count: 0, severe_count: 0 };
  
  const isRefreshing = isLoadingAllergies || isRefetchingAllergies;

  // Reset form
  const resetForm = () => {
    setFormData({
      allergen: '',
      reaction: '',
      severity: AllergySeverity.MODERATE,
      clinical_notes: '',
    });
    setEditingAllergyId(null);
    setShowForm(false);
  };

  // Handle edit
  const handleEdit = (allergy: Allergy) => {
    setFormData({
      allergen: allergy.allergen,
      reaction: allergy.reaction || '',
      severity: allergy.severity,
      clinical_notes: allergy.clinical_notes || '',
    });
    setEditingAllergyId(allergy.id);
    setShowForm(true);
  };

  // Handle submit
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    if (!patientId) {
      console.error('No patient selected');
      return;
    }

    if (!formData.allergen.trim()) {
      return;
    }

    setIsSubmitting(true);

    const baseData: CreateAllergyRequest = {
      allergen: formData.allergen.trim(),
      severity: formData.severity,
      reaction: formData.reaction.trim() || null,
      clinical_notes: formData.clinical_notes.trim() || null,
      visit_id: activeVisitId || undefined,
      diagnosed_at: new Date().toISOString(),
    };

    if (editingAllergyId) {
      const updateData: UpdateAllergyRequest = {
        allergen: formData.allergen.trim(),
        severity: formData.severity,
        reaction: formData.reaction.trim() || null,
        clinical_notes: formData.clinical_notes.trim() || null,
      };
      updateAllergy.mutate({
        patientId: patientId.toString(),
        allergyId: editingAllergyId,
        data: updateData,
      });
    } else {
      createAllergy.mutate({
        patientId: patientId.toString(),
        data: baseData,
      });
    }
  }, [formData, patientId, activeVisitId, editingAllergyId, createAllergy, updateAllergy]);

  // Handle delete
  const handleDelete = (allergy: Allergy) => {
    if (confirm(`Delete allergy record for "${allergy.allergen}"?`)) {
      setPendingActionId(allergy.id);
      deleteAllergy.mutate({
        patientId: patientId!.toString(),
        allergyId: allergy.id,
      });
    }
  };

  // Handle resolve
  const handleResolve = (allergy: Allergy) => {
    if (confirm(`Mark "${allergy.allergen}" as resolved?`)) {
      setPendingActionId(allergy.id);
      resolveAllergy.mutate({
        patientId: patientId!.toString(),
        allergyId: allergy.id,
      });
    }
  };

  // Handle restore
  const handleRestore = (allergy: Allergy) => {
    setPendingActionId(allergy.id);
    restoreAllergy.mutate({
      patientId: patientId!.toString(),
      allergyId: allergy.id,
    });
  };

  // Get severity style
  const getSeverityStyle = (severity: string) => {
    const option = severityOptions.find(opt => opt.value === severity);
    if (!option) return '';
    return option.color;
  };

  // Colors
  const colors = {
    bg: {
      input: isDark ? 'bg-gray-800' : 'bg-gray-50',
      hover: isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-50',
      card: isDark ? 'bg-gray-900' : 'bg-white',
    },
    text: {
      primary: isDark ? 'text-gray-100' : 'text-gray-900',
      secondary: isDark ? 'text-gray-400' : 'text-gray-600',
      tertiary: isDark ? 'text-gray-500' : 'text-gray-400',
    },
    border: {
      primary: isDark ? 'border-gray-700' : 'border-gray-200',
      focus: isDark ? 'focus:border-blue-500' : 'focus:border-blue-500',
    },
  };

  if (!patientId) {
    return (
      <div className="p-6 text-center">
        <div className={`p-4 rounded-lg inline-flex mb-4 ${colors.bg.card}`}>
          <User className={`w-8 h-8 ${colors.text.secondary}`} />
        </div>
        <h3 className={`font-semibold text-base mb-2 ${colors.text.primary}`}>No Active Patient</h3>
        <p className={`text-sm ${colors.text.secondary}`}>
          Please select a patient from the queue to manage allergies
        </p>
        <button
          onClick={onCancel}
          className="mt-4 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (isRefreshing && allergies.length === 0) {
    return <LoadingSkeleton variant="default" message="Loading allergy records..." theme={theme} />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-6"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className={`rounded-lg p-2 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div>
          <h2 className={`text-lg font-semibold ${colors.text.primary}`}>
            Allergy Management
          </h2>
          <p className={`text-sm ${colors.text.secondary}`}>
            Manage patient allergies and reactions
          </p>
        </div>
      </div>

      {/* Patient Info Bar */}
      <div className={`mb-6 p-4 rounded-lg border ${colors.border.primary} ${colors.bg.card}`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
            <User className="h-4 w-4" />
          </div>
          <div>
            <p className={`text-xs font-medium ${colors.text.secondary}`}>Patient</p>
            <p className={`text-sm font-semibold ${colors.text.primary}`}>
              {activePatient?.name || 'Unknown'} 
              <span className={`text-xs ml-2 ${colors.text.tertiary}`}>
                Number: {activePatient?.patient_number || 'N/A'}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Existing Allergies List */}
      {allergies.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className={`h-4 w-4 ${colors.text.secondary}`} />
            <h3 className={`text-sm font-medium ${colors.text.primary}`}>
              Current Allergies ({meta.total || allergies.length})
            </h3>
          </div>
          <div className="space-y-2">
            {allergies.map((allergy: Allergy) => {
              const isPending = pendingActionId === allergy.id;
              
              return (
                <div
                  key={allergy.id}
                  className={`p-3 rounded-lg border transition-all ${colors.border.primary} ${colors.bg.card} ${
                    isPending ? 'opacity-50' : isDark ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`font-medium ${colors.text.primary}`}>
                          {allergy.allergen}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getSeverityStyle(allergy.severity)}`}>
                          {allergy.severity}
                        </span>
                        {!allergy.is_active && (
                          <span className={`text-xs px-2 py-0.5 rounded-full bg-gray-500/20 ${colors.text.tertiary}`}>
                            Resolved
                          </span>
                        )}
                      </div>
                      {allergy.reaction && (
                        <p className={`text-xs ${colors.text.secondary} mb-1`}>
                          Reaction: {allergy.reaction}
                        </p>
                      )}
                      {allergy.clinical_notes && (
                        <p className={`text-xs ${colors.text.tertiary}`}>
                          Notes: {allergy.clinical_notes}
                        </p>
                      )}
                      {allergy.diagnosed_at && (
                        <p className={`text-xs ${colors.text.tertiary} mt-1`}>
                          Diagnosed: {new Date(allergy.diagnosed_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      {isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                      ) : (
                        <>
                          {allergy.is_active ? (
                            <>
                              <button
                                onClick={() => handleEdit(allergy)}
                                disabled={isSubmitting}
                                className={`p-1.5 rounded-lg transition-colors ${colors.bg.hover} disabled:opacity-50`}
                                title="Edit"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleResolve(allergy)}
                                disabled={isSubmitting}
                                className={`p-1.5 rounded-lg transition-colors ${colors.bg.hover} disabled:opacity-50`}
                                title="Mark as Resolved"
                              >
                                <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                              </button>
                              <button
                                onClick={() => handleDelete(allergy)}
                                disabled={isSubmitting}
                                className={`p-1.5 rounded-lg transition-colors ${colors.bg.hover} disabled:opacity-50`}
                                title="Delete"
                              >
                                <Trash2 className="h-3.5 w-3.5 text-red-500" />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleRestore(allergy)}
                              disabled={isSubmitting}
                              className={`p-1.5 rounded-lg transition-colors ${colors.bg.hover} disabled:opacity-50`}
                              title="Restore"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* No Allergies Message */}
      {allergies.length === 0 && !showForm && (
        <div className={`text-center py-8 mb-4 rounded-lg border ${colors.border.primary} ${colors.bg.card}`}>
          <AlertCircle className={`h-10 w-10 mx-auto mb-3 ${colors.text.secondary}`} />
          <p className={`text-sm ${colors.text.secondary}`}>
            No allergies recorded for this patient.
          </p>
          <p className={`text-xs ${colors.text.tertiary} mt-1`}>
            Click "Add New Allergy" to record one.
          </p>
        </div>
      )}

      {/* Add New Allergy Button */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          disabled={isSubmitting}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg border-2 border-dashed transition-all ${colors.border.primary} ${colors.text.secondary} hover:${colors.bg.hover} disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <Plus className="h-4 w-4" />
          Add New Allergy
        </button>
      )}

      {/* Allergy Form */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleSubmit}
            className="mt-4 space-y-4"
          >
            <div className={`p-4 rounded-lg border ${colors.border.primary} ${colors.bg.card}`}>
              <h3 className={`text-sm font-medium mb-3 ${colors.text.primary}`}>
                {editingAllergyId ? 'Edit Allergy' : 'New Allergy Record'}
              </h3>

              {/* Allergen Name */}
              <div className="mb-4">
                <label className={`block text-sm font-medium mb-2 ${colors.text.primary}`}>
                  Allergen <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <AlertTriangle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={formData.allergen}
                    onChange={(e) => setFormData(prev => ({ ...prev, allergen: e.target.value }))}
                    placeholder="e.g., Penicillin, Peanuts, Latex, Pollen"
                    className={`w-full cursor-text rounded-lg border p-3 pl-10 text-sm outline-none transition-all ${colors.bg.input} ${colors.text.primary} ${colors.border.primary} ${colors.border.focus}`}
                    autoFocus
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Severity */}
              <div className="mb-4">
                <label className={`block text-sm font-medium mb-2 ${colors.text.primary}`}>
                  Severity
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {severityOptions.map((option) => {
                    const Icon = option.icon;
                    const isSelected = formData.severity === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, severity: option.value as AllergySeverity }))}
                        disabled={isSubmitting}
                        className={`flex items-center justify-center gap-2 py-2 rounded-lg border transition-all ${
                          isSelected
                            ? option.color + ' border-current'
                            : `${colors.bg.input} ${colors.border.primary} ${colors.text.secondary}`
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        <span className="text-sm capitalize">{option.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Reaction */}
              <div className="mb-4">
                <label className={`block text-sm font-medium mb-2 ${colors.text.primary}`}>
                  Reaction
                </label>
                <div className="relative">
                  <AlertCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={formData.reaction}
                    onChange={(e) => setFormData(prev => ({ ...prev, reaction: e.target.value }))}
                    placeholder="e.g., Rash, Hives, Difficulty breathing, Swelling"
                    className={`w-full cursor-text rounded-lg border p-3 pl-10 text-sm outline-none transition-all ${colors.bg.input} ${colors.text.primary} ${colors.border.primary} ${colors.border.focus}`}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Clinical Notes */}
              <div className="mb-4">
                <label className={`block text-sm font-medium mb-2 ${colors.text.primary}`}>
                  Clinical Notes
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <textarea
                    value={formData.clinical_notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, clinical_notes: e.target.value }))}
                    placeholder="Additional notes about the allergy, treatment, or patient history..."
                    rows={3}
                    className={`w-full cursor-text rounded-lg border p-3 pl-10 text-sm outline-none transition-all resize-y ${colors.bg.input} ${colors.text.primary} ${colors.border.primary} ${colors.border.focus}`}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Validation Hint */}
              {!formData.allergen.trim() && (
                <div className={`flex items-center gap-2 rounded-lg p-3 mb-4 ${isDark ? 'bg-yellow-900/20' : 'bg-yellow-50'}`}>
                  <AlertCircle className={`h-4 w-4 ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`} />
                  <p className={`text-xs ${isDark ? 'text-yellow-400' : 'text-yellow-700'}`}>
                    Allergen name is required before saving
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={isSubmitting}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${colors.bg.hover} ${colors.text.secondary} disabled:opacity-50`}
                >
                  <X className="h-4 w-4" />
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!formData.allergen.trim() || isSubmitting}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
                    formData.allergen.trim() && !isSubmitting
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-400 cursor-not-allowed text-gray-200'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      {editingAllergyId ? 'Update Allergy' : 'Save Allergy'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AllergyForm;