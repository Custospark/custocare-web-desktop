// MRPatientSearch.tsx
import React, { useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, ClipboardList, FileSearch, Clock, Calendar, CheckCircle2, Loader2, Heart } from 'lucide-react';

import PatientSearch from '../../../../pharmacy/ui/dispensing/dispensing-medication/views/PatientSearch';
import { cn } from '../../../../../shared/utils/classNameUtils';
import type { PatientSearchResult } from '../../../../pharmacy/api/dispensing/patient-search/usePatientTypes';
import { PatientStatus } from '../../../../pharmacy/api/dispensing/patient-search/usePatientTypes';
import { MEDICAL_RECORDS_ROUTES } from '../../../../../app/routes/routeConstants';
import { useCreateVisit } from '../../../../pharmacy/api/dispensing/visit-queue/useVisitQueries';
import { useAppSelector } from '../../../../../app/store/hooks/useApp';
import { 
  getActiveFacilityId, 
  getStaffId,
  hasCompleteStaffContext
} from '../../../../../app/store/utils/contextSelectors';
import { setActiveVisit } from '../../../../../app/store/slices/visitSlice';
import { VisitPhase, VisitType } from '../../../../pharmacy/api/dispensing/visit-queue/visitTypes';
import { useToast } from '../../../../../app/store/contexts/toast/useToast';

interface MRPatientSearchProps {
  theme: 'light' | 'dark';
  className?: string;
}

