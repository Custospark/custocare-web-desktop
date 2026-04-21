import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Clock3,
  Eye,
  FileText,
  Pencil,
  Pill,
  Printer,
  Route as RouteIcon,
  ShieldAlert,
  Trash2,
} from 'lucide-react';
import { cn } from '../../../../../../shared/utils/classNameUtils';
import type { Prescription } from '../../../../api/prescription/PrescriptionTypes';
import type { PrescriptionItem } from '../../../../api/prescription-items/PrescriptionItemsTypes';
import {
  formatDosage,
  formatDuration,
  generatePatientInstructions,
  getDosageFormIcon,
  getRouteIcon,
} from '../../../../api/prescription-items/PrescriptionItemsTypes';
import type { ColorTokens, PrescriptionFormData } from './prescriptionForm.types';

interface PrescriptionMedicationsCardProps {
  isDark: boolean;
  colors: ColorTokens;
  prescription: Prescription | null;
  formData: PrescriptionFormData;
  medications: PrescriptionItem[];
  onAddMedication: () => void;
  onEditMedication: (item: PrescriptionItem) => void;
  onDeleteMedication: (item: PrescriptionItem) => void;
}

export const PrescriptionMedicationsCard: React.FC<PrescriptionMedicationsCardProps> = ({
  isDark,
  colors,
  prescription,
  formData,
  medications,
  onAddMedication,
  onEditMedication,
  onDeleteMedication,
}) => {
  const [showPreview, setShowPreview] = useState(false);

  const previewItems = useMemo(
    () =>
      medications.map((med) => ({
        ...med,
        patientInstruction:
          med.patient_instructions?.trim() || generatePatientInstructions(med),
      })),
    [medications]
  );

  return (
    <div className={cn('rounded-2xl border', colors.border.primary, colors.bg.card)}>
      <div className={cn('flex flex-wrap items-center justify-between gap-3 border-b p-4', colors.border.primary)}>
        <div>
          <h3 className={cn('text-base font-semibold', colors.text.primary)}>Prescription Medications</h3>
          <p className={cn('text-sm', colors.text.secondary)}>
            {medications.length} item(s) currently available under this prescription
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowPreview((prev) => !prev)}
            className={cn(
              'inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-all',
              colors.bg.hover,
              colors.text.brand
            )}
          >
            <Eye className="h-4 w-4" />
            {showPreview ? 'Hide Preview' : 'Preview / Print'}
          </button>

          <button
            type="button"
            onClick={onAddMedication}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-all hover:bg-blue-700"
          >
            <Pill className="h-4 w-4" />
            Add Medication
          </button>
        </div>
      </div>

      <div className="space-y-4 p-4">
        {medications.length === 0 ? (
          <div className={cn('rounded-xl border border-dashed p-8 text-center', colors.border.primary, colors.bg.subtle)}>
            <Pill className={cn('mx-auto mb-3 h-10 w-10', colors.text.tertiary)} />
            <p className={cn('text-sm font-medium', colors.text.primary)}>No medications added yet</p>
          
          </div>
        ) : (
          <div className="space-y-3">
            {medications.map((med) => (
              <div key={med.id} className={cn('rounded-xl border p-4', colors.border.primary, colors.bg.subtle)}>
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-lg" aria-hidden="true">
                        {getDosageFormIcon(med.dosage_form)}
                      </span>
                      <p className={cn('font-semibold', colors.text.primary)}>
                        {med.medication_name}
                      </p>
                      {med.strength && (
                        <span className={cn('rounded-full px-2 py-0.5 text-xs', isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-200 text-gray-700')}>
                          {med.strength}
                        </span>
                      )}
                      {med.brand_name && (
                        <span className={cn('rounded-full px-2 py-0.5 text-xs', isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-200 text-gray-700')}>
                          {med.brand_name}
                        </span>
                      )}
                    </div>

                    <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                      <div className={cn('rounded-lg border p-3', colors.border.primary, colors.bg.card)}>
                        <div className="flex items-center gap-2">
                          <Pill className={cn('h-4 w-4', isDark ? 'text-green-300' : 'text-green-600')} />
                          <span className={cn('text-xs font-medium uppercase tracking-wide', colors.text.tertiary)}>
                            Dose
                          </span>
                        </div>
                        <p className={cn('mt-1 text-sm', colors.text.primary)}>
                          {formatDosage(med.dosage_quantity, med.dosage_unit)}
                        </p>
                      </div>

                      <div className={cn('rounded-lg border p-3', colors.border.primary, colors.bg.card)}>
                        <div className="flex items-center gap-2">
                          <Clock3 className={cn('h-4 w-4', isDark ? 'text-orange-300' : 'text-orange-600')} />
                          <span className={cn('text-xs font-medium uppercase tracking-wide', colors.text.tertiary)}>
                            Frequency / Duration
                          </span>
                        </div>
                        <p className={cn('mt-1 text-sm', colors.text.primary)}>{med.frequency}</p>
                        <p className={cn('text-xs', colors.text.secondary)}>
                          {formatDuration(med.duration_value, med.duration_unit)}
                        </p>
                      </div>

                      <div className={cn('rounded-lg border p-3', colors.border.primary, colors.bg.card)}>
                        <div className="flex items-center gap-2">
                          <RouteIcon className={cn('h-4 w-4', isDark ? 'text-cyan-300' : 'text-cyan-600')} />
                          <span className={cn('text-xs font-medium uppercase tracking-wide', colors.text.tertiary)}>
                            Route
                          </span>
                        </div>
                        <p className={cn('mt-1 text-sm', colors.text.primary)}>
                          {getRouteIcon(med.route)} {med.route}
                        </p>
                      </div>

                      <div className={cn('rounded-lg border p-3', colors.border.primary, colors.bg.card)}>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className={cn('h-4 w-4', isDark ? 'text-purple-300' : 'text-purple-600')} />
                          <span className={cn('text-xs font-medium uppercase tracking-wide', colors.text.tertiary)}>
                            Refills / Substitution
                          </span>
                        </div>
                        <p className={cn('mt-1 text-sm', colors.text.primary)}>{med.refills}</p>
                        <p className={cn('text-xs', colors.text.secondary)}>{med.substitution}</p>
                      </div>
                    </div>

                    {(med.instructions || med.as_needed_reason) && (
                      <div className={cn('mt-3 rounded-lg border p-3', colors.border.primary, colors.bg.card)}>
                        <div className="flex items-center gap-2">
                          <FileText className={cn('h-4 w-4', isDark ? 'text-indigo-300' : 'text-indigo-600')} />
                          <span className={cn('text-xs font-medium uppercase tracking-wide', colors.text.tertiary)}>
                            Entered Instructions
                          </span>
                        </div>

                        {med.instructions && (
                          <p className={cn('mt-1 text-sm', colors.text.primary)}>{med.instructions}</p>
                        )}

                        {med.as_needed && (
                          <div className="mt-2 flex items-center gap-2">
                            <ShieldAlert className="h-4 w-4 text-amber-500" />
                            <span className={cn('text-sm', colors.text.primary)}>
                              PRN
                              {med.as_needed_reason ? ` — ${med.as_needed_reason}` : ''}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 xl:ml-4">
                    <button
                      type="button"
                      onClick={() => onEditMedication(med)}
                      className={cn('rounded-lg p-2 transition-colors', colors.bg.hover, colors.text.secondary)}
                      title="Edit medication"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteMedication(med)}
                      className={cn('rounded-lg p-2 transition-colors', colors.bg.hover, 'text-red-500')}
                      title="Delete medication"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {showPreview && (
          <div className={cn('rounded-2xl border p-5', colors.border.primary, colors.bg.subtle)}>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
              <div>
                <h4 className={cn('text-base font-semibold', colors.text.primary)}>
                  Patient-ready Prescription Preview
                </h4>
                <p className={cn('text-sm', colors.text.secondary)}>
                  Preview the handout before printing it for the patient.
                </p>
              </div>

              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-3 py-2 text-sm font-medium text-white transition-all hover:bg-slate-900"
              >
                <Printer className="h-4 w-4" />
                Print
              </button>
            </div>

            <div className={cn('rounded-xl border p-5 print:border-none print:p-0', colors.border.primary, colors.bg.card)}>
              <div className="border-b pb-4">
                <h5 className={cn('text-lg font-semibold', colors.text.primary)}>
                  Prescription
                </h5>

                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                  <p className={cn('text-sm', colors.text.primary)}>
                    <span className="font-semibold">Prescription #:</span>{' '}
                    {prescription?.prescription_number || 'Pending after save'}
                  </p>
                  <p className={cn('text-sm', colors.text.primary)}>
                    <span className="font-semibold">Date:</span>{' '}
                    {prescription?.prescription_date
                      ? new Date(prescription.prescription_date).toLocaleDateString()
                      : new Date().toLocaleDateString()}
                  </p>
                  <p className={cn('text-sm', colors.text.primary)}>
                    <span className="font-semibold">Type:</span> {formData.prescription_type}
                  </p>
                  <p className={cn('text-sm', colors.text.primary)}>
                    <span className="font-semibold">Priority:</span> {formData.priority}
                  </p>
                  {formData.valid_until && (
                    <p className={cn('text-sm', colors.text.primary)}>
                      <span className="font-semibold">Valid until:</span> {formData.valid_until}
                    </p>
                  )}
                  {formData.follow_up_date && (
                    <p className={cn('text-sm', colors.text.primary)}>
                      <span className="font-semibold">Follow-up date:</span> {formData.follow_up_date}
                    </p>
                  )}
                </div>

                {formData.diagnosis && (
                  <p className={cn('mt-3 text-sm', colors.text.primary)}>
                    <span className="font-semibold">Diagnosis:</span> {formData.diagnosis}
                  </p>
                )}
              </div>

              <div className="py-4">
                <h6 className={cn('mb-3 text-sm font-semibold uppercase tracking-wide', colors.text.tertiary)}>
                  Medications
                </h6>

                <div className="space-y-4">
                  {previewItems.map((med, index) => (
                    <div key={med.id} className="border-b pb-4 last:border-b-0 last:pb-0">
                      <p className={cn('font-semibold', colors.text.primary)}>
                        {index + 1}. {med.medication_name}
                        {med.strength ? ` ${med.strength}` : ''}
                        {med.brand_name ? ` (${med.brand_name})` : ''}
                      </p>

                      <ul className={cn('mt-2 space-y-1 text-sm', colors.text.primary)}>
                        <li>
                          Dose: {formatDosage(med.dosage_quantity, med.dosage_unit)}
                        </li>
                        <li>Form: {med.dosage_form}</li>
                        <li>Frequency: {med.frequency}</li>
                        <li>Duration: {formatDuration(med.duration_value, med.duration_unit)}</li>
                        <li>Route: {med.route}</li>
                        <li>Instructions: {med.patientInstruction}</li>
                        <li>Refills: {med.refills}</li>
                        <li>Substitution: {med.substitution}</li>
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              {(formData.patient_education_notes || formData.follow_up_instructions || formData.special_instructions) && (
                <div className="border-t pt-4">
                  <h6 className={cn('mb-3 text-sm font-semibold uppercase tracking-wide', colors.text.tertiary)}>
                    Additional Notes
                  </h6>

                  <div className="space-y-2">
                    {formData.patient_education_notes && (
                      <p className={cn('text-sm', colors.text.primary)}>
                        <span className="font-semibold">Patient education:</span> {formData.patient_education_notes}
                      </p>
                    )}
                    {formData.follow_up_instructions && (
                      <p className={cn('text-sm', colors.text.primary)}>
                        <span className="font-semibold">Follow-up instructions:</span> {formData.follow_up_instructions}
                      </p>
                    )}
                    {formData.special_instructions && (
                      <p className={cn('text-sm', colors.text.primary)}>
                        <span className="font-semibold">Special instructions:</span> {formData.special_instructions}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PrescriptionMedicationsCard;
