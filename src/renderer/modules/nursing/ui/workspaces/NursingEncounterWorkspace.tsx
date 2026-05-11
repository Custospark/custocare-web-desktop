import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  ArrowLeftRight,
  ArrowRight,
  BedDouble,
  Calendar,
  ClipboardList,
  Clock,
  FileText,
  Pill,
  Search,
  Shield,
  Stethoscope,
  User,
  Users,
} from 'lucide-react';
import { BaseActionWorkspace } from '../../../../shared/components/workspace/BaseActionWorkspace';
import { NURSING_ROUTES } from '../../../../app/routes/routeConstants';
import type { NursingWorkspaceProps } from './NursingWorkspace.types';
import type { RootState } from '../../../../app/store/rootReducer';
import {
  emergencyClearVisit,
  selectActivePatient,
  selectActiveVisitInfo,
  selectHasActiveVisit,
} from '../../../../app/store/slices/visitSlice';
import { clearAll } from '../../../medical-records/ui/visit-action-center/billing-space';
import { useToast } from '../../../../app/store/contexts/toast/useToast';
import LoadingSkeleton from '../../../../shared/components/Loading/LoadingSkeletons';
import {
  formatVisitStageLabel,
  formatVisitStatusLabel,
} from '../../../pharmacy/api/dispensing/visit-queue/visitTypes';
import { FOCUS_MODE_ROUTES } from '../../../../app/routes/utils/forwardPatientFocus';

