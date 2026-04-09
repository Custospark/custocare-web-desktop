import React from 'react';
import { motion } from 'framer-motion';
import { Clock3 } from 'lucide-react';
import type {
  PatientFlow,
  PeakDay,
  RetentionData,
} from '../../../api/facility-patient-analytics/FacilityPatientAnalyticsTypes';
import { EmptyChartState, ProgressRow } from './dashboard.primitives';
import { cn, formatNumber, getPanelClass, getSubtlePanelClass } from './dashboard.utils';

interface DashboardOperationsSectionProps {
  isDark: boolean;
  flow: PatientFlow;
  retention: RetentionData;
  peakDays: PeakDay[];
}

const DashboardOperationsSection: React.FC<DashboardOperationsSectionProps> = ({
  isDark,
  flow,
  retention,
  peakDays,
}) => {
  const panelClass = getPanelClass(isDark);
  const subtlePanelClass = getSubtlePanelClass(isDark);

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.2 }}
      className={cn(panelClass, 'p-6')}
    >
      <div className="mb-6">
        <h2 className={cn('text-xl font-bold', isDark ? 'text-white' : 'text-slate-950')}>
          Operational Performance
        </h2>
        <p className={cn('mt-1 text-sm', isDark ? 'text-slate-400' : 'text-slate-600')}>
          Care flow efficiency, queue pressure, and patient retention performance.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className={cn(subtlePanelClass, 'p-4')}>
          <div className="mb-4 flex items-center gap-3">
            <div className={cn(
              'flex h-10 w-10 items-center justify-center rounded-2xl',
              isDark ? 'bg-blue-500/10 text-blue-300' : 'bg-blue-100 text-blue-700'
            )}>
              <Clock3 className="h-5 w-5" />
            </div>
            <div>
              <p className={cn('text-sm font-semibold', isDark ? 'text-white' : 'text-slate-900')}>
                Patient Flow
              </p>
              <p className={cn('text-xs', isDark ? 'text-slate-500' : 'text-slate-500')}>
                Avg operational timings
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className={cn('rounded-2xl border p-4', isDark ? 'border-white/10 bg-white/[0.03]' : 'border-slate-200 bg-white')}>
              <p className={cn('text-xs', isDark ? 'text-slate-500' : 'text-slate-500')}>Waiting</p>
              <p className={cn('mt-2 text-2xl font-bold', isDark ? 'text-white' : 'text-slate-950')}>
                {formatNumber(flow.average_waiting_minutes)}
                <span className="ml-1 text-sm font-medium">min</span>
              </p>
            </div>

            <div className={cn('rounded-2xl border p-4', isDark ? 'border-white/10 bg-white/[0.03]' : 'border-slate-200 bg-white')}>
              <p className={cn('text-xs', isDark ? 'text-slate-500' : 'text-slate-500')}>Consultation</p>
              <p className={cn('mt-2 text-2xl font-bold', isDark ? 'text-white' : 'text-slate-950')}>
                {formatNumber(flow.average_consultation_minutes)}
                <span className="ml-1 text-sm font-medium">min</span>
              </p>
            </div>

            <div className={cn('rounded-2xl border p-4', isDark ? 'border-white/10 bg-white/[0.03]' : 'border-slate-200 bg-white')}>
              <p className={cn('text-xs', isDark ? 'text-slate-500' : 'text-slate-500')}>Arrival → Consult</p>
              <p className={cn('mt-2 text-2xl font-bold', isDark ? 'text-white' : 'text-slate-950')}>
                {formatNumber(flow.average_arrival_to_consultation_minutes)}
                <span className="ml-1 text-sm font-medium">min</span>
              </p>
            </div>

            <div className={cn('rounded-2xl border p-4', isDark ? 'border-white/10 bg-white/[0.03]' : 'border-slate-200 bg-white')}>
              <p className={cn('text-xs', isDark ? 'text-slate-500' : 'text-slate-500')}>Queue Length</p>
              <p className={cn('mt-2 text-2xl font-bold', isDark ? 'text-white' : 'text-slate-950')}>
                {formatNumber(flow.queue_length)}
              </p>
            </div>
          </div>
        </div>

        <div className={cn(subtlePanelClass, 'p-4')}>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className={cn('text-sm font-semibold', isDark ? 'text-white' : 'text-slate-900')}>
                Retention & Continuity
              </p>
              <p className={cn('text-xs', isDark ? 'text-slate-500' : 'text-slate-500')}>
                Outcome-oriented patient loyalty indicators
              </p>
            </div>

            <div className={cn(
              'rounded-2xl border px-3 py-2 text-right',
              isDark ? 'border-white/10 bg-white/[0.03]' : 'border-slate-200 bg-white'
            )}>
              <p className={cn('text-[10px] uppercase tracking-[0.14em]', isDark ? 'text-slate-500' : 'text-slate-500')}>
                Continuity Index
              </p>
              <p className={cn('mt-1 text-lg font-bold', isDark ? 'text-white' : 'text-slate-950')}>
                {(
                  (retention.repeat_visit_rate +
                    retention.follow_up_compliance +
                    retention.returning_patients_percentage) /
                  3
                ).toFixed(1)}
                %
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <ProgressRow
              label="Repeat Visit Rate"
              value={retention.repeat_visit_rate}
              isDark={isDark}
              tone="green"
            />
            <ProgressRow
              label="Follow-up Compliance"
              value={retention.follow_up_compliance}
              isDark={isDark}
              tone="blue"
            />
            <ProgressRow
              label="Returning Patients"
              value={retention.returning_patients_percentage}
              isDark={isDark}
              tone="violet"
            />
            <ProgressRow
              label="Missed Appointment Rate"
              value={retention.missed_appointment_rate}
              isDark={isDark}
              tone="rose"
            />
          </div>
        </div>
      </div>

      <div className={cn(subtlePanelClass, 'mt-4 p-4')}>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className={cn('text-sm font-semibold', isDark ? 'text-white' : 'text-slate-900')}>
              Peak Day Intelligence
            </p>
            <p className={cn('text-xs', isDark ? 'text-slate-500' : 'text-slate-500')}>
              Highest patient-volume weekdays across the selected period
            </p>
          </div>
        </div>

        {peakDays.length ? (
          <div className="space-y-3">
            {[...peakDays]
              .sort((a, b) => b.count - a.count)
              .slice(0, 5)
              .map((item, index, arr) => {
                const max = arr[0]?.count || 1;
                const width = (item.count / max) * 100;

                return (
                  <div key={item.day} className="space-y-2">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'flex h-7 w-7 items-center justify-center rounded-xl text-xs font-bold',
                          isDark ? 'bg-white/5 text-slate-300' : 'bg-slate-100 text-slate-700'
                        )}>
                          {index + 1}
                        </div>
                        <span className={cn('text-sm font-medium', isDark ? 'text-slate-200' : 'text-slate-800')}>
                          {item.day}
                        </span>
                      </div>

                      <span className={cn('text-sm font-semibold', isDark ? 'text-white' : 'text-slate-950')}>
                        {formatNumber(item.count)}
                      </span>
                    </div>

                    <div className={cn('h-2 rounded-full', isDark ? 'bg-white/10' : 'bg-slate-100')}>
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 transition-all duration-500"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        ) : (
          <EmptyChartState
            title="No peak day data"
            subtitle="Peak weekday intelligence is not available for this range."
            isDark={isDark}
          />
        )}
      </div>
    </motion.section>
  );
};

export default DashboardOperationsSection;
