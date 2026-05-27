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
import { CompletedVisitBanner } from '../../../../shared/components/CompletedVisitBanner';

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
      <div
        className={`flex min-h-[50vh] items-center justify-center px-4 py-12 ${
          theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
        }`}
      >
        <div className="max-w-2xl text-center">
          <div
            className={`mb-5 inline-flex rounded-full p-4 ${theme === 'dark' ? 'bg-slate-900 ring-1 ring-slate-700' : 'bg-white shadow-sm ring-1 ring-slate-200'}`}
          >
            <Users className={`h-12 w-12 ${theme === 'dark' ? 'text-sky-400' : 'text-blue-600'}`} />
          </div>
          <h2 className={`mb-3 text-2xl font-bold tracking-tight ${theme === 'dark' ? 'text-slate-50' : 'text-slate-900'}`}>
            Ready for Nursing Encounter
          </h2>
          <p className={`mb-8 text-base leading-relaxed ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
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
              className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border px-5 py-2.5 font-semibold transition-all ${
                theme === 'dark'
                  ? 'border-slate-600 bg-slate-900 text-slate-100 hover:border-slate-500 hover:bg-slate-800'
                  : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50'
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
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-slate-950' : 'bg-slate-50'}`}>
      <div className="container mx-auto p-4 lg:p-6">
        <CompletedVisitBanner theme={theme} />
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-4 xl:col-span-3">
            <div
              className={`sticky top-6 overflow-hidden rounded-xl border shadow-sm ${
                theme === 'dark' ? 'border-slate-700 bg-slate-950' : 'border-slate-200 bg-white'
              }`}
            >
              <div
                className={`border-b p-4 ${theme === 'dark' ? 'border-slate-800 bg-slate-900/80' : 'border-slate-200 bg-slate-50'}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`rounded-lg p-2 ${theme === 'dark' ? 'bg-sky-950/80 ring-1 ring-sky-800/50' : 'bg-blue-50'}`}>
                    <User className={`h-5 w-5 ${theme === 'dark' ? 'text-sky-400' : 'text-blue-600'}`} />
                  </div>
                  <div className="flex-1">
                    <h3
                      className={`text-center text-sm font-semibold uppercase tracking-wide ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}
                    >
                      Current Patient
                    </h3>
                  </div>
                </div>
              </div>
              <div className="space-y-3 p-4">
                <div>
                  <div className={`mb-1 text-xs font-semibold uppercase tracking-wide ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>
                    Patient Name
                  </div>
                  <div className={`truncate text-lg font-bold ${theme === 'dark' ? 'text-slate-50' : 'text-slate-900'}`}>{patient?.name}</div>
                </div>
                <div>
                  <div className={`mb-1 text-xs font-semibold uppercase tracking-wide ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>
                    Patient No.
                  </div>
                  <div className={`font-mono text-sm font-semibold ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>
                    {patient?.patient_number || 'N/A'}
                  </div>
                </div>
                <div className={`border-t ${theme === 'dark' ? 'border-slate-800' : 'border-slate-200'}`} />
                <div className="grid grid-cols-2 gap-x-3 gap-y-3">
                  <div className="flex items-start gap-2">
                    <Calendar className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`} />
                    <div className="min-w-0">
                      <div className={`text-xs font-medium ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>DOB</div>
                      <div className={`truncate text-xs font-semibold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
                        {patient?.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString() : 'N/A'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Clock className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`} />
                    <div className="min-w-0">
                      <div className={`text-xs font-medium ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>Wait Time</div>
                      <div className={`truncate text-xs font-semibold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
                        {calculateWaitTime(visitInfo?.arrivedAt ?? null)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Activity className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`} />
                    <div className="min-w-0">
                      <div className={`text-xs font-medium ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>Acuity</div>
                      <div className={`truncate text-xs font-semibold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>{visitInfo?.acuity || 'N/A'}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <FileText className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`} />
                    <div className="min-w-0">
                      <div className={`text-xs font-medium ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>Visit stage</div>
                      <div className={`truncate text-xs font-semibold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
                        {formatVisitStageLabel(visitInfo?.phase)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <ClipboardList className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`} />
                    <div className="min-w-0">
                      <div className={`text-xs font-medium ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>Visit status</div>
                      <div className={`truncate text-xs font-semibold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
                        {formatVisitStatusLabel(visitInfo?.status)}
                      </div>
                    </div>
                  </div>
                </div>
                {patient?.requires_isolation && (
                  <div
                    className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold ${
                      theme === 'dark'
                        ? 'border border-amber-700/40 bg-amber-950/40 text-amber-100'
                        : 'border border-amber-200 bg-amber-50 text-amber-900'
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Isolation Required</span>
                  </div>
                )}
              </div>
              <div className={`border-t p-4 ${theme === 'dark' ? 'border-slate-800 bg-slate-900/90' : 'border-slate-200 bg-slate-50'}`}>
                <button
                  onClick={handleWorkOnAnotherPatient}
                  disabled={isNavigating}
                  className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-blue-700"
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
                {
                  key: 'ward-bed',
                  label: 'Ward & Bed',
                  icon: <BedDouble className="w-4 h-4" />,
                  to: FOCUS_MODE_ROUTES.NURSING_WARD_BED_FOCUS,
                  description: 'Assign or update ward and bed (opens in focus mode)',
                },
                {
                  key: 'forward-patient',
                  label: 'Forward Patient',
                  icon: <ArrowRight className="w-4 h-4" />,
                  to: FOCUS_MODE_ROUTES.FORWARD_PATIENT_FOCUS,
                  activeWhenPath: NURSING_ROUTES.NURSING_ENCOUNTER_FORWARD_PATIENT,
                  navigateState: {
                    cancelTo: NURSING_ROUTES.NURSING_ENCOUNTER_PATIENT_INFO,
                    queueRedirectTo: NURSING_ROUTES.WARDS_PATIENTS_NEW_PATIENTS_UNASSIGNED,
                  },
                  description: 'Send this patient to another team queue or a specific staff member',
                },
                {
                  key: 'tasks',
                  label: 'Tasks',
                  icon: <ClipboardList className="w-4 h-4" />,
                  to: FOCUS_MODE_ROUTES.NURSING_TASKS_FOCUS,
                  activeWhenPath: NURSING_ROUTES.NURSING_ENCOUNTER_TASKS,
                  description: 'Encounter tasks in focus mode',
                },
                {
                  key: 'meds',
                  label: 'Medications',
                  icon: <Pill className="w-4 h-4" />,
                  to: FOCUS_MODE_ROUTES.NURSING_MEDS_FOCUS,
                  activeWhenPath: NURSING_ROUTES.NURSING_ENCOUNTER_MEDS,
                  description: 'Medication schedule for this visit (focus mode)',
                },
                {
                  key: 'notes',
                  label: 'Notes',
                  icon: <Activity className="w-4 h-4" />,
                  to: FOCUS_MODE_ROUTES.NURSING_NOTES_FOCUS,
                  activeWhenPath: NURSING_ROUTES.NURSING_ENCOUNTER_NOTES,
                  description: 'Clinical notes for this visit (focus mode)',
                },
                {
                  key: 'clinical-reports',
                  label: 'Clinical Reports',
                  icon: <FileText className="h-4 w-4" />,
                  to: NURSING_ROUTES.NURSING_ENCOUNTER_CLINICAL_REPORTS,
                  description: 'View patient clinical reports and documents',
                },
              ]}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default NursingEncounterWorkspace;

