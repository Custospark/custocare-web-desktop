// MRPatientCreate.tsx
import React, { useCallback, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, ArrowRight, ClipboardList, Heart, CheckCircle2, Loader2 } from 'lucide-react';

import PatientCreate from '../../../../pharmacy/ui/dispensing/dispensing-medication/views/PatientCreate';
import { cn } from '../../../../../shared/utils/classNameUtils';
import type { PatientSearchResult } from '../../../../pharmacy/api/dispensing/patient-search/usePatientTypes';
import {
  getPatientIntakeRoutes,
  type PatientIntakeModule,
} from '../../../../../app/routes/utils/patientIntakeRoutes';
import { useCreateVisit } from '../../../../pharmacy/api/dispensing/visit-queue/useVisitQueries';
import { useAppSelector } from '../../../../../app/store/hooks/useApp';
import { 
  getActiveFacilityId, 
  getStaffId,
  hasCompleteStaffContext
} from '../../../../../app/store/utils/contextSelectors';
import { setActiveVisit, emergencyClearVisit } from '../../../../../app/store/slices/visitSlice';
import { clearAll } from '../../visit-action-center/billing-space';
import { VisitPhase, VisitType } from '../../../../pharmacy/api/dispensing/visit-queue/visitTypes';
import { useToast } from '../../../../../app/store/contexts/toast/useToast';

interface MRPatientCreateProps {
  theme: 'light' | 'dark';
  className?: string;
  intakeModule?: PatientIntakeModule;
}

const getCreateModuleCopy = (module: PatientIntakeModule) => {
  if (module === 'pharmacy') {
    return {
      subtitle: 'Create a record so you can start visits and dispensing from pharmacy',
      chiefComplaint: 'Pharmacy visit',
      encounterWorkflow: ' medication encounter workflow',
      infoTitle: 'Pharmacy Information',
      infoDescription:
        'New patients can proceed to medication encounter and dispensing workflow after registration.',
    };
  }
  if (module === 'laboratory') {
    return {
      subtitle: 'Create a record so you can start visits, diagnostics, and lab billing workflow',
      chiefComplaint: 'Laboratory visit',
      encounterWorkflow: ' laboratory encounter workflow',
      infoTitle: 'Laboratory Information',
      infoDescription:
        'New patients can proceed to lab requests, results capture, and laboratory billing after registration.',
    };
  }
  if (module === 'ambulance') {
    return {
      subtitle: 'Create a record so you can start visits and ambulance dispatch workflow',
      chiefComplaint: 'Ambulance transport',
      encounterWorkflow: ' transport encounter workflow',
      infoTitle: 'Ambulance Information',
      infoDescription:
        'New patients can proceed to trip requests, dispatch, and transport documentation after registration.',
    };
  }
  if (module === 'referral') {
    return {
      subtitle: 'Create a record so you can start visits and referral coordination workflow',
      chiefComplaint: 'Referral coordination',
      encounterWorkflow: ' referral encounter workflow',
      infoTitle: 'Referral Information',
      infoDescription:
        'New patients can proceed to referral requests and network coordination after registration.',
    };
  }
  if (module === 'clinical') {
    return {
      subtitle: 'Create a new patient record for clinical consultation and care planning',
      chiefComplaint: 'Clinical consultation',
      encounterWorkflow: ' clinical encounter workflow',
      infoTitle: 'Clinical Information',
      infoDescription:
        'New patients can proceed to clinical notes, diagnosis, and treatment planning after registration.',
    };
  }
  if (module === 'nursing') {
    return {
      subtitle: 'Create a patient record for nursing assessments and ward workflow',
      chiefComplaint: 'Nursing consultation',
      encounterWorkflow: ' nursing encounter workflow',
      infoTitle: 'Nursing Information',
      infoDescription:
        'New patients can proceed to nursing triage, assessments, and care workflow after registration.',
    };
  }
  if (module === 'billing') {
    return {
      subtitle: 'Create a patient record for billing intake and payment workflow',
      chiefComplaint: 'Billing visit',
      encounterWorkflow: ' billing encounter workflow',
      infoTitle: 'Billing Information',
      infoDescription:
        'New patients can proceed to billing queue, charge capture, and payment workflow after registration.',
    };
  }
  return {
    subtitle: 'Create a new patient record for medical documentation and history tracking',
    chiefComplaint: 'Initial medical records visit',
    encounterWorkflow: ' clinical encounter workflow',
    infoTitle: 'Medical Records Information',
    infoDescription:
      'New patients will have a complete medical record created. You can add visit notes, upload documents, and manage appointments after registration.',
  };
};

