import React, { useCallback, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  ChevronRight,
  Clock,
  Eye,
  FileOutput,
  Search,
  X,
} from 'lucide-react';
import { useGetAllergies } from '../../../medical-records/api/allergies/AllergyQueries';
import { useGetVisitClinicalNotes } from '../../../medical-records/api/clinical-notes/clinicalNoteQueries';
import { useGetVisitVitals } from '../../../medical-records/api/vitals/vitalQueries';
import { useGetVisitDiagnoses } from '../../../medical-records/api/diagnosis/diagnosisQueries';
import { useGetVisitConsultations } from '../../../medical-records/api/consultations/consultationQueries';
import { useGetPatientPrescriptions, useGetPrescriptionById } from '../../../medical-records/api/prescription/PrescriptionQueries';
import { PrescriptionStatus, type Prescription } from '../../../medical-records/api/prescription/PrescriptionTypes';
import { useGetPrescriptionItems } from '../../../medical-records/api/prescription-items/PrescriptionItemsQueries';
import { useGetRequestWithItems, useGetRequestsByVisit } from '../../../medical-records/api/lab/LabQueries';
import { LabRequestStatus, type LabRequest } from '../../../medical-records/api/lab/LabTypes';
import type {
  FacilitySnapshot,
  MedicalHistoryVisit,
  PatientMedicalHistoryPayload,
} from '../../../medical-records/api/patient-medical-history/patientMedicalHistoryTypes';
import { normalizeAllergyResponse } from '../../../medical-records/ui/visit-action-center/clinical-forms/allergies-form-components';
import { pickPrimaryClinicalNote } from '../../../medical-records/ui/visit-action-center/clinical-forms/clinical-notes-form-components/clinicalNotesForm.utils';
import { pickPrimaryVitals } from '../../../medical-records/ui/visit-action-center/clinical-forms/vitals-form-components/vitalsForm.utils';
import { pickPrimaryDiagnosis } from '../../../medical-records/ui/visit-action-center/clinical-forms/diagnoses-form-components/diagnosesForm.utils';
import { pickPrimaryConsultation } from '../../../medical-records/ui/visit-action-center/clinical-forms/consultations-form-components/consultationsForm.utils';
import {
  AllergyReportLauncher,
  ClinicalNoteReportLauncher,
  ConsultationReportLauncher,
  DiagnosisReportLauncher,
  LabRequestReportLauncher,
  LabResultReportLauncher,
  PrescriptionReportLauncher,
  VitalsReportLauncher,
} from '../../../medical-records/ui/visit-action-center/clinical-forms/clinical-reports/launchers';
import type { ClinicalReportPortalContext } from '../../../medical-records/ui/visit-action-center/clinical-forms/clinical-reports/launchers/clinicalReportPortalContext';
import LoadingSkeleton from '../../../../shared/components/Loading/LoadingSkeletons';
import {
  PATIENT_PORTAL_REPORT_EMPTY_HINT,
  PATIENT_PORTAL_REPORT_ROW_DESCRIPTION,
  patientPortalReportBadge,
} from '../medical-history/patientPortalLatestVisitReports.messages';

interface ActionItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  category: string;
  actionPrefix?: 'Add' | 'View';
  statusInfo?: {
    hasData: boolean;
    message: string;
  };
  handler: () => void;
}

type ReportModalModule =
  | 'allergies'
  | 'clinical-notes'
  | 'vitals'
  | 'diagnoses'
  | 'consultations'
  | 'prescriptions'
  | 'lab-requests'
  | 'lab-results'
  | null;

interface ReportModalState {
  isOpen: boolean;
  module: ReportModalModule;
  action: 'preview' | 'print' | 'download';
}

const resolveRequestFromApiPayload = (payload: unknown): LabRequest | null => {
  if (!payload || typeof payload !== 'object') return null;
  const candidate = payload as Partial<LabRequest>;
  if (typeof candidate.request_uuid === 'string') return candidate as LabRequest;
  const nested = payload as { data?: Partial<LabRequest> };
  if (nested.data && typeof nested.data.request_uuid === 'string') {
    return nested.data as LabRequest;
  }
  return null;
};

