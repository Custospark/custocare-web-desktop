/**
 * ============================================================================
 * PATIENT COMPLAINTS COMPONENT
 * ============================================================================
 * 
 * A production-ready component for capturing and managing patient chief complaints.
 * Features real backend integration with optimistic updates.
 * Handles single chief complaint only.
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { 
  Edit2, 
  X, 
  Plus, 
  AlertCircle, 
  CheckCircle, 
  Loader2,
  MessageSquare,
  ClipboardList,
  Trash2
} from 'lucide-react';
import { useSelector } from 'react-redux';

// Hooks and utilities
import { useToast } from '../../../../app/store/contexts/toast/useToast';
import { cn } from '../../../../shared/utils/classNameUtils';
import LoadingSkeleton from '../../../../shared/components/Loading/LoadingSkeletons';
import { useConfirm } from '../../../../shared/components/Feedback/ConfirmDialog/ConfirmContext';

// Redux selectors
import { 
  selectActiveVisitUuid,
  selectActivePatient,
  selectActiveVisitInfo,
  selectVisitContext
} from '../../../../app/store/slices/visitSlice';

// API hooks - Using the provided useUpdateVisit hook and adding useGetVisitByUUID
import { 
  useUpdateVisit,
  useGetVisitByUUID
} from '../../../pharmacy/api/dispensing/visit-queue/useVisitQueries';
import type { 
  VisitResponse,
  ApiErrorResponse,
  UpdateVisitRequest,
} from '../../../pharmacy/api/dispensing/visit-queue/visitTypes';
import type { AxiosError } from 'axios';

/* -------------------------------------------------------------------------- */
/*                                TYPE DEFINITIONS                            */
/* -------------------------------------------------------------------------- */

interface PatientComplaintsProps {
  theme: 'light' | 'dark';
  className?: string;
  onComplaintsUpdated?: (complaints: string[]) => void | Promise<void>;
  readOnly?: boolean;
  compact?: boolean;
  // Optional: if not using active visit from Redux
  visitUuid?: string;
}

interface ComplaintDisplayProps {
  theme: 'light' | 'dark';
  complaint: string;
  isEditing: boolean;
  isSaving: boolean;
  onEdit: () => void;
  onSave: (text: string) => void;
  onCancel: () => void;
  onDelete: () => void;
  readOnly?: boolean;
}

interface NewComplaintFormProps {
  theme: 'light' | 'dark';
  onSubmit: (text: string) => void;
  onCancel: () => void;
  isLoading?: boolean;
  placeholder?: string;
}

/* -------------------------------------------------------------------------- */
/*                               SUB-COMPONENTS                               */
/* -------------------------------------------------------------------------- */

/**
 * Complaint display component - shows single complaint with edit/delete options
 */