const NursingEncounterWorkspace: React.FC<NursingWorkspaceProps> = ({ theme }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { showToast } = useToast();
  const [isNavigating, setIsNavigating] = useState(false);
  /** Tick so wait-time math does not call `Date.now()` during render (react-hooks/purity). */
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const patient = useSelector((state: RootState) => selectActivePatient(state));
  const visitInfo = useSelector((state: RootState) => selectActiveVisitInfo(state));
  const hasActiveVisit = useSelector((state: RootState) => selectHasActiveVisit(state));

  const calculateWaitTime = (arrivedAt: string | null): string => {
    if (!arrivedAt) return 'N/A';
    try {
      const arrivalTime = new Date(arrivedAt).getTime();
      const diffMinutes = Math.floor((nowMs - arrivalTime) / (1000 * 60));
      if (diffMinutes < 60) return `${diffMinutes} min`;
      const hours = Math.floor(diffMinutes / 60);
      const minutes = diffMinutes % 60;
      return `${hours}h ${minutes}m`;
    } catch {
      return 'N/A';
    }
  };

  const handleWorkOnAnotherPatient = async () => {
    try {
      setIsNavigating(true);
      const currentVisitId = visitInfo?.uuid;
      if (currentVisitId) {
        sessionStorage.removeItem(`billing_draft_${currentVisitId}`);
      }
      dispatch(clearAll());
      dispatch(emergencyClearVisit());
      await new Promise((resolve) => setTimeout(resolve, 300));
      navigate(NURSING_ROUTES.WARDS_PATIENTS_NEW_PATIENTS_UNASSIGNED);
    } catch (error) {
      console.error('Error clearing patient data:', error);
      showToast('error', 'Failed to clear patient data. Please try again.', 4000);
      setIsNavigating(false);
      navigate(NURSING_ROUTES.WARDS_PATIENTS_NEW_PATIENTS_UNASSIGNED);
    }
  };

  if (isNavigating) {
    return <LoadingSkeleton variant="default" theme={theme} message="Getting the nursing queue ready..." />;
  }

  if (!hasActiveVisit) {
    return (
      <div className={`flex items-center justify-center p-8 ${theme === 'dark' ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
        <div className="text-center max-w-2xl">
          <div className={`inline-flex p-4 rounded-full mb-4 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow-sm'}`}>
            <Users className={`w-12 h-12 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-500'}`} />
          </div>
          <h2 className="text-2xl font-bold mb-3">Ready for Nursing Encounter</h2>
          <p className={`text-base mb-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Select a patient from nursing queue or search to start nursing assessment and task workflow.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate(NURSING_ROUTES.WARDS_PATIENTS_NEW_PATIENTS_UNASSIGNED)}
              className="cursor-pointer inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-semibold transition-all bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Users className="w-4 h-4" />
              Go to Nursing Queue
            </button>
            <button
              onClick={() => navigate(NURSING_ROUTES.WARDS_PATIENTS_SEARCH_PATIENT)}
              className={`cursor-pointer inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-semibold transition-all ${
                theme === 'dark'
                  ? 'bg-gray-800 hover:bg-gray-700 text-white border border-gray-700'
                  : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300'
              }`}
            >
              <Search className="w-4 h-4" />
              Search Patient
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="container mx-auto p-4 lg:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
          <div className="lg:col-span-4 xl:col-span-3">
            <div className={`rounded-xl overflow-hidden sticky top-6 border ${theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
              <div className={`p-4 border-b ${theme === 'dark' ? 'bg-gray-800/50 border-gray-800' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-center gap-3">
                  <div className={`${theme === 'dark' ? 'bg-blue-600/20' : 'bg-blue-50'} p-2 rounded-lg`}>
                    <User className={`w-5 h-5 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm uppercase tracking-wide text-center">Current Patient</h3>
                  </div>
                </div>
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <div className={`text-xs font-medium mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Patient Name</div>
                  <div className="text-lg font-bold truncate">{patient?.name}</div>
                </div>
                <div>
                  <div className={`text-xs font-medium mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Patient No.</div>
                  <div className="font-mono text-sm font-semibold">{patient?.patient_number || 'N/A'}</div>
                </div>
                <div className={`border-t ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'}`} />
                <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
                  <div className="flex items-start gap-2">
                    <Calendar className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                    <div className="min-w-0">
                      <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>DOB</div>
                      <div className="text-xs font-medium truncate">{patient?.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString() : 'N/A'}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Clock className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                    <div className="min-w-0">
                      <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Wait Time</div>
                      <div className="text-xs font-semibold truncate">{calculateWaitTime(visitInfo?.arrivedAt ?? null)}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Activity className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                    <div className="min-w-0">
                      <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Acuity</div>
                      <div className="text-xs font-medium truncate">{visitInfo?.acuity || 'N/A'}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <FileText className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                    <div className="min-w-0">
                      <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Visit stage</div>
                      <div className="text-xs font-medium truncate">{formatVisitStageLabel(visitInfo?.phase)}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <ClipboardList className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                    <div className="min-w-0">
                      <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Visit status</div>
                      <div className="text-xs font-medium truncate">{formatVisitStatusLabel(visitInfo?.status)}</div>
                    </div>
                  </div>
                </div>
                {patient?.requires_isolation && (
                  <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium ${
                    theme === 'dark'
                      ? 'bg-yellow-900/20 text-yellow-400 border border-yellow-800/30'
                      : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                  }`}>
                    <Shield className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Isolation Required</span>
                  </div>
                )}
              </div>
              <div className={`p-4 border-t ${theme === 'dark' ? 'border-gray-800 bg-gray-800/30' : 'border-gray-200 bg-gray-50'}`}>
                <button
                  onClick={handleWorkOnAnotherPatient}
                  disabled={isNavigating}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold transition-all bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                >
                  <ArrowLeftRight className="w-4 h-4" />
                  Work on Another Patient
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-8 xl:col-span-9">
            <BaseActionWorkspace
              title="Nursing Encounter"
              icon={<Stethoscope className="w-6 h-6" />}
              theme={theme}
              defaultActionTo={NURSING_ROUTES.NURSING_ENCOUNTER_PATIENT_INFO}
              actions={[
                { key: 'patient-info', label: 'Patient Info', icon: <ClipboardList className="w-4 h-4" />, to: NURSING_ROUTES.NURSING_ENCOUNTER_PATIENT_INFO },
                { key: 'ward-bed', label: 'Ward & Bed', icon: <BedDouble className="w-4 h-4" />, to: NURSING_ROUTES.NURSING_ENCOUNTER_WARD_BED },
                {
                  key: 'forward-patient',
                  label: 'Forward Patient',
                  icon: <ArrowRight className="w-4 h-4" />,
                  to: FOCUS_MODE_ROUTES.FORWARD_PATIENT_FOCUS,
                  navigateState: {
                    cancelTo: NURSING_ROUTES.NURSING_ENCOUNTER_PATIENT_INFO,
                    queueRedirectTo: NURSING_ROUTES.WARDS_PATIENTS_NEW_PATIENTS_UNASSIGNED,
                  },
                  description: 'Send this patient to another team queue or a specific staff member',
                },
                { key: 'tasks', label: 'Tasks', icon: <ClipboardList className="w-4 h-4" />, to: NURSING_ROUTES.NURSING_ENCOUNTER_TASKS },
                { key: 'meds', label: 'Meds', icon: <Pill className="w-4 h-4" />, to: NURSING_ROUTES.NURSING_ENCOUNTER_MEDS },
                { key: 'notes', label: 'Notes', icon: <Activity className="w-4 h-4" />, to: NURSING_ROUTES.NURSING_ENCOUNTER_NOTES },
              ]}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default NursingEncounterWorkspace;

