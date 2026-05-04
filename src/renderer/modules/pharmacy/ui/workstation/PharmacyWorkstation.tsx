/**
 * Superseded by `PharmacyActionCenter` — `/pharmacy/workstation` redirects to `/pharmacy/action-center/dispensing`.
 */
import React, { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate, useNavigate } from 'react-router-dom';
import { Receipt, Users } from 'lucide-react';

import { PHARMACY_ROUTES } from '../../../../app/routes/routeConstants';
import { emergencyClearVisit } from '../../../../app/store/slices/visitSlice';
import {
  selectActivePatient,
  selectActiveVisitId,
  selectActiveVisitInfo,
  selectActiveVisitPatientId,
  selectHasActiveVisit,
} from '../../../../app/store/slices/visitSlice';
import { clearAll } from '../../../medical-records/ui/visit-action-center/billing-space';
import { openTray } from '../../../../app/store/slices/billingSlice';
import { cn } from '../../../../shared/utils/classNameUtils';

import PrescriptionWorkbench from '../precriptions/views/PrescriptionWorkbench';

export interface PharmacyWorkstationProps {
  theme: 'light' | 'dark';
  className?: string;
}

const PharmacyWorkstation: React.FC<PharmacyWorkstationProps> = ({ theme, className = '' }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const hasVisit = useSelector(selectHasActiveVisit);
  const visitInfo = useSelector(selectActiveVisitInfo);
  const activePatient = useSelector(selectActivePatient);
  const visitId = useSelector(selectActiveVisitId);
  const patientId = useSelector(selectActiveVisitPatientId);

  const handleOpenBillingTray = useCallback(() => {
    if (visitId == null || patientId == null) return;
    dispatch(
      openTray({
        step: 'charge_entry',
        visitId: String(visitId),
        patientId: String(patientId),
        patientName: activePatient?.name ?? visitInfo?.patientName ?? undefined,
      })
    );
  }, [dispatch, visitId, patientId, activePatient?.name, visitInfo?.patientName]);

  const handleWorkOnAnotherPatient = useCallback(() => {
    if (visitId != null) {
      sessionStorage.removeItem(`billing_draft_${String(visitId)}`);
    }
    dispatch(emergencyClearVisit());
    dispatch(clearAll());
    navigate(PHARMACY_ROUTES.PATIENT_QUEUE);
  }, [dispatch, navigate, visitId]);

  if (!hasVisit) {
    return <Navigate to={PHARMACY_ROUTES.PATIENT_QUEUE} replace />;
  }

  const isDark = theme === 'dark';

  return (
    <div
      className={cn(
        'mx-auto max-w-6xl space-y-4 p-4 sm:p-5',
        isDark ? 'text-gray-100' : 'text-gray-900',
        className
      )}
    >
      <div
        className={cn(
          'flex flex-col gap-3 rounded-xl border-2 p-4 sm:flex-row sm:items-center sm:justify-between',
          isDark ? 'border-gray-700 bg-gray-900/80' : 'border-blue-200 bg-white'
        )}
      >
        <div className="min-w-0">
          <p className={cn('text-xs font-medium uppercase tracking-wide', isDark ? 'text-gray-400' : 'text-gray-500')}>
            Active encounter
          </p>
          <h2 className="truncate text-lg font-semibold">{visitInfo?.patientName ?? 'Patient'}</h2>
          <p className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-600')}>
            MRN #{visitInfo?.patientNumber ?? '—'} · Visit {visitInfo?.uuid ?? '—'} · Phase{' '}
            {visitInfo?.phase?.replace(/_/g, ' ') ?? '—'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleOpenBillingTray}
            className={cn(
              'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium',
              'bg-blue-600 text-white hover:bg-blue-700',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
            )}
          >
            <Receipt className="h-4 w-4 shrink-0" aria-hidden />
            Billing tray
          </button>
          <button
            type="button"
            onClick={handleWorkOnAnotherPatient}
            className={cn(
              'inline-flex items-center gap-2 rounded-lg border-2 px-4 py-2 text-sm font-medium',
              isDark
                ? 'border-gray-600 text-gray-100 hover:bg-gray-800'
                : 'border-gray-300 text-gray-800 hover:bg-gray-50'
            )}
          >
            <Users className="h-4 w-4 shrink-0" aria-hidden />
            Work on another patient
          </button>
        </div>
      </div>

      <div
        className={cn(
          'rounded-lg border p-3 text-sm',
          isDark ? 'border-amber-800/50 bg-amber-950/40 text-amber-100' : 'border-amber-200 bg-amber-50 text-amber-900'
        )}
      >
        <strong className="font-semibold">Dispensing & billing:</strong> use the billing tray to search billable
        items and add dispensed medications to this visit. When fulfillment is complete, mark the prescription
        dispensed below so inventory and clinical status stay aligned.
      </div>

      <PrescriptionWorkbench theme={theme} mode="queue" scope="activeVisit" />
    </div>
  );
};

PharmacyWorkstation.displayName = 'PharmacyWorkstation';

export default PharmacyWorkstation;
