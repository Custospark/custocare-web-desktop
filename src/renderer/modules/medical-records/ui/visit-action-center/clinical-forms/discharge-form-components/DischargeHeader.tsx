import React from 'react';
import { CalendarClock, DoorOpen, Eye, FileText, Stethoscope } from 'lucide-react';
import { cn } from '../../../../../../shared/utils/classNameUtils';
import type { ColorTokens, DischargeData } from './dischargeForm.types';

interface DischargeHeaderProps {
  theme?: 'light' | 'dark';
  colors: ColorTokens;
  dischargeData: DischargeData | null;
  onPreview?: () => void;
  onApplyTemplate?: () => void;
}

const formatDateTime = (value: string | null | undefined): string => {
  if (!value) return 'N/A';
  try {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  } catch {
    return value;
  }
};

const getDispositionLabel = (disposition: string | null | undefined): string => {
  if (!disposition) return 'Not set';
  const labels: Record<string, string> = {
    home: 'Home / Self-Care',
    admitted_to_hospital: 'Admitted to Hospital',
    transferred_to_facility: 'Transferred to Another Facility',
    left_ama: 'Left AMA',
    left_without_seen: 'Left Without Being Seen',
    expired: 'Expired',
    hospice: 'Hospice Care',
    skilled_nursing_facility: 'Skilled Nursing Facility',
    rehabilitation_facility: 'Rehabilitation Facility',
    psychiatric_facility: 'Psychiatric Facility',
    law_enforcement_custody: 'Law Enforcement Custody',
  };
  return labels[disposition] || disposition;
};

export const DischargeHeader: React.FC<DischargeHeaderProps> = ({
  theme = 'light',
  colors,
  dischargeData,
  onPreview,
  onApplyTemplate,
}) => {
  const isDark = theme === 'dark';
  const isDischarged = !!dischargeData;

  return (
    <section
      className={cn(
        'mt-6 rounded-2xl border p-5 sm:p-6',
        colors.border.primary,
        colors.bg.card
      )}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          <div className={cn('rounded-2xl p-3', colors.bg.brandSoft)}>
            <DoorOpen className={cn('h-6 w-6', colors.text.brand)} />
          </div>

          <div>
            <h2 className={cn('text-xl font-semibold', colors.text.primary)}>
              Discharge Summary
            </h2>
            <p className={cn('mt-1 text-sm', colors.text.secondary)}>
              Process patient discharge and generate discharge summary.
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold',
                  isDischarged
                    ? `${colors.state.infoSoft} ${colors.state.info}`
                    : `${colors.state.warningSoft} ${colors.state.warning}`
                )}
              >
                <Stethoscope className="h-3.5 w-3.5" />
                {isDischarged ? 'Discharged' : 'Not yet discharged'}
              </span>

              {isDischarged && dischargeData?.discharged_at && (
                <span
                  className={cn(
                    'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold',
                    isDark ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-700'
                  )}
                >
                  <CalendarClock className="h-3.5 w-3.5" />
                  {formatDateTime(dischargeData.discharged_at)}
                </span>
              )}

              {isDischarged && dischargeData?.discharge_disposition && (
                <span
                  className={cn(
                    'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold',
                    isDark ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-700'
                  )}
                >
                  Disposition: {getDispositionLabel(dischargeData.discharge_disposition)}
                </span>
              )}

              {isDischarged && dischargeData?.discharged_by?.staff_name && (
                <span
                  className={cn(
                    'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold',
                    isDark ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-700'
                  )}
                >
                  By: Dr. {dischargeData.discharged_by.staff_name}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onApplyTemplate && (
            <button
              type="button"
              onClick={onApplyTemplate}
              className={cn(
                'inline-flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-all',
                colors.border.primary, colors.text.brand, colors.bg.hover
              )}
            >
              <FileText className="h-4 w-4" />
              Template
            </button>
          )}
          {onPreview && (
            <button
              type="button"
              onClick={onPreview}
              className={cn(
                'inline-flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-all',
                colors.border.primary, colors.text.primary, colors.bg.hover
              )}
            >
              <Eye className="h-4 w-4" />
              Preview
            </button>
          )}
        </div>
      </div>
    </section>
  );
};

export default DischargeHeader;
