import {
  CheckCircle2,
  Clock3,
  FileText,
  Pencil,
  Pill,
  Route as RouteIcon,
  ShieldAlert,
  Trash2,
} from 'lucide-react';
import { cn } from '../../../../../../shared/utils/classNameUtils';
import type { PrescriptionItem } from '../../../../api/prescription-items/PrescriptionItemsTypes';
import {
  formatDosage,
  formatDuration,
  getDosageFormIcon,
} from '../../../../api/prescription-items/PrescriptionItemsTypes';
import type { ColorTokens } from './prescriptionForm.types';

interface PrescriptionMedicationsDataTableProps {
  isDark: boolean;
  colors: ColorTokens;
  medications: PrescriptionItem[];
  onEditMedication: (item: PrescriptionItem) => void;
  onDeleteMedication: (item: PrescriptionItem) => void;
}

export function PrescriptionMedicationsDataTable({
  isDark,
  colors,
  medications,
  onEditMedication,
  onDeleteMedication,
}: PrescriptionMedicationsDataTableProps) {
  const tableHeaderClass = cn(
    'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide',
    isDark ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-700'
  );

  const rowClass = cn(
    'border-b align-top transition-colors',
    colors.border.primary,
    isDark ? 'hover:bg-slate-800/60' : 'hover:bg-slate-50'
  );

  const badgeClass = cn(
    'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
    isDark ? 'bg-slate-700 text-slate-100' : 'bg-slate-200 text-slate-800'
  );

  const cardLabelClass = cn(
    'text-xs font-semibold uppercase tracking-wide',
    isDark ? 'text-slate-300' : 'text-slate-600'
  );

  if (medications.length === 0) {
    return (
      <div
        className={cn(
          'rounded-xl border border-dashed p-8 text-center',
          colors.border.primary,
          colors.bg.subtle
        )}
      >
        <Pill className={cn('mx-auto mb-3 h-10 w-10', colors.text.tertiary)} />
        <p className={cn('text-sm font-medium', colors.text.primary)}>
          No medications added yet
        </p>
        <p className={cn('mt-1 text-sm', colors.text.secondary)}>
          Add the prescribed medications to complete this prescription.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[980px] border-collapse">
          <thead>
            <tr className={cn('border-b', colors.border.primary)}>
              <th className={tableHeaderClass}>Medication</th>
              <th className={tableHeaderClass}>Dose / Form</th>
              <th className={tableHeaderClass}>Frequency / Duration</th>
              <th className={tableHeaderClass}>Route</th>
              <th className={tableHeaderClass}>Refills / Substitution</th>
              <th className={tableHeaderClass}>Clinical Instructions</th>
              <th className={cn(tableHeaderClass, 'text-center')}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {medications.map((med) => (
              <tr key={med.id} className={rowClass}>
                <td className="px-4 py-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5 text-lg" aria-hidden="true">
                        {getDosageFormIcon(med.dosage_form)}
                      </span>

                      <div className="min-w-0">
                        <div className={cn('font-semibold', colors.text.primary)}>
                          {med.medication_name}
                        </div>

                        <div className="mt-1 flex flex-wrap gap-1.5">
                          {med.strength && <span className={badgeClass}>{med.strength}</span>}
                          {med.brand_name && <span className={badgeClass}>{med.brand_name}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                </td>

                <td className="px-4 py-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Pill
                        className={cn(
                          'h-4 w-4 flex-shrink-0',
                          isDark ? 'text-emerald-300' : 'text-emerald-700'
                        )}
                      />
                      <span className={cn('text-sm font-medium', colors.text.primary)}>
                        {formatDosage(med.dosage_quantity, med.dosage_unit)}
                      </span>
                    </div>

                    {med.dosage_form && (
                      <div className={cn('text-sm', colors.text.secondary)}>
                        Form: {med.dosage_form}
                      </div>
                    )}
                  </div>
                </td>

                <td className="px-4 py-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Clock3
                        className={cn(
                          'h-4 w-4 flex-shrink-0',
                          isDark ? 'text-amber-300' : 'text-amber-700'
                        )}
                      />
                      <span className={cn('text-sm font-medium', colors.text.primary)}>
                        {med.frequency || '—'}
                      </span>
                    </div>

                    <div className={cn('text-sm', colors.text.secondary)}>
                      {med.duration_value && med.duration_unit
                        ? formatDuration(med.duration_value, med.duration_unit)
                        : '—'}
                    </div>
                  </div>
                </td>

                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <RouteIcon
                      className={cn(
                        'h-4 w-4 flex-shrink-0',
                        isDark ? 'text-cyan-300' : 'text-cyan-700'
                      )}
                    />
                    <span className={cn('text-sm font-medium', colors.text.primary)}>
                      {med.route || '—'}
                    </span>
                  </div>
                </td>

                <td className="px-4 py-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <CheckCircle2
                        className={cn(
                          'h-4 w-4 flex-shrink-0',
                          isDark ? 'text-violet-300' : 'text-violet-700'
                        )}
                      />
                      <span className={cn('text-sm font-medium', colors.text.primary)}>
                        {med.refills ?? 0}
                      </span>
                    </div>

                    <div className={cn('text-sm', colors.text.secondary)}>
                      {med.substitution || '—'}
                    </div>
                  </div>
                </td>

                <td className="px-4 py-4">
                  <div className="max-w-sm space-y-2">
                    {med.instructions ? (
                      <div className="flex items-start gap-2">
                        <FileText
                          className={cn(
                            'mt-0.5 h-4 w-4 flex-shrink-0',
                            isDark ? 'text-indigo-300' : 'text-indigo-700'
                          )}
                        />
                        <span className={cn('text-sm leading-5', colors.text.primary)}>
                          {med.instructions}
                        </span>
                      </div>
                    ) : (
                      <span className={cn('text-sm', colors.text.secondary)}>—</span>
                    )}

                    {med.as_needed && (
                      <div className="flex items-start gap-2">
                        <ShieldAlert className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
                        <span className={cn('text-sm leading-5', colors.text.primary)}>
                          PRN
                          {med.as_needed_reason ? ` — ${med.as_needed_reason}` : ''}
                        </span>
                      </div>
                    )}
                  </div>
                </td>

                <td className="px-4 py-4 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      type="button"
                      onClick={() => onEditMedication(med)}
                      className={cn(
                        'rounded-lg border p-2 transition-colors',
                        colors.border.primary,
                        isDark
                          ? 'text-slate-200 hover:bg-slate-700'
                          : 'text-slate-700 hover:bg-slate-100'
                      )}
                      title="Edit medication"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteMedication(med)}
                      className={cn(
                        'rounded-lg border p-2 transition-colors',
                        colors.border.primary,
                        isDark
                          ? 'text-red-300 hover:bg-red-950/40'
                          : 'text-red-700 hover:bg-red-50'
                      )}
                      title="Delete medication"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 md:hidden">
        {medications.map((med) => (
          <div
            key={med.id}
            className={cn(
              'rounded-xl border p-4',
              colors.border.primary,
              isDark ? 'bg-slate-900' : 'bg-white'
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 text-lg" aria-hidden="true">
                    {getDosageFormIcon(med.dosage_form)}
                  </span>

                  <div>
                    <div className={cn('font-semibold', colors.text.primary)}>
                      {med.medication_name}
                    </div>

                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {med.strength && <span className={badgeClass}>{med.strength}</span>}
                      {med.brand_name && <span className={badgeClass}>{med.brand_name}</span>}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onEditMedication(med)}
                  className={cn(
                    'rounded-lg border p-2 transition-colors',
                    colors.border.primary,
                    isDark
                      ? 'text-slate-200 hover:bg-slate-700'
                      : 'text-slate-700 hover:bg-slate-100'
                  )}
                  title="Edit medication"
                >
                  <Pencil className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={() => onDeleteMedication(med)}
                  className={cn(
                    'rounded-lg border p-2 transition-colors',
                    colors.border.primary,
                    isDark
                      ? 'text-red-300 hover:bg-red-950/40'
                      : 'text-red-700 hover:bg-red-50'
                  )}
                  title="Delete medication"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mt-4 grid gap-3">
              <div>
                <div className={cardLabelClass}>Dose / Form</div>
                <div className={cn('mt-1 text-sm', colors.text.primary)}>
                  {formatDosage(med.dosage_quantity, med.dosage_unit)}
                  {med.dosage_form ? ` • ${med.dosage_form}` : ''}
                </div>
              </div>

              <div>
                <div className={cardLabelClass}>Frequency / Duration</div>
                <div className={cn('mt-1 text-sm', colors.text.primary)}>
                  {med.frequency || '—'}
                  {med.duration_value && med.duration_unit
                    ? ` • ${formatDuration(med.duration_value, med.duration_unit)}`
                    : ''}
                </div>
              </div>

              <div>
                <div className={cardLabelClass}>Route</div>
                <div className={cn('mt-1 text-sm', colors.text.primary)}>
                  {med.route || '—'}
                </div>
              </div>

              <div>
                <div className={cardLabelClass}>Refills / Substitution</div>
                <div className={cn('mt-1 text-sm', colors.text.primary)}>
                  {med.refills ?? 0}
                  {med.substitution ? ` • ${med.substitution}` : ''}
                </div>
              </div>

              <div>
                <div className={cardLabelClass}>Clinical Instructions</div>
                <div className={cn('mt-1 space-y-1 text-sm', colors.text.primary)}>
                  {med.instructions ? <div>{med.instructions}</div> : <div>—</div>}
                  {med.as_needed && (
                    <div className="text-amber-600 dark:text-amber-400">
                      PRN{med.as_needed_reason ? ` — ${med.as_needed_reason}` : ''}
                    </div>
                  )}
                  {med.patient_instructions && (
                    <div className={cn('text-sm', colors.text.secondary)}>
                      Patient instructions: {med.patient_instructions}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
