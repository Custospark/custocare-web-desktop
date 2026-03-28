import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  selectActiveVisit,
  selectActivePatient,
  selectActiveVisitUuid,
} from '../../../../../app/store/slices/visitSlice';

import { BillingTray } from './BillingTray';
import { loadDraft } from './billingSlice';
import { setPatientInfo } from './billingSlice';
import { BillingSpace } from './BillingSpace';
import {BillingBottomDisplay} from './BillingBottomDisplay'

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
      
      {/* Billing Space Component */}       
        <BillingSpace 
          theme={theme}
        />
        <BillingBottomDisplay 
          theme={theme}
        />

      {/* Billing Tray Overlay */}
      <BillingTray />
    </div>
  );
};

export default MRBilling;