const ComplaintDisplay: React.FC<ComplaintDisplayProps> = React.memo(({
  theme,
  complaint,
  isEditing,
  isSaving,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  readOnly = false
}) => {
  const isDark = theme === 'dark';
  const [editText, setEditText] = useState(complaint);
  
  const colors = useMemo(() => ({
    bg: isDark ? 'bg-gray-800/50' : 'bg-gray-50',
    border: isDark ? 'border-gray-700' : 'border-gray-200',
    text: isDark ? 'text-gray-100' : 'text-gray-900',
    textSecondary: isDark ? 'text-gray-400' : 'text-gray-600',
    hoverBg: isDark ? 'hover:bg-gray-700/50' : 'hover:bg-gray-100',
    accent: isDark ? 'text-cyan-400' : 'text-blue-600',
    accentBg: isDark ? 'bg-cyan-900/20' : 'bg-cyan-50',
    danger: isDark ? 'text-red-400' : 'text-red-600',
    dangerBg: isDark ? 'bg-red-900/20' : 'bg-red-50',
    success: isDark ? 'text-blue-400' : 'text-blue-600'
  }), [isDark]);

  const handleSave = useCallback(() => {
    if (editText.trim() && !isSaving) {
      onSave(editText.trim());
    }
  }, [editText, onSave, isSaving]);

  const handleCancel = useCallback(() => {
    setEditText(complaint);
    onCancel();
  }, [complaint, onCancel]);

useEffect(() => {
  if (isEditing) {
    const timer = setTimeout(() => {
      setEditText(complaint);
    }, 0);
    
    return () => clearTimeout(timer);
  }
}, [isEditing, complaint]);

  if (isEditing) {
    return (
      <div className={cn('space-y-4', colors.bg, colors.border, 'p-4 rounded-lg border')}>
        <div>
          <label className={cn('block text-sm font-medium mb-2', colors.text)}>
            Edit Chief Complaint
          </label>
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className={cn(
              'w-full px-3 py-2 rounded-lg border resize-none min-h-[120px]',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors cursor-text',
              isDark 
                ? 'bg-gray-900 border-gray-600 text-white placeholder-gray-500 hover:border-gray-500' 
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 hover:border-gray-400'
            )}
            placeholder="Describe the chief complaint in detail..."
            autoFocus
            disabled={readOnly || isSaving}
            rows={4}
          />
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={handleCancel}
            disabled={readOnly || isSaving}
            className={cn(
              'px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer',
              'focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-1',
              isDark ? 'focus:ring-offset-gray-800' : 'focus:ring-offset-white',
              isDark 
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' 
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700',
              (readOnly || isSaving) && 'opacity-50 cursor-not-allowed'
            )}
            aria-label="Cancel edit"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!editText.trim() || readOnly || isSaving}
            className={cn(
              'px-4 py-2 rounded-lg font-medium transition-all duration-200 cursor-pointer',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1',
              isDark ? 'focus:ring-offset-gray-800' : 'focus:ring-offset-white',
              editText.trim() && !readOnly && !isSaving
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed',
              readOnly && 'opacity-50',
              isSaving && 'opacity-70 cursor-wait'
            )}
            aria-label="Save complaint"
          >
            {isSaving ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </span>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      'p-4 rounded-lg border transition-all duration-200',
      colors.bg, colors.border,
      !readOnly && colors.hoverBg
    )}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* <div className="flex items-center gap-2 mb-2">
            <MessageSquare className={cn('w-5 h-5', colors.textSecondary)} />
            <span className={cn('text-sm font-semibold', colors.text)}>
              Chief Complaint
            </span>
          </div> */}
          <p className={cn('text-sm leading-relaxed', colors.text)}>{complaint}</p>
        </div>
     {!readOnly && (
      <div className="flex gap-2 ml-4">
        <button
          type="button"
          onClick={onEdit}
          disabled={isSaving}
          className={cn(
            'p-2 rounded-lg transition-all duration-200 cursor-pointer group',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1',
            isDark ? 'focus:ring-offset-gray-800' : 'focus:ring-offset-white',
            isDark 
              ? 'bg-gray-800 hover:bg-blue-600 text-gray-400 hover:text-white' 
              : 'bg-white hover:bg-blue-600 text-gray-600 hover:text-white shadow-sm hover:shadow-md',
            isSaving && 'opacity-50 cursor-not-allowed pointer-events-none'
          )}
          aria-label="Edit complaint"
          title="Edit complaint"
        >
          <Edit2 className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
        </button>
        
        <button
          type="button"
          onClick={onDelete}
          disabled={isSaving}
          className={cn(
            'p-2 rounded-lg transition-all duration-200 cursor-pointer group',
            'focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1',
            isDark ? 'focus:ring-offset-gray-800' : 'focus:ring-offset-white',
            isDark 
              ? 'bg-gray-800 hover:bg-red-600 text-gray-400 hover:text-white' 
              : 'bg-white hover:bg-red-600 text-gray-600 hover:text-white shadow-sm hover:shadow-md',
            isSaving && 'opacity-50 cursor-not-allowed pointer-events-none'
          )}
          aria-label="Delete complaint"
          title="Delete complaint"
        >
          <Trash2 className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
        </button>
      </div>
    )}
      </div>
    </div>
  );
});

ComplaintDisplay.displayName = 'ComplaintDisplay';

/**
 * New complaint form component
 */
