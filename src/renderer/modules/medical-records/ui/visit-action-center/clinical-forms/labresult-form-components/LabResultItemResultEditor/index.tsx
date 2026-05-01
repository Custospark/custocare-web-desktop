import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Loader2, Plus } from 'lucide-react';
import { cn } from '../../../../../../../shared/utils/classNameUtils';
import {
  useBulkCreateResults,
  useGetFieldsByTemplate,
  useUpdateLabResult,
} from '../../../../../api/lab/LabQueries';
import {
  LabRequestItemStatus,
  TemplateFieldDataType,
  type LabTemplateField,
} from '../../../../../api/lab/LabTypes';
import type { LabResultEditorModalProps, LabResultFieldDraft } from '../labResultForm.types';
import {
  buildDraftsFromFieldsAndResults,
  deriveNumericValue,
  deriveResultFlag,
  hasMeaningfulDraftData,
} from '../labResultForm.utils';
import { EditorHeader } from './EditorHeader';
import { EditorInfoBar } from './EditorInfoBar';
import { EditorFieldCard } from './EditorFieldCard';
import { EditorFooter } from './EditorFooter';

const getSelectOptions = (field?: LabTemplateField | null): string[] => {
  const raw = field?.metadata;
  if (!raw || typeof raw !== 'object') return [];

  const options =
    (raw as Record<string, unknown>).options ||
    (raw as Record<string, unknown>).choices ||
    null;

  if (!Array.isArray(options)) return [];
  return options.map((option) => String(option));
};

// Create a manual fallback draft when no template fields exist
const createManualFallbackDraft = (existingResults: any[]): LabResultFieldDraft[] => {
  if (existingResults.length > 0) {
    return existingResults.map((result, index) => ({
      localId: result.result_uuid || `manual-${index}`,
      result_uuid: result.result_uuid,
      template_field_id: result.template_field_id,
      field_uuid: result.template_field?.field_uuid || null,
      field_name: result.template_field?.name || 'Result Value',
      field_code: result.template_field?.code || null,
      data_type: result.template_field?.data_type || TemplateFieldDataType.TEXT,
      display_order: result.template_field?.display_order || index + 1,
      is_required: false,
      is_critical: false,
      value: result.value || (result.numeric_value !== null ? String(result.numeric_value) : ''),
      numeric_value: result.numeric_value !== null ? String(result.numeric_value) : '',
      unit: result.unit || result.template_field?.unit || '',
      reference_min: result.reference_min !== null ? String(result.reference_min) : '',
      reference_max: result.reference_max !== null ? String(result.reference_max) : '',
      flag: result.flag,
      interpretation: result.interpretation || '',
      comments: result.comments || '',
      existingResult: result,
      isNew: false,
    }));
  }

  return [
    {
      localId: 'manual-field-1',
      result_uuid: undefined,
      template_field_id: null,
      field_uuid: null,
      field_name: 'Result Value',
      field_code: null,
      data_type: TemplateFieldDataType.TEXT,
      display_order: 1,
      is_required: false,
      is_critical: false,
      value: '',
      numeric_value: '',
      unit: '',
      reference_min: '',
      reference_max: '',
      flag: 'pending' as any,
      interpretation: '',
      comments: '',
      existingResult: undefined,
      isNew: true,
    },
  ];
};

