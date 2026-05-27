import React from 'react';
import { User, GitBranch, MapPin } from 'lucide-react';
import type { UseFormReset, UseFormWatch } from 'react-hook-form';

import {
  CARE_DELIVERY_WORKFLOW_LABELS,
  ENCOUNTER_WORKFLOW_STAGE_HINTS,
  type CareDeliveryWorkflow,
} from '../../../../../pharmacy/api/dispensing/visit-queue/visitTypes';

import { useAccessibleWorkflows } from '../../../../../../shared/hooks/useAccessibleWorkflows';

import type { ForwardPatientFormData } from './schema';
import type { ForwardPatientColors } from './constants';

export interface ForwardingModeSectionProps {
  isDark: boolean;
  colors: ForwardPatientColors;
  watch: UseFormWatch<ForwardPatientFormData>;
  reset: UseFormReset<ForwardPatientFormData>;
  currentWorkflow?: CareDeliveryWorkflow | null;
}

export const ForwardingModeSection: React.FC<ForwardingModeSectionProps> = ({
  isDark,
  colors,
  watch,
  reset,
  currentWorkflow,
}) => {
  const mode = watch('forwarding_mode');
  const selectedWorkflow =
    mode === 'workflow' ? watch('care_delivery_workflow') : undefined;
  const accessibleWorkflows = useAccessibleWorkflows();

  const switchToWorkflow = () => {
    const note = watch('note');
    reset({
      forwarding_mode: 'workflow',
      ...(selectedWorkflow ? { care_delivery_workflow: selectedWorkflow } : {}),
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
        <h3 className={`text-sm font-semibold ${colors.text.primary}`}>Where should this patient go next?</h3>
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
          'Specific Team member',
          'Pick someone from the directory below.',
          <User className="h-4 w-4" />,
          mode === 'staff',
          switchToStaff
        )}
      </div>

      {currentWorkflow && (
        <div className={`rounded-lg border px-3 py-2.5 ${isDark ? 'border-indigo-800/40 bg-indigo-950/25' : 'border-indigo-200 bg-indigo-50'}`}>
          <div className="flex items-center gap-2">
            <MapPin className={`h-4 w-4 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
            <span className={`text-xs font-medium ${isDark ? 'text-indigo-300' : 'text-indigo-700'}`}>
              Currently at
            </span>
            <span className={`text-sm font-semibold ${isDark ? 'text-indigo-200' : 'text-indigo-800'}`}>
              {CARE_DELIVERY_WORKFLOW_LABELS[currentWorkflow]}
            </span>
          </div>
        </div>
      )}

      {mode === 'workflow' && (
        <div className="space-y-2">
          <p className={`text-xs font-medium ${colors.text.secondary}`}>Care step</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {accessibleWorkflows.map((wf) => {
              const selected = selectedWorkflow === wf;
              const isCurrentStep = wf === currentWorkflow;
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
                  className={`relative rounded-lg border px-3 py-2.5 text-left text-sm transition-colors cursor-pointer ${
                    selected
                      ? isDark
                        ? 'border-emerald-500/60 bg-emerald-950/35 text-emerald-100'
                        : 'border-emerald-400 bg-emerald-50 text-emerald-900'
                      : isCurrentStep
                        ? isDark
                          ? 'border-indigo-600/50 bg-indigo-950/20 text-indigo-100'
                          : 'border-indigo-300 bg-indigo-50/80 text-indigo-900'
                        : `${colors.border.primary} ${colors.bg.primary} ${colors.text.primary} ${colors.bg.hover}`
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    {isCurrentStep && (
                      <MapPin className={`h-3.5 w-3.5 ${isDark ? 'text-indigo-400' : 'text-indigo-500'}`} />
                    )}
                    <span className="font-medium">{CARE_DELIVERY_WORKFLOW_LABELS[wf]}</span>
                    {isCurrentStep && (
                      <span className={`ml-1 inline-block rounded-full px-1.5 py-0.5 text-[10px] font-medium leading-tight ${
                        isDark ? 'bg-indigo-900/60 text-indigo-300' : 'bg-indigo-100 text-indigo-700'
                      }`}>
                        Current
                      </span>
                    )}
                  </div>
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
