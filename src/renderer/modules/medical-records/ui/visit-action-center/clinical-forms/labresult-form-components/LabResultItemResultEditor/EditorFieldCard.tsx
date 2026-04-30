// lab-results/labresult-form-components/LabResultItemResultEditor/EditorFieldCard.tsx
import React from 'react';
import { cn } from '../../../../../../../shared/utils/classNameUtils';
import type { ColorTokens } from '../labResultForm.types';
import type { LabResultFieldDraft } from '../labResultForm.types';
import { formatReferenceRange, deriveResultFlag } from '../labResultForm.utils';
import { TemplateFieldDataType } from '../../../../../api/lab/LabTypes';

interface EditorFieldCardProps {
  isDark: boolean;
  colors: ColorTokens;
  draft: LabResultFieldDraft;
  readOnly: boolean;
  fieldOptions: string[];
  onPatchDraft: (localId: string, updater: (draft: LabResultFieldDraft) => LabResultFieldDraft) => void;
}

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

export const EditorFieldCard: React.FC<EditorFieldCardProps> = ({
  isDark,
  colors,
  draft,
  readOnly,
  fieldOptions,
  onPatchDraft,
}) => {
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
                onPatchDraft(draft.localId, (current) =>
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
                onPatchDraft(draft.localId, (current) =>
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
                onPatchDraft(draft.localId, (current) =>
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
                onPatchDraft(draft.localId, (current) =>
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
              onPatchDraft(draft.localId, (current) => ({
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
              onPatchDraft(draft.localId, (current) => ({
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
              onPatchDraft(draft.localId, (current) => ({
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
              onPatchDraft(draft.localId, (current) => ({
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
              onPatchDraft(draft.localId, (current) => ({
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
              onPatchDraft(draft.localId, (current) => ({
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
};