// lab-results/labresult-form-components/LabResultItemResultEditor/index.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '../../../../../../../shared/utils/classNameUtils';
import {
  useBulkCreateResults,
  useGetFieldsByTemplate,
  useGetResultsByLabRequestItem,
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
  extractResultsArray,
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

  const templateUuid = item?.lab_test?.template?.template_uuid || '';
  const itemUuid = item?.item_uuid || '';

  const fieldsQuery = useGetFieldsByTemplate(templateUuid, {
    enabled: open && !!templateUuid,
  });

  const resultsQuery = useGetResultsByLabRequestItem(itemUuid, {
    enabled: open && !!itemUuid,
  });

  const createResults = useBulkCreateResults();
  const updateResult = useUpdateLabResult();

  const templateFields = useMemo(
    () => (Array.isArray(fieldsQuery.data) ? fieldsQuery.data : []),
    [fieldsQuery.data]
  );

  const existingResults = useMemo(
    () => extractResultsArray(resultsQuery.data),
    [resultsQuery.data]
  );

  useEffect(() => {
    if (!open || !item) return;
    setSaveError(null);
    setDrafts(buildDraftsFromFieldsAndResults(templateFields, existingResults));
  }, [open, item, templateFields, existingResults]);

  const loading = fieldsQuery.isLoading || resultsQuery.isLoading;
  const saving = createResults.isPending || updateResult.isPending;

  const readOnly =
    requestLocked ||
    item?.status === LabRequestItemStatus.CANCELLED ||
    item?.status === LabRequestItemStatus.VERIFIED;

  const hasConfiguredFields = templateFields.length > 0 || existingResults.length > 0;

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

  const handleSave = async () => {
    if (!item) return;

    setSaveError(null);

    if (!hasConfiguredFields) {
      setSaveError('This lab test has no configured template fields.');
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
      .filter((draft) => draft.isNew && !!draft.template_field_id)
      .map((draft) => {
        const rawValue = getDraftInputValue(draft);

        return {
          template_field_id: draft.template_field_id as number,
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
            },
          },
        };
      });

    try {
      if (createPayloads.length) {
        await createResults.mutateAsync({
          itemUuid: item.item_uuid,
          results: createPayloads,
        });
      }

      if (updatePayloads.length) {
        await Promise.all(updatePayloads.map((payload) => updateResult.mutateAsync(payload)));
      }

      onSaved();
    } catch {
      setSaveError('Unable to save result entries right now. Please try again.');
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
            requestUuid={request.request_uuid}
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

          {loading ? (
            <div className={cn('flex items-center justify-center gap-2 py-16 text-sm', colors.text.secondary)}>
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading template fields and item results...
            </div>
          ) : !hasConfiguredFields ? (
            <div
              className={cn(
                'rounded-2xl border border-dashed p-10 text-center',
                colors.border.primary,
                colors.bg.subtle
              )}
            >
              <AlertCircle className={cn('mx-auto mb-3 h-10 w-10', colors.text.tertiary)} />
              <p className={cn('text-base font-semibold', colors.text.primary)}>
                No result fields configured
              </p>
              <p className={cn('mt-2 text-sm', colors.text.secondary)}>
                This lab test template does not expose result fields yet. Configure template fields before entering results.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {drafts.map((draft) => {
                const fieldOptions =
                  draft.data_type === TemplateFieldDataType.SELECT
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