export const LabResultItemResultEditor: React.FC<LabResultEditorModalProps> = ({
  open,
  isDark,
  colors,
  request,
  item,
  staffId,
  requestLocked,
  onClose,
  onSaved,
}) => {
  const [drafts, setDrafts] = useState<LabResultFieldDraft[]>([]);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isManualMode, setIsManualMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const templateUuid = item?.lab_test?.template?.template_uuid || '';
  const hasTemplate = !!templateUuid;
  const hasTemplateWithFields = hasTemplate;

  const fieldsQuery = useGetFieldsByTemplate(templateUuid, {
    enabled: open && hasTemplateWithFields,
  });

  const createResults = useBulkCreateResults();
  const updateResult = useUpdateLabResult();

  const templateFields = useMemo(
    () => (Array.isArray(fieldsQuery.data) ? fieldsQuery.data : []),
    [fieldsQuery.data]
  );

  // Results come directly from the item (already loaded in the request)
  // Use a stable key to track when results actually change
  const existingResults = useMemo(() => item?.results || [], [item?.results]);
  const resultsKey = useMemo(() => 
    existingResults.map(r => `${r.result_uuid}-${r.updated_at}`).join(','),
    [existingResults]
  );

  // Determine if we should use manual mode
  const shouldUseManualMode = useMemo(() => {
    const noTemplateFields = !hasTemplateWithFields || templateFields.length === 0;
    const hasExistingResults = existingResults.length > 0;
    
    return (!hasTemplateWithFields || (noTemplateFields && !hasExistingResults)) || isManualMode;
  }, [hasTemplateWithFields, templateFields.length, existingResults.length, isManualMode]);

  // Reset drafts when modal opens or when results change
  useEffect(() => {
    if (!open || !item) return;
    
    setSaveError(null);
    setIsSaving(false);
    
    const noTemplateFields = !hasTemplateWithFields || templateFields.length === 0;
    const hasExistingResults = existingResults.length > 0;
    
    if (noTemplateFields || (shouldUseManualMode && !hasExistingResults)) {
      setDrafts(createManualFallbackDraft(existingResults));
      setIsManualMode(true);
    } else {
      setDrafts(buildDraftsFromFieldsAndResults(templateFields, existingResults));
      setIsManualMode(false);
    }
  }, [open, item, resultsKey, templateFields, hasTemplateWithFields, shouldUseManualMode]);

  const loading = fieldsQuery.isLoading;
  const saving = createResults.isPending || updateResult.isPending || isSaving;

  const readOnly =
    requestLocked ||
    item?.status === LabRequestItemStatus.CANCELLED ||
    item?.status === LabRequestItemStatus.VERIFIED;

  const hasConfiguredFields = drafts.length > 0;

  const missingRequiredField = drafts.some(
    (draft) => draft.is_required && !hasMeaningfulDraftData(draft)
  );

  const handlePatchDraft = (
    localId: string,
    updater: (draft: LabResultFieldDraft) => LabResultFieldDraft
  ) => {
    setDrafts((prev) =>
      prev.map((draft) => (draft.localId === localId ? updater(draft) : draft))
    );
  };

  const handleAddManualField = () => {
    const newDraft: LabResultFieldDraft = {
      localId: `manual-field-${Date.now()}`,
      result_uuid: undefined,
      template_field_id: null,
      field_uuid: null,
      field_name: `Additional Result ${drafts.length + 1}`,
      field_code: null,
      data_type: TemplateFieldDataType.TEXT,
      display_order: drafts.length + 1,
      is_required: false,
      is_critical: false,
      value: '',
      numeric_value: '',
      unit: '',
      reference_min: '',
      reference_max: '',
      flag: 'pending' as any,
      interpretation: '',
      comments: '',
      existingResult: undefined,
      isNew: true,
    };
    setDrafts((prev) => [...prev, newDraft]);
  };

  const handleSave = async () => {
    if (!item) return;

    setSaveError(null);
    setIsSaving(true);

    try {
      if (!hasConfiguredFields) {
        setSaveError('No result fields available to save.');
        return;
      }

      if (missingRequiredField) {
        setSaveError('Fill all required result fields before saving.');
        return;
      }

      const meaningfulDrafts = drafts.filter(hasMeaningfulDraftData);

      if (!meaningfulDrafts.length) {
        setSaveError('Enter at least one result value before saving.');
        return;
      }

      const getDraftInputValue = (draft: LabResultFieldDraft): string =>
        draft.data_type === TemplateFieldDataType.NUMBER ? draft.numeric_value : draft.value;

      const createPayloads = meaningfulDrafts
        .filter((draft) => draft.isNew && !draft.result_uuid)
        .map((draft) => {
          const rawValue = getDraftInputValue(draft);

          return {
            template_field_id: draft.template_field_id,
            value: rawValue || null,
            unit: draft.unit || null,
            numeric_value: deriveNumericValue(rawValue, draft.data_type),
            flag: deriveResultFlag({
              rawValue,
              dataType: draft.data_type,
              referenceMin: draft.reference_min,
              referenceMax: draft.reference_max,
              currentFlag: draft.flag,
            }),
            reference_min: draft.reference_min ? Number(draft.reference_min) : null,
            reference_max: draft.reference_max ? Number(draft.reference_max) : null,
            interpretation: draft.interpretation || null,
            comments: draft.comments || null,
            recorded_by_staff_id: staffId || null,
            metadata: {
              source: 'lab-result-item-result-editor',
              is_manual_entry: !hasTemplateWithFields,
            },
          };
        });

      const updatePayloads = meaningfulDrafts
        .filter((draft) => !draft.isNew && !!draft.result_uuid)
        .map((draft) => {
          const rawValue = getDraftInputValue(draft);

          return {
            uuid: draft.result_uuid as string,
            data: {
              value: rawValue || null,
              unit: draft.unit || null,
              numeric_value: deriveNumericValue(rawValue, draft.data_type),
              flag: deriveResultFlag({
                rawValue,
                dataType: draft.data_type,
                referenceMin: draft.reference_min,
                referenceMax: draft.reference_max,
                currentFlag: draft.flag,
              }),
              reference_min: draft.reference_min ? Number(draft.reference_min) : null,
              reference_max: draft.reference_max ? Number(draft.reference_max) : null,
              interpretation: draft.interpretation || null,
              comments: draft.comments || null,
              recorded_by_staff_id: staffId || null,
              metadata: {
                source: 'lab-result-item-result-editor',
                is_manual_entry: !hasTemplateWithFields,
              },
            },
          };
        });

      // Execute saves
      if (createPayloads.length) {
        await createResults.mutateAsync({
          itemUuid: item.item_uuid,
          results: createPayloads,
        });
      }

      if (updatePayloads.length) {
        await Promise.all(updatePayloads.map((payload) => updateResult.mutateAsync(payload)));
      }

      // Close modal first, then trigger refresh
      onClose();
      
      // Small delay to ensure modal animation completes before refresh
      setTimeout(() => {
        onSaved();
      }, 100);
      
    } catch (error) {
      console.error('Save error:', error);
      setSaveError('Unable to save result entries right now. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!open || !item) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className={cn(
          'flex w-full max-w-6xl flex-col overflow-hidden rounded-t-2xl border shadow-2xl sm:rounded-2xl',
          colors.border.primary,
          colors.bg.card
        )}
        style={{ maxHeight: '94vh' }}
      >
        <EditorHeader
          isDark={isDark}
          colors={colors}
          testName={item.lab_test?.name || 'Lab Test'}
          onClose={onClose}
        />

        <div className="flex-1 overflow-y-auto p-5">
          <EditorInfoBar
            colors={colors}
            testName={item.lab_test?.name || 'N/A'}
            sampleType={item.sample_type}
            status={item.status_label || item.status}
          />

          {readOnly && (
            <div
              className={cn(
                'mb-4 rounded-xl border px-4 py-3 text-sm',
                isDark ? 'border-amber-800/50 bg-amber-950/30 text-amber-300' : 'border-amber-200 bg-amber-50 text-amber-700'
              )}
            >
              This result editor is currently read-only because the request or item status no longer permits result changes.
            </div>
          )}

          {!readOnly && isManualMode && (
            <div
              className={cn(
                'mb-4 rounded-xl border px-4 py-3 text-sm',
                isDark ? 'border-blue-800/50 bg-blue-950/30 text-blue-300' : 'border-blue-200 bg-blue-50 text-blue-700'
              )}
            >
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Manual Result Entry Mode</p>
                  <p className={cn('text-xs mt-0.5', isDark ? 'text-blue-300/80' : 'text-blue-600')}>
                    This lab test doesn't have a configured template or fields. You can still enter results manually below.
                  </p>
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className={cn('flex items-center justify-center gap-2 py-16 text-sm', colors.text.secondary)}>
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading template fields...
            </div>
          ) : (
            <div className="space-y-4">
              {drafts.map((draft) => {
                const fieldOptions =
                  draft.data_type === TemplateFieldDataType.SELECT && draft.template_field_id
                    ? getSelectOptions(
                        templateFields.find((field) => field.id === draft.template_field_id) || null
                      )
                    : [];

                return (
                  <EditorFieldCard
                    key={draft.localId}
                    isDark={isDark}
                    colors={colors}
                    draft={draft}
                    readOnly={readOnly}
                    fieldOptions={fieldOptions}
                    onPatchDraft={handlePatchDraft}
                  />
                );
              })}

              {!readOnly && isManualMode && (
                <button
                  type="button"
                  onClick={handleAddManualField}
                  className={cn(
                    'cursor-pointer inline-flex items-center gap-2 rounded-lg border border-dashed px-4 py-3 text-sm font-medium transition-all w-full justify-center',
                    colors.border.primary,
                    colors.bg.hover,
                    colors.text.primary,
                    'hover:shadow-sm'
                  )}
                >
                  <Plus className="h-4 w-4" />
                  Add Another Result Field
                </button>
              )}
            </div>
          )}

          {saveError && (
            <div
              className={cn(
                'mt-4 rounded-xl border px-4 py-3 text-sm',
                isDark ? 'border-red-900/40 bg-red-950/30 text-red-300' : 'border-red-200 bg-red-50 text-red-700'
              )}
            >
              {saveError}
            </div>
          )}
        </div>

        <EditorFooter
          colors={colors}
          readOnly={readOnly}
          saving={saving}
          hasConfiguredFields={hasConfiguredFields}
          missingRequiredField={missingRequiredField}
          onClose={onClose}
          onSave={() => void handleSave()}
        />
      </div>
    </div>
  );
};

export default LabResultItemResultEditor;