const NewComplaintForm: React.FC<NewComplaintFormProps> = React.memo(({
  theme,
  onSubmit,
  onCancel,
  isLoading = false,
  placeholder = "Enter the patient's chief complaint or reason for visit..."
}) => {
  const isDark = theme === 'dark';
  const [text, setText] = useState('');
  
  const colors = useMemo(() => ({
    bg: isDark ? 'bg-gray-800' : 'bg-gray-50',
    border: isDark ? 'border-gray-700' : 'border-gray-200',
    text: isDark ? 'text-white' : 'text-gray-900',
    placeholder: isDark ? 'placeholder-gray-500' : 'placeholder-gray-400',
    accent: isDark ? 'border-cyan-700' : 'border-cyan-200',
    accentBg: isDark ? 'bg-cyan-900/10' : 'bg-cyan-50'
  }), [isDark]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim() && !isLoading) {
      onSubmit(text.trim());
      setText('');
    }
  }, [text, isLoading, onSubmit]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit(e);
    }
  }, [handleSubmit]);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className={cn('block text-sm font-medium mb-2', colors.text)}>
          Chief Complaint
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn(
            'w-full px-3 py-3 rounded-lg border resize-none min-h-[120px]',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors cursor-text',
            colors.bg, colors.border, colors.text, colors.placeholder,
            text.trim() && colors.accent
          )}
          disabled={isLoading}
          rows={4}
        />
        {text.trim() && (
          <div className="mt-2 text-right">
            <div className={cn(
              'text-xs px-2 py-1 rounded inline-block',
              isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-600'
            )}>
              Press ⌘⏎ to save
            </div>
          </div>
        )}
      </div>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className={cn(
            'px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer',
            'focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2',
            isDark ? 'focus:ring-offset-gray-800' : 'focus:ring-offset-white',
            isDark 
              ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' 
              : 'bg-gray-200 hover:bg-gray-300 text-gray-700',
            isLoading && 'opacity-50 cursor-not-allowed'
          )}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!text.trim() || isLoading}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 cursor-pointer',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
            isDark ? 'focus:ring-offset-gray-800' : 'focus:ring-offset-white',
            text.trim() && !isLoading
              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed',
            isLoading && 'opacity-70 cursor-wait'
          )}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Adding...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              Add Complaint
            </>
          )}
        </button>
      </div>
    </form>
  );
});

NewComplaintForm.displayName = 'NewComplaintForm';

/* -------------------------------------------------------------------------- */
/*                         MAIN COMPONENT IMPLEMENTATION                      */
/* -------------------------------------------------------------------------- */

