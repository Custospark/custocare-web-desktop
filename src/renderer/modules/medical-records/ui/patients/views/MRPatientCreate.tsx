// MRPatientCreate.tsx
import React, { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FileText, ArrowRight, ClipboardList } from 'lucide-react';

import PatientCreate from '../../../../pharmacy/ui/dispensing/dispensing-medication/views/PatientCreate';
import { cn } from '../../../../../shared/utils/classNameUtils';
import type { PatientSearchResult } from '../../../../pharmacy/api/dispensing/patient-search/usePatientTypes';
import { MEDICAL_RECORDS_ROUTES } from '../../../../../app/routes/routeConstants';
import { useCreateVisit } from '../../../../pharmacy/api/dispensing/visit-queue/useVisitQueries';
import { useAppSelector } from '../../../../../app/store/hooks/useApp';
import { 
  getActiveFacilityId, 
  getStaffId,
  getUserId,
  getUserFullName,
  getActiveRoleCode,
  hasCompleteStaffContext
} from '../../../../../app/store/utils/contextSelectors';
import { setActiveVisit } from '../../../../../app/store/slices/visitSlice';
import { VisitPhase, VisitType } from '../../../../pharmacy/api/dispensing/visit-queue/visitTypes';
import { useToast } from '../../../../../app/store/contexts/toast/useToast';

interface MRPatientCreateProps {
  theme: 'light' | 'dark';
  className?: string;
}

const MRPatientCreate: React.FC<MRPatientCreateProps> = ({ theme, className }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { showToast } = useToast();
  
  // Get all necessary context data
  const facilityId = useAppSelector(getActiveFacilityId);
  const staffId = useAppSelector(getStaffId);
  const userId = useAppSelector(getUserId);
  const userFullName = useAppSelector(getUserFullName);
  const roleCode = useAppSelector(getActiveRoleCode);
  const hasCompleteStaff = useAppSelector(hasCompleteStaffContext);
  
  const createVisitMutation = useCreateVisit();

  const handleSuccess = useCallback(
    (patient: PatientSearchResult) => {
      console.log('Patient created successfully:', patient.patient_number);
    },
    []
  );

  const handleProceed = useCallback(
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
        navigate(MEDICAL_RECORDS_ROUTES.VISIT_ACTION_CENTER, { replace: true });
        return;
      }

      try {
        // Format the current timestamp for MySQL DATETIME format (YYYY-MM-DD HH:MM:SS)
        const now = new Date();
        const formattedDateTime = now.toISOString().slice(0, 19).replace('T', ' ');
        
        // Create a visit for the new patient
        const visitData = {
          facility_id: facilityId,
          patient_id: patient.id,
          visit_type: VisitType.OUTPATIENT,
          chief_complaints: ['Initial medical records visit'],
          arrived_at: formattedDateTime, // Use MySQL DATETIME format
          registered_at: formattedDateTime, // Add registration time
          current_phase: VisitPhase.REGISTRATION,
          is_walk_in: true,
          status: 'active' as any,
          acuity_score: 3,
          // Don't explicitly send created_by_staff_id - let the backend handle it
          // The backend should set this based on the authenticated user
        };
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

          showToast('success', `Visit created successfully for ${patient.name || 'patient'}`, 3000);
          
          // Navigate to action center
          navigate(MEDICAL_RECORDS_ROUTES.VISIT_ACTION_CENTER, { replace: true });
        } else {
          throw new Error('Visit creation failed: Invalid response from server');
        }
      } catch (error: any) {
        console.error('Failed to create visit:', error);
        
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
    [navigate, dispatch, facilityId, staffId, userId, roleCode, userFullName, hasCompleteStaff, createVisitMutation, showToast]
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

      <div>
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