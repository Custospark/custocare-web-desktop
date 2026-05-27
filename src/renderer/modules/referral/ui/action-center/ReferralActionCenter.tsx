import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Share2,
  User,
  Users,
  UserPlus,
  Search,
  FileText,
  ArrowRight,
  PlusCircle,
  ListOrdered,
} from 'lucide-react';
import type { RootState } from '../../../../app/store/rootReducer';
import { REFERRAL_ROUTES } from '../../../../app/routes/routeConstants';
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
import {
  formatVisitStageLabel,
  formatVisitStatusLabel,
} from '../../../pharmacy/api/dispensing/visit-queue/visitTypes';
import { FOCUS_MODE_ROUTES } from '../../../../app/routes/utils/forwardPatientFocus';
import { CompletedVisitBanner } from '../../../../shared/components/CompletedVisitBanner';

interface ReferralActionCenterProps {
  theme: 'light' | 'dark';
}

const ReferralActionCenter: React.FC<ReferralActionCenterProps> = ({ theme }) => {
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
      const diffMinutes = Math.floor((Date.now() - new Date(arrivedAt).getTime()) / 60000);
      if (diffMinutes < 60) return `${diffMinutes} min`;
      return `${Math.floor(diffMinutes / 60)}h ${diffMinutes % 60}m`;
    } catch {
      return 'N/A';
    }
  };

  const handleWorkOnAnotherPatient = async () => {
    try {
      setIsNavigating(true);
      if (visitInfo?.uuid) sessionStorage.removeItem(`billing_draft_${visitInfo.uuid}`);
      dispatch(clearAll());
      dispatch(emergencyClearVisit());
      await new Promise((r) => setTimeout(r, 300));
      navigate(REFERRAL_ROUTES.PATIENT_QUEUE);
    } catch {
      showToast('error', 'Failed to clear patient data');
      navigate(REFERRAL_ROUTES.PATIENT_QUEUE);
    } finally {
      setIsNavigating(false);
    }
  };

  if (isNavigating) {
    return (
      <LoadingSkeleton variant="default" theme={theme} message="Loading referral queue…" />
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
          <div className={`mb-4 inline-flex rounded-full p-4 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow-sm'}`}>
            <Users className={`h-12 w-12 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-500'}`} />
          </div>
          <h2 className="mb-3 text-2xl font-bold">No active referral encounter</h2>
          <p className={`mb-6 text-base ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Start from the referral queue, register a patient, or search to load a visit into this workflow.
          </p>
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => navigate(REFERRAL_ROUTES.PATIENT_QUEUE)}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-700"
            >
              <ListOrdered className="h-4 w-4" />
              Referral queue
            </button>
            <button
              type="button"
              onClick={() => navigate(REFERRAL_ROUTES.PATIENTS_REGISTER)}
              className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border px-5 py-2.5 font-semibold ${
                theme === 'dark' ? 'border-gray-700 bg-gray-800 hover:bg-gray-700' : 'border-gray-300 bg-white hover:bg-gray-50'
              }`}
            >
              <UserPlus className="h-4 w-4" />
              Quick register
            </button>
            <button
              type="button"
              onClick={() => navigate(REFERRAL_ROUTES.PATIENTS_SEARCH)}
              className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border px-5 py-2.5 font-semibold ${
                theme === 'dark' ? 'border-gray-700 bg-gray-800 hover:bg-gray-700' : 'border-gray-300 bg-white hover:bg-gray-50'
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

  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="container mx-auto p-4 lg:p-6">
        <CompletedVisitBanner theme={theme} />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-6">
          <div className="lg:col-span-4 xl:col-span-3">
            <div className={`sticky top-6 overflow-hidden rounded-xl border ${isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'}`}>
              <div className={`border-b p-4 ${isDark ? 'border-gray-800 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
                <div className="flex items-center gap-3">
                  <User className={`h-5 w-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                  <h3 className="text-sm font-semibold uppercase tracking-wide">Current patient</h3>
                </div>
              </div>
              <div className="space-y-3 p-4">
                <p className="text-lg font-bold">{patient?.name ?? '—'}</p>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Stage: {formatVisitStageLabel(visitInfo?.phase)}
                </p>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Status: {formatVisitStatusLabel(visitInfo?.status)}
                </p>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Wait: {calculateWaitTime(visitInfo?.arrivedAt ?? null)}
                </p>
                <button
                  type="button"
                  onClick={handleWorkOnAnotherPatient}
                  className={`mt-2 w-full cursor-pointer rounded-lg border px-3 py-2 text-sm font-medium ${
                    isDark ? 'border-gray-700 hover:bg-gray-800' : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  Work on another patient
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-8 xl:col-span-9">
            <BaseActionWorkspace
              title="Referral encounter workflow"
              icon={<Share2 className="h-6 w-6" />}
              theme={theme}
              defaultActionTo={REFERRAL_ROUTES.ACTION_CENTER_REFERRAL_STATUS}
              actions={[
                {
                  key: 'referral-status',
                  label: 'Referral status',
                  icon: <ListOrdered className="h-4 w-4" />,
                  to: REFERRAL_ROUTES.ACTION_CENTER_REFERRAL_STATUS,
                  description: 'Referrals linked to this patient',
                },
                {
                  key: 'create-referral',
                  label: 'Create referral',
                  icon: <PlusCircle className="h-4 w-4" />,
                  to: REFERRAL_ROUTES.ACTION_CENTER_CREATE_REFERRAL,
                  description: 'Submit internal or external referral request',
                },
                {
                  key: 'patient-info',
                  label: 'Patient chart',
                  icon: <FileText className="h-4 w-4" />,
                  to: REFERRAL_ROUTES.ACTION_CENTER_PATIENT_INFO,
                  description: 'Visit chart and history',
                },
                {
                  key: 'forward-patient',
                  label: 'Forward patient',
                  icon: <ArrowRight className="h-4 w-4" />,
                  to: FOCUS_MODE_ROUTES.FORWARD_PATIENT_FOCUS,
                  navigateState: {
                    cancelTo: REFERRAL_ROUTES.ACTION_CENTER_REFERRAL_STATUS,
                    queueRedirectTo: REFERRAL_ROUTES.PATIENT_QUEUE,
                  },
                  description: 'Send visit to another care team queue',
                },
                {
                  key: 'clinical-reports',
                  label: 'Clinical Reports',
                  icon: <FileText className="h-4 w-4" />,
                  to: REFERRAL_ROUTES.ACTION_CENTER_CLINICAL_REPORTS,
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

export default ReferralActionCenter;
