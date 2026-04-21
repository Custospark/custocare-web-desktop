import { useRef } from 'react';
import { Printer, X } from 'lucide-react';
import { cn } from '../../../../../../shared/utils/classNameUtils';
import type { Prescription } from '../../../../api/prescription/PrescriptionTypes';
import {
  formatDosage,
  formatDuration,
} from '../../../../api/prescription-items/PrescriptionItemsTypes';
import type { ColorTokens, PrescriptionFormData } from './prescriptionForm.types';
import type { PreviewMedicationItem } from './prescriptionInstructionsUtils';

interface PrescriptionMedicationsPreviewProps {
  isDark: boolean;
  colors: ColorTokens;
  prescription: Prescription | null;
  formData: PrescriptionFormData;
  previewItems: PreviewMedicationItem[];
  onClose: () => void;
}

function buildPrintHtml(params: {
  prescription: Prescription | null;
  formData: PrescriptionFormData;
  previewItems: PreviewMedicationItem[];
}) {
  const { prescription, formData, previewItems } = params;

  const prescriptionDate = prescription?.prescription_date
    ? new Date(prescription.prescription_date).toLocaleDateString()
    : new Date().toLocaleDateString();

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Prescription ${prescription?.prescription_number || 'Preview'}</title>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            padding: 32px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
            background: #ffffff;
            color: #111827;
            line-height: 1.5;
          }

          .print-container {
            max-width: 1200px;
            margin: 0 auto;
          }

          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 24px;
            border-bottom: 2px solid #cbd5e1;
            padding-bottom: 20px;
            margin-bottom: 24px;
          }

          .header h1 {
            margin: 0;
            font-size: 28px;
            line-height: 1.2;
            font-weight: 700;
            color: #0f172a;
          }

          .header-meta {
            font-size: 14px;
            color: #334155;
          }

          .section {
            margin-bottom: 24px;
          }

          .section-title {
            margin: 0 0 12px 0;
            font-size: 14px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            color: #334155;
          }

          .details-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 12px 24px;
          }

          .detail-row {
            display: flex;
            gap: 8px;
            align-items: flex-start;
            font-size: 14px;
          }

          .detail-label {
            min-width: 130px;
            font-weight: 700;
            color: #334155;
          }

          .detail-value {
            color: #0f172a;
          }

          .callout {
            border: 1px solid #cbd5e1;
            border-left: 5px solid #2563eb;
            background: #f8fafc;
            border-radius: 10px;
            padding: 14px 16px;
          }

          .callout-label {
            font-size: 13px;
            font-weight: 700;
            color: #1e3a8a;
            margin-bottom: 6px;
            text-transform: uppercase;
            letter-spacing: 0.04em;
          }

          .callout-value {
            font-size: 14px;
            color: #0f172a;
          }

          .medications-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            border: 1px solid #cbd5e1;
          }

          .medications-table th {
            background: #e2e8f0;
            color: #0f172a;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            text-align: left;
            padding: 12px 10px;
            border: 1px solid #cbd5e1;
            vertical-align: top;
          }

          .medications-table td {
            padding: 12px 10px;
            border: 1px solid #cbd5e1;
            vertical-align: top;
            font-size: 13px;
            color: #111827;
          }

          .med-name {
            font-weight: 700;
            color: #0f172a;
            margin-bottom: 6px;
          }

          .badge {
            display: inline-block;
            margin-right: 6px;
            margin-top: 4px;
            padding: 2px 8px;
            font-size: 11px;
            font-weight: 600;
            border-radius: 999px;
            background: #e2e8f0;
            color: #1e293b;
          }

          .muted {
            color: #475569;
            font-size: 12px;
            margin-top: 4px;
          }

          .prn {
            color: #92400e;
            font-weight: 700;
            margin-top: 6px;
            font-size: 12px;
          }

          .notes-box {
            border: 1px solid #cbd5e1;
            border-radius: 10px;
            background: #ffffff;
            padding: 14px 16px;
          }

          .note-item + .note-item {
            margin-top: 10px;
          }

          .note-label {
            font-weight: 700;
            color: #0f172a;
          }

          @media print {
            body {
              padding: 18px;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }

          @media (max-width: 900px) {
            .details-grid {
              grid-template-columns: 1fr;
            }
          }
        </style>
      </head>
      <body>
        <div class="print-container">
          <div class="header">
            <div>
              <h1>Prescription</h1>
              <div class="header-meta">Patient-ready medication summary</div>
            </div>
            <div class="header-meta">
              <div><strong>Prescription #:</strong> ${prescription?.prescription_number || 'Pending after save'}</div>
              <div><strong>Date:</strong> ${prescriptionDate}</div>
            </div>
          </div>

          <div class="section">
            <h2 class="section-title">Prescription Details</h2>
            <div class="details-grid">
              <div class="detail-row">
                <span class="detail-label">Prescription Type</span>
                <span class="detail-value">${formData.prescription_type || '—'}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Priority</span>
                <span class="detail-value">${formData.priority || '—'}</span>
              </div>
              ${
                formData.valid_until
                  ? `
                <div class="detail-row">
                  <span class="detail-label">Valid Until</span>
                  <span class="detail-value">${formData.valid_until}</span>
                </div>
              `
                  : ''
              }
              ${
                formData.follow_up_date
                  ? `
                <div class="detail-row">
                  <span class="detail-label">Follow-up Date</span>
                  <span class="detail-value">${formData.follow_up_date}</span>
                </div>
              `
                  : ''
              }
            </div>
          </div>

          ${
            formData.diagnosis
              ? `
            <div class="section">
              <div class="callout">
                <div class="callout-label">Clinical Indication / Diagnosis</div>
                <div class="callout-value">${formData.diagnosis}</div>
              </div>
            </div>
          `
              : ''
          }

          <div class="section">
            <h2 class="section-title">Medication List</h2>
            <table class="medications-table">
              <thead>
                <tr>
                  <th style="width: 20%;">Medication</th>
                  <th style="width: 12%;">Dose / Form</th>
                  <th style="width: 13%;">Frequency</th>
                  <th style="width: 11%;">Duration</th>
                  <th style="width: 10%;">Route</th>
                  <th style="width: 10%;">Refills</th>
                  <th style="width: 24%;">Patient Instructions</th>
                </tr>
              </thead>
              <tbody>
                ${previewItems
                  .map(
                    (med) => `
                  <tr>
                    <td>
                      <div class="med-name">${med.medication_name}</div>
                      ${med.strength ? `<span class="badge">${med.strength}</span>` : ''}
                      ${med.brand_name ? `<span class="badge">${med.brand_name}</span>` : ''}
                    </td>
                    <td>
                      ${formatDosage(med.dosage_quantity, med.dosage_unit)}
                      ${
                        med.dosage_form
                          ? `<div class="muted">Form: ${med.dosage_form}</div>`
                          : ''
                      }
                    </td>
                    <td>${med.frequency || '—'}</td>
                    <td>${
                      med.duration_value && med.duration_unit
                        ? formatDuration(med.duration_value, med.duration_unit)
                        : '—'
                    }</td>
                    <td>${med.route || '—'}</td>
                    <td>
                      ${med.refills ?? 0}
                      ${
                        med.substitution
                          ? `<div class="muted">${med.substitution}</div>`
                          : ''
                      }
                    </td>
                    <td>
                      ${
                        med.patientInstruction
                          ? `<div>${med.patientInstruction}</div>`
                          : '<div>—</div>'
                      }
                     
                      ${
                        med.as_needed
                          ? `<div class="prn">PRN${med.as_needed_reason ? ` — ${med.as_needed_reason}` : ''}</div>`
                          : ''
                      }
                    </td>
                  </tr>
                `
                  )
                  .join('')}
              </tbody>
            </table>
          </div>

          ${
            formData.patient_education_notes ||
            formData.follow_up_instructions ||
            formData.special_instructions
              ? `
            <div class="section">
              <h2 class="section-title">Patient Counseling and Follow-up</h2>
              <div class="notes-box">
                ${
                  formData.patient_education_notes
                    ? `
                  <div class="note-item">
                    <span class="note-label">Patient education:</span>
                    ${formData.patient_education_notes}
                  </div>
                `
                    : ''
                }
                ${
                  formData.follow_up_instructions
                    ? `
                  <div class="note-item">
                    <span class="note-label">Follow-up instructions:</span>
                    ${formData.follow_up_instructions}
                  </div>
                `
                    : ''
                }
                ${
                  formData.special_instructions
                    ? `
                  <div class="note-item">
                    <span class="note-label">Special instructions:</span>
                    ${formData.special_instructions}
                  </div>
                `
                    : ''
                }
              </div>
            </div>
          `
              : ''
          }
        </div>
      </body>
    </html>
  `;
}

export function PrescriptionMedicationsPreview({
  isDark,
  colors,
  prescription,
  formData,
  previewItems,
  onClose,
}: PrescriptionMedicationsPreviewProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const previewSurfaceClass = cn(
    'rounded-2xl border',
    colors.border.primary,
    isDark ? 'bg-slate-950' : 'bg-white'
  );

  const previewMutedPanelClass = cn(
    'rounded-xl border p-4',
    colors.border.primary,
    isDark ? 'bg-slate-900' : 'bg-slate-50'
  );

  const tableHeaderClass = cn(
    'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide',
    isDark ? 'bg-slate-800 text-slate-100' : 'bg-slate-100 text-slate-700'
  );

  const rowClass = cn(
    'border-b align-top',
    colors.border.primary,
    isDark ? 'bg-slate-950 text-slate-100' : 'bg-white text-slate-900'
  );

  function handlePrint() {
    const originalTitle = document.title;
    document.title = `Prescription_${prescription?.prescription_number || 'Preview'}`;

    const printWindow = window.open('', '_blank', 'width=1200,height=800');
    if (!printWindow) {
      window.print();
      document.title = originalTitle;
      return;
    }

    printWindow.document.write(
      buildPrintHtml({
        prescription,
        formData,
        previewItems,
      })
    );

    printWindow.document.close();
    printWindow.focus();

    printWindow.onload = () => {
      printWindow.print();
      printWindow.close();
    };

    document.title = originalTitle;
  }

  return (
    <div className={previewSurfaceClass}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b p-4 print:hidden">
        <div>
          <h4 className={cn('text-base font-semibold', colors.text.primary)}>
            Patient-ready Prescription Preview
          </h4>
          <p className={cn('text-sm', colors.text.secondary)}>
            Review the clinical layout and print format before issuing to the patient.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className={cn(
              'inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
              colors.border.primary,
              colors.bg.hover,
              colors.text.primary
            )}
          >
            <X className="h-4 w-4" />
            Close
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-800"
          >
            <Printer className="h-4 w-4" />
            Print Prescription
          </button>
        </div>
      </div>

      <div ref={printRef} className="space-y-5 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b pb-4">
          <div>
            <h1 className={cn('text-2xl font-bold', colors.text.primary)}>Prescription</h1>
            <p className={cn('mt-1 text-sm', colors.text.secondary)}>
              Patient-ready medication summary
            </p>
          </div>

          <div className="space-y-1 text-sm">
            <div className={colors.text.primary}>
              <span className={cn('font-semibold', colors.text.primary)}>Prescription #:</span>{' '}
              {prescription?.prescription_number || 'Pending after save'}
            </div>
            <div className={colors.text.primary}>
              <span className={cn('font-semibold', colors.text.primary)}>Date:</span>{' '}
              {prescription?.prescription_date
                ? new Date(prescription.prescription_date).toLocaleDateString()
                : new Date().toLocaleDateString()}
            </div>
          </div>
        </div>

        <div className={previewMutedPanelClass}>
          <h5 className={cn('mb-3 text-sm font-semibold uppercase tracking-wide', colors.text.secondary)}>
            Prescription Details
          </h5>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="text-sm">
              <span className={cn('font-semibold', colors.text.primary)}>Prescription Type:</span>{' '}
              <span className={colors.text.primary}>{formData.prescription_type || '—'}</span>
            </div>

            <div className="text-sm">
              <span className={cn('font-semibold', colors.text.primary)}>Priority:</span>{' '}
              <span className={colors.text.primary}>{formData.priority || '—'}</span>
            </div>

            {formData.valid_until && (
              <div className="text-sm">
                <span className={cn('font-semibold', colors.text.primary)}>Valid Until:</span>{' '}
                <span className={colors.text.primary}>{formData.valid_until}</span>
              </div>
            )}

            {formData.follow_up_date && (
              <div className="text-sm">
                <span className={cn('font-semibold', colors.text.primary)}>Follow-up Date:</span>{' '}
                <span className={colors.text.primary}>{formData.follow_up_date}</span>
              </div>
            )}
          </div>
        </div>

        {formData.diagnosis && (
          <div
            className={cn(
              'rounded-xl border-l-4 p-4',
              isDark
                ? 'border-blue-400 bg-blue-950/40 text-slate-100'
                : 'border-blue-700 bg-blue-50 text-slate-900'
            )}
          >
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">
              Clinical Indication / Diagnosis
            </div>
            <div className="text-sm leading-6">{formData.diagnosis}</div>
          </div>
        )}

        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[980px] border-collapse">
            <thead>
              <tr className={cn('border-b', colors.border.primary)}>
                <th className={tableHeaderClass}>Medication</th>
                <th className={tableHeaderClass}>Dose / Form</th>
                <th className={tableHeaderClass}>Frequency</th>
                <th className={tableHeaderClass}>Duration</th>
                <th className={tableHeaderClass}>Route</th>
                <th className={tableHeaderClass}>Refills</th>
                <th className={tableHeaderClass}>Patient Instructions</th>
              </tr>
            </thead>

            <tbody>
              {previewItems.map((med) => (
                <tr key={med.id} className={rowClass}>
                  <td className="px-4 py-4">
                    <div className={cn('font-semibold', colors.text.primary)}>
                      {med.medication_name}
                    </div>

                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {med.strength && (
                        <span
                          className={cn(
                            'rounded-full px-2 py-0.5 text-xs font-medium',
                            isDark ? 'bg-slate-700 text-slate-100' : 'bg-slate-200 text-slate-800'
                          )}
                        >
                          {med.strength}
                        </span>
                      )}

                      {med.brand_name && (
                        <span
                          className={cn(
                            'rounded-full px-2 py-0.5 text-xs font-medium',
                            isDark ? 'bg-slate-700 text-slate-100' : 'bg-slate-200 text-slate-800'
                          )}
                        >
                          {med.brand_name}
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="px-4 py-4 text-sm">
                    <div className={colors.text.primary}>
                      {formatDosage(med.dosage_quantity, med.dosage_unit)}
                    </div>
                    {med.dosage_form && (
                      <div className={cn('mt-1 text-xs', colors.text.secondary)}>
                        Form: {med.dosage_form}
                      </div>
                    )}
                  </td>

                  <td className="px-4 py-4 text-sm">
                    <span className={colors.text.primary}>{med.frequency || '—'}</span>
                  </td>

                  <td className="px-4 py-4 text-sm">
                    <span className={colors.text.primary}>
                      {med.duration_value && med.duration_unit
                        ? formatDuration(med.duration_value, med.duration_unit)
                        : '—'}
                    </span>
                  </td>

                  <td className="px-4 py-4 text-sm">
                    <span className={colors.text.primary}>{med.route || '—'}</span>
                  </td>

                  <td className="px-4 py-4 text-sm">
                    <div className={colors.text.primary}>{med.refills ?? 0}</div>
                    {med.substitution && (
                      <div className={cn('mt-1 text-xs', colors.text.secondary)}>
                        {med.substitution}
                      </div>
                    )}
                  </td>

                  <td className="px-4 py-4 text-sm">
                    {/* <div className={cn('leading-5', colors.text.primary)}>
                      {med.patientInstruction || '—'}
                    </div> */}

                    {med.organizedInstructions && (
                      <div className={cn('leading-5', colors.text.primary)}>
                         {med.organizedInstructions}
                      </div>
                    )}

                    {med.as_needed && (
                      <div className="mt-2 text-xs font-semibold text-amber-600 dark:text-amber-400">
                        PRN{med.as_needed_reason ? ` — ${med.as_needed_reason}` : ''}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {(formData.patient_education_notes ||
          formData.follow_up_instructions ||
          formData.special_instructions) && (
          <div className={previewMutedPanelClass}>
            <h5 className={cn('mb-3 text-sm font-semibold uppercase tracking-wide', colors.text.secondary)}>
              Patient Counseling and Follow-up
            </h5>

            <div className="space-y-3 text-sm">
              {formData.patient_education_notes && (
                <div className={colors.text.primary}>
                  <span className="font-semibold">Patient education:</span>{' '}
                  {formData.patient_education_notes}
                </div>
              )}

              {formData.follow_up_instructions && (
                <div className={colors.text.primary}>
                  <span className="font-semibold">Follow-up instructions:</span>{' '}
                  {formData.follow_up_instructions}
                </div>
              )}

              {formData.special_instructions && (
                <div className={colors.text.primary}>
                  <span className="font-semibold">Special instructions:</span>{' '}
                  {formData.special_instructions}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
