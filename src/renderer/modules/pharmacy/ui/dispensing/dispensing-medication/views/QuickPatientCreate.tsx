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
      // Use replace instead of push to prevent going back to create form
      navigate(`${PHARMACY_ROUTES.DISPENSING_SEARCH_PRESCRIPTION}?patientId=${patient.patient_number}`, {
        replace: true,
      });
    },
    [navigate]
  );

  const handleCancel = useCallback(() => {
    navigate(PHARMACY_ROUTES.DISPENSING_PATIENT_SEARCH, { replace: true });
  }, [navigate]);

  return (
    <div className={cn(className)}>
      <PatientCreate 
        theme={theme} 
        title="Register New Patient (Pharmacy)" 
        subtitle="Create a patient record to proceed with dispensing" 
        onCreated={handleCreated} 
        onCancel={handleCancel} 
      />

      <div className="max-w-3xl mx-auto px-6 pb-8">
        <div className={cn(
          'mt-6 rounded-xl border p-4 flex items-center justify-between gap-3 transition-colors',
          theme === 'dark' 
            ? 'bg-gray-800 border-gray-700 hover:bg-gray-700/50' 
            : 'bg-white border-gray-200 hover:bg-gray-50'
        )}>
          <div className={cn('text-sm flex-1', theme === 'dark' ? 'text-gray-300' : 'text-gray-700')}>
            After registration, you'll be automatically redirected to the dispensing page to continue.
          </div>
          <div className="flex items-center gap-2 text-blue-600 flex-shrink-0">
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