const PatientComplaints: React.FC<PatientComplaintsProps> = ({
  theme,
  className,
  onComplaintsUpdated,
  readOnly = false,
  compact = false,
  visitUuid: propVisitUuid,
}) => {
  const isDark = theme === 'dark';
  const { showToast } = useToast();
  const { confirm } = useConfirm();

  // Redux selectors for visit data
  const reduxVisitUuid = useSelector(selectActiveVisitUuid);
  const activePatient = useSelector(selectActivePatient);
  const visitInfo = useSelector(selectActiveVisitInfo);
  const visitContext = useSelector(selectVisitContext);

  // Use prop visitUuid if provided, otherwise use Redux
  const visitUuid = propVisitUuid || reduxVisitUuid;

  // Fetch visit data from backend
  const { 
    data: visitData,
    isLoading: isLoadingVisit,
    error: visitError,
    refetch: refetchVisit 
  } = useGetVisitByUUID(visitUuid || '', {
    enabled: !!visitUuid,
    staleTime: 10000,
  });

  // Extract chief complaint from visit data
  const chiefComplaint = useMemo(() => {
    if (!visitData?.data?.chief_complaints) return '';
    // Handle single complaint - take the first one if array
    const complaints = visitData.data.chief_complaints;
    if (Array.isArray(complaints) && complaints.length > 0) {
      return complaints[0];
    }
    return '';
  }, [visitData]);

  // Local state
  const [isEditing, setIsEditing] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [optimisticComplaint, setOptimisticComplaint] = useState<string | null>(null);

  // Use the update visit mutation with proper optimistic updates
  const updateVisitMutation = useUpdateVisit({
    onSuccess: (data: VisitResponse) => {
      const updatedComplaints = data.data.chief_complaints || [];
    
      
      setOptimisticComplaint(null);
      setError(null);
      setIsEditing(false);
      setShowNewForm(false);
      
      if (onComplaintsUpdated) {
        onComplaintsUpdated(updatedComplaints);
      }
            refetchVisit(); // Refetch to ensure data is fresh
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      // Revert optimistic update on error
      setOptimisticComplaint(null);
      
      // Extract meaningful error message
      let errorMessage = 'Failed to update complaint';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.errors) {
        // Handle validation errors
        const errors = error.response.data.errors;
        const firstError = Object.values(errors)[0];
        if (Array.isArray(firstError) && firstError[0]) {
          errorMessage = firstError[0];
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      showToast('error', errorMessage, 5000);
    },
  });

  // Display complaint with optimistic update
  const displayComplaint = optimisticComplaint || chiefComplaint;

  const colors = useMemo(() => ({
    bg: isDark ? 'bg-gray-900' : 'bg-white',
    border: isDark ? 'border-gray-800' : 'border-gray-200',
    text: {
      primary: isDark ? 'text-white' : 'text-gray-900',
      secondary: isDark ? 'text-gray-400' : 'text-gray-600',
      tertiary: isDark ? 'text-gray-500' : 'text-gray-500'
    },
    accent: {
      bg: isDark ? 'bg-blue-900/20' : 'bg-blue-50',
      text: isDark ? 'text-blue-300' : 'text-blue-600',
      border: isDark ? 'border-blue-800' : 'border-blue-200'
    },
    success: {
      bg: isDark ? 'bg-blue-900/20' : 'bg-blue-50',
      text: isDark ? 'text-blue-300' : 'text-blue-600'
    },
    warning: {
      bg: isDark ? 'bg-yellow-900/20' : 'bg-yellow-50',
      text: isDark ? 'text-yellow-300' : 'text-yellow-600'
    },
    error: {
      bg: isDark ? 'bg-red-900/20' : 'bg-red-50',
      text: isDark ? 'text-red-300' : 'text-red-600',
      border: isDark ? 'border-red-800' : 'border-red-200'
    }
  }), [isDark]);

  const handleAddComplaint = useCallback(async (text: string) => {
    if (!visitUuid || !text.trim() || updateVisitMutation.isPending) return;

    // Optimistic update
    setOptimisticComplaint(text);
    setShowNewForm(false);
    
    try {
      await updateVisitMutation.mutateAsync({
        uuid: visitUuid,
        data: { 
          chief_complaints: [text], // Send as array with single element
          updated_by_staff_id: visitContext.staffId || undefined
        } as UpdateVisitRequest
      });
    } catch (error) {
      // Error handling is done in mutation callbacks
      console.error('Failed to add complaint:', error);
    }
  }, [updateVisitMutation, visitUuid, visitContext.staffId]);

  const handleEditComplaint = useCallback(async (text: string) => {
    if (!visitUuid || !text.trim() || updateVisitMutation.isPending) return;

    // Optimistic update
    setOptimisticComplaint(text);
    setIsEditing(false);
    
    try {
      await updateVisitMutation.mutateAsync({
        uuid: visitUuid,
        data: { 
          chief_complaints: [text], // Send as array with single element
          updated_by_staff_id: visitContext.staffId || undefined
        } as UpdateVisitRequest
      });
    } catch (error) {
      // Error handling is done in mutation callbacks
      console.error('Failed to edit complaint:', error);
    }
  }, [updateVisitMutation, visitUuid, visitContext.staffId]);

  const handleDeleteComplaint = useCallback(async () => {
    if (!visitUuid || updateVisitMutation.isPending) return;

    // Confirm deletion
    const ok = await confirm({
      title: 'Delete Chief Complaint',
      message: 'Are you sure you want to delete this chief complaint? This action cannot be undone.',
      confirmText: 'Yes, Delete',
      cancelText: 'Cancel',
      variant: 'danger',
      theme,
    });

    if (!ok) return;

    // Optimistic update - clear complaint
    setOptimisticComplaint('');
    
    try {
      await updateVisitMutation.mutateAsync({
        uuid: visitUuid,
        data: { 
          chief_complaints: [], // Empty array to clear complaint
          updated_by_staff_id: visitContext.staffId || undefined
        } as UpdateVisitRequest
      });
    } catch (error) {
      // Error handling is done in mutation callbacks
      console.error('Failed to delete complaint:', error);
    }
  }, [confirm, updateVisitMutation, visitUuid, visitContext.staffId, theme]);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
  }, []);

  const handleStartEdit = useCallback(() => {
    setIsEditing(true);
  }, []);

  const handleCancelNew = useCallback(() => {
    setShowNewForm(false);
  }, []);

  // Loading state
  const isLoading = isLoadingVisit || (updateVisitMutation.isPending && !optimisticComplaint);

  useEffect(() => {
  if (visitError) {
    const errorMessage = (visitError as AxiosError<ApiErrorResponse>)?.response?.data?.message || 
                        'Failed to load visit data';
    
    // Make it asynchronous
    const timer = setTimeout(() => {
      setError(errorMessage);
    }, 0);
    
    return () => clearTimeout(timer);
  }
}, [visitError]);

  // No active visit
  if (!visitUuid) {
    return (
      <div className={cn('rounded-xl border p-8 text-center', colors.bg, colors.border)}>
        <ClipboardList className={cn('w-16 h-16 mx-auto mb-4', colors.text.secondary)} />
        <h3 className={cn('text-xl font-bold mb-2', colors.text.primary)}>
          No Active Visit Selected
        </h3>
        <p className={cn('max-w-md mx-auto mb-6', colors.text.secondary)}>
          Please select a patient visit from the queue to view and manage chief complaints.
        </p>
        <div className={cn('inline-flex items-center gap-2 px-4 py-2 rounded-lg cursor-default', 
          isDark ? 'bg-gray-800' : 'bg-gray-100'
        )}>
          <MessageSquare className={cn('w-4 h-4', colors.text.secondary)} />
          <span className={colors.text.secondary}>Select a visit to begin</span>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoadingVisit) {
    return (
      <div className={className}>
        <LoadingSkeleton 
          variant="detail"
          theme={theme}
          message="Loading patient complaint..."
        />
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header Card */}
      <div className={cn('rounded-xl border', colors.bg, colors.border, 'shadow-sm')}>
        <div className="p-6 border-b" style={{ borderColor: colors.border }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn('p-2.5 rounded-xl', colors.accent.bg)}>
                <MessageSquare className={cn('w-6 h-6', colors.accent.text)} />
              </div>
              <div>
                <h2 className={cn('text-xl font-bold', colors.text.primary)}>
                  Primary Reason for Visit
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <p className={cn('text-sm', colors.text.secondary)}>
                    {activePatient?.name || visitInfo?.patientName || 'Patient Name Not Available'}
                  </p>
                  <span className={cn('text-xs px-2 py-0.5 rounded cursor-default', 
                    isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'
                  )}>
                    {visitInfo?.patientNumber || 'N/A'}
                  </span>
                </div>
              </div>
            </div>
            
            {!readOnly && !showNewForm && !displayComplaint && (
              <button
                type="button"
                onClick={() => setShowNewForm(true)}
                disabled={updateVisitMutation.isPending}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 cursor-pointer',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                  isDark ? 'focus:ring-offset-gray-900' : 'focus:ring-offset-white',
                  isDark 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow',
                  updateVisitMutation.isPending && 'opacity-50 cursor-not-allowed'
                )}
              >
                <Plus className="w-4 h-4" />
                Add Complaint
              </button>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6">
          {/* Error Display */}
          {error && (
            <div className={cn(
              'rounded-lg border p-4 mb-6 flex gap-3 items-start animate-in fade-in',
              colors.error.bg, colors.error.border
            )}>
              <AlertCircle className={cn('w-5 h-5 flex-shrink-0 mt-0.5', colors.error.text)} />
              <div className="flex-1">
                <p className={cn('text-sm font-medium mb-1', colors.error.text)}>
                  {visitError ? 'Load Failed' : 'Update Failed'}
                </p>
                <p className={cn('text-sm', colors.error.text)}>
                  {error}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setError(null)}
                className={cn(
                  'p-1 rounded-lg transition-colors cursor-pointer',
                  isDark 
                    ? 'hover:bg-red-800/30 text-red-400' 
                    : 'hover:bg-red-100 text-red-600'
                )}
                aria-label="Dismiss error"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Global Loading State */}
          {isLoading && (
            <div className="mb-6">
              <div className="flex items-center justify-center gap-3 p-4 rounded-lg bg-gradient-to-r from-blue-500/10 to-cyan-500/10">
                <Loader2 className={cn('w-5 h-5 animate-spin', colors.accent.text)} />
                <span className={cn('text-sm font-medium', colors.accent.text)}>
                  {updateVisitMutation.isPending ? 'Updating complaint...' : 'Loading...'}
                </span>
              </div>
            </div>
          )}

          {/* Empty State - No complaint recorded */}
          {!displayComplaint && !showNewForm && !isLoading && (
            <div className={cn(
              'rounded-xl border-2 border-dashed p-8 text-center transition-colors',
              colors.border,
              'hover:border-blue-400/50'
            )}>
              <MessageSquare className={cn('w-16 h-16 mx-auto mb-4 opacity-50', colors.text.secondary)} />
              <h3 className={cn('text-lg font-semibold mb-2', colors.text.primary)}>
                No Complaint Recorded
              </h3>
              <p className={cn('max-w-md mx-auto mb-6', colors.text.secondary)}>
                {readOnly 
                  ? "No chief complaint has been recorded for this visit."
                  : "Document the patient's primary reason for visit or chief complaint."
                }
              </p>
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => setShowNewForm(true)}
                  className={cn(
                    'inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all duration-200 cursor-pointer',
                    'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                    isDark ? 'focus:ring-offset-gray-900' : 'focus:ring-offset-white',
                    isDark 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow' 
                      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow'
                  )}
                >
                  <Plus className="w-4 h-4" />
                  Add Complaint
                </button>
              )}
            </div>
          )}

          {/* Existing Complaint Display */}
          {displayComplaint && !showNewForm && (
            <ComplaintDisplay
              theme={theme}
              complaint={displayComplaint}
              isEditing={isEditing}
              isSaving={updateVisitMutation.isPending && !!optimisticComplaint}
              onEdit={handleStartEdit}
              onSave={handleEditComplaint}
              onCancel={handleCancelEdit}
              onDelete={handleDeleteComplaint}
              readOnly={readOnly}
            />
          )}

          {/* New Complaint Form */}
          {showNewForm && (
            <div className={cn(
              'mt-6 p-4 rounded-xl border animate-in slide-in-from-bottom-4',
              colors.accent.bg, colors.accent.border
            )}>
              <div className="flex items-center gap-2 mb-3">
                <Plus className={cn('w-4 h-4', colors.accent.text)} />
                <h4 className={cn('text-sm font-semibold', colors.accent.text)}>
                  Add New Complaint
                </h4>
              </div>
              <NewComplaintForm
                theme={theme}
                onSubmit={handleAddComplaint}
                onCancel={handleCancelNew}
                isLoading={updateVisitMutation.isPending}
                placeholder="Describe the patient's chief complaint in detail. Include duration, severity, and any associated symptoms..."
              />
            </div>
          )}
        </div>
      </div>

      {/* Success State Indicator */}
      {updateVisitMutation.isSuccess && !updateVisitMutation.isPending && (
        <div className={cn(
          'rounded-lg border p-4 flex items-center gap-3 animate-in fade-in',
          colors.success.bg, colors.success.bg
        )}>
          <CheckCircle className={cn('w-5 h-5 flex-shrink-0', colors.success.text)} />
          <div className="flex-1">
            <p className={cn('text-sm font-medium', colors.success.text)}>
              Complaint updated successfully
            </p>
            <p className={cn('text-xs mt-1', colors.success.text)}>
              Changes have been saved to the patient's visit record.
            </p>
          </div>
        </div>
      )}

      {/* Additional Guidelines (Optional) */}
      {!compact && !readOnly && (
        <div className={cn('rounded-xl border p-5', colors.bg, colors.border)}>
          <h4 className={cn('font-semibold mb-3 flex items-center gap-2 cursor-default', colors.text.primary)}>
            <AlertCircle className="w-4 h-4" />
            Documentation Guidelines
          </h4>
          <ul className={cn('space-y-2 text-sm cursor-default', colors.text.secondary)}>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
              <span>Use the patient's own words when possible</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
              <span>Be specific about onset, duration, and location</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
              <span>Document severity using pain scales when applicable</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
              <span>Note aggravating/relieving factors and associated symptoms</span>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

PatientComplaints.displayName = 'PatientComplaints';

export default PatientComplaints;