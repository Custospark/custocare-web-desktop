import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, ArrowRight, ClipboardList } from 'lucide-react';

import PatientCreate from '../../../../pharmacy/ui/dispensing/dispensing-medication/views/PatientCreate';
import { cn } from '../../../../../shared/utils/classNameUtils';
import type { PatientSearchResult } from '../../../../pharmacy/api/dispensing/patient-search/usePatientTypes';
import { MEDICAL_RECORDS_ROUTES } from '../../../../../app/routes/routeConstants';

interface MRPatientCreateProps {
  theme: 'light' | 'dark';
  className?: string;
}

const MRPatientCreate: React.FC<MRPatientCreateProps> = ({ theme, className }) => {
  const navigate = useNavigate();

  const handleSuccess = useCallback(
    (patient: PatientSearchResult) => {
      // Handle immediate success (e.g., analytics, logging)
      console.log('Patient created successfully:', patient.patient_number);
    },
    []
  );

  const handleProceed = useCallback(
    (patient: PatientSearchResult) => {
      // Navigate to medical records action center after user clicks "Continue"
      navigate(`${MEDICAL_RECORDS_ROUTES.VISIT_ACTION_CENTER}?patientId=${patient.patient_number}`, {
        replace: true,
      });
    },
    [navigate]
  );

  const handleCancel = useCallback(() => {
    navigate(MEDICAL_RECORDS_ROUTES.PATIENTS_SEARCH, { replace: true });
  }, [navigate]);

  return (
    <div className={cn(className)}>
      <PatientCreate 
        theme={theme} 
        title="Register New Patient (Medical Records)" 
        subtitle="Create a new patient record for medical documentation and history tracking" 
        onSuccess={handleSuccess} 
        onProceed={handleProceed}
        onCancel={handleCancel} 
      />

      <div className="max-w-3xl mx-auto px-6 pb-8">
        <div className={cn(
          'mt-6 rounded-xl border p-4 flex items-center justify-between gap-3 transition-colors cursor-pointer',
          theme === 'dark' 
            ? 'bg-gray-800 border-gray-700 hover:bg-gray-700/50' 
            : 'bg-white border-gray-200 hover:bg-gray-50'
        )}
        onClick={() => navigate(MEDICAL_RECORDS_ROUTES.PATIENTS_SEARCH)}
        >
          <div className={cn('text-sm flex-1', theme === 'dark' ? 'text-gray-300' : 'text-gray-700')}>
            After registration, you'll see a confirmation modal with the patient number. 
            Click "Continue" to go to the medical records action center, or return here to search.
          </div>
          <div className="flex items-center gap-2 text-blue-600 flex-shrink-0">
            <ClipboardList className="w-4 h-4" />
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>

        {/* Information Section */}
        <div className={cn(
          'mt-4 p-4 rounded-lg border',
          theme === 'dark' 
            ? 'bg-blue-900/20 border-blue-800/30' 
            : 'bg-blue-50 border-blue-100'
        )}>
          <div className="flex items-start gap-3">
            <FileText className={cn('w-5 h-5 mt-0.5', theme === 'dark' ? 'text-blue-400' : 'text-blue-600')} />
            <div>
              <h4 className={cn('font-medium mb-1', theme === 'dark' ? 'text-blue-300' : 'text-blue-800')}>
                Medical Records Information
              </h4>
              <p className={cn('text-sm', theme === 'dark' ? 'text-blue-400/90' : 'text-blue-700')}>
                New patients will have a complete medical record created. 
                You can add visit notes, upload documents, and manage appointments after registration.
                The patient number will be displayed in the confirmation modal for easy reference.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

MRPatientCreate.displayName = 'MRPatientCreate';
export default MRPatientCreate;