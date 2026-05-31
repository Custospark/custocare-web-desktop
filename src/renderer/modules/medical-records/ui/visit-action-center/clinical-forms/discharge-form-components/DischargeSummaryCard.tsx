import React from 'react';
import {
  CalendarClock,
  DoorOpen,
  FilePenLine,
  FileText,
  ListChecks,
  Pill,
  UserRound,
} from 'lucide-react';
import { cn } from '../../../../../../shared/utils/classNameUtils';
import type { ColorTokens, DischargeData } from './dischargeForm.types';

interface DischargeSummaryCardProps {
  theme?: 'light' | 'dark';
  colors: ColorTokens;
  dischargeData: DischargeData;
  onEdit: () => void;
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

const getDispositionDisplay = (disposition: string | null | undefined): { label: string; color: string } => {
  if (!disposition) return { label: 'Not set', color: 'bg-slate-100 text-slate-700' };
  const map: Record<string, { label: string; color: string }> = {
    home: { label: 'Home / Self-Care', color: 'bg-emerald-100 text-emerald-700' },
    admitted_to_hospital: { label: 'Admitted to Hospital', color: 'bg-blue-100 text-blue-700' },
    transferred_to_facility: { label: 'Transferred', color: 'bg-indigo-100 text-indigo-700' },
    left_ama: { label: 'Left AMA', color: 'bg-amber-100 text-amber-700' },
    left_without_seen: { label: 'Left Without Seen', color: 'bg-orange-100 text-orange-700' },
    expired: { label: 'Expired', color: 'bg-red-100 text-red-700' },
    hospice: { label: 'Hospice Care', color: 'bg-purple-100 text-purple-700' },
    skilled_nursing_facility: { label: 'Skilled Nursing', color: 'bg-cyan-100 text-cyan-700' },
    rehabilitation_facility: { label: 'Rehabilitation', color: 'bg-blue-100 text-blue-700' },
    psychiatric_facility: { label: 'Psychiatric Facility', color: 'bg-violet-100 text-violet-700' },
    law_enforcement_custody: { label: 'Law Enforcement Custody', color: 'bg-slate-100 text-slate-700' },
  };
  return map[disposition] || { label: disposition, color: 'bg-slate-100 text-slate-700' };
};

const InfoRow: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}> = ({ icon, label, value }) => (
  <div className="flex items-start gap-3 py-2">
    <div className="mt-0.5 shrink-0">{icon}</div>
    <div className="min-w-0 flex-1">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-slate-800">{value}</p>
    </div>
  </div>
);

export const DischargeSummaryCard: React.FC<DischargeSummaryCardProps> = ({
  theme = 'light',
  colors,
  dischargeData,
  onEdit,
}) => {
  const isDark = theme === 'dark';
  const disposition = getDispositionDisplay(dischargeData.discharge_disposition);
  const hasMedications = dischargeData.discharge_medications?.length > 0;
  const hasInstructions = !!dischargeData.discharge_instructions;

  return (
    <section
      className={cn(
        'rounded-2xl border mb-6',
        colors.border.primary,
        colors.bg.card
      )}
    >
      <div className={cn('border-b p-5 sm:p-6', colors.border.primary)}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <DoorOpen className={cn('h-5 w-5', colors.text.brand)} />
              <h3 className={cn('text-lg font-semibold', colors.text.primary)}>
                Discharge Summary
              </h3>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              <span
                className={cn(
                  'rounded-full px-3 py-1 font-medium',
                  isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'
                )}
              >
                Discharged: {formatDateTime(dischargeData.discharged_at)}
              </span>

              {dischargeData.discharged_by?.staff_name && (
                <span
                  className={cn(
                    'rounded-full px-3 py-1 font-medium',
                    isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'
                  )}
                >
                  By: Dr. {dischargeData.discharged_by.staff_name}
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onEdit}
            className={cn(
              'inline-flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-all',
              isDark
                ? 'border-amber-800/50 bg-amber-950/30 text-amber-300 hover:bg-amber-950/50'
                : 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
            )}
          >
            <FilePenLine className="h-4 w-4" />
            Edit Discharge
          </button>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <InfoRow
            icon={<CalendarClock className="h-4 w-4 text-slate-400" />}
            label="Discharge Date"
            value={formatDateTime(dischargeData.discharged_at)}
          />

          <InfoRow
            icon={<DoorOpen className="h-4 w-4 text-slate-400" />}
            label="Disposition"
            value={
              <span className={cn('inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold', disposition.color)}>
                {disposition.label}
              </span>
            }
          />
        </div>

        {dischargeData.discharge_diagnosis && (
          <div className={cn('mt-4 rounded-xl border p-4', colors.border.primary, colors.bg.subtle)}>
            <div className="flex items-center gap-2 mb-2">
              <ListChecks className="h-4 w-4 text-slate-400" />
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Discharge Diagnosis
              </span>
            </div>
            <p className={cn('text-sm', colors.text.primary)}>
              {dischargeData.discharge_diagnosis}
            </p>
          </div>
        )}

        {hasInstructions && (
          <div className={cn('mt-4 rounded-xl border p-4', colors.border.primary, colors.bg.subtle)}>
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-slate-400" />
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Discharge Instructions
              </span>
            </div>
            <p className={cn('text-sm whitespace-pre-line', colors.text.primary)}>
              {(dischargeData.discharge_instructions ?? '').length > 300
                ? `${(dischargeData.discharge_instructions ?? '').slice(0, 300)}...`
                : dischargeData.discharge_instructions}
            </p>
          </div>
        )}

        {hasMedications && (
          <div className={cn('mt-4 rounded-xl border p-4', colors.border.primary, colors.bg.subtle)}>
            <div className="flex items-center gap-2 mb-3">
              <Pill className="h-4 w-4 text-slate-400" />
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Discharge Medications ({dischargeData.discharge_medications.length})
              </span>
            </div>
            <div className="space-y-2">
              {dischargeData.discharge_medications.map((med, idx) => (
                <div
                  key={idx}
                  className={cn(
                    'flex items-center justify-between rounded-lg border px-3 py-2 text-sm',
                    colors.border.primary
                  )}
                >
                  <span className={cn('font-medium', colors.text.primary)}>{med.name}</span>
                  <span className={cn('text-xs', colors.text.secondary)}>
                    {med.dosage} | {med.frequency} | {med.route}
                    {med.duration_days ? ` | ${med.duration_days}d` : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {(dischargeData.followup_scheduled_at || dischargeData.followup_provider) && (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {dischargeData.followup_scheduled_at && (
              <InfoRow
                icon={<CalendarClock className="h-4 w-4 text-slate-400" />}
                label="Follow-up Date"
                value={formatDateTime(dischargeData.followup_scheduled_at)}
              />
            )}
            {dischargeData.followup_provider && (
              <InfoRow
                icon={<UserRound className="h-4 w-4 text-slate-400" />}
                label="Follow-up Provider"
                value={`Dr. ${dischargeData.followup_provider.staff_name}`}
              />
            )}
          </div>
        )}

        {dischargeData.discharged_by && (
          <div className="mt-4 flex items-center gap-2 text-sm">
            <UserRound className={cn('h-4 w-4', colors.text.tertiary)} />
            <span className={colors.text.secondary}>Discharged by:</span>
            <span className={cn('font-medium', colors.text.primary)}>
              Dr. {dischargeData.discharged_by.staff_name}
            </span>
          </div>
        )}
      </div>
    </section>
  );
};

export default DischargeSummaryCard;
