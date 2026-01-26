import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { AlertCircle, Plus, X, Save, Edit2, Check, Trash2 } from 'lucide-react';
import { cn } from '../../../../shared/utils/classNameUtils';
import LoadingSkeleton from '../../../../shared/components/Loading/LoadingSkeletons';
import { useToast } from '../../../../app/store/contexts/toast/useToast';
import { useConfirm } from '../../../../shared/components/Feedback/ConfirmDialog/ConfirmContext';
import { useUpdateVisit } from '../../../pharmacy/api/dispensing/visit-queue/useVisitQueries';
import { selectActiveVisit } from '../../../../app/store/slices/visitSlice';
import type { RootState } from '../../../../app/store/rootReducer';

type Theme = 'light' | 'dark';

interface PatientComplaintsProps {
  theme?: Theme;
  className?: string;
}

// Common complaint suggestions for quick entry
const COMMON_COMPLAINTS = [
  'Fever',
  'Headache',
  'Cough',
  'Abdominal pain',
  'Chest pain',
  'Shortness of breath',
  'Nausea',
  'Vomiting',
  'Diarrhea',
  'Fatigue',
  'Dizziness',
  'Back pain',
  'Sore throat',
  'Body aches',
  'Rash',
];

const PatientComplaints: React.FC<PatientComplaintsProps> = ({ 
  theme = 'dark',
  className 
}) => {
  const isDark = theme === 'dark';
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  
  // Get active visit from Redux store
  const activeVisit = useSelector((state: RootState) => selectActiveVisit(state));
  
  // Local state for managing complaints
  const [complaints, setComplaints] = useState<string[]>([]);
  const [newComplaint, setNewComplaint] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [touchedInput, setTouchedInput] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Initialize complaints from active visit
  useEffect(() => {
    if (activeVisit?.chief_complaints) {
      setComplaints(activeVisit.chief_complaints);
    } else {
      setComplaints([]);
    }
  }, [activeVisit]);

  // Update mutation
  const updateMutation = useUpdateVisit({
    onSuccess: (response) => {
      showToast('success', 'Chief complaints updated successfully', 3000);
      setIsEditing(false);
      setEditingIndex(null);
      setNewComplaint('');
      setTouchedInput(false);
      
      // Update local state with server response
      if (response.data.chief_complaints) {
        setComplaints(response.data.chief_complaints);
      }
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message || 'Failed to update chief complaints';
      showToast('error', errorMessage, 5000);
    },
  });

  // Color tokens
  const colors = useMemo(
    () => ({
      bg: {
        primary: isDark ? 'bg-gray-900' : 'bg-white',
        secondary: isDark ? 'bg-gray-800' : 'bg-gray-50',
        elevated: isDark ? 'bg-gray-800' : 'bg-white',
      },
      border: {
        primary: isDark ? 'border-gray-700' : 'border-gray-200',
        secondary: isDark ? 'border-gray-600' : 'border-gray-300',
      },
      text: {
        primary: isDark ? 'text-white' : 'text-gray-900',
        secondary: isDark ? 'text-gray-400' : 'text-gray-600',
        tertiary: isDark ? 'text-gray-500' : 'text-gray-500',
      },
    }),
    [isDark]
  );

  // Validation
  const validateComplaint = useCallback((value: string): string | null => {
    const trimmed = value.trim();
    if (!trimmed) return 'Complaint cannot be empty';
    if (trimmed.length < 2) return 'Complaint must be at least 2 characters';
    if (trimmed.length > 200) return 'Complaint must be less than 200 characters';
    return null;
  }, []);

  const inputError = useMemo(() => {
    if (!touchedInput || !newComplaint) return null;
    return validateComplaint(newComplaint);
  }, [newComplaint, touchedInput, validateComplaint]);

  // Add new complaint
  const handleAddComplaint = useCallback(async () => {
    const error = validateComplaint(newComplaint);
    if (error) {
      setTouchedInput(true);
      showToast('error', error, 3000);
      return;
    }

    const trimmed = newComplaint.trim();
    if (complaints.includes(trimmed)) {
      showToast('error', 'This complaint has already been added', 3000);
      return;
    }

    const updatedComplaints = [...complaints, trimmed];
    setComplaints(updatedComplaints);
    setNewComplaint('');
    setTouchedInput(false);
    setShowSuggestions(false);

    // Save to backend if visit exists
    if (activeVisit?.visit_uuid) {
      updateMutation.mutate({
        uuid: activeVisit.visit_uuid,
        data: {
          chief_complaints: updatedComplaints,
        },
      });
    }
  }, [newComplaint, complaints, validateComplaint, activeVisit, updateMutation, showToast]);

  // Start editing a complaint
  const handleStartEdit = useCallback((index: number) => {
    setEditingIndex(index);
    setEditValue(complaints[index]);
    setIsEditing(true);
  }, [complaints]);

  // Save edited complaint
  const handleSaveEdit = useCallback(async () => {
    if (editingIndex === null) return;

    const error = validateComplaint(editValue);
    if (error) {
      showToast('error', error, 3000);
      return;
    }

    const trimmed = editValue.trim();
    const updatedComplaints = [...complaints];
    updatedComplaints[editingIndex] = trimmed;
    
    setComplaints(updatedComplaints);
    setEditingIndex(null);
    setEditValue('');
    setIsEditing(false);

    // Save to backend if visit exists
    if (activeVisit?.visit_uuid) {
      updateMutation.mutate({
        uuid: activeVisit.visit_uuid,
        data: {
          chief_complaints: updatedComplaints,
        },
      });
    }
  }, [editingIndex, editValue, complaints, validateComplaint, activeVisit, updateMutation, showToast]);

  // Cancel editing
  const handleCancelEdit = useCallback(() => {
    setEditingIndex(null);
    setEditValue('');
    setIsEditing(false);
  }, []);

  // Remove complaint
  const handleRemoveComplaint = useCallback(async (index: number) => {
    const ok = await confirm({
      title: 'Remove Complaint',
      message: `Are you sure you want to remove "${complaints[index]}"?`,
      confirmText: 'Yes, Remove',
      cancelText: 'Cancel',
      variant: 'warning',
      theme,
    });

    if (!ok) return;

    const updatedComplaints = complaints.filter((_, i) => i !== index);
    setComplaints(updatedComplaints);

    // Save to backend if visit exists
    if (activeVisit?.visit_uuid) {
      updateMutation.mutate({
        uuid: activeVisit.visit_uuid,
        data: {
          chief_complaints: updatedComplaints,
        },
      });
    }
  }, [complaints, confirm, theme, activeVisit, updateMutation]);

  // Add suggestion
  const handleAddSuggestion = useCallback((suggestion: string) => {
    if (complaints.includes(suggestion)) {
      showToast('info', 'This complaint has already been added', 3000);
      return;
    }

    const updatedComplaints = [...complaints, suggestion];
    setComplaints(updatedComplaints);
    setShowSuggestions(false);

    // Save to backend if visit exists
    if (activeVisit?.visit_uuid) {
      updateMutation.mutate({
        uuid: activeVisit.visit_uuid,
        data: {
          chief_complaints: updatedComplaints,
        },
      });
    }
  }, [complaints, activeVisit, updateMutation, showToast]);

  // Filter suggestions based on input
  const filteredSuggestions = useMemo(() => {
    if (!newComplaint.trim()) return COMMON_COMPLAINTS;
    const query = newComplaint.toLowerCase();
    return COMMON_COMPLAINTS.filter(
      (c) => c.toLowerCase().includes(query) && !complaints.includes(c)
    );
  }, [newComplaint, complaints]);

  // Loading state
  if (!activeVisit) {
    return (
      <div className={cn('p-6', className)}>
        <div className={cn('rounded-xl border p-6', colors.border.primary, colors.bg.elevated)}>
          <div className="text-center space-y-2">
            <AlertCircle className={cn('w-12 h-12 mx-auto', colors.text.secondary)} />
            <p className={cn('text-sm', colors.text.secondary)}>
              No active visit selected. Please select a patient visit first.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const isSubmitting = updateMutation.isPending;

  return (
    <div className={cn('p-6', className)}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h2 className={cn('text-2xl font-bold', colors.text.primary)}>
            Chief Complaints
          </h2>
          <p className={colors.text.secondary}>
            Document the patient's reason for visit and primary complaints
          </p>
        </div>

        {/* Main Content */}
        <div className={cn('rounded-xl border p-6', colors.border.primary, colors.bg.elevated)}>
          {/* Loading Skeleton */}
          {isSubmitting && (
            <div className="mb-6">
              <LoadingSkeleton variant="minimal" theme={theme} message="Saving changes..." />
            </div>
          )}

          {/* Patient Info */}
          <div className={cn('mb-6 p-4 rounded-lg', colors.bg.secondary)}>
            <div className="flex items-center justify-between">
              <div>
                <p className={cn('text-sm font-medium', colors.text.secondary)}>Patient</p>
                <p className={cn('text-lg font-semibold', colors.text.primary)}>
                  {activeVisit.patient?.name || 'Unknown Patient'}
                </p>
              </div>
              <div className="text-right">
                <p className={cn('text-sm font-medium', colors.text.secondary)}>Visit ID</p>
                <p className={cn('text-sm font-mono', colors.text.primary)}>
                  {activeVisit.visit_uuid.slice(0, 8)}...
                </p>
              </div>
            </div>
          </div>

          {/* Add New Complaint */}
          <div className="space-y-4 mb-6">
            <label className={cn('block text-sm font-medium', colors.text.primary)}>
              Add Chief Complaint
            </label>
            
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={newComplaint}
                  onChange={(e) => {
                    setNewComplaint(e.target.value);
                    setTouchedInput(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      void handleAddComplaint();
                    }
                  }}
                  placeholder="Enter patient complaint or select from suggestions..."
                  disabled={isSubmitting}
                  className={cn(
                    'w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors',
                    isDark 
                      ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-500' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400',
                    inputError && 'border-red-500'
                  )}
                />
                
                {/* Suggestions Dropdown */}
                {showSuggestions && filteredSuggestions.length > 0 && (
                  <div className={cn(
                    'absolute z-10 w-full mt-1 rounded-lg border shadow-lg max-h-60 overflow-y-auto',
                    isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                  )}>
                    {filteredSuggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => handleAddSuggestion(suggestion)}
                        className={cn(
                          'w-full px-4 py-2 text-left text-sm transition-colors',
                          isDark 
                            ? 'hover:bg-gray-700 text-gray-200' 
                            : 'hover:bg-gray-100 text-gray-700'
                        )}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              <button
                type="button"
                onClick={() => void handleAddComplaint()}
                disabled={isSubmitting || !newComplaint.trim()}
                className={cn(
                  'px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2',
                  'bg-blue-600 hover:bg-blue-700 text-white',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                <Plus className="w-5 h-5" />
                Add
              </button>
            </div>

            {inputError && (
              <p className={cn('text-xs flex items-center gap-1', isDark ? 'text-red-300' : 'text-red-600')}>
                <AlertCircle className="w-3 h-3" />
                {inputError}
              </p>
            )}
          </div>

          {/* Complaints List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className={cn('text-sm font-medium', colors.text.primary)}>
                Current Complaints ({complaints.length})
              </h3>
              {complaints.length > 0 && (
                <p className={cn('text-xs', colors.text.tertiary)}>
                  Click to edit or remove
                </p>
              )}
            </div>

            {complaints.length === 0 ? (
              <div className={cn('text-center py-12 rounded-lg border-2 border-dashed', colors.border.primary)}>
                <AlertCircle className={cn('w-12 h-12 mx-auto mb-3', colors.text.tertiary)} />
                <p className={cn('text-sm', colors.text.secondary)}>
                  No chief complaints recorded yet
                </p>
                <p className={cn('text-xs mt-1', colors.text.tertiary)}>
                  Add the patient's primary reasons for visiting
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {complaints.map((complaint, index) => (
                  <div
                    key={index}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg border transition-colors',
                      isDark 
                        ? 'bg-gray-900 border-gray-700 hover:border-gray-600' 
                        : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                    )}
                  >
                    <div className={cn(
                      'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold',
                      isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-700'
                    )}>
                      {index + 1}
                    </div>

                    {editingIndex === index ? (
                      <>
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              void handleSaveEdit();
                            } else if (e.key === 'Escape') {
                              handleCancelEdit();
                            }
                          }}
                          autoFocus
                          className={cn(
                            'flex-1 px-3 py-1 rounded border focus:outline-none focus:ring-2 focus:ring-blue-500',
                            isDark 
                              ? 'bg-gray-800 border-gray-600 text-white' 
                              : 'bg-white border-gray-300 text-gray-900'
                          )}
                        />
                        <button
                          type="button"
                          onClick={() => void handleSaveEdit()}
                          disabled={isSubmitting}
                          className={cn(
                            'p-2 rounded-lg transition-colors',
                            isDark 
                              ? 'hover:bg-green-900/30 text-green-400' 
                              : 'hover:bg-green-100 text-green-600'
                          )}
                          title="Save"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          disabled={isSubmitting}
                          className={cn(
                            'p-2 rounded-lg transition-colors',
                            isDark 
                              ? 'hover:bg-gray-700 text-gray-400' 
                              : 'hover:bg-gray-200 text-gray-600'
                          )}
                          title="Cancel"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <p className={cn('flex-1 text-sm', colors.text.primary)}>
                          {complaint}
                        </p>
                        <button
                          type="button"
                          onClick={() => handleStartEdit(index)}
                          disabled={isSubmitting || isEditing}
                          className={cn(
                            'p-2 rounded-lg transition-colors',
                            isDark 
                              ? 'hover:bg-blue-900/30 text-blue-400' 
                              : 'hover:bg-blue-100 text-blue-600',
                            'disabled:opacity-50 disabled:cursor-not-allowed'
                          )}
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleRemoveComplaint(index)}
                          disabled={isSubmitting || isEditing}
                          className={cn(
                            'p-2 rounded-lg transition-colors',
                            isDark 
                              ? 'hover:bg-red-900/30 text-red-400' 
                              : 'hover:bg-red-100 text-red-600',
                            'disabled:opacity-50 disabled:cursor-not-allowed'
                          )}
                          title="Remove"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Info */}
          {complaints.length > 0 && (
            <div className={cn('mt-6 pt-6 border-t', colors.border.primary)}>
              <p className={cn('text-xs text-center', colors.text.tertiary)}>
                ⚠️ Changes are automatically saved. Ensure all complaints are accurately documented.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

PatientComplaints.displayName = 'PatientComplaints';

export default PatientComplaints;