// lab-results/labresult-form-components/labResultForm.utils.ts
import type {
  ColorTokens,
  FacilityPreviewMeta,
  LabResultFieldDraft,
  LabResultHydratedMap,
  LabResultPreviewRow,
} from './labResultForm.types';
import {
  LabRequestItemStatus,
  LabRequestPriority,
  LabRequestStatus,
  LabResultFlag,
  TemplateFieldDataType,
  type LabRequest,
  type LabRequestItem,
  type LabResult,
  type LabTemplateField,
} from '../../../../api/lab/LabTypes';

export const buildLabResultColorTokens = (theme: 'light' | 'dark'): ColorTokens => {
  const isDark = theme === 'dark';

  return {
    bg: {
      page: isDark ? 'bg-gray-950' : 'bg-slate-50',
      card: isDark ? 'bg-gray-900' : 'bg-white',
      input: isDark ? 'bg-gray-800' : 'bg-gray-50',
      subtle: isDark ? 'bg-gray-800/60' : 'bg-gray-50',
      hover: isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-50',
      muted: isDark ? 'bg-gray-800' : 'bg-gray-100',
      modal: isDark ? 'bg-gray-950/90' : 'bg-white/95',
      accent: isDark ? 'bg-blue-950/30' : 'bg-blue-50',
    },
    text: {
      primary: isDark ? 'text-gray-100' : 'text-gray-900',
      secondary: isDark ? 'text-gray-400' : 'text-gray-600',
      tertiary: isDark ? 'text-gray-500' : 'text-gray-500',
      brand: isDark ? 'text-blue-400' : 'text-blue-600',
      danger: isDark ? 'text-red-300' : 'text-red-700',
      success: isDark ? 'text-emerald-300' : 'text-emerald-700',
      warning: isDark ? 'text-amber-300' : 'text-amber-700',
    },
    border: {
      primary: isDark ? 'border-gray-700' : 'border-gray-200',
      subtle: isDark ? 'border-gray-800' : 'border-gray-100',
      focus: 'focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20',
      accent: isDark ? 'border-blue-800/40' : 'border-blue-200',
    },
  };
};

export const formatDisplayDate = (dateString?: string | null): string => {
  if (!dateString) return 'N/A';

  try {
    return new Date(dateString).toLocaleDateString([], {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    });
  } catch {
    return 'N/A';
  }
};

export const formatDisplayTime = (dateString?: string | null): string => {
  if (!dateString) return 'N/A';

  try {
    return new Date(dateString).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'N/A';
  }
};

