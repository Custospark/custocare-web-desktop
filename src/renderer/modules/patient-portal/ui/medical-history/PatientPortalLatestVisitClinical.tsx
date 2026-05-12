import React, { useCallback, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
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
import type { RootState } from '../../../../app/store/rootReducer';
import {
  getPatientId,
  getPatientPrimaryFacilityId,
} from '../../../../app/store/utils/contextSelectors';
import { usePatientMedicalHistory } from '../../../medical-records/api/patient-medical-history/patientMedicalHistoryQueries';
import type { PatientMedicalHistoryPayload } from '../../../medical-records/api/patient-medical-history/patientMedicalHistoryTypes';
import {
  filterMedicalHistoryPayloadByVisitId,
  pickLatestVisitId,
} from '../../../medical-records/api/patient-medical-history/patientMedicalHistoryVisitFilter';
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

const getStatusInfo = (hasData: boolean, documentedNoun: string, ctaVerb: string) => ({
  hasData,
  message: hasData ? `${documentedNoun} documented - review/update` : `Not documented - ${ctaVerb}`,
});

const getReportStatusInfo = (hasData: boolean, reportNoun: string, ctaHint: string) => ({
  hasData,
  message: hasData ? `${reportNoun} ready - view report` : `No report data yet - ${ctaHint}`,
});

function visitScopedPayload(data: PatientMedicalHistoryPayload): PatientMedicalHistoryPayload | null {
  if (!data.visits.length) return null;
  const latestId = pickLatestVisitId(data.visits);
  if (latestId == null) return null;
  return filterMedicalHistoryPayloadByVisitId(data, latestId);
}

function buildModuleStatusFromScoped(scoped: PatientMedicalHistoryPayload) {
  return {
    allergies: getStatusInfo(scoped.allergies.length > 0, 'Allergy profile', 'capture allergy history'),
    clinicalNotes: getStatusInfo(scoped.clinical_notes.length > 0, 'Clinical note', 'document SOAP notes'),
    vitals: getStatusInfo(scoped.vitals.length > 0, 'Vital signs', 'record vitals'),
    diagnoses: getStatusInfo(scoped.diagnoses.length > 0, 'Diagnosis', 'add a diagnosis'),
    consultations: getStatusInfo(scoped.consultations.length > 0, 'Consultation', 'add consultation notes'),
    prescriptions: getStatusInfo(scoped.prescriptions.length > 0, 'Prescription', 'enter prescription orders'),
    labRequests: getStatusInfo(scoped.lab_requests.length > 0, 'Lab request', 'order lab tests'),
    labResults: getStatusInfo(scoped.lab_results.length > 0, 'Lab result', 'enter lab results'),
    clinicalTemplates: getStatusInfo(scoped.clinical_notes.length > 0, 'Clinical template', 'complete template notes'),
  };
}

export interface PatientPortalLatestVisitClinicalProps {
  theme?: 'light' | 'dark';
}

/**
 * Mirrors Patient Encounter Hub → Clinical Care → **Reports**: same list and report preview modals,
 * using patient id from context plus latest visit (and facility when present) from continuity-of-care data.
 */
export function PatientPortalLatestVisitClinical({ theme = 'light' }: PatientPortalLatestVisitClinicalProps) {
  const isDark = theme === 'dark';
  const patientId = useSelector((state: RootState) => getPatientId(state));
  const primaryFacilityId = useSelector((state: RootState) => getPatientPrimaryFacilityId(state));
  const numericId = patientId ?? 0;

  const historyQuery = usePatientMedicalHistory(numericId, {
    enabled: numericId > 0,
  });

  const scoped = useMemo(() => {
    if (!historyQuery.data) return null;
    return visitScopedPayload(historyQuery.data);
  }, [historyQuery.data]);

  const latestVisitMeta = useMemo(() => {
    if (!scoped?.visits?.length) return null;
    return scoped.visits[0];
  }, [scoped]);

  const portalContext = useMemo((): ClinicalReportPortalContext | null => {
    if (!patientId || !latestVisitMeta) return null;
    return {
      patientId,
      visitId: latestVisitMeta.id,
      facilityId:
        latestVisitMeta.facility_id ?? latestVisitMeta.facility?.id ?? primaryFacilityId ?? null,
      patientDisplayName: historyQuery.data?.patient?.full_name ?? null,
    };
  }, [patientId, latestVisitMeta, primaryFacilityId, historyQuery.data?.patient?.full_name]);

  const [reportModal, setReportModal] = useState<ReportModalState>({
    isOpen: false,
    module: null,
    action: 'preview',
  });
  const [searchQuery, setSearchQuery] = useState('');

  const moduleStatus = useMemo(() => {
    if (!scoped) return null;
    return buildModuleStatusFromScoped(scoped);
  }, [scoped]);

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
    if (!moduleStatus) return [];
    return [
      {
        key: 'allergy-report',
        label: 'Allergy Report',
        icon: <FileOutput className="w-5 h-5" />,
        description: 'Complete allergy documentation for this patient',
        category: 'Clinical',
        actionPrefix: 'View',
        statusInfo: getReportStatusInfo(
          moduleStatus.allergies.hasData,
          'Allergy report',
          'record allergy details first'
        ),
        handler: () => openReport('allergies', 'preview'),
      },
      {
        key: 'clinical-notes-report',
        label: 'Clinical Notes Report',
        icon: <FileOutput className="w-5 h-5" />,
        description: 'Complete clinical notes documentation',
        category: 'Documentation',
        actionPrefix: 'View',
        statusInfo: getReportStatusInfo(
          moduleStatus.clinicalNotes.hasData,
          'Clinical notes report',
          'document clinical notes first'
        ),
        handler: () => openReport('clinical-notes', 'preview'),
      },
      {
        key: 'vitals-report',
        label: 'Vitals Report',
        icon: <FileOutput className="w-5 h-5" />,
        description: 'Vital signs summary report',
        category: 'Clinical',
        actionPrefix: 'View',
        statusInfo: getReportStatusInfo(
          moduleStatus.vitals.hasData,
          'Vitals report',
          'record vitals first'
        ),
        handler: () => openReport('vitals', 'preview'),
      },
      {
        key: 'diagnosis-report',
        label: 'Diagnosis Report',
        icon: <FileOutput className="w-5 h-5" />,
        description: 'Diagnosis documentation report',
        category: 'Clinical',
        actionPrefix: 'View',
        statusInfo: getReportStatusInfo(
          moduleStatus.diagnoses.hasData,
          'Diagnosis report',
          'add diagnosis entries first'
        ),
        handler: () => openReport('diagnoses', 'preview'),
      },
      {
        key: 'consultation-report',
        label: 'Consultation Report',
        icon: <FileOutput className="w-5 h-5" />,
        description: 'Consultation notes and recommendations',
        category: 'Clinical',
        actionPrefix: 'View',
        statusInfo: getReportStatusInfo(
          moduleStatus.consultations.hasData,
          'Consultation report',
          'capture consultation notes first'
        ),
        handler: () => openReport('consultations', 'preview'),
      },
      {
        key: 'prescription-report',
        label: 'Prescription Report',
        icon: <FileOutput className="w-5 h-5" />,
        description: 'Printable prescription document',
        category: 'Treatment',
        actionPrefix: 'View',
        statusInfo: getReportStatusInfo(
          moduleStatus.prescriptions.hasData,
          'Prescription report',
          'enter prescription orders first'
        ),
        handler: () => openReport('prescriptions', 'preview'),
      },
      {
        key: 'lab-request-report',
        label: 'Lab Request Report',
        icon: <FileOutput className="w-5 h-5" />,
        description: 'Laboratory request document',
        category: 'Diagnostics',
        actionPrefix: 'View',
        statusInfo: getReportStatusInfo(
          moduleStatus.labRequests.hasData,
          'Lab request report',
          'create a lab request first'
        ),
        handler: () => openReport('lab-requests', 'preview'),
      },
      {
        key: 'lab-results-report',
        label: 'Lab Results Report',
        icon: <FileOutput className="w-5 h-5" />,
        description: 'Laboratory test results report',
        category: 'Diagnostics',
        actionPrefix: 'View',
        statusInfo: getReportStatusInfo(
          moduleStatus.labResults.hasData,
          'Lab results report',
          'enter lab results first'
        ),
        handler: () => openReport('lab-results', 'preview'),
      },
    ];
  }, [moduleStatus, openReport]);

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

  if (!numericId) {
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

  if (historyQuery.isLoading) {
    return (
      <div className="p-6">
        <LoadingSkeleton variant="dashboard" theme={theme} message="Loading your latest visit…" />
      </div>
    );
  }

  if (historyQuery.isError) {
    return (
      <div className={`rounded-xl border p-6 ${colors.border.primary} ${colors.bg.secondary}`}>
        <p className="text-sm text-red-600">
          {(historyQuery.error as Error)?.message ?? 'Unable to load visit information.'}
        </p>
      </div>
    );
  }

  if (!scoped || !latestVisitMeta || !moduleStatus) {
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

  return (
    <div className={`h-full w-full overflow-hidden p-4 sm:p-5 lg:p-6 ${colors.bg.primary}`}>
      <div className="no-print mb-6">
        <div className="mb-4 flex items-start gap-3">
          <Eye className={`mt-0.5 h-6 w-6 shrink-0 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
          <div>
            <h2 className={`text-xl font-bold ${colors.text.primary}`}>Reports — latest visit</h2>
            <p className={`mt-1 text-sm ${colors.text.secondary}`}>
              Same report previews as Clinical Care in the encounter hub, scoped to your most recent visit.
            </p>
          </div>
        </div>

        <div
          className={`flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between ${colors.border.primary} ${colors.bg.elevated}`}
        >
          <div className="flex items-start gap-3">
            <Building2 className={`mt-0.5 h-5 w-5 shrink-0 ${colors.text.tertiary}`} />
            <div>
              <p className={`text-sm font-semibold ${colors.text.primary}`}>
                {latestVisitMeta.facility?.name ?? 'Hospital visit'}
                {latestVisitMeta.facility?.code ? (
                  <span className={`font-normal ${colors.text.secondary}`}> ({latestVisitMeta.facility.code})</span>
                ) : null}
              </p>
              <p className={`text-xs ${colors.text.tertiary}`}>
                Visit ID {latestVisitMeta.id}
                {latestVisitMeta.visit_uuid ? (
                  <span className={`ml-1 font-mono ${colors.text.tertiary}`}>· {latestVisitMeta.visit_uuid}</span>
                ) : null}
              </p>
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
              {filteredItems.map((option, index) => (
                <motion.div
                  key={option.key}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.15, delay: index * 0.02 }}
                  onClick={option.handler}
                  className={`group flex cursor-pointer items-center justify-between rounded-xl border p-4 transition-all duration-200 ${colors.border.primary} ${colors.bg.card} ${colors.bg.hover}`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`rounded-lg p-2 ${isDark ? 'bg-gray-700' : 'bg-gray-100'} transition-transform duration-200 group-hover:scale-105`}
                    >
                      {option.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        {option.actionPrefix ? (
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${getActionColor(option.actionPrefix)}`}
                          >
                            {option.actionPrefix}:
                          </span>
                        ) : null}
                        <h3 className={`font-semibold ${colors.text.primary}`}>{option.label}</h3>
                      </div>
                      {option.description ? (
                        <p className={`text-sm ${colors.text.secondary}`}>{option.description}</p>
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
                    className={`h-5 w-5 ${colors.text.tertiary} opacity-0 transition-opacity group-hover:opacity-100`}
                  />
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
