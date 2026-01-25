import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, ClipboardList, FileSearch, Clock, Calendar } from 'lucide-react';
import PatientSearch from '../../../../pharmacy/ui/dispensing/dispensing-medication/views/PatientSearch';
import { cn } from '../../../../../shared/utils/classNameUtils';
import type { PatientSearchResult } from '../../../../pharmacy/api/dispensing/patient-search/usePatientTypes';
import { PatientStatus } from '../../../../pharmacy/api/dispensing/patient-search/usePatientTypes';
import { MEDICAL_RECORDS_ROUTES } from '../../../../../app/routes/routeConstants';
interface MRPatientSearchProps {
  theme: 'light' | 'dark';
  className?: string;
}

const MRPatientSearch: React.FC<MRPatientSearchProps> = ({ theme, className }) => {
  const navigate = useNavigate();
  const isDark = theme === 'dark';

  const [selectedPatient, setSelectedPatient] = useState<PatientSearchResult | null>(null);

  const handleCreateNewPatient = useCallback(
    (searchText: string) => {
      // Navigate to create patient page with pre-filled search text
      navigate(MEDICAL_RECORDS_ROUTES.PATIENTS_REGISTER, {
        state: { prefillSearch: searchText }
      });
    },
    [navigate]
  );

  const handleTakeAction = useCallback(
    (patient: PatientSearchResult) => {
      // Handle navigation to medical records view
      navigate(`${MEDICAL_RECORDS_ROUTES.VISIT_ACTION_CENTER}?patientId=${patient.patient_number}`);
    },
    [navigate]
  );

  const renderQuickActions = () => {
    if (!selectedPatient) return null;

    return (
      <div className={cn('rounded-xl border p-6 mt-6', isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200', className)}>
        <div className="flex items-center gap-3 mb-4">
          <FileText className={cn('w-5 h-5', isDark ? 'text-blue-300' : 'text-blue-700')} />
          <div className={cn('font-semibold', isDark ? 'text-white' : 'text-gray-900')}>Medical Records Quick Actions</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div 
            className={cn('p-4 rounded-lg border cursor-pointer transition-colors', 
              isDark ? 'bg-blue-900/20 border-blue-800/50 hover:bg-blue-900/30' : 'bg-blue-50 border-blue-100 hover:bg-blue-100')}
            onClick={() => handleTakeAction(selectedPatient)}
          >
            <div className="flex items-center gap-3">
              <ClipboardList className={cn('w-5 h-5', isDark ? 'text-blue-300' : 'text-blue-600')} />
              <div>
                <div className={cn('font-medium', isDark ? 'text-blue-200' : 'text-blue-900')}>View Medical Records</div>
                <div className={cn('text-sm mt-1', isDark ? 'text-blue-300' : 'text-blue-700')}>Access complete medical history</div>
              </div>
            </div>
          </div>

          <div 
            className={cn('p-4 rounded-lg border cursor-pointer transition-colors', 
              isDark ? 'bg-purple-900/20 border-purple-800/50 hover:bg-purple-900/30' : 'bg-purple-50 border-purple-100 hover:bg-purple-100')}
            onClick={() => handleTakeAction(selectedPatient)}
          >
            <div className="flex items-center gap-3">
              <FileSearch className={cn('w-5 h-5', isDark ? 'text-purple-300' : 'text-purple-600')} />
              <div>
                <div className={cn('font-medium', isDark ? 'text-purple-200' : 'text-purple-900')}>Document Search</div>
                <div className={cn('text-sm mt-1', isDark ? 'text-purple-300' : 'text-purple-700')}>Find specific documents & reports</div>
              </div>
            </div>
          </div>

          <div 
            className={cn('p-4 rounded-lg border cursor-pointer transition-colors', 
              isDark ? 'bg-green-900/20 border-green-800/50 hover:bg-green-900/30' : 'bg-green-50 border-green-100 hover:bg-green-100')}
            onClick={() => handleTakeAction(selectedPatient)}
          >
            <div className="flex items-center gap-3">
              <Clock className={cn('w-5 h-5', isDark ? 'text-green-300' : 'text-green-600')} />
              <div>
                <div className={cn('font-medium', isDark ? 'text-green-200' : 'text-green-900')}>Visit History</div>
                <div className={cn('text-sm mt-1', isDark ? 'text-green-300' : 'text-green-700')}>Review all patient visits</div>
              </div>
            </div>
          </div>

          <div 
            className={cn('p-4 rounded-lg border cursor-pointer transition-colors', 
              isDark ? 'bg-orange-900/20 border-orange-800/50 hover:bg-orange-900/30' : 'bg-orange-50 border-orange-100 hover:bg-orange-100')}
            onClick={() => handleTakeAction(selectedPatient)}
          >
            <div className="flex items-center gap-3">
              <Calendar className={cn('w-5 h-5', isDark ? 'text-orange-300' : 'text-orange-600')} />
              <div>
                <div className={cn('font-medium', isDark ? 'text-orange-200' : 'text-orange-900')}>Schedule Management</div>
                <div className={cn('text-sm mt-1', isDark ? 'text-orange-300' : 'text-orange-700')}>Manage appointments & schedules</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={cn(className)}>
      <PatientSearch
        theme={theme}
        title="Medical Records Patient Search"
        subtitle="Search for patients to access medical records, documents, and history"
        placeholder="Search by patient number, name, phone, or national ID"
        filters={{ status: PatientStatus.ACTIVE }}
        onPatientSelect={setSelectedPatient}
        onCreateNewPatient={handleCreateNewPatient}
        takeAction={{
          label: 'Take Action',
          onTakeAction: handleTakeAction,
        }}
      />

      {renderQuickActions()}
    </div>
  );
};

MRPatientSearch.displayName = 'MRPatientSearch';

export default MRPatientSearch;