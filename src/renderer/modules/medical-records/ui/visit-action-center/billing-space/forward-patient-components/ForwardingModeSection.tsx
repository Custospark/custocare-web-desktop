import React from 'react';
import { User, GitBranch } from 'lucide-react';
import type { UseFormReset, UseFormWatch } from 'react-hook-form';

import {
  CARE_DELIVERY_WORKFLOW_LABELS,
  DEFAULT_ENCOUNTER_WORKFLOW_STAGE,
  ENCOUNTER_WORKFLOW_STAGE_HINTS,
  ENCOUNTER_WORKFLOW_STAGE_ORDER,
} from '../../../../../pharmacy/api/dispensing/visit-queue/visitTypes';

import type { ForwardPatientFormData } from './schema';
import type { ForwardPatientColors } from './constants';

export interface ForwardingModeSectionProps {
  isDark: boolean;
  colors: ForwardPatientColors;
  watch: UseFormWatch<ForwardPatientFormData>;
  reset: UseFormReset<ForwardPatientFormData>;
}

export const ForwardingModeSection: React.FC<ForwardingModeSectionProps> = ({
  isDark,
  colors,
  watch,
  reset,
}) => {
  const mode = watch('forwarding_mode');
  const selectedWorkflow =
    mode === 'workflow' ? watch('care_delivery_workflow') : undefined;

  const switchToWorkflow = () => {
    const note = watch('note');
    reset({
      forwarding_mode: 'workflow',
      care_delivery_workflow: selectedWorkflow ?? DEFAULT_ENCOUNTER_WORKFLOW_STAGE,
      note: note ?? '',
    });
  };

  const switchToStaff = () => {
    const note = watch('note');
    reset({
      forwarding_mode: 'staff',
      assigned_staff_id: 0,
      note: note ?? '',
    });
  };

  const modeButton = (
    _id: 'staff' | 'workflow',
    label: string,
    description: string,
    icon: React.ReactNode,
    active: boolean,
    onClick: () => void
  ) => (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 min-w-[140px] flex-col items-start gap-1 rounded-xl border p-4 text-left transition-colors cursor-pointer ${
        active
          ? isDark
            ? 'border-blue-500/70 bg-blue-950/40 ring-1 ring-blue-500/40'
            : 'border-blue-400 bg-blue-50 ring-1 ring-blue-200'
          : `${colors.border.primary} ${colors.bg.hover}`
      }`}
    >
      <div className="flex items-center gap-2">
        <span className={active ? (isDark ? 'text-blue-300' : 'text-blue-700') : colors.text.tertiary}>
          {icon}
        </span>
        <span className={`text-sm font-semibold ${colors.text.primary}`}>{label}</span>
      </div>
      <p className={`text-xs ${colors.text.secondary}`}>{description}</p>
    </button>
  );

  return (
    <div className="space-y-4">
      <div>
        <h3 className={`text-sm font-semibold ${colors.text.primary}`}>Where should this visit go next?</h3>
        <p className={`mt-1 text-xs ${colors.text.secondary}`}>
          Default is a team queue. You can switch to one person if you already know who should take
          it.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        {modeButton(
          'workflow',
          'Team queue',
          'Shown in the chosen care step list for your site.',
          <GitBranch className="h-4 w-4" />,
          mode === 'workflow',
          switchToWorkflow
        )}
        {modeButton(
          'staff',
          'Specific person',
          'Pick someone from the directory below.',
          <User className="h-4 w-4" />,
          mode === 'staff',
          switchToStaff
        )}
      </div>

      {mode === 'workflow' && (
        <div className="space-y-2">
          <p className={`text-xs font-medium ${colors.text.secondary}`}>Care step</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {ENCOUNTER_WORKFLOW_STAGE_ORDER.map((wf) => {
              const selected = selectedWorkflow === wf;
              const hint =
                ENCOUNTER_WORKFLOW_STAGE_HINTS[wf] ?? 'Next team picks it up from their queue.';
              return (
                <button
                  key={wf}
                  type="button"
                  onClick={() => {
                    const note = watch('note');
                    reset({
                      forwarding_mode: 'workflow',
                      care_delivery_workflow: wf,
                      note: note ?? '',
                    });
                  }}
                  className={`rounded-lg border px-3 py-2.5 text-left text-sm transition-colors cursor-pointer ${
                    selected
                      ? isDark
                        ? 'border-emerald-500/60 bg-emerald-950/35 text-emerald-100'
                        : 'border-emerald-400 bg-emerald-50 text-emerald-900'
                      : `${colors.border.primary} ${colors.bg.primary} ${colors.text.primary} ${colors.bg.hover}`
                  }`}
                >
                  <span className="font-medium">{CARE_DELIVERY_WORKFLOW_LABELS[wf]}</span>
                  <span className={`mt-0.5 block text-xs ${colors.text.secondary}`}>{hint}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
