import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Pill } from 'lucide-react';

import PatientCreate from './PatientCreate';
import { cn } from '../../../../../../shared/utils/classNameUtils';
import type { PatientSearchResult } from '../../../../api/dispensing/patient-search/usePatientTypes';
import { PHARMACY_ROUTES } from '../../../../../../app/routes/routeConstants';

interface QuickPatientCreateProps {
  theme: 'light' | 'dark';
  className?: string;
}

const QuickPatientCreate: React.FC<QuickPatientCreateProps> = ({ theme, className }) => {
  const navigate = useNavigate();

  const handleCreated = useCallback(
    (patient: PatientSearchResult) => {
      navigate(`${PHARMACY_ROUTES.DISPENSING_SEARCH_PRESCRIPTION}?patientId=${patient.patient_number}`);
    },
    [navigate]
  );

  const handleCancel = useCallback(() => {
    navigate(PHARMACY_ROUTES.DISPENSING_PATIENT_SEARCH);
  }, [navigate]);

  return (
    <div className={cn(className)}>
      <PatientCreate theme={theme} title="Register New Patient (Pharmacy)" subtitle="Create a patient record to proceed with dispensing" onCreated={handleCreated} onCancel={handleCancel} />

      <div className="max-w-3xl mx-auto px-6 pb-8">
        <div className={cn('mt-6 rounded-xl border p-4 flex items-center justify-between gap-3', theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200')}>
          <div className={cn('text-sm', theme === 'dark' ? 'text-gray-300' : 'text-gray-700')}>After registration, you'll be redirected to dispensing.</div>
          <div className="flex items-center gap-2 text-blue-600">
            <Pill className="w-4 h-4" />
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
};

QuickPatientCreate.displayName = 'QuickPatientCreate';
export default QuickPatientCreate;
