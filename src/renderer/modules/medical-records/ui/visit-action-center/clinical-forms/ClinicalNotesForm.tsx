import React, { useCallback,useMemo, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { cn } from '../../../../../shared/utils/classNameUtils';
import { selectActiveVisitId, selectActiveVisitPatientId } from '../../../../../app/store/slices/visitSlice';
import {
  extractClinicalNoteErrorMessage,
  extractClinicalNoteFieldErrors,
  useCreateClinicalNote,
  useGetActiveVisitClinicalNotes,
  useUpdateClinicalNote,
} from '../../../api/clinical-notes/clinicalNoteQueries';
import type { CreateClinicalNoteRequest } from '../../../api/clinical-notes/clinicalNoteTypes';
import {
  ClinicalNotesEditor,
  ClinicalNotesEmptyState,
  ClinicalNotesHeader,
  ClinicalNotesPreviewModal,
  ClinicalNotesSummaryCard,
} from './clinical-notes-form-components';
import type {
  ClinicalNotesFormData,
  ClinicalNotesMode,
  ClinicalNotesPreviewAction,
} from './clinical-notes-form-components/clinicalNotesForm.types';
import {
  EMPTY_CLINICAL_NOTES_FORM,
  buildCreateClinicalNotePayload,
  buildUpdateClinicalNotePayload,
  extractClinicalNotesFormValues,
  getClinicalNoteUuid,
  getClinicalNotesTheme,
  getClinicalNoteTitle,
  mapApiFieldErrorsToFormErrors,
  pickPrimaryClinicalNote,
} from './clinical-notes-form-components/clinicalNotesForm.utils';

export interface ClinicalNotesFormProps {
  theme?: 'light' | 'dark';
  onSaved?: (noteUuid: string | null) => void;
  onCancel?: () => void;
}

export const ClinicalNotesForm: React.FC<ClinicalNotesFormProps> = ({
  theme = 'light',
  onSaved,
  // onCancel,
}) => {
  const isDark = theme === 'dark';
  const colors = getClinicalNotesTheme(theme);

  const activeVisitId = useSelector(selectActiveVisitId);
  const activePatientId = useSelector(selectActiveVisitPatientId);

  const [mode, setMode] = useState<ClinicalNotesMode>('idle');
  const [formData, setFormData] = useState<ClinicalNotesFormData>(EMPTY_CLINICAL_NOTES_FORM);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof ClinicalNotesFormData, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewAction, setPreviewAction] = useState<ClinicalNotesPreviewAction>('preview');

  const notesQuery = useGetActiveVisitClinicalNotes({
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const visitNotes = useMemo(() => notesQuery.data?.data ?? [], [notesQuery.data]);
  const activeVisitNote = useMemo(() => pickPrimaryClinicalNote(visitNotes), [visitNotes]);
  const hydratedValues = useMemo(
    () => extractClinicalNotesFormValues(activeVisitNote),
    [activeVisitNote]
  );

  // Helper function to refresh notes after mutation
  const refreshNotes = useCallback(() => {
    if (activeVisitId) {
      notesQuery.refetch();
    }
  }, [activeVisitId, notesQuery]);

  useEffect(() => {
    if (mode === 'idle') {
      setFormData(activeVisitNote ? hydratedValues : EMPTY_CLINICAL_NOTES_FORM);
      setFieldErrors({});
      setFormError(null);
    }
  }, [mode, activeVisitNote, hydratedValues]);

  const handleMutationError = useCallback((error: unknown) => {
    const normalizedMessage = extractClinicalNoteErrorMessage(
      error as never,
      'Unable to save clinical notes right now.'
    );
    const apiFieldErrors = extractClinicalNoteFieldErrors(error as never);
    setFormError(normalizedMessage);
    setFieldErrors(mapApiFieldErrorsToFormErrors(apiFieldErrors));
  }, []);

  const createMutation = useCreateClinicalNote({
    onSuccess: (response) => {
      const savedUuid = getClinicalNoteUuid(response.data ?? null);
      // Refresh notes to get the newly created note with all its data
      refreshNotes();
      setMode('idle');
      setFieldErrors({});
      setFormError(null);
      onSaved?.(savedUuid);
    },
    onError: handleMutationError,
  });

  const updateMutation = useUpdateClinicalNote({
    onSuccess: (response) => {
      const savedUuid = getClinicalNoteUuid(response.data ?? null);
      // Refresh notes to get the updated note with latest timestamps and data
      refreshNotes();
      setMode('idle');
      setFieldErrors({});
      setFormError(null);
      onSaved?.(savedUuid);
    },
    onError: handleMutationError,
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const isLoading = notesQuery.isLoading && !!activeVisitId;

  const handleChange = useCallback(
    (field: keyof ClinicalNotesFormData, value: string) => {
      setFormError(null);
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleCreate = useCallback(() => {
    setFormError(null);
    setFieldErrors({});
    setFormData(EMPTY_CLINICAL_NOTES_FORM);
    setMode('create');
  }, []);

  const handleEdit = useCallback(() => {
    setFormError(null);
    setFieldErrors({});
    setFormData(hydratedValues);
    setMode('edit');
  }, [hydratedValues]);

  const handleCancelEdit = useCallback(() => {
    setFormError(null);
    setFieldErrors({});
    setFormData(activeVisitNote ? hydratedValues : EMPTY_CLINICAL_NOTES_FORM);
    setMode('idle');
  }, [activeVisitNote, hydratedValues]);

  const openPreview = useCallback((action: ClinicalNotesPreviewAction = 'preview') => {
    setPreviewAction(action);
    setPreviewOpen(true);
  }, []);

  const closePreview = useCallback(() => {
    setPreviewOpen(false);
    setPreviewAction('preview');
  }, []);

  const handleCreateSubmit = useCallback(() => {
    const payload = buildCreateClinicalNotePayload(formData);
    createMutation.mutate(payload as CreateClinicalNoteRequest);
  }, [createMutation, formData]);

  const handleUpdateSubmit = useCallback(() => {
    const uuid = getClinicalNoteUuid(activeVisitNote);
    if (!uuid) {
      setFormError('This note could not be updated because its identifier is missing.');
      return;
    }
    const payload = buildUpdateClinicalNotePayload(formData);
    updateMutation.mutate({ uuid, data: payload });
  }, [activeVisitNote, formData, updateMutation]);

  const handleSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      setFormError(null);
      setFieldErrors({});

      if (!formData.chiefComplaint.trim()) {
        setFieldErrors({
          chiefComplaint: 'Please enter the main reason for this visit.',
        });
        return;
      }

      if (mode === 'edit' && activeVisitNote) {
        handleUpdateSubmit();
      } else {
        handleCreateSubmit();
      }
    },
    [formData, mode, activeVisitNote, handleCreateSubmit, handleUpdateSubmit]
  );

  const previewValues = mode === 'create' || mode === 'edit' ? formData : hydratedValues;

  return (
    <>
      <div className="space-y-6 px-6 mb-6">
        {/* Clinical Notes Header with Refresh Button */}
        <ClinicalNotesHeader
          isDark={isDark}
          colors={colors}
          hasActiveVisit={!!activeVisitId}
          hasExistingNote={!!activeVisitNote}
          noteCount={visitNotes.length}
          isFetching={notesQuery.isFetching}
          onRefresh={refreshNotes}
        />

        {!activeVisitId && (
          <div
            className={cn(
              'rounded-2xl border p-5',
              colors.border.primary,
              colors.bg.card
            )}
          >
            <div className="flex items-start gap-3">
              <div className={cn('rounded-xl p-2.5', isDark ? 'bg-amber-900/20' : 'bg-amber-50')}>
                <AlertTriangle className={cn('h-5 w-5', isDark ? 'text-amber-300' : 'text-amber-700')} />
              </div>
              <div>
                <h3 className={cn('text-base font-semibold', colors.text.primary)}>
                  No active visit selected
                </h3>
                <p className={cn('mt-1 text-sm', colors.text.secondary)}>
                  Select the current patient visit first to create or update visit-based clinical notes.
                </p>
              </div>
            </div>
          </div>
        )}

     {!!activeVisitId && isLoading && (
      <div className={cn('rounded-2xl border p-6 mb-6', colors.border.primary, colors.bg.card)}>
        <div className="flex items-center gap-3">
          <RefreshCw className={cn('h-5 w-5 animate-spin', colors.text.secondary)} />
          <div>
            <p className={cn('text-sm font-medium', colors.text.primary)}>Loading clinical notes</p>
            <p className={cn('text-sm', colors.text.secondary)}>
              Checking whether this visit already has a saved note.
            </p>
          </div>
        </div>
      </div>
    )}

        {!!activeVisitId && notesQuery.isError && !isLoading && (
          <div className={cn('rounded-2xl border p-5 mb-6', colors.border.primary, colors.bg.card)}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className={cn('rounded-xl p-2.5', isDark ? 'bg-red-900/20' : 'bg-red-50')}>
                  <AlertTriangle className={cn('h-5 w-5', isDark ? 'text-red-300' : 'text-red-700')} />
                </div>
                <div>
                  <h3 className={cn('text-base font-semibold', colors.text.primary)}>
                    Unable to load clinical notes
                  </h3>
                  <p className={cn('mt-1 text-sm', colors.text.secondary)}>
                    {extractClinicalNoteErrorMessage(
                      notesQuery.error as never,
                      'Something went wrong while loading this visit note.'
                    )}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => notesQuery.refetch()}
                className={cn(
                  'inline-flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all',
                  'bg-blue-600 text-white hover:bg-blue-700'
                )}
              >
                <RefreshCw className="h-4 w-4" />
                Retry
              </button>
            </div>
          </div>
        )}

        {!!activeVisitId && !isLoading && !notesQuery.isError && mode === 'idle' && activeVisitNote && (
          <ClinicalNotesSummaryCard
            isDark={isDark}
            colors={colors}
            note={activeVisitNote}
            values={hydratedValues}
            noteTitle={getClinicalNoteTitle(activeVisitNote, hydratedValues)}
            onEdit={handleEdit}
            onPreview={() => openPreview('preview')}
            onPrint={() => openPreview('print')}
            onDownload={() => openPreview('download')}
          />
        )}

        {!!activeVisitId && !isLoading && !notesQuery.isError && mode === 'idle' && !activeVisitNote && (
          <ClinicalNotesEmptyState
            isDark={isDark}
            colors={colors}
            patientId={activePatientId ?? null}
            onCreate={handleCreate}
          />
        )}

        {!!activeVisitId && !isLoading && !notesQuery.isError && (mode === 'create' || mode === 'edit') && (
          <ClinicalNotesEditor
            isDark={isDark}
            colors={colors}
            mode={mode}
            formData={formData}
            fieldErrors={fieldErrors}
            formError={formError}
            isSubmitting={isSubmitting}
            onChange={handleChange}
            onCancel={handleCancelEdit}
            onPreview={() => openPreview('preview')}
            onSubmit={handleSubmit}
          />
        )}
      </div>

      <ClinicalNotesPreviewModal
        open={previewOpen}
        onClose={closePreview}
        note={activeVisitNote}
        values={previewValues}
        noteTitle={getClinicalNoteTitle(activeVisitNote, previewValues)}
        initialAction={previewAction}
      />
    </>
  );
};

export type { ClinicalNotesFormData };
export default ClinicalNotesForm;