export interface PatientPortalVisitReportsClinicalProps {
  theme?: 'light' | 'dark';
  patientId: number;
  effectiveVisitId: number | null;
  effectiveFacilityId: number | null;
  scoped: PatientMedicalHistoryPayload | null;
  patientDisplayName: string | null;
  headerVisit: MedicalHistoryVisit | null;
  headerFacility: FacilitySnapshot | null;
  pageTitle: string;
  pageSubtitle: string;
  loadingMessage: string;
  isHistoryLoading: boolean;
  isHistoryError: boolean;
  historyError: Error | null;
  /**
   * When true, wait for latest-visit-context query before showing the “no visit” empty state
   * (medical history latest-visit page).
   */
  awaitVisitContext?: boolean;
  visitContextQueryPending?: boolean;
  visitContextQueryFetched?: boolean;
  visitContextQuerySuccess?: boolean;
}

export function PatientPortalVisitReportsClinical({
  theme = 'light',
  patientId,
  effectiveVisitId,
  effectiveFacilityId,
  scoped,
  patientDisplayName,
  headerVisit,
  headerFacility,
  pageTitle,
  pageSubtitle,
  loadingMessage,
  isHistoryLoading,
  isHistoryError,
  historyError,
  awaitVisitContext = false,
  visitContextQueryPending = false,
  visitContextQueryFetched = true,
  visitContextQuerySuccess = false,
}: PatientPortalVisitReportsClinicalProps) {
  const isDark = theme === 'dark';

  const visitApisEnabled =
    patientId > 0 && effectiveVisitId != null && effectiveFacilityId != null;

  const allergiesQuery = useGetAllergies(String(patientId), {}, {
    enabled: patientId > 0,
    staleTime: 30_000,
  });

  const portalVisitNotesQuery = useGetVisitClinicalNotes(effectiveVisitId ?? 0, {
    enabled: visitApisEnabled,
    facilityId: effectiveFacilityId ?? undefined,
    staleTime: 30_000,
  });
  const portalVisitVitalsQuery = useGetVisitVitals(effectiveVisitId ?? 0, {
    enabled: visitApisEnabled,
    facilityId: effectiveFacilityId ?? undefined,
    staleTime: 30_000,
  });
  const portalVisitDiagnosesQuery = useGetVisitDiagnoses(effectiveVisitId ?? 0, {
    enabled: visitApisEnabled,
    facilityId: effectiveFacilityId ?? undefined,
    staleTime: 30_000,
  });
  const portalVisitConsultationsQuery = useGetVisitConsultations(effectiveVisitId ?? 0, {
    enabled: visitApisEnabled,
    facilityId: effectiveFacilityId ?? undefined,
    staleTime: 30_000,
  });

  const prescriptionsQuery = useGetPatientPrescriptions(patientId, [], {
    enabled: patientId > 0,
    staleTime: 30_000,
  });

  const resolvedExistingPrescription = useMemo<Prescription | null>(() => {
    const prescriptions = prescriptionsQuery.data?.data ?? [];
    const pool =
      effectiveVisitId != null
        ? prescriptions.filter((item) => item.visit_id === effectiveVisitId)
        : prescriptions;
    if (!pool.length) return null;
    const drafts = pool.filter((item) => item.status === PrescriptionStatus.DRAFT);
    const candidatePool = drafts.length ? drafts : pool;
    return [...candidatePool].sort((a, b) => {
      const aTime = new Date(a.updated_at || a.created_at).getTime();
      const bTime = new Date(b.updated_at || b.created_at).getTime();
      return bTime - aTime;
    })[0] ?? null;
  }, [prescriptionsQuery.data, effectiveVisitId]);

  const selectedPrescriptionId = resolvedExistingPrescription?.id ?? 0;
  const selectedPrescriptionQuery = useGetPrescriptionById(selectedPrescriptionId, {
    enabled: !!selectedPrescriptionId,
    staleTime: 30_000,
  });
  const selectedPrescriptionItemsQuery = useGetPrescriptionItems(selectedPrescriptionId, {
    enabled: !!selectedPrescriptionId,
    staleTime: 30_000,
  });

  const labRequestsQuery = useGetRequestsByVisit(effectiveVisitId ?? 0, {
    enabled: !!effectiveVisitId,
    staleTime: 30_000,
  });

  const visitRequests = useMemo(() => labRequestsQuery.data ?? [], [labRequestsQuery.data]);

  const activeLabRequestForOrders = useMemo<LabRequest | null>(() => {
    if (!visitRequests.length) return null;
    const pendingOrActive = visitRequests.filter((request) =>
      [LabRequestStatus.PENDING, LabRequestStatus.IN_PROGRESS].includes(request.status)
    );
    const candidatePool = pendingOrActive.length ? pendingOrActive : visitRequests;
    return [...candidatePool].sort((a, b) => {
      const aTime = new Date(a.updated_at ?? a.created_at).getTime();
      const bTime = new Date(b.updated_at ?? b.created_at).getTime();
      return bTime - aTime;
    })[0] ?? null;
  }, [visitRequests]);

  const activeLabRequestForResults = useMemo<LabRequest | null>(() => {
    if (!visitRequests.length) return null;
    const inProgressOrCompleted = visitRequests.filter((request) =>
      [LabRequestStatus.IN_PROGRESS, LabRequestStatus.COMPLETED].includes(request.status)
    );
    const candidatePool = inProgressOrCompleted.length ? inProgressOrCompleted : visitRequests;
    return [...candidatePool].sort((a, b) => {
      const aTime = new Date(a.updated_at ?? a.created_at).getTime();
      const bTime = new Date(b.updated_at ?? b.created_at).getTime();
      return bTime - aTime;
    })[0] ?? null;
  }, [visitRequests]);

  const labResultRequestQuery = useGetRequestWithItems(activeLabRequestForResults?.request_uuid ?? '', {
    enabled: !!activeLabRequestForResults?.request_uuid,
    staleTime: 30_000,
  });

  const portalContext = useMemo((): ClinicalReportPortalContext | null => {
    if (!patientId || effectiveVisitId == null) return null;
    const facilityId =
      effectiveFacilityId ?? headerFacility?.id ?? headerVisit?.facility_id ?? null;
    return {
      patientId,
      visitId: effectiveVisitId,
      facilityId,
      patientDisplayName,
    };
  }, [
    patientId,
    effectiveVisitId,
    effectiveFacilityId,
    headerFacility,
    headerVisit,
    patientDisplayName,
  ]);

  const visitDateLine = useMemo(() => {
    const raw = headerVisit?.occurred_at ?? headerVisit?.arrived_at ?? headerVisit?.discharged_at;
    if (!raw) return null;
    const t = new Date(raw).getTime();
    if (!Number.isFinite(t)) return null;
    return new Date(raw).toLocaleDateString(undefined, {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }, [headerVisit]);

  const [reportModal, setReportModal] = useState<ReportModalState>({
    isOpen: false,
    module: null,
    action: 'preview',
  });
  const [searchQuery, setSearchQuery] = useState('');

  const availability = useMemo(() => {
    if (patientId <= 0) return null;

    const normalizedAllergies = normalizeAllergyResponse(allergiesQuery.data);
    const allergyHasData =
      normalizedAllergies.allergies.length > 0 || (scoped?.allergies.length ?? 0) > 0;

    const notesList = portalVisitNotesQuery.data?.data ?? [];
    const clinicalNotesHasData =
      !!pickPrimaryClinicalNote(notesList) || (scoped?.clinical_notes.length ?? 0) > 0;

    const vitalsList = portalVisitVitalsQuery.data?.data ?? [];
    const vitalsHasData =
      !!pickPrimaryVitals(vitalsList) || (scoped?.vitals.length ?? 0) > 0;

    const diagnosesList = portalVisitDiagnosesQuery.data?.data ?? [];
    const diagnosesHasData =
      !!pickPrimaryDiagnosis(diagnosesList) || (scoped?.diagnoses.length ?? 0) > 0;

    const consultationsList = portalVisitConsultationsQuery.data?.data ?? [];
    const consultationsHasData =
      !!pickPrimaryConsultation(consultationsList) || (scoped?.consultations.length ?? 0) > 0;

    const currentPrescription =
      selectedPrescriptionQuery.data?.data ?? resolvedExistingPrescription;
    const prescriptionItems = selectedPrescriptionItemsQuery.data?.data ?? [];
    const prescriptionsHasData =
      !!currentPrescription ||
      prescriptionItems.length > 0 ||
      (scoped?.prescriptions.length ?? 0) > 0;

    const labResultRequest =
      resolveRequestFromApiPayload(labResultRequestQuery.data) ?? activeLabRequestForResults;
    const labResultCount =
      labResultRequest?.items?.reduce((sum, item) => {
        const currentCount = Array.isArray(item.results) ? item.results.length : 0;
        return sum + currentCount;
      }, 0) ?? 0;

    const labRequestsHasData =
      !!activeLabRequestForOrders || (scoped?.lab_requests.length ?? 0) > 0;
    const labResultsHasData = labResultCount > 0 || (scoped?.lab_results.length ?? 0) > 0;

    return {
      allergies: allergyHasData,
      clinicalNotes: clinicalNotesHasData,
      vitals: vitalsHasData,
      diagnoses: diagnosesHasData,
      consultations: consultationsHasData,
      prescriptions: prescriptionsHasData,
      labRequests: labRequestsHasData,
      labResults: labResultsHasData,
    };
  }, [
    activeLabRequestForOrders,
    activeLabRequestForResults,
    allergiesQuery.data,
    labResultRequestQuery.data,
    patientId,
    portalVisitConsultationsQuery.data,
    portalVisitDiagnosesQuery.data,
    portalVisitNotesQuery.data,
    portalVisitVitalsQuery.data,
    resolvedExistingPrescription,
    scoped,
    selectedPrescriptionItemsQuery.data?.data,
    selectedPrescriptionQuery.data?.data,
  ]);

  const openReport = useCallback((module: ReportModalModule, action: 'preview' | 'print' | 'download' = 'preview') => {
    setReportModal({
      isOpen: true,
      module,
      action,
    });
  }, []);

  const closeReport = useCallback(() => {
    setReportModal({
      isOpen: false,
      module: null,
      action: 'preview',
    });
  }, []);

  const reportOptions: ActionItem[] = useMemo(() => {
    if (!availability) return [];
    return [
      {
        key: 'allergy-report',
        label: 'Allergy Report',
        icon: <FileOutput className="w-5 h-5" />,
        description: PATIENT_PORTAL_REPORT_ROW_DESCRIPTION.allergy,
        category: 'Clinical',
        actionPrefix: 'View',
        statusInfo: patientPortalReportBadge(
          availability.allergies,
          'Allergy report',
          PATIENT_PORTAL_REPORT_EMPTY_HINT.allergies
        ),
        handler: () => openReport('allergies', 'preview'),
      },
      {
        key: 'clinical-notes-report',
        label: 'Clinical Notes Report',
        icon: <FileOutput className="w-5 h-5" />,
        description: PATIENT_PORTAL_REPORT_ROW_DESCRIPTION.clinicalNotes,
        category: 'Documentation',
        actionPrefix: 'View',
        statusInfo: patientPortalReportBadge(
          availability.clinicalNotes,
          'Clinical notes report',
          PATIENT_PORTAL_REPORT_EMPTY_HINT.clinicalNotes
        ),
        handler: () => openReport('clinical-notes', 'preview'),
      },
      {
        key: 'vitals-report',
        label: 'Vitals Report',
        icon: <FileOutput className="w-5 h-5" />,
        description: PATIENT_PORTAL_REPORT_ROW_DESCRIPTION.vitals,
        category: 'Clinical',
        actionPrefix: 'View',
        statusInfo: patientPortalReportBadge(
          availability.vitals,
          'Vitals report',
          PATIENT_PORTAL_REPORT_EMPTY_HINT.vitals
        ),
        handler: () => openReport('vitals', 'preview'),
      },
      {
        key: 'diagnosis-report',
        label: 'Diagnosis Report',
        icon: <FileOutput className="w-5 h-5" />,
        description: PATIENT_PORTAL_REPORT_ROW_DESCRIPTION.diagnoses,
        category: 'Clinical',
        actionPrefix: 'View',
        statusInfo: patientPortalReportBadge(
          availability.diagnoses,
          'Diagnosis report',
          PATIENT_PORTAL_REPORT_EMPTY_HINT.diagnoses
        ),
        handler: () => openReport('diagnoses', 'preview'),
      },
      {
        key: 'consultation-report',
        label: 'Consultation Report',
        icon: <FileOutput className="w-5 h-5" />,
        description: PATIENT_PORTAL_REPORT_ROW_DESCRIPTION.consultations,
        category: 'Clinical',
        actionPrefix: 'View',
        statusInfo: patientPortalReportBadge(
          availability.consultations,
          'Consultation report',
          PATIENT_PORTAL_REPORT_EMPTY_HINT.consultations
        ),
        handler: () => openReport('consultations', 'preview'),
      },
      {
        key: 'prescription-report',
        label: 'Prescription Report',
        icon: <FileOutput className="w-5 h-5" />,
        description: PATIENT_PORTAL_REPORT_ROW_DESCRIPTION.prescriptions,
        category: 'Treatment',
        actionPrefix: 'View',
        statusInfo: patientPortalReportBadge(
          availability.prescriptions,
          'Prescription report',
          PATIENT_PORTAL_REPORT_EMPTY_HINT.prescriptions
        ),
        handler: () => openReport('prescriptions', 'preview'),
      },
      {
        key: 'lab-request-report',
        label: 'Lab Request Report',
        icon: <FileOutput className="w-5 h-5" />,
        description: PATIENT_PORTAL_REPORT_ROW_DESCRIPTION.labRequests,
        category: 'Diagnostics',
        actionPrefix: 'View',
        statusInfo: patientPortalReportBadge(
          availability.labRequests,
          'Lab request report',
          PATIENT_PORTAL_REPORT_EMPTY_HINT.labRequests
        ),
        handler: () => openReport('lab-requests', 'preview'),
      },
      {
        key: 'lab-results-report',
        label: 'Lab Results Report',
        icon: <FileOutput className="w-5 h-5" />,
        description: PATIENT_PORTAL_REPORT_ROW_DESCRIPTION.labResults,
        category: 'Diagnostics',
        actionPrefix: 'View',
        statusInfo: patientPortalReportBadge(
          availability.labResults,
          'Lab results report',
          PATIENT_PORTAL_REPORT_EMPTY_HINT.labResults
        ),
        handler: () => openReport('lab-results', 'preview'),
      },
    ];
  }, [availability, openReport]);

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return reportOptions;
    const query = searchQuery.toLowerCase();
    return reportOptions.filter(
      (item) =>
        item.label.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query)
    );
  }, [reportOptions, searchQuery]);

  const colors = {
    bg: {
      primary: isDark ? 'bg-gray-900' : 'bg-gray-50',
      secondary: isDark ? 'bg-gray-800' : 'bg-white',
      elevated: isDark ? 'bg-gray-800' : 'bg-white',
      hover: isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50',
      card: isDark ? 'bg-gray-800/50' : 'bg-white',
      input: isDark ? 'bg-gray-800' : 'bg-white',
    },
    text: {
      primary: isDark ? 'text-gray-100' : 'text-gray-900',
      secondary: isDark ? 'text-gray-400' : 'text-gray-600',
      tertiary: isDark ? 'text-gray-500' : 'text-gray-400',
    },
    border: {
      primary: isDark ? 'border-gray-700' : 'border-gray-200',
      focus: isDark ? 'focus:border-blue-500' : 'focus:border-blue-500',
    },
    active: {
      bg: isDark ? 'bg-blue-600' : 'bg-blue-600',
      text: 'text-white',
    },
  };

  const getActionColor = (actionPrefix?: string) => {
    if (actionPrefix === 'Add') {
      return isDark ? 'text-green-400 bg-green-900/20' : 'text-green-600 bg-green-50';
    }
    return isDark ? 'text-blue-400 bg-blue-900/20' : 'text-blue-600 bg-blue-50';
  };

  const getStatusColor = (hasData: boolean) => {
    if (hasData) {
      return isDark ? 'text-emerald-400 bg-emerald-900/20' : 'text-emerald-700 bg-emerald-50';
    }
    return isDark ? 'text-amber-400 bg-amber-900/20' : 'text-amber-700 bg-amber-50';
  };

  const clearSearch = useCallback(() => setSearchQuery(''), []);

  if (!patientId) {
    return (
      <div className={`h-full w-full p-6 ${colors.bg.primary}`}>
        <div className={`rounded-xl border p-12 text-center ${colors.border.primary} ${colors.bg.secondary}`}>
          <p className={`text-sm ${colors.text.secondary}`}>
            Patient record could not be loaded. Please sign in again or contact support.
          </p>
        </div>
      </div>
    );
  }

  if (isHistoryLoading || (awaitVisitContext && visitContextQueryPending)) {
    return (
      <div className="p-6">
        <LoadingSkeleton variant="dashboard" theme={theme} message={loadingMessage} />
      </div>
    );
  }

  if (isHistoryError) {
    return (
      <div className={`rounded-xl border p-6 ${colors.border.primary} ${colors.bg.secondary}`}>
        <p className="text-sm text-red-600">
          {historyError?.message ?? 'Unable to load visit information.'}
        </p>
      </div>
    );
  }

  const visitContextReady =
    !isHistoryLoading &&
    !isHistoryError &&
    (awaitVisitContext ? visitContextQuerySuccess || visitContextQueryFetched : true);

  if (visitContextReady && effectiveVisitId == null && (scoped?.visits?.length ?? 0) === 0) {
    return (
      <div className={`h-full w-full p-6 ${colors.bg.primary}`}>
        <div className={`rounded-xl border p-12 text-center ${colors.border.primary} ${colors.bg.secondary}`}>
          <Clock className={`mx-auto mb-4 h-12 w-12 ${colors.text.tertiary}`} />
          <h3 className={`mb-2 text-lg font-semibold ${colors.text.primary}`}>No visit on file yet</h3>
          <p className={`text-sm ${colors.text.secondary}`}>
            When you complete a hospital visit, your clinical reports for that encounter will appear here.
          </p>
        </div>
      </div>
    );
  }

  if (!availability) {
    return (
      <div className={`h-full w-full p-6 ${colors.bg.primary}`}>
        <div className={`rounded-xl border p-12 text-center ${colors.border.primary} ${colors.bg.secondary}`}>
          <p className={`text-sm ${colors.text.secondary}`}>
            Patient record could not be loaded. Please sign in again or contact support.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full w-full overflow-hidden p-4 sm:p-5 lg:p-6 ${colors.bg.primary}`}>
      <div className="no-print mb-6">
        <div className="mb-4 flex items-start gap-3">
          <Eye className={`mt-0.5 h-6 w-6 shrink-0 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
          <div>
            <h2 className={`text-xl font-bold ${colors.text.primary}`}>{pageTitle}</h2>
            <p className={`mt-1 text-sm ${colors.text.secondary}`}>{pageSubtitle}</p>
          </div>
        </div>

        <div
          className={`flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between ${colors.border.primary} ${colors.bg.elevated}`}
        >
          <div className="flex items-start gap-3">
            <Building2 className={`mt-0.5 h-5 w-5 shrink-0 ${colors.text.tertiary}`} />
            <div>
              <p className={`text-sm font-semibold ${colors.text.primary}`}>
                Visit at {headerFacility?.name ?? 'Hospital'}
                {headerFacility?.code ? (
                  <span className={`font-normal ${colors.text.secondary}`}> ({headerFacility.code})</span>
                ) : null}
              </p>
              {visitDateLine ? (
                <p className={`mt-0.5 text-xs ${colors.text.secondary}`}>{visitDateLine}</p>
              ) : null}
            
            </div>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <div className={`relative flex items-center rounded-xl border ${colors.border.primary} ${colors.bg.input}`}>
          <Search className={`absolute left-3 h-4 w-4 ${colors.text.tertiary}`} />
          <input
            type="text"
            placeholder="Search reports..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full cursor-text rounded-xl py-2.5 pl-9 pr-10 text-sm outline-none transition-all ${colors.bg.input} ${colors.text.primary} ${colors.border.focus}`}
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={clearSearch}
              aria-label="Clear search"
              title="Clear search"
              className={`absolute right-3 cursor-pointer rounded-full p-0.5 transition-colors ${colors.bg.hover}`}
            >
              <X className={`h-4 w-4 ${colors.text.tertiary}`} />
            </button>
          ) : null}
        </div>
      </div>

      <div className="mb-3 flex items-center justify-between">
        <p className={`text-xs ${colors.text.tertiary}`}>
          {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'} found · Reports ({reportOptions.length})
        </p>
      </div>

      <div className="h-[calc(100%-12rem)] overflow-y-auto pr-1">
        <AnimatePresence mode="wait">
          {filteredItems.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`flex flex-col items-center justify-center rounded-xl border p-12 text-center ${colors.border.primary} ${colors.bg.card}`}
            >
              <Eye className={`mb-3 h-12 w-12 ${colors.text.tertiary}`} />
              <h3 className={`mb-1 font-medium ${colors.text.primary}`}>No reports found</h3>
              <p className={`text-sm ${colors.text.tertiary}`}>Try adjusting your search term</p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
            >
              {filteredItems.map((option, index) => (
                <motion.div
                  key={option.key}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.15, delay: index * 0.02 }}
                  onClick={option.handler}
                  className={`group flex min-h-36 cursor-pointer flex-col rounded-xl border p-4 transition-all duration-200 ${colors.border.primary} ${colors.bg.card} ${colors.bg.hover}`}
                >
                  <div className="flex flex-1 items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <div
                        className={`shrink-0 rounded-lg p-2 ${isDark ? 'bg-gray-700' : 'bg-gray-100'} transition-transform duration-200 group-hover:scale-105`}
                      >
                        {option.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {option.actionPrefix ? (
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${getActionColor(option.actionPrefix)}`}
                            >
                              {option.actionPrefix}:
                            </span>
                          ) : null}
                          <h3 className={`font-semibold leading-snug ${colors.text.primary}`}>{option.label}</h3>
                        </div>
                        {option.description ? (
                          <p className={`mt-1 line-clamp-2 text-sm ${colors.text.secondary}`}>{option.description}</p>
                        ) : null}
                        {option.category ? (
                          <span className={`mt-1 inline-block text-xs ${colors.text.tertiary}`}>{option.category}</span>
                        ) : null}
                        {option.statusInfo ? (
                          <div className="mt-2">
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getStatusColor(option.statusInfo.hasData)}`}
                            >
                              {option.statusInfo.message}
                            </span>
                          </div>
                        ) : null}
                      </div>
                    </div>
                    <ChevronRight
                      className={`mt-0.5 h-5 w-5 shrink-0 ${colors.text.tertiary} opacity-60 transition-opacity group-hover:opacity-100`}
                    />
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AllergyReportLauncher
        isOpen={reportModal.isOpen && reportModal.module === 'allergies'}
        onClose={closeReport}
        initialAction={reportModal.action}
        theme={theme}
        portalContext={portalContext}
      />
      <ClinicalNoteReportLauncher
        isOpen={reportModal.isOpen && reportModal.module === 'clinical-notes'}
        onClose={closeReport}
        initialAction={reportModal.action}
        theme={theme}
        portalContext={portalContext}
      />
      <VitalsReportLauncher
        isOpen={reportModal.isOpen && reportModal.module === 'vitals'}
        onClose={closeReport}
        initialAction={reportModal.action}
        theme={theme}
        portalContext={portalContext}
      />
      <DiagnosisReportLauncher
        isOpen={reportModal.isOpen && reportModal.module === 'diagnoses'}
        onClose={closeReport}
        initialAction={reportModal.action}
        theme={theme}
        portalContext={portalContext}
      />
      <ConsultationReportLauncher
        isOpen={reportModal.isOpen && reportModal.module === 'consultations'}
        onClose={closeReport}
        initialAction={reportModal.action}
        theme={theme}
        portalContext={portalContext}
      />
      <PrescriptionReportLauncher
        isOpen={reportModal.isOpen && reportModal.module === 'prescriptions'}
        onClose={closeReport}
        initialAction={reportModal.action}
        theme={theme}
        portalContext={portalContext}
      />
      <LabRequestReportLauncher
        isOpen={reportModal.isOpen && reportModal.module === 'lab-requests'}
        onClose={closeReport}
        initialAction={reportModal.action}
        theme={theme}
        portalContext={portalContext}
      />
      <LabResultReportLauncher
        isOpen={reportModal.isOpen && reportModal.module === 'lab-results'}
        onClose={closeReport}
        initialAction={reportModal.action}
        theme={theme}
        portalContext={portalContext}
      />
    </div>
  );
}