// Processing overlay component (reused from MRPatientCreate)
const VisitProcessingOverlay: React.FC<{ 
  theme: 'light' | 'dark'; 
  patientName?: string;
  stage: 'creating' | 'saving' | 'redirecting';
}> = ({ theme, patientName, stage }) => {
  const stages = {
    creating: { message: `Processing visit for ${patientName || 'patient'}`, subMessage: 'Creating visit record...' },
    saving: { message: 'Processing visit data', subMessage: 'Saving visit information...' },
    redirecting: { message: 'Processing complete', subMessage: 'Redirecting to action center...' }
  };
  
  const currentStage = stages[stage];
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.2 } }}
      role="status"
      aria-live="assertive"
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
    >
      <motion.div
        initial={{ scale: 0.85, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.85, opacity: 0, y: 20 }}
        transition={{ type: "spring", stiffness: 150, damping: 20 }}
        className={cn(
          "p-10 rounded-3xl flex flex-col items-center gap-6 border-2 shadow-2xl max-w-sm mx-4",
          theme === 'dark' 
            ? "bg-slate-900 border-slate-700" 
            : "bg-white border-slate-200"
        )}
      >
        <div className="relative">
          {stage === 'creating' && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
              className={cn(
                "w-20 h-20 border-[4px] rounded-full",
                theme === 'dark' 
                  ? "border-blue-500/30 border-t-blue-500 shadow-lg shadow-blue-500/20" 
                  : "border-blue-500/30 border-t-blue-600 shadow-lg shadow-blue-500/30"
              )}
              aria-hidden="true"
            />
          )}
          
          {stage === 'saving' && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-20 h-20 relative"
            >
              <Loader2 className={cn(
                "w-full h-full",
                theme === 'dark' ? "text-emerald-500" : "text-emerald-600"
              )} />
            </motion.div>
          )}
          
          {stage === 'redirecting' && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
            >
              <CheckCircle2 className={cn(
                "w-20 h-20",
                theme === 'dark' ? "text-emerald-500" : "text-emerald-600"
              )} />
            </motion.div>
          )}
          
          <motion.div
            animate={{ 
              scale: [1, 1.25, 1],
              rotate: [0, 180, 360]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          >
            <Heart className="w-9 h-9 text-blue-500 drop-shadow-lg" aria-hidden="true" />
          </motion.div>
        </div>
        
        <div className="text-center space-y-2">
          <motion.p 
            className={cn(
              "font-bold text-xl tracking-tight",
              theme === 'dark' ? "text-white" : "text-slate-900"
            )}
            animate={{ opacity: [1, 0.6, 1] }}
            transition={{ duration: 1.8, repeat: Infinity }}
          >
            {currentStage.message}
          </motion.p>
          <p className={cn(
            "text-sm font-medium",
            theme === 'dark' ? "text-slate-400" : "text-slate-600"
          )}>
            {currentStage.subMessage}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};

const MRPatientSearch: React.FC<MRPatientSearchProps> = ({ theme, className }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { showToast } = useToast();
  const isDark = theme === 'dark';

  const [selectedPatient, setSelectedPatient] = useState<PatientSearchResult | null>(null);
  const [processingStage, setProcessingStage] = useState<'creating' | 'saving' | 'redirecting' | null>(null);
  const [currentPatient, setCurrentPatient] = useState<PatientSearchResult | null>(null);

  // Get all necessary context data
  const facilityId = useAppSelector(getActiveFacilityId);
  const staffId = useAppSelector(getStaffId);
  const hasCompleteStaff = useAppSelector(hasCompleteStaffContext);
  
  const createVisitMutation = useCreateVisit();

  const handleCreateNewPatient = useCallback(
    (searchText: string) => {
      navigate(MEDICAL_RECORDS_ROUTES.PATIENTS_REGISTER, {
        state: { prefillSearch: searchText }
      });
    },
    [navigate]
  );

  const handleTakeAction = useCallback(
    async (patient: PatientSearchResult) => {
      // Validate staff context
      if (!hasCompleteStaff) {
        showToast('error', 'Complete staff context required. Please ensure you are logged in as staff with an active facility.', 5000);
        return;
      }

      if (!facilityId) {
        showToast('error', 'No active facility selected. Please select a facility first.', 4000);
        return;
      }

      if (!staffId) {
        showToast('error', 'Staff ID not found. Please ensure you are logged in as staff.', 4000);
        return;
      }

      if (!patient.id) {
        console.error('Patient ID is missing:', patient);
        showToast('error', 'Invalid patient data. Patient ID is missing.', 4000);
        navigate(`${MEDICAL_RECORDS_ROUTES.VISIT_ACTION_CENTER}?patientId=${patient.patient_number}`, { replace: true });
        return;
      }

      // Show processing overlay
      setCurrentPatient(patient);
      setProcessingStage('creating');
      
      // Add a small delay to show the creating stage
      await new Promise(resolve => setTimeout(resolve, 300));

      try {
        // Format the current timestamp for MySQL DATETIME format
        const now = new Date();
        const formattedDateTime = now.toISOString().slice(0, 19).replace('T', ' ');
        
        // Create a visit for the selected patient
        const visitData = {
          facility_id: facilityId,
          patient_id: patient.id,
          visit_type: VisitType.OUTPATIENT,
          chief_complaints: ['Medical records consultation'],
          arrived_at: formattedDateTime,
          registered_at: formattedDateTime,
          current_phase: VisitPhase.REGISTRATION,
          is_walk_in: true,
          status: 'active' as any,
          acuity_score: 3,
        };
        
        // Update to saving stage
        setProcessingStage('saving');
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const response = await createVisitMutation.mutateAsync(visitData);
        
        if (response.success && response.data) {
          // Convert the visit to QueueVisitItem format for Redux
          const queueVisitItem = {
            visit_id: response.data.id,
            visit_uuid: response.data.visit_uuid,
            facility_id: response.data.facility_id,
            patient_id: response.data.patient_id,
            patient: {
              id: patient.id,
              patient_number: patient.patient_number,
              global_user_uuid: patient.global_user_uuid || undefined,
              name: patient.name,
              date_of_birth: patient.date_of_birth,
              biological_sex: patient.biological_sex,
              blood_type: patient.blood_type,
              status: patient.status,
              requires_isolation: patient.requires_isolation,
              created_at: patient.created_at,
            },
            current_phase: response.data.current_phase,
            current_department_id: response.data.current_department_id,
            assigned_staff_id: response.data.assigned_staff_id,
            assigned_at: response.data.assigned_at,
            waiting_since: response.data.waiting_since,
            acuity_score: response.data.acuity_score,
            arrived_at: response.data.arrived_at,
            visit_type: response.data.visit_type,
            status: response.data.status,
            is_walk_in: response.data.is_walk_in,
          };


          // Set active visit in Redux
          dispatch(setActiveVisit({
            visit: queueVisitItem,
            staffId: staffId,
            departmentId: response.data.current_department_id || undefined,
            facilityId: response.data.facility_id,
          }));

          // Update to redirecting stage
          setProcessingStage('redirecting');
          await new Promise(resolve => setTimeout(resolve, 500));          
          // Navigate to action center
          navigate(MEDICAL_RECORDS_ROUTES.VISIT_ACTION_CENTER, { replace: true });
        } else {
          throw new Error('Visit creation failed: Invalid response from server');
        }
      } catch (error: any) {
        console.error('Failed to create visit:', error);
        
        // Clear processing overlay
        setProcessingStage(null);
        
        // Extract detailed error message
        let errorMessage = 'Failed to create visit. ';
        
        if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.response?.data?.errors) {
          const errors = error.response.data.errors;
          const errorDetails = Object.values(errors).flat().join(', ');
          errorMessage = `${errorMessage} ${errorDetails}`;
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        // Check for specific foreign key errors
        if (errorMessage.includes('foreign key') || errorMessage.includes('staff_id')) {
          errorMessage = 'Staff verification failed. Please ensure your staff account is properly configured.';
        } else if (errorMessage.includes('facility')) {
          errorMessage = 'Facility validation failed. Please ensure the facility is active and you have access.';
        }
        
        showToast('error', errorMessage, 5000);
        
        // Fallback: navigate with patient ID only
        navigate(`${MEDICAL_RECORDS_ROUTES.VISIT_ACTION_CENTER}?patientId=${patient.patient_number}`, {
          replace: true,
        });
      }
    },
    [navigate, dispatch, facilityId, staffId, hasCompleteStaff, createVisitMutation, showToast]
  );

  const renderQuickActions = () => {
    if (!selectedPatient) return null;

    return (
      <div className={cn(
        'rounded-xl border p-6 mt-6',
        isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200',
        className
      )}>
        <div className="flex items-center gap-3 mb-4">
          <FileText className={cn('w-5 h-5', isDark ? 'text-blue-300' : 'text-blue-700')} />
          <div className={cn('font-semibold', isDark ? 'text-white' : 'text-gray-900')}>
            Medical Records Quick Actions
          </div>
        </div>

        {/* Responsive grid with no truncation */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* View Medical Records */}
          <div 
            className={cn(
              'p-4 rounded-lg border cursor-pointer transition-all duration-200 hover:scale-[1.02]',
              isDark 
                ? 'bg-blue-900/20 border-blue-800/50 hover:bg-blue-900/30' 
                : 'bg-blue-50 border-blue-100 hover:bg-blue-100'
            )}
            onClick={() => handleTakeAction(selectedPatient)}
          >
            <div className="flex items-start gap-3">
              <ClipboardList className={cn('w-5 h-5 flex-shrink-0 mt-0.5', isDark ? 'text-blue-300' : 'text-blue-600')} />
              <div className="flex-1 min-w-0">
                <div className={cn('font-medium mb-1', isDark ? 'text-blue-200' : 'text-blue-900')}>
                  View Medical Records
                </div>
                <div className={cn('text-sm', isDark ? 'text-blue-300' : 'text-blue-700')}>
                  Access complete medical history
                </div>
              </div>
            </div>
          </div>

          {/* Document Search */}
          <div 
            className={cn(
              'p-4 rounded-lg border cursor-pointer transition-all duration-200 hover:scale-[1.02]',
              isDark 
                ? 'bg-purple-900/20 border-purple-800/50 hover:bg-purple-900/30' 
                : 'bg-purple-50 border-purple-100 hover:bg-purple-100'
            )}
            onClick={() => handleTakeAction(selectedPatient)}
          >
            <div className="flex items-start gap-3">
              <FileSearch className={cn('w-5 h-5 flex-shrink-0 mt-0.5', isDark ? 'text-purple-300' : 'text-purple-600')} />
              <div className="flex-1 min-w-0">
                <div className={cn('font-medium mb-1', isDark ? 'text-purple-200' : 'text-purple-900')}>
                  Document Search
                </div>
                <div className={cn('text-sm', isDark ? 'text-purple-300' : 'text-purple-700')}>
                  Find specific documents & reports
                </div>
              </div>
            </div>
          </div>

          {/* Visit History */}
          <div 
            className={cn(
              'p-4 rounded-lg border cursor-pointer transition-all duration-200 hover:scale-[1.02]',
              isDark 
                ? 'bg-green-900/20 border-green-800/50 hover:bg-green-900/30' 
                : 'bg-green-50 border-green-100 hover:bg-green-100'
            )}
            onClick={() => handleTakeAction(selectedPatient)}
          >
            <div className="flex items-start gap-3">
              <Clock className={cn('w-5 h-5 flex-shrink-0 mt-0.5', isDark ? 'text-green-300' : 'text-green-600')} />
              <div className="flex-1 min-w-0">
                <div className={cn('font-medium mb-1', isDark ? 'text-green-200' : 'text-green-900')}>
                  Visit History
                </div>
                <div className={cn('text-sm', isDark ? 'text-green-300' : 'text-green-700')}>
                  Review all patient visits and consultations
                </div>
              </div>
            </div>
          </div>

          {/* Schedule Management */}
          <div 
            className={cn(
              'p-4 rounded-lg border cursor-pointer transition-all duration-200 hover:scale-[1.02]',
              isDark 
                ? 'bg-orange-900/20 border-orange-800/50 hover:bg-orange-900/30' 
                : 'bg-orange-50 border-orange-100 hover:bg-orange-100'
            )}
            onClick={() => handleTakeAction(selectedPatient)}
          >
            <div className="flex items-start gap-3">
              <Calendar className={cn('w-5 h-5 flex-shrink-0 mt-0.5', isDark ? 'text-orange-300' : 'text-orange-600')} />
              <div className="flex-1 min-w-0">
                <div className={cn('font-medium mb-1', isDark ? 'text-orange-200' : 'text-orange-900')}>
                  Schedule Management
                </div>
                <div className={cn('text-sm', isDark ? 'text-orange-300' : 'text-orange-700')}>
                  Manage appointments, follow-ups, and schedules
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional info section for selected patient */}
        {selectedPatient && (
          <div className={cn(
            'mt-6 pt-6 border-t',
            isDark ? 'border-gray-700' : 'border-gray-200'
          )}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div>
                <div className={cn('font-medium mb-1', isDark ? 'text-gray-400' : 'text-gray-500')}>
                  Patient Number
                </div>
                <div className={cn('font-mono', isDark ? 'text-white' : 'text-gray-900')}>
                  {selectedPatient.patient_number}
                </div>
              </div>
              <div>
                <div className={cn('font-medium mb-1', isDark ? 'text-gray-400' : 'text-gray-500')}>
                  Date of Birth
                </div>
                <div className={cn(isDark ? 'text-white' : 'text-gray-900')}>
                  {selectedPatient.date_of_birth || 'N/A'}
                </div>
              </div>
              <div>
                <div className={cn('font-medium mb-1', isDark ? 'text-gray-400' : 'text-gray-500')}>
                  Biological Sex
                </div>
                <div className="capitalize">
                  {selectedPatient.biological_sex?.toLowerCase() || 'N/A'}
                </div>
              </div>
              <div>
                <div className={cn('font-medium mb-1', isDark ? 'text-gray-400' : 'text-gray-500')}>
                  Status
                </div>
                <span className={cn(
                  'inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium',
                  selectedPatient.status === PatientStatus.ACTIVE
                    ? isDark 
                      ? 'bg-green-900/30 text-green-300' 
                      : 'bg-green-100 text-green-800'
                    : isDark 
                      ? 'bg-gray-700 text-gray-300' 
                      : 'bg-gray-100 text-gray-700'
                )}>
                  {selectedPatient.status}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
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
      
      {/* Processing Overlay */}
      <AnimatePresence>
        {processingStage && currentPatient && (
          <VisitProcessingOverlay 
            theme={theme}
            stage={processingStage}
            patientName={currentPatient.name || undefined}
          />
        )}
      </AnimatePresence>
    </>
  );
};

MRPatientSearch.displayName = 'MRPatientSearch';

export default MRPatientSearch;