import React from 'react';
import { useSelector } from 'react-redux';
import { Eye, FileText, Receipt, AlertCircle } from 'lucide-react';
import type { RootState } from '../../app/store/rootReducer';
import { selectActivePatient, selectIsVisitCompleted } from '../../app/store/slices/visitSlice';
import { selectUser } from '../../app/store/slices/authSlice';
import { getUserFirstName } from '../utils/userGreeting';
import { cn } from '../utils/classNameUtils';

interface VisitCompletedGuardProps {
  children: React.ReactNode;
  theme?: 'light' | 'dark';
  /** Custom fallback to render instead of the default message. */
  fallback?: React.ReactNode;
}

const ALLOWED_ACTIONS = [
  { icon: FileText, text: 'View clinical reports and patient records' },
  { icon: Receipt, text: 'Review billing history and settled charges' },
  { icon: Eye, text: 'Read nursing notes, lab results, and prescriptions' },
] as const;

export const VisitCompletedGuard: React.FC<VisitCompletedGuardProps> = ({
  children,
  theme,
  fallback,
}) => {
  const isCompleted = useSelector(selectIsVisitCompleted);
  const patient = useSelector(selectActivePatient);
  const user = useSelector(selectUser);
  const isDark = theme === 'dark';

  if (!isCompleted) {
    return <>{children}</>;
  }

  const greetingName = getUserFirstName(user);
  const patientName = patient?.name || 'this patient';
  const patientNumber = patient?.patient_number;

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className={cn(
        'w-full max-w-md rounded-2xl border px-6 py-8 shadow-sm',
        isDark
          ? 'border-slate-700/80 bg-slate-900/60'
          : 'border-slate-200/90 bg-white/90',
      )}>
        <div className="text-center">
          <div className={cn(
            'mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full',
            isDark ? 'bg-blue-500/20' : 'bg-blue-100',
          )}>
            <AlertCircle className={cn(
              'h-8 w-8',
              isDark ? 'text-blue-400' : 'text-blue-600',
            )} />
          </div>

          <h2 className={cn(
            'text-lg font-bold mb-1',
            isDark ? 'text-white' : 'text-gray-900',
          )}>
            {greetingName ? `${greetingName}, this visit is closed` : 'This visit is closed'}
          </h2>

          <p className={cn(
            'text-sm mb-1',
            isDark ? 'text-gray-400' : 'text-gray-600',
          )}>
            The visit for <span className="font-semibold">{patientName}</span>
            {patientNumber ? <> (<span className="font-mono text-xs">{patientNumber}</span>)</> : null} has been marked as completed.
          </p>

          <p className={cn(
            'text-sm',
            isDark ? 'text-gray-500' : 'text-gray-500',
          )}>
            You can review existing information, but no new entries can be added at this time.
          </p>
        </div>

        <div className={cn(
          'mt-6 rounded-xl border px-4 py-4',
          isDark
            ? 'border-slate-700/60 bg-slate-800/40'
            : 'border-slate-200 bg-slate-50/80',
        )}>
          <p className={cn(
            'mb-3 text-xs font-semibold uppercase tracking-wider',
            isDark ? 'text-slate-500' : 'text-slate-500',
          )}>
            You can still
          </p>
          <ul className="space-y-3" role="list">
            {ALLOWED_ACTIONS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex gap-3">
                <span className={cn(
                  'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg',
                  isDark ? 'bg-slate-700/80 text-blue-400' : 'bg-white text-blue-600 shadow-sm',
                )}>
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <span className={cn(
                  'text-sm leading-snug',
                  isDark ? 'text-slate-300' : 'text-slate-600',
                )}>
                  {text}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default VisitCompletedGuard;
