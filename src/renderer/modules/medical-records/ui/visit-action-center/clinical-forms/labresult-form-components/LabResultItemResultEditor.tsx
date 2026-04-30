// lab-results/labresult-form-components/LabResultItemResultEditor.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Loader2,
  Save,
  Sparkles,
  X,
} from 'lucide-react';
import { cn } from '../../../../../../shared/utils/classNameUtils';
import {
  useBulkCreateResults,
  useGetFieldsByTemplate,
  useGetResultsByLabRequestItem,
  useUpdateLabResult,
} from '../../../../api/lab/LabQueries';
import {
  LabRequestItemStatus,
  TemplateFieldDataType,
  type LabTemplateField,
} from '../../../../api/lab/LabTypes';
import type { LabResultEditorModalProps, LabResultFieldDraft } from './labResultForm.types';
import {
  buildDraftsFromFieldsAndResults,
  deriveNumericValue,
  deriveResultFlag,
  extractResultsArray,
  formatReferenceRange,
  hasMeaningfulDraftData,
} from './labResultForm.utils';

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

const getDraftInputValue = (draft: LabResultFieldDraft): string =>
  draft.data_type === TemplateFieldDataType.NUMBER ? draft.numeric_value : draft.value;

const patchDraftValue = (draft: LabResultFieldDraft, nextValue: string): LabResultFieldDraft => {
  if (draft.data_type === TemplateFieldDataType.NUMBER) {
    return {
      ...draft,
      numeric_value: nextValue,
      value: nextValue,
    };
  }

  return {
    ...draft,
    value: nextValue,
  };
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
        <div className={cn('flex items-center justify-between border-b px-5 py-4', colors.border.primary)}>
          <div className="flex items-start gap-3">
            <div className={cn('rounded-xl p-2.5', isDark ? 'bg-blue-950/40' : 'bg-blue-50')}>
              <Sparkles className={cn('h-5 w-5', isDark ? 'text-blue-300' : 'text-blue-600')} />
            </div>

            <div>
              <h3 className={cn('text-base font-semibold', colors.text.primary)}>
                Result Editor — {item.lab_test?.name || 'Lab Test'}
              </h3>
              <p className={cn('mt-1 text-sm', colors.text.secondary)}>
                Record structured laboratory result values for this request item.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={cn('rounded-lg p-2 transition-colors', colors.bg.hover, colors.text.secondary)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <div className="mb-4 grid gap-4 lg:grid-cols-4">
            <div className={cn('rounded-xl border p-3', colors.border.primary, colors.bg.subtle)}>
              <p className={cn('text-[11px] font-semibold uppercase tracking-wide', colors.text.tertiary)}>
                Test Name
              </p>
              <p className={cn('mt-1 text-sm font-semibold', colors.text.primary)}>
                {item.lab_test?.name || 'N/A'}
              </p>
            </div>

            <div className={cn('rounded-xl border p-3', colors.border.primary, colors.bg.subtle)}>
              <p className={cn('text-[11px] font-semibold uppercase tracking-wide', colors.text.tertiary)}>
                Request UUID
              </p>
              <p className={cn('mt-1 text-sm font-semibold break-all', colors.text.primary)}>
                {request.request_uuid}
              </p>
            </div>

            <div className={cn('rounded-xl border p-3', colors.border.primary, colors.bg.subtle)}>
              <p className={cn('text-[11px] font-semibold uppercase tracking-wide', colors.text.tertiary)}>
                Sample Type
              </p>
              <p className={cn('mt-1 text-sm font-semibold', colors.text.primary)}>
                {item.sample_type || 'N/A'}
              </p>
            </div>

            <div className={cn('rounded-xl border p-3', colors.border.primary, colors.bg.subtle)}>
              <p className={cn('text-[11px] font-semibold uppercase tracking-wide', colors.text.tertiary)}>
                Current Status
              </p>
              <p className={cn('mt-1 text-sm font-semibold', colors.text.primary)}>
                {item.status_label || item.status}
              </p>
            </div>
          </div>

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

                const inputValue = getDraftInputValue(draft);

                return (
                  <div
                    key={draft.localId}
                    className={cn('rounded-2xl border p-4', colors.border.primary, colors.bg.subtle)}
                  >
                    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className={cn('text-sm font-semibold', colors.text.primary)}>
                            {draft.field_name}
                          </h4>

                          {draft.is_required && (
                            <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', isDark ? 'bg-blue-950/30 text-blue-300' : 'bg-blue-100 text-blue-700')}>
                              Required
                            </span>
                          )}

                          {draft.is_critical && (
                            <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', isDark ? 'bg-red-950/30 text-red-300' : 'bg-red-100 text-red-700')}>
                              Critical
                            </span>
                          )}

                          {!draft.isNew && (
                            <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', isDark ? 'bg-emerald-950/30 text-emerald-300' : 'bg-emerald-100 text-emerald-700')}>
                              Existing result
                            </span>
                          )}
                        </div>

                        <p className={cn('mt-1 text-xs', colors.text.secondary)}>
                          {draft.field_code || 'No code'} • {draft.data_type || 'text'}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className={cn('text-[11px] font-semibold uppercase tracking-wide', colors.text.tertiary)}>
                          Reference Range
                        </p>
                        <p className={cn('mt-1 text-sm font-semibold', colors.text.primary)}>
                          {formatReferenceRange(draft.reference_min, draft.reference_max, draft.unit)}
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-12">
                      <div className="lg:col-span-3">
                        <label className={cn('mb-1.5 block text-xs font-semibold uppercase tracking-wide', colors.text.secondary)}>
                          Result Value
                        </label>

                        {draft.data_type === TemplateFieldDataType.BOOLEAN ? (
                          <select
                            value={inputValue}
                            disabled={readOnly}
                            onChange={(event) =>
                              handlePatchDraft(draft.localId, (current) =>
                                patchDraftValue(current, event.target.value)
                              )
                            }
                            className={cn(
                              'w-full rounded-lg border px-3 py-2.5 text-sm',
                              colors.bg.input,
                              colors.border.primary,
                              colors.text.primary
                            )}
                          >
                            <option value="">Select value</option>
                            <option value="true">Yes / True</option>
                            <option value="false">No / False</option>
                          </select>
                        ) : draft.data_type === TemplateFieldDataType.SELECT && fieldOptions.length > 0 ? (
                          <select
                            value={inputValue}
                            disabled={readOnly}
                            onChange={(event) =>
                              handlePatchDraft(draft.localId, (current) =>
                                patchDraftValue(current, event.target.value)
                              )
                            }
                            className={cn(
                              'w-full rounded-lg border px-3 py-2.5 text-sm',
                              colors.bg.input,
                              colors.border.primary,
                              colors.text.primary
                            )}
                          >
                            <option value="">Select value</option>
                            {fieldOptions.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        ) : draft.data_type === TemplateFieldDataType.NUMBER ? (
                          <input
                            type="number"
                            step="any"
                            value={draft.numeric_value}
                            disabled={readOnly}
                            onChange={(event) =>
                              handlePatchDraft(draft.localId, (current) =>
                                patchDraftValue(current, event.target.value)
                              )
                            }
                            placeholder="Enter numeric value"
                            className={cn(
                              'w-full rounded-lg border px-3 py-2.5 text-sm',
                              colors.bg.input,
                              colors.border.primary,
                              colors.text.primary
                            )}
                          />
                        ) : (
                          <input
                            type="text"
                            value={draft.value}
                            disabled={readOnly}
                            onChange={(event) =>
                              handlePatchDraft(draft.localId, (current) =>
                                patchDraftValue(current, event.target.value)
                              )
                            }
                            placeholder="Enter result value"
                            className={cn(
                              'w-full rounded-lg border px-3 py-2.5 text-sm',
                              colors.bg.input,
                              colors.border.primary,
                              colors.text.primary
                            )}
                          />
                        )}
                      </div>

                      <div className="lg:col-span-2">
                        <label className={cn('mb-1.5 block text-xs font-semibold uppercase tracking-wide', colors.text.secondary)}>
                          Unit
                        </label>
                        <input
                          type="text"
                          value={draft.unit}
                          disabled={readOnly}
                          onChange={(event) =>
                            handlePatchDraft(draft.localId, (current) => ({
                              ...current,
                              unit: event.target.value,
                            }))
                          }
                          placeholder="Unit"
                          className={cn(
                            'w-full rounded-lg border px-3 py-2.5 text-sm',
                            colors.bg.input,
                            colors.border.primary,
                            colors.text.primary
                          )}
                        />
                      </div>

                      <div className="lg:col-span-2">
                        <label className={cn('mb-1.5 block text-xs font-semibold uppercase tracking-wide', colors.text.secondary)}>
                          Ref Min
                        </label>
                        <input
                          type="number"
                          step="any"
                          value={draft.reference_min}
                          disabled={readOnly}
                          onChange={(event) =>
                            handlePatchDraft(draft.localId, (current) => ({
                              ...current,
                              reference_min: event.target.value,
                            }))
                          }
                          placeholder="Min"
                          className={cn(
                            'w-full rounded-lg border px-3 py-2.5 text-sm',
                            colors.bg.input,
                            colors.border.primary,
                            colors.text.primary
                          )}
                        />
                      </div>

                      <div className="lg:col-span-2">
                        <label className={cn('mb-1.5 block text-xs font-semibold uppercase tracking-wide', colors.text.secondary)}>
                          Ref Max
                        </label>
                        <input
                          type="number"
                          step="any"
                          value={draft.reference_max}
                          disabled={readOnly}
                          onChange={(event) =>
                            handlePatchDraft(draft.localId, (current) => ({
                              ...current,
                              reference_max: event.target.value,
                            }))
                          }
                          placeholder="Max"
                          className={cn(
                            'w-full rounded-lg border px-3 py-2.5 text-sm',
                            colors.bg.input,
                            colors.border.primary,
                            colors.text.primary
                          )}
                        />
                      </div>

                      <div className="lg:col-span-3">
                        <label className={cn('mb-1.5 block text-xs font-semibold uppercase tracking-wide', colors.text.secondary)}>
                          Flag
                        </label>
                        <select
                          value={deriveResultFlag({
                            rawValue: inputValue,
                            dataType: draft.data_type,
                            referenceMin: draft.reference_min,
                            referenceMax: draft.reference_max,
                            currentFlag: draft.flag,
                          })}
                          disabled={readOnly}
                          onChange={(event) =>
                            handlePatchDraft(draft.localId, (current) => ({
                              ...current,
                              flag: event.target.value as LabResultFieldDraft['flag'],
                            }))
                          }
                          className={cn(
                            'w-full rounded-lg border px-3 py-2.5 text-sm',
                            colors.bg.input,
                            colors.border.primary,
                            colors.text.primary
                          )}
                        >
                          <option value="pending">Pending</option>
                          <option value="normal">Normal</option>
                          <option value="low">Low</option>
                          <option value="high">High</option>
                          <option value="abnormal">Abnormal</option>
                          <option value="critical">Critical</option>
                        </select>
                      </div>

                      <div className="lg:col-span-6">
                        <label className={cn('mb-1.5 block text-xs font-semibold uppercase tracking-wide', colors.text.secondary)}>
                          Interpretation
                        </label>
                        <textarea
                          rows={3}
                          value={draft.interpretation}
                          disabled={readOnly}
                          onChange={(event) =>
                            handlePatchDraft(draft.localId, (current) => ({
                              ...current,
                              interpretation: event.target.value,
                            }))
                          }
                          placeholder="Clinical interpretation"
                          className={cn(
                            'w-full rounded-lg border px-3 py-2.5 text-sm resize-y',
                            colors.bg.input,
                            colors.border.primary,
                            colors.text.primary
                          )}
                        />
                      </div>

                      <div className="lg:col-span-6">
                        <label className={cn('mb-1.5 block text-xs font-semibold uppercase tracking-wide', colors.text.secondary)}>
                          Comments
                        </label>
                        <textarea
                          rows={3}
                          value={draft.comments}
                          disabled={readOnly}
                          onChange={(event) =>
                            handlePatchDraft(draft.localId, (current) => ({
                              ...current,
                              comments: event.target.value,
                            }))
                          }
                          placeholder="Additional technical or clinical comments"
                          className={cn(
                            'w-full rounded-lg border px-3 py-2.5 text-sm resize-y',
                            colors.bg.input,
                            colors.border.primary,
                            colors.text.primary
                          )}
                        />
                      </div>
                    </div>
                  </div>
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

        <div className={cn('flex items-center justify-between border-t px-5 py-4', colors.border.primary)}>
          <div className={cn('text-xs', colors.text.secondary)}>
            {readOnly
              ? 'This editor is read-only.'
              : missingRequiredField
              ? 'Required fields must be completed before save.'
              : 'Save results to attach them to this lab request item.'}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className={cn(
                'rounded-lg border px-4 py-2 text-sm font-medium transition-all',
                colors.border.primary,
                colors.bg.hover,
                colors.text.secondary
              )}
            >
              Close
            </button>

            <button
              type="button"
              onClick={() => {
                void handleSave();
              }}
              disabled={readOnly || saving || !hasConfiguredFields}
              className={cn(
                'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-all',
                readOnly || saving || !hasConfiguredFields
                  ? 'cursor-not-allowed bg-gray-400'
                  : 'bg-blue-600 hover:bg-blue-700'
              )}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? 'Saving...' : 'Save Results'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LabResultItemResultEditor;
