import React from 'react';
import { useNavigate } from 'react-router-dom';

import PatientQueue from './PatientQueue';
import { cn } from '../../../../../../shared/utils/classNameUtils';
import { PHARMACY_ROUTES } from '../../../../../../app/routes/routeConstants';
import type { QueuePatient } from '../../../../api/dispensing/visit-queue/visitTypes';

/* -------------------------------------------------------------------------- */
/*                               TYPE DEFINITIONS                             */
/* -------------------------------------------------------------------------- */

type Theme = 'light' | 'dark';

export interface DispensingQueueProps {
  theme: Theme;
  className?: string;
}

/* -------------------------------------------------------------------------- */
/*                              MAIN COMPONENT                                */
/* -------------------------------------------------------------------------- */

const DispensingQueue: React.FC<DispensingQueueProps> = ({ theme, className = '' }) => {
  const navigate = useNavigate();

  const handlePatientSelect = (patient: QueuePatient) => {
    // Handle patient selection (optional)
    console.log('Patient selected:', patient.patient_number);
  };

  const handleTakeAction = (patient: QueuePatient) => {
    // Navigation handled by this component
    navigate(`${PHARMACY_ROUTES.DISPENSING_SEARCH_PRESCRIPTION}?patientId=${encodeURIComponent(patient.patient_number)}`);
  };

  const handleCreateNewPatient = () => {
    // Navigation handled by this component
    navigate(PHARMACY_ROUTES.DISPENSING_QUICK_CREATE);
  };

  return (
    <div className={cn(className)}>
      <PatientQueue
        title="Dispensing Queue"
        description="Patients waiting for medication dispensing"
        onPatientSelect={handlePatientSelect}
        onTakeAction={handleTakeAction}
        actionButtonText="Take Action"
        showStats={true}
        allowPhaseFilter={true}
        allowDepartmentFilter={false}
        showUnassignedToggle={true}
        theme={theme}
        className="cursor-default"
        initialFilters={{
          current_phase: undefined,
          department_id: undefined,
          include_unassigned: false,
          limit: 50,
        }}
      />

      {/* Create New Patient CTA */}
      <div className="max-w-6xl mx-auto px-6 pb-8">
        <div className={cn(
          'mt-6 rounded-xl border p-4 flex items-center justify-between gap-3 transition-colors cursor-pointer',
          theme === 'dark' 
            ? 'bg-gray-800 border-gray-700 hover:bg-gray-700/50' 
            : 'bg-white border-gray-200 hover:bg-gray-50'
        )}
        onClick={handleCreateNewPatient}
        >
          <div className={cn('text-sm flex-1', theme === 'dark' ? 'text-gray-300' : 'text-gray-700')}>
            Need to register a new patient? Click here to create a new patient record.
          </div>
          <div className="flex items-center gap-2 text-blue-600 flex-shrink-0">
            <span className="font-medium">New Patient</span>
          </div>
        </div>
      </div>
    </div>
  );
};

DispensingQueue.displayName = 'DispensingQueue';

export default DispensingQueue;