// Processing overlay component
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

const MRPatientCreate: React.FC<MRPatientCreateProps> = ({
  theme,
  className,
  intakeModule = 'medical-records',
}) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { showToast } = useToast();
  const routes = useMemo(() => getPatientIntakeRoutes(intakeModule), [intakeModule]);
  
  // State for processing overlay
  const [processingStage, setProcessingStage] = useState<'creating' | 'saving' | 'redirecting' | null>(null);
  const [currentPatient, setCurrentPatient] = useState<PatientSearchResult | null>(null);
  
  // Get all necessary context data
  const facilityId = useAppSelector(getActiveFacilityId);
  const staffId = useAppSelector(getStaffId);
  const hasCompleteStaff = useAppSelector(hasCompleteStaffContext);
  
  const createVisitMutation = useCreateVisit();
  const moduleCopy = useMemo(() => getCreateModuleCopy(intakeModule), [intakeModule]);

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
        navigate(routes.actionCenter, { replace: true });
        return;
      }

      // ✅ CLEAR EXISTING DATA FIRST - Clear visit then billing
      // Clear visit slice state
      dispatch(emergencyClearVisit());
      
      // Clear billing slice state
      dispatch(clearAll());
      
      // Clear any existing billing draft from session storage
      const billingDraftKey = `billing_draft_${patient.id}`;
      sessionStorage.removeItem(billingDraftKey);
      
      // Small delay to ensure state updates are processed
      await new Promise(resolve => setTimeout(resolve, 50));

      // Show processing overlay
      setCurrentPatient(patient);
      setProcessingStage('creating');
      
      // Add a small delay to show the creating stage
      await new Promise(resolve => setTimeout(resolve, 300));

      try {
        // Format the current timestamp for MySQL DATETIME format (YYYY-MM-DD HH:MM:SS)
        const now = new Date();
        const formattedDateTime = now.toISOString().slice(0, 19).replace('T', ' ');
        
        // Create a visit for the new patient
        const visitData = {
          facility_id: facilityId,
          patient_id: patient.id,
          visit_type: VisitType.OUTPATIENT,
          chief_complaints: [moduleCopy.chiefComplaint],
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
          navigate(routes.actionCenter, { replace: true });
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
        navigate(`${routes.actionCenter}?patientId=${patient.patient_number}`, {
          replace: true,
        });
      }
    },
    [
      navigate,
      dispatch,
      facilityId,
      staffId,
      hasCompleteStaff,
      createVisitMutation,
      showToast,
      routes,
      intakeModule,
    ]
  );

  const handleCancel = useCallback(() => {
    navigate(routes.search, { replace: true });
  }, [navigate, routes.search]);

  return (
    <>
      <div className={cn(className)}>
        <PatientCreate
          theme={theme}
          title="Register new patient"
          subtitle={moduleCopy.subtitle}
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
          onClick={() => navigate(routes.search)}
          >
            <div className={cn('text-sm flex-1', theme === 'dark' ? 'text-gray-300' : 'text-gray-700')}>
              After registration, you will see a confirmation with the patient number. Continue to the
              {moduleCopy.encounterWorkflow}, or return to search.
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
                  {moduleCopy.infoTitle}
                </h4>
                <p className={cn('text-sm', theme === 'dark' ? 'text-blue-400/90' : 'text-blue-700')}>
                  {moduleCopy.infoDescription}
                  The patient number will be displayed in the confirmation modal for easy reference.
                </p>
              </div>
            </div>
          </div>
        </div>
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

MRPatientCreate.displayName = 'MRPatientCreate';
export default MRPatientCreate;