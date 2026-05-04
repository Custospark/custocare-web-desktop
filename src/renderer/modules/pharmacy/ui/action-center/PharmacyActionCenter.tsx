// Pharmacy Action Center — visit-bound workspace from visitSlice; facility prescription desk removed.
// Two visit-scoped tools from the former desk: search + review (current patient / active visit).
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Pill,
  User,
  Calendar,
  Clock,
  Activity,
  Shield,
  Users,
  UserPlus,
  Search,
  ArrowLeftRight,
  ClipboardList,
} from 'lucide-react';

import { type RootState } from '../../../../app/store/rootReducer';
import { PHARMACY_ROUTES } from '../../../../app/routes/routeConstants';
import { BaseActionWorkspace } from '../../../../shared/components/workspace/BaseActionWorkspace';
import {
  selectActivePatient,
  selectActiveVisitInfo,
  selectHasActiveVisit,
  emergencyClearVisit,
} from '../../../../app/store/slices/visitSlice';
import { clearAll } from '../../../medical-records/ui/visit-action-center/billing-space';
import { useToast } from '../../../../app/store/contexts/toast/useToast';
import LoadingSkeleton from '../../../../shared/components/Loading/LoadingSkeletons';

interface PharmacyActionCenterProps {
  theme: 'light' | 'dark';
}

