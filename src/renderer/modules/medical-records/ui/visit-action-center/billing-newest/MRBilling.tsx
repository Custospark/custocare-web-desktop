// MRBilling.tsx
// Medical Records Billing Component
import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  selectActiveVisit,
  selectActivePatient,
  selectActiveVisitUuid,
} from '../../../../../app/store/slices/visitSlice';

import BillingSpace from '../billing-new/BillingSpace';
import { BillingTray } from './BillingTray';
import { loadDraft } from './billing-slice';
import { setPatientInfo } from './billing-slice';

interface MRBillingProps {
  theme?: 'light' | 'dark';
  departmentId?: number;
  staffId?: number;
  facilityId?: number;
}

const MRBilling: React.FC<MRBillingProps> = ({
  theme = 'light',
}) => {
  const dispatch = useDispatch();
  
  // Select visit data from Redux store
  const activeVisit = useSelector(selectActiveVisit);
  const activePatient = useSelector(selectActivePatient);
  const visitUuid = useSelector(selectActiveVisitUuid);

  // Load billing draft when visit changes
  useEffect(() => {
    if (visitUuid) {
      // Load draft for this visit
      dispatch(loadDraft(visitUuid));
      
      // Set patient info in billing state
      if (activePatient) {
        dispatch(setPatientInfo({
          visitId: visitUuid,
          patientId: activePatient.patient_number,
          patientName: activePatient.name,
        }));
      }
    }
  }, [visitUuid, activePatient, dispatch]);

  // If no active visit, show minimal empty state
  if (!activeVisit || !activePatient) {
    return (
      <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-8 text-center">
        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          No Active Visit
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Select a patient visit to start billing
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Visit Header */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-gray-100">
                {activePatient.name}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {activePatient.patient_number} • {activeVisit.visit_type || 'Consultation'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Visit ID</div>
            <div className="font-mono text-sm text-gray-700 dark:text-gray-300">
              {visitUuid?.slice(0, 8)}...
            </div>
          </div>
        </div>
      </div>

      {/* Billing Space Component */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Billing Controls
        </h3>
        <BillingSpace 
          theme={theme}
        />
      </div>

      {/* Billing Tray Overlay */}
      <BillingTray theme={theme} />
    </div>
  );
};

export default MRBilling;