export const formatDisplayDateTime = (dateString?: string | null): string => {
  if (!dateString) return 'N/A';

  try {
    return new Date(dateString).toLocaleString([], {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'N/A';
  }
};

export const formatLabel = (value?: string | null): string => {
  if (!value) return 'N/A';
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase());
};

export const getRequestStatusClasses = (
  status: LabRequestStatus | string,
  isDark: boolean
): string => {
  const map: Record<string, string> = {
    [LabRequestStatus.PENDING]: isDark ? 'bg-yellow-900/30 text-yellow-300' : 'bg-yellow-100 text-yellow-700',
    [LabRequestStatus.IN_PROGRESS]: isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-700',
    [LabRequestStatus.COMPLETED]: isDark ? 'bg-emerald-900/30 text-emerald-300' : 'bg-emerald-100 text-emerald-700',
    [LabRequestStatus.REVIEWED]: isDark ? 'bg-purple-900/30 text-purple-300' : 'bg-purple-100 text-purple-700',
    [LabRequestStatus.CANCELLED]: isDark ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-700',
  };

  return map[status] || (isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700');
};

export const getPriorityClasses = (
  priority: LabRequestPriority | string,
  isDark: boolean
): string => {
  const map: Record<string, string> = {
    [LabRequestPriority.ROUTINE]: isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-700',
    [LabRequestPriority.URGENT]: isDark ? 'bg-amber-900/30 text-amber-300' : 'bg-amber-100 text-amber-700',
    [LabRequestPriority.STAT]: isDark ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-700',
  };

  return map[priority] || (isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700');
};

export const getItemStatusClasses = (
  status: LabRequestItemStatus | string,
  isDark: boolean
): string => {
  const map: Record<string, string> = {
    [LabRequestItemStatus.PENDING]: isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700',
    [LabRequestItemStatus.SAMPLE_COLLECTED]: isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-700',
    [LabRequestItemStatus.IN_PROGRESS]: isDark ? 'bg-yellow-900/30 text-yellow-300' : 'bg-yellow-100 text-yellow-700',
    [LabRequestItemStatus.COMPLETED]: isDark ? 'bg-emerald-900/30 text-emerald-300' : 'bg-emerald-100 text-emerald-700',
    [LabRequestItemStatus.VERIFIED]: isDark ? 'bg-purple-900/30 text-purple-300' : 'bg-purple-100 text-purple-700',
    [LabRequestItemStatus.CANCELLED]: isDark ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-700',
  };

  return map[status] || (isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700');
};

export const getResultFlagClasses = (
  flag: LabResultFlag | string,
  isDark: boolean
): string => {
  const map: Record<string, string> = {
    [LabResultFlag.NORMAL]: isDark ? 'bg-emerald-900/30 text-emerald-300' : 'bg-emerald-100 text-emerald-700',
    [LabResultFlag.LOW]: isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-700',
    [LabResultFlag.HIGH]: isDark ? 'bg-orange-900/30 text-orange-300' : 'bg-orange-100 text-orange-700',
    [LabResultFlag.ABNORMAL]: isDark ? 'bg-amber-900/30 text-amber-300' : 'bg-amber-100 text-amber-700',
    [LabResultFlag.CRITICAL]: isDark ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-700',
    [LabResultFlag.PENDING]: isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700',
  };

  return map[flag] || (isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700');
};

export const formatReferenceRange = (
  min?: number | string | null,
  max?: number | string | null,
  unit?: string | null
): string => {
  const safeUnit = unit ? ` ${unit}` : '';
  const hasMin = min !== null && min !== undefined && String(min).trim() !== '';
  const hasMax = max !== null && max !== undefined && String(max).trim() !== '';

  if (hasMin && hasMax) return `${min} - ${max}${safeUnit}`;
  if (hasMin) return `≥ ${min}${safeUnit}`;
  if (hasMax) return `≤ ${max}${safeUnit}`;
  return 'N/A';
};

export const getPatientDisplayName = (request: LabRequest): string =>
  request.patient?.full_name || 'Unknown patient';

export const getPatientNumber = (request: LabRequest): string =>
  request.patient?.medical_record_number || request.patient?.patient_uuid || 'N/A';

export const isRequestLockedForEditing = (request: LabRequest): boolean =>
  request.status === LabRequestStatus.REVIEWED || request.status === LabRequestStatus.CANCELLED;

export const canEditItemResults = (
  item: LabRequestItem,
  requestLocked: boolean
): boolean => {
  if (requestLocked) return false;
  if (item.status === LabRequestItemStatus.CANCELLED) return false;
  if (item.status === LabRequestItemStatus.VERIFIED) return false;
  return true;
};

export const canAdvanceItemStatus = (
  item: LabRequestItem,
  requestLocked: boolean
): boolean => {
  if (requestLocked) return false;
  if (item.status === LabRequestItemStatus.CANCELLED) return false;
  if (item.status === LabRequestItemStatus.VERIFIED) return false;
  return true;
};

export const deriveNumericValue = (
  rawValue: string,
  dataType?: string | null
): number | null => {
  if (dataType !== TemplateFieldDataType.NUMBER) return null;
  if (!rawValue.trim()) return null;

  const numeric = Number(rawValue);
  return Number.isFinite(numeric) ? numeric : null;
};

export const deriveResultFlag = (params: {
  rawValue: string;
  dataType?: string | null;
  referenceMin?: string | number | null;
  referenceMax?: string | number | null;
  currentFlag?: LabResultFlag;
}): LabResultFlag => {
  const { rawValue, dataType, referenceMin, referenceMax, currentFlag } = params;

  if (!rawValue.trim()) return LabResultFlag.PENDING;

  if (dataType !== TemplateFieldDataType.NUMBER) {
    return currentFlag && currentFlag !== LabResultFlag.PENDING
      ? currentFlag
      : LabResultFlag.NORMAL;
  }

  const numericValue = Number(rawValue);
  if (!Number.isFinite(numericValue)) {
    return currentFlag && currentFlag !== LabResultFlag.PENDING
      ? currentFlag
      : LabResultFlag.ABNORMAL;
  }

  const min = referenceMin !== null && referenceMin !== undefined && String(referenceMin).trim() !== ''
    ? Number(referenceMin)
    : null;
  const max = referenceMax !== null && referenceMax !== undefined && String(referenceMax).trim() !== ''
    ? Number(referenceMax)
    : null;

  if (min !== null && numericValue < min) return LabResultFlag.LOW;
  if (max !== null && numericValue > max) return LabResultFlag.HIGH;
  return LabResultFlag.NORMAL;
};

export const hasMeaningfulDraftData = (draft: LabResultFieldDraft): boolean =>
  !!(
    draft.value.trim() ||
    draft.numeric_value.trim() ||
    draft.interpretation.trim() ||
    draft.comments.trim()
  );

export const summarizeResults = (results: LabResult[]): string => {
  if (!results.length) return 'No results recorded';

  const normalized = results
    .slice(0, 3)
    .map((result) => {
      const parameter = result.template_field?.name || 'Result';
      const value =
        result.formatted_value ||
        result.value ||
        (result.numeric_value !== null ? String(result.numeric_value) : 'Pending');

      return `${parameter}: ${value}`;
    });

  return normalized.join(' • ');
};

export const getPrimaryFlag = (results: LabResult[]): LabResultFlag => {
  if (!results.length) return LabResultFlag.PENDING;
  
  // Highest priority: Critical (life-threatening)
  if (results.some((result) => result.flag === LabResultFlag.CRITICAL)) {
    return LabResultFlag.CRITICAL;
  }
  
  // Second priority: Abnormal (clinically significant)
  if (results.some((result) => result.flag === LabResultFlag.ABNORMAL)) {
    return LabResultFlag.ABNORMAL;
  }
  
  // Third priority: High (above reference range)
  if (results.some((result) => result.flag === LabResultFlag.HIGH)) {
    return LabResultFlag.HIGH;
  }
  
  // Fourth priority: Low (below reference range)
  if (results.some((result) => result.flag === LabResultFlag.LOW)) {
    return LabResultFlag.LOW;
  }
  
  // Only return NORMAL if EVERY result is NORMAL
  if (results.every((result) => result.flag === LabResultFlag.NORMAL)) {
    return LabResultFlag.NORMAL;
  }
  
  // Default fallback
  return LabResultFlag.PENDING;
};

export const flattenPreviewRows = (
  request: LabRequest,
  resultsMap: LabResultHydratedMap
): LabResultPreviewRow[] => {
  const items = Array.isArray(request.items) ? request.items : [];

  return items.flatMap((item) => {
    const itemResults = Array.isArray(resultsMap[item.item_uuid]) ? resultsMap[item.item_uuid] : [];
    const base = {
      itemUuid: item.item_uuid,
      testName: item.lab_test?.name || 'Unnamed test',
      testCode: item.lab_test?.code || 'N/A',
      category: item.lab_test?.category || 'N/A',
      sampleType: item.sample_type || 'N/A',
      itemStatus: formatLabel(item.status),
    };

    if (!itemResults.length) {
      return [
        {
          rowId: `${item.item_uuid}-pending`,
          ...base,
          parameter: 'Pending result',
          value: '—',
          unit: '—',
          referenceRange: '—',
          flag: formatLabel(item.result_flag || LabResultFlag.PENDING),
          interpretation: 'No result entered yet',
          comments: item.notes || '—',
          recordedAt: '—',
          verifiedAt: '—',
          recordedBy: '—',
          verifiedBy: '—',
        },
      ];
    }

    return itemResults.map((result, index) => ({
      rowId: `${item.item_uuid}-${result.result_uuid || index}`,
      ...base,
      parameter: result.template_field?.name || `Result ${index + 1}`,
      value:
        result.formatted_value ||
        result.value ||
        (result.numeric_value !== null ? String(result.numeric_value) : '—'),
      unit: result.unit || result.template_field?.unit || '—',
      referenceRange:
        result.reference_range ||
        formatReferenceRange(result.reference_min, result.reference_max, result.unit || result.template_field?.unit),
      flag: formatLabel(result.flag),
      interpretation: result.interpretation || '—',
      comments: result.comments || '—',
      recordedAt: formatDisplayDateTime(result.recorded_at),
      verifiedAt: formatDisplayDateTime(result.verified_at),
      recordedBy: result.recorded_by?.name || '—',
      verifiedBy: result.verified_by?.name || '—',
    }));
  });
};

const escapeHtml = (value?: string | number | null): string =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

export const buildLabResultFileName = (request: LabRequest): string => {
  const patient = getPatientDisplayName(request).replace(/\s+/g, '_').replace(/[^\w-]/g, '');
  const requestCode = request.request_uuid || `request_${request.id}`;
  return `lab_result_${patient || 'patient'}_${requestCode}`.toLowerCase();
};

export const buildLabResultReportHtml = (
  request: LabRequest,
  resultsMap: LabResultHydratedMap,
  facility?: FacilityPreviewMeta
): string => {
  const previewRows = flattenPreviewRows(request, resultsMap);
  const generatedAt = new Date().toLocaleString();
  const facilityName = facility?.name || request.facility?.facility_name || 'Medical Facility';

  const summaryHtml = `
    <div class="summary-grid">
      <div class="summary-card">
        <div class="summary-label">Patient Name</div>
        <div class="summary-value">${escapeHtml(getPatientDisplayName(request))}</div>
      </div>
      <div class="summary-card">
        <div class="summary-label">Patient Number</div>
        <div class="summary-value">${escapeHtml(getPatientNumber(request))}</div>
      </div>
      <div class="summary-card">
        <div class="summary-label">Request Number</div>
        <div class="summary-value">${escapeHtml(request.request_uuid)}</div>
      </div>
      <div class="summary-card">
        <div class="summary-label">Visit Number</div>
        <div class="summary-value">${escapeHtml(request.visit?.visit_uuid || request.visit_id)}</div>
      </div>
      <div class="summary-card">
        <div class="summary-label">Priority</div>
        <div class="summary-value">${escapeHtml(formatLabel(request.priority))}</div>
      </div>
      <div class="summary-card">
        <div class="summary-label">Status</div>
        <div class="summary-value">${escapeHtml(formatLabel(request.status))}</div>
      </div>
      <div class="summary-card">
        <div class="summary-label">Requested At</div>
        <div class="summary-value">${escapeHtml(formatDisplayDateTime(request.requested_at))}</div>
      </div>
      <div class="summary-card">
        <div class="summary-label">Completed At</div>
        <div class="summary-value">${escapeHtml(formatDisplayDateTime(request.completed_at))}</div>
      </div>
    </div>
  `;

  const rowsHtml = previewRows
    .map(
      (row) => `
        <tr>
          <td>${escapeHtml(row.testName)}</td>
          <td>${escapeHtml(row.parameter)}</td>
          <td>${escapeHtml(row.value)}</td>
          <td>${escapeHtml(row.unit)}</td>
          <td>${escapeHtml(row.referenceRange)}</td>
          <td>${escapeHtml(row.flag)}</td>
          <td>${escapeHtml(row.interpretation)}</td>
          <td>${escapeHtml(row.comments)}</td>
        </tr>
      `
    )
    .join('');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(buildLabResultFileName(request))}</title>
        <style>
          * { box-sizing: border-box; }
          body {
            margin: 0;
            padding: 32px;
            font-family: Inter, Arial, Helvetica, sans-serif;
            color: #0f172a;
            background: #ffffff;
          }
          .report {
            max-width: 1100px;
            margin: 0 auto;
          }
          .header {
            border-bottom: 3px solid #1d4ed8;
            padding-bottom: 16px;
            margin-bottom: 20px;
          }
          .facility-name {
            font-size: 28px;
            font-weight: 800;
            margin-bottom: 4px;
            color: #0f172a;
          }
          .facility-meta,
          .report-meta {
            color: #475569;
            font-size: 13px;
            line-height: 1.5;
          }
          .report-title {
            margin-top: 14px;
            font-size: 20px;
            font-weight: 800;
            color: #1d4ed8;
            letter-spacing: 0.03em;
          }
          .summary-grid {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 12px;
            margin-bottom: 20px;
          }
          .summary-card {
            border: 1px solid #dbeafe;
            background: #f8fbff;
            border-radius: 10px;
            padding: 12px;
          }
          .summary-label {
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #64748b;
            margin-bottom: 6px;
          }
          .summary-value {
            font-size: 14px;
            font-weight: 700;
            color: #0f172a;
            word-break: break-word;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
          }
          thead th {
            background: #eff6ff;
            color: #1e40af;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            border: 1px solid #bfdbfe;
            padding: 10px;
            text-align: left;
          }
          tbody td {
            border: 1px solid #dbeafe;
            padding: 10px;
            font-size: 13px;
            vertical-align: top;
          }
          .footer {
            margin-top: 22px;
            border-top: 1px solid #cbd5e1;
            padding-top: 14px;
            font-size: 12px;
            color: #475569;
          }
          .footer strong { color: #0f172a; }
          @media print {
            body { padding: 0; }
            .report { max-width: none; }
          }
        </style>
      </head>
      <body>
        <div class="report">
          <div class="header">
            <div class="facility-name">${escapeHtml(facilityName)}</div>
            <div class="facility-meta">
              ${escapeHtml(facility?.address || 'Address not available')}<br />
              Phone: ${escapeHtml(facility?.phone || 'N/A')}
              ${facility?.email ? ` • Email: ${escapeHtml(facility.email)}` : ''}
              ${facility?.code ? ` • Facility Code: ${escapeHtml(facility.code)}` : ''}
            </div>
            <div class="report-title">LABORATORY RESULT REPORT</div>
            <div class="report-meta">
              Generated: ${escapeHtml(generatedAt)}
            </div>
          </div>

          ${summaryHtml}

          <table>
            <thead>
              <tr>
                <th>Test</th>
                <th>Parameter</th>
                <th>Result</th>
                <th>Unit</th>
                <th>Reference Range</th>
                <th>Flag</th>
                <th>Interpretation</th>
                <th>Comments</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          <div class="footer">
            <strong>Clinical Notice:</strong> This report is electronically generated from the laboratory module.
            Results must be interpreted in clinical context by an authorized healthcare professional.<br />
            <strong>Requested By:</strong> ${escapeHtml(request.requested_by?.name || 'N/A')}
            &nbsp; | &nbsp;
            <strong>Reviewed By:</strong> ${escapeHtml(request.reviewed_by?.name || 'N/A')}
          </div>
        </div>
      </body>
    </html>
  `;
};

export const triggerPrintWindow = (html: string): void => {
  const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=1200,height=900');
  if (!printWindow) return;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();

  setTimeout(() => {
    printWindow.print();
  }, 250);
};

export const downloadHtmlDocument = (filename: string, html: string): void => {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${filename}.html`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
};

export const extractResultsArray = (payload: unknown): LabResult[] => {
  if (!payload || typeof payload !== 'object') return [];
  const response = payload as { data?: LabResult[] };
  if (Array.isArray(response.data)) return response.data;
  return [];
};

export const sortTemplateFields = (fields: LabTemplateField[]): LabTemplateField[] =>
  [...fields].sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

export const buildDraftsFromFieldsAndResults = (
  fields: LabTemplateField[],
  results: LabResult[]
): LabResultFieldDraft[] => {
  const resultByFieldId = new Map<number, LabResult>(
    results
      .filter((result) => result.template_field_id !== null)
      .map((result) => [result.template_field_id as number, result])
  );

  if (!fields.length && results.length) {
    return results.map((result, index) => ({
      localId: result.result_uuid || `existing-${index}`,
      result_uuid: result.result_uuid,
      template_field_id: result.template_field_id,
      field_uuid: result.template_field?.field_uuid || null,
      field_name: result.template_field?.name || `Result ${index + 1}`,
      field_code: result.template_field?.code || null,
      data_type: result.template_field?.data_type || TemplateFieldDataType.TEXT,
      display_order: result.template_field?.display_order || index + 1,
      is_required: !!result.template_field?.is_required,
      is_critical: !!result.template_field?.is_critical,
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

  return sortTemplateFields(fields).map((field, index) => {
  const existing = resultByFieldId.get(field.id);

  return {
    localId: existing?.result_uuid || field.field_uuid || `field-${index}`,
    result_uuid: existing?.result_uuid,
    template_field_id: field.id,
    field_uuid: field.field_uuid,
    field_name: field.name,
    field_code: field.code,
    data_type: field.data_type,
    display_order: field.display_order,
    is_required: field.is_required,
    is_critical: field.is_critical,
    value: existing?.value || (existing && existing.numeric_value !== null ? String(existing.numeric_value) : ''),
    numeric_value: existing && existing.numeric_value !== null ? String(existing.numeric_value) : '',
    unit: existing?.unit || field.unit || '',
    reference_min:
      existing && existing.reference_min !== null && existing.reference_min !== undefined
        ? String(existing.reference_min)
        : field.reference_min !== null && field.reference_min !== undefined
        ? String(field.reference_min)
        : '',
    reference_max:
      existing && existing.reference_max !== null && existing.reference_max !== undefined
        ? String(existing.reference_max)
        : field.reference_max !== null && field.reference_max !== undefined
        ? String(field.reference_max)
        : '',
    flag: existing?.flag || LabResultFlag.PENDING,
    interpretation: existing?.interpretation || '',
    comments: existing?.comments || '',
    existingResult: existing,
    isNew: !existing,
  };
});
};