const PharmacyActionCenter: React.FC<PharmacyActionCenterProps> = ({ theme }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { showToast } = useToast();
  const [isNavigating, setIsNavigating] = useState(false);

  const patient = useSelector((state: RootState) => selectActivePatient(state));
  const visitInfo = useSelector((state: RootState) => selectActiveVisitInfo(state));
  const hasActiveVisit = useSelector((state: RootState) => selectHasActiveVisit(state));

  const calculateWaitTime = (arrivedAt: string | null): string => {
    if (!arrivedAt) return 'N/A';
    try {
      const arrivalTime = new Date(arrivedAt).getTime();
      const now = Date.now();
      const diffMinutes = Math.floor((now - arrivalTime) / (1000 * 60));
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
      navigate(PHARMACY_ROUTES.PATIENT_QUEUE);
    } catch (error) {
      console.error('Error clearing patient data:', error);
      showToast('error', 'Failed to clear patient data. Please try again.', 4000);
      setIsNavigating(false);
      navigate(PHARMACY_ROUTES.PATIENT_QUEUE);
    }
  };

  if (isNavigating) {
    return (
      <LoadingSkeleton
        variant="default"
        theme={theme}
        message="Getting the queue ready for your next patient..."
      />
    );
  }

  if (!hasActiveVisit) {
    return (
      <div
        className={`flex items-center justify-center p-8 ${
          theme === 'dark' ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'
        }`}
      >
        <div className="max-w-2xl text-center">
          <div
            className={`mb-4 inline-flex rounded-full p-4 ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow-sm'
            }`}
          >
            <Users className={`h-12 w-12 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-500'}`} />
          </div>

          <h2 className="mb-3 text-2xl font-bold">No active medication encounter</h2>
          <p className={`mb-6 text-base ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Start from the queue, quick-register a walk-in, or search so a visit loads into this workflow.
          </p>

          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => navigate(PHARMACY_ROUTES.PATIENT_QUEUE)}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white transition-all hover:bg-blue-700"
            >
              <Users className="h-4 w-4" />
              Queue & intake
            </button>

            <button
              type="button"
              onClick={() => navigate(PHARMACY_ROUTES.PATIENTS_REGISTER)}
              className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border px-5 py-2.5 font-semibold transition-all ${
                theme === 'dark'
                  ? 'border-gray-700 bg-gray-800 text-white hover:bg-gray-700'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <UserPlus className="h-4 w-4" />
              Quick register
            </button>

            <button
              type="button"
              onClick={() => navigate(PHARMACY_ROUTES.PATIENTS_SEARCH)}
              className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border px-5 py-2.5 font-semibold transition-all ${
                theme === 'dark'
                  ? 'border-gray-700 bg-gray-800 text-white hover:bg-gray-700'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Search className="h-4 w-4" />
              Search patient
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="container mx-auto p-4 lg:p-6">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-6">
          <div className="lg:col-span-4 xl:col-span-3">
            <PharmacyPatientInfoCard
              theme={theme}
              patient={patient}
              visitInfo={visitInfo}
              calculateWaitTime={calculateWaitTime}
              onWorkOnAnotherPatient={handleWorkOnAnotherPatient}
              isNavigating={isNavigating}
            />
          </div>

          <div className="lg:col-span-8 xl:col-span-9">
            <BaseActionWorkspace
              title="Medication encounter workflow"
              icon={<Pill className="h-6 w-6" />}
              theme={theme}
              defaultActionTo={PHARMACY_ROUTES.ACTION_CENTER_DISPENSING}
              actions={[
                {
                  key: 'dispensing',
                  label: 'Dispense & fulfill',
                  icon: <Pill className="h-4 w-4" />,
                  to: PHARMACY_ROUTES.ACTION_CENTER_DISPENSING,
                },
                {
                  key: 'prescription-search',
                  label: 'Search prescriptions',
                  icon: <Search className="h-4 w-4" />,
                  to: PHARMACY_ROUTES.ACTION_CENTER_PRESCRIPTION_SEARCH,
                  description: 'Search and open prescriptions for this visit (from slice context)',
                },
                {
                  key: 'prescription-review',
                  label: 'Review prescriptions',
                  icon: <ClipboardList className="h-4 w-4" />,
                  to: PHARMACY_ROUTES.ACTION_CENTER_PRESCRIPTION_REVIEW,
                  description: 'Rx needing review for this patient / visit',
                },
              ]}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

interface PharmacyPatientInfoCardProps {
  theme: 'light' | 'dark';
  patient: ReturnType<typeof selectActivePatient>;
  visitInfo: ReturnType<typeof selectActiveVisitInfo>;
  calculateWaitTime: (arrivedAt: string | null) => string;
  onWorkOnAnotherPatient: () => void;
  isNavigating?: boolean;
}

const PharmacyPatientInfoCard: React.FC<PharmacyPatientInfoCardProps> = ({
  theme,
  patient,
  visitInfo,
  calculateWaitTime,
  onWorkOnAnotherPatient,
  isNavigating = false,
}) => {
  const isDark = theme === 'dark';
  const hasPatientData = patient && patient.name;
  const hasVisitData = visitInfo && visitInfo.uuid;

  if (!hasPatientData || !hasVisitData) {
    return (
      <div
        className={`sticky top-6 rounded-xl border p-6 ${
          isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'
        }`}
      >
        <div className="py-8 text-center">
          <div className={`mb-4 inline-flex rounded-lg p-4 ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
            <User className={`h-8 w-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
          </div>
          <h3 className="mb-2 text-lg font-bold">Loading patient data…</h3>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Please wait while we load the patient information.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`sticky top-6 overflow-hidden rounded-xl border ${
        isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'
      }`}
    >
      <div
        className={`border-b p-4 ${isDark ? 'border-gray-800 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}
      >
        <div className="flex items-center gap-3">
          <div className={`rounded-lg p-2 ${isDark ? 'bg-blue-600/20' : 'bg-blue-50'}`}>
            <User className={`h-5 w-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-center text-sm font-semibold uppercase tracking-wide wrap-break-word">
              Current patient
            </h3>
          </div>
        </div>
      </div>

      <div className="space-y-3 p-4">
        <div>
          <div className={`mb-1 text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Patient name
          </div>
          <div className="truncate text-lg font-bold">{patient.name}</div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className={`mb-1 text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Patient no.
            </div>
            <div className="font-mono text-sm font-semibold">{patient.patient_number || 'N/A'}</div>
          </div>
          <div />
        </div>

        <div className={`border-t ${isDark ? 'border-gray-800' : 'border-gray-200'}`} />

        <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
          <div className="flex items-start gap-2">
            <Calendar className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
            <div className="min-w-0">
              <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>DOB</div>
              <div className="truncate text-xs font-medium">
                {patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString() : 'N/A'}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <User className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
            <div className="min-w-0">
              <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Sex</div>
              <div className="truncate text-xs font-medium">{patient.biological_sex || 'N/A'}</div>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Activity className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
            <div className="min-w-0">
              <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Blood type</div>
              <div className="truncate text-xs font-medium">{patient.blood_type || 'Unknown'}</div>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Clock className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
            <div className="min-w-0">
              <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Wait time</div>
              <div className="truncate text-xs font-semibold">{calculateWaitTime(visitInfo.arrivedAt)}</div>
            </div>
          </div>
        </div>

        <div className={`border-t ${isDark ? 'border-gray-800' : 'border-gray-200'}`} />

        <div className="space-y-2">
          {patient.requires_isolation && (
            <div
              className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs font-medium ${
                isDark
                  ? 'border-yellow-800/30 bg-yellow-900/20 text-yellow-400'
                  : 'border-yellow-200 bg-yellow-50 text-yellow-700'
              }`}
            >
              <Shield className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">Isolation required</span>
            </div>
          )}
          {visitInfo.acuity && (
            <div
              className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs font-medium ${
                isDark ? 'border-gray-700 bg-gray-800 text-gray-300' : 'border-gray-200 bg-gray-50 text-gray-700'
              }`}
            >
              <Activity className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">Acuity: {visitInfo.acuity}</span>
            </div>
          )}
        </div>
      </div>

      <div className={`space-y-2 border-t p-4 ${isDark ? 'border-gray-800 bg-gray-800/30' : 'border-gray-200 bg-gray-50'}`}>
        <button
          type="button"
          onClick={onWorkOnAnotherPatient}
          disabled={isNavigating}
          className={`inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition-all ${
            isNavigating
              ? 'cursor-not-allowed bg-gray-400 opacity-50'
              : isDark
                ? 'cursor-pointer bg-blue-600 text-white hover:bg-blue-700'
                : 'cursor-pointer bg-blue-600 text-white hover:bg-blue-700'
          }`}
          title={isNavigating ? 'Navigating to patient queue…' : 'Switch to work on another patient'}
        >
          {isNavigating ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Navigating…
            </>
          ) : (
            <>
              <ArrowLeftRight className="h-4 w-4" />
              Work on another patient
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default PharmacyActionCenter;
