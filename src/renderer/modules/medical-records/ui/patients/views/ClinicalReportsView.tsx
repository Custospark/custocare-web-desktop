import React, { useCallback, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileOutput, Eye, Search, X, ChevronRight,
} from 'lucide-react';
import { cn } from '../../../../../shared/utils/classNameUtils';
import { selectActiveVisitId, selectActiveVisitPatientId, selectActiveVisitUuid } from '../../../../../app/store/slices/visitSlice';
import { useGetAllergies } from '../../../api/allergies/AllergyQueries';
import { useGetActiveVisitClinicalNotes } from '../../../api/clinical-notes/clinicalNoteQueries';
import { useGetActiveVisitVitals } from '../../../api/vitals/vitalQueries';
import { useGetActiveVisitDiagnoses } from '../../../api/diagnosis/diagnosisQueries';
import { useGetActiveVisitConsultations } from '../../../api/consultations/consultationQueries';
import { useGetVisitPrescriptions, useGetPrescriptionById } from '../../../api/prescription/PrescriptionQueries';
import { useGetPrescriptionItems } from '../../../api/prescription-items/PrescriptionItemsQueries';
import { useGetRequestWithItems, useGetRequestsByVisit } from '../../../api/lab/LabQueries';
import { LabRequestStatus, type LabRequest } from '../../../api/lab/LabTypes';
import { PrescriptionStatus, type Prescription } from '../../../api/prescription/PrescriptionTypes';
import { useGetDischargeData } from '../../../api/discharge/DischargeQueries';
import { normalizeAllergyResponse } from '../../visit-action-center/clinical-forms/allergies-form-components';
import { pickPrimaryClinicalNote } from '../../visit-action-center/clinical-forms/clinical-notes-form-components/clinicalNotesForm.utils';
import { pickPrimaryVitals } from '../../visit-action-center/clinical-forms/vitals-form-components/vitalsForm.utils';
import { pickPrimaryDiagnosis } from '../../visit-action-center/clinical-forms/diagnoses-form-components/diagnosesForm.utils';
import { pickPrimaryConsultation } from '../../visit-action-center/clinical-forms/consultations-form-components/consultationsForm.utils';
import {
  AllergyReportLauncher,
  ClinicalNoteReportLauncher,
  ConsultationReportLauncher,
  DiagnosisReportLauncher,
  LabRequestReportLauncher,
  LabResultReportLauncher,
  PrescriptionReportLauncher,
  VitalsReportLauncher,
  DischargeReportLauncher,
} from '../../visit-action-center/clinical-forms/clinical-reports/launchers';

interface ClinicalReportsViewProps {
  theme?: 'light' | 'dark';
}

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

interface ReportModalState {
  isOpen: boolean;
  module: 'allergies' | 'clinical-notes' | 'vitals' | 'diagnoses' | 'consultations' | 'prescriptions' | 'lab-requests' | 'lab-results' | 'discharge' | null;
  action: 'preview' | 'print' | 'download';
}

const getReportStatusInfo = (hasData: boolean, documentedNoun: string, ctaVerb: string) => ({
  hasData,
  message: hasData
    ? `${documentedNoun} documented`
    : `Not available - ${ctaVerb}`,
});

export const ClinicalReportsView: React.FC<ClinicalReportsViewProps> = ({ theme = 'light' }) => {
  const isDark = theme === 'dark';
  const activeVisitId = useSelector(selectActiveVisitId);
  const activePatientId = useSelector(selectActiveVisitPatientId);
  const activeVisitUuid = useSelector(selectActiveVisitUuid);

  const [reportModal, setReportModal] = useState<ReportModalState>({
    isOpen: false,
    module: null,
    action: 'preview',
  });

  const [searchQuery, setSearchQuery] = useState('');

  const vitalsQuery = useGetActiveVisitVitals({ enabled: !!activeVisitId });
  const notesQuery = useGetActiveVisitClinicalNotes({ enabled: !!activeVisitId });
  const diagnosesQuery = useGetActiveVisitDiagnoses({ enabled: !!activeVisitId });
  const consultationsQuery = useGetActiveVisitConsultations({ enabled: !!activeVisitId });
  const allergiesQuery = useGetAllergies(activePatientId ?? '', {}, {
    enabled: !!activePatientId,
  });

  const labRequestsQuery = useGetRequestsByVisit(Number(activeVisitId ?? 0), {
    enabled: !!activeVisitId,
  });

  const prescriptionsQuery = useGetVisitPrescriptions(Number(activeVisitId ?? 0), Number(activePatientId ?? 0), {
    enabled: !!activeVisitId,
  });

  const visitRequests = useMemo(() => labRequestsQuery.data ?? [], [labRequestsQuery.data]);

  const activeLabRequestForOrders = useMemo<LabRequest | null>(() => {
    if (!visitRequests.length) return null;
    const pool = visitRequests.filter((r) =>
      [LabRequestStatus.PENDING, LabRequestStatus.IN_PROGRESS].includes(r.status)
    );
    return (pool.length ? pool : visitRequests).sort(
      (a, b) => new Date(b.updated_at ?? b.created_at).getTime() - new Date(a.updated_at ?? a.created_at).getTime()
    )[0] ?? null;
  }, [visitRequests]);

  const activeLabRequestForResults = useMemo<LabRequest | null>(() => {
    if (!visitRequests.length) return null;
    const pool = visitRequests.filter((r) =>
      [LabRequestStatus.IN_PROGRESS, LabRequestStatus.COMPLETED].includes(r.status)
    );
    return (pool.length ? pool : visitRequests).sort(
      (a, b) => new Date(b.updated_at ?? b.created_at).getTime() - new Date(a.updated_at ?? a.created_at).getTime()
    )[0] ?? null;
  }, [visitRequests]);

  const labResultRequestQuery = useGetRequestWithItems(activeLabRequestForResults?.request_uuid ?? '', {
    enabled: !!activeLabRequestForResults?.request_uuid,
    refetchOnMount: 'always', refetchOnWindowFocus: false, staleTime: 0,
  });

  const resolvedExistingPrescription = useMemo<Prescription | null>(() => {
    const list = prescriptionsQuery.data?.data ?? [];
    if (!list.length) return null;
    const drafts = list.filter((item) => item.status === PrescriptionStatus.DRAFT);
    return (drafts.length ? drafts : list).sort(
      (a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime()
    )[0] ?? null;
  }, [prescriptionsQuery.data]);

  const selectedPrescriptionId = resolvedExistingPrescription?.id ?? 0;
  const selectedPrescriptionQuery = useGetPrescriptionById(selectedPrescriptionId, {
    enabled: !!selectedPrescriptionId, refetchOnMount: true, refetchOnWindowFocus: false, staleTime: 0,
  });
  const selectedPrescriptionItemsQuery = useGetPrescriptionItems(selectedPrescriptionId, {
    enabled: !!selectedPrescriptionId, refetchOnMount: true, refetchOnWindowFocus: false, staleTime: 0,
  });

  const dischargeQuery = useGetDischargeData(activeVisitUuid, {
    enabled: !!activeVisitUuid,
  });

  const moduleStatus = useMemo(() => {
    const normalizedAllergies = normalizeAllergyResponse(allergiesQuery.data);
    const notesList = notesQuery.data?.data ?? [];
    const vitalsList = vitalsQuery.data?.data ?? [];
    const diagnosesList = diagnosesQuery.data?.data ?? [];
    const consultationsList = consultationsQuery.data?.data ?? [];
    const currentPrescription = selectedPrescriptionQuery.data?.data ?? resolvedExistingPrescription;
    const prescriptionItems = selectedPrescriptionItemsQuery.data?.data ?? [];
    const raw = labResultRequestQuery.data;
    const labResultRequest = raw && typeof raw === 'object' && 'request_uuid' in raw
      ? (raw as unknown as LabRequest)
      : activeLabRequestForResults;
    const labResultCount = labResultRequest?.items?.reduce(
      (sum, item) => sum + (Array.isArray(item.results) ? item.results.length : 0), 0
    ) ?? 0;

    const hasClinicalNote = !!pickPrimaryClinicalNote(notesList);
    const hasVitals = !!pickPrimaryVitals(vitalsList);
    const hasDiagnosis = !!pickPrimaryDiagnosis(diagnosesList);
    const hasConsultation = !!pickPrimaryConsultation(consultationsList);
    const hasPrescription = !!currentPrescription || prescriptionItems.length > 0;

    return {
      allergies: { hasData: normalizedAllergies.allergies.length > 0 },
      clinicalNotes: { hasData: hasClinicalNote },
      vitals: { hasData: hasVitals },
      diagnoses: { hasData: hasDiagnosis },
      consultations: { hasData: hasConsultation },
      prescriptions: { hasData: hasPrescription },
      labRequests: { hasData: !!activeLabRequestForOrders },
      labResults: { hasData: labResultCount > 0 },
      discharge: { hasData: dischargeQuery.data?.data?.is_discharged ?? false },
    };
  }, [
    allergiesQuery.data, consultationsQuery.data, diagnosesQuery.data,
    notesQuery.data, vitalsQuery.data, resolvedExistingPrescription,
    selectedPrescriptionItemsQuery.data?.data, selectedPrescriptionQuery.data?.data,
    activeLabRequestForOrders, activeLabRequestForResults, labResultRequestQuery.data,
    dischargeQuery.data,
  ]);

  const openReport = useCallback((
    module: ReportModalState['module'],
    action: ReportModalState['action'] = 'preview',
  ) => {
    setReportModal({ isOpen: true, module, action });
  }, []);

  const closeReport = useCallback(() => {
    setReportModal({ isOpen: false, module: null, action: 'preview' });
  }, []);

  const reportOptions: ActionItem[] = useMemo(() => [
    {
      key: 'allergy-report', label: 'Allergy Report', icon: <FileOutput className="w-5 h-5" />,
      description: 'Allergy documentation for this patient', category: 'Clinical', actionPrefix: 'View',
      statusInfo: getReportStatusInfo(moduleStatus.allergies.hasData, 'Allergy report', 'record allergy details first'),
      handler: () => openReport('allergies', 'preview'),
    },
    {
      key: 'clinical-notes-report', label: 'Clinical Notes Report', icon: <FileOutput className="w-5 h-5" />,
      description: 'Clinical notes documentation', category: 'Documentation', actionPrefix: 'View',
      statusInfo: getReportStatusInfo(moduleStatus.clinicalNotes.hasData, 'Clinical notes report', 'document clinical notes first'),
      handler: () => openReport('clinical-notes', 'preview'),
    },
    {
      key: 'vitals-report', label: 'Vitals Report', icon: <FileOutput className="w-5 h-5" />,
      description: 'Vital signs summary report', category: 'Clinical', actionPrefix: 'View',
      statusInfo: getReportStatusInfo(moduleStatus.vitals.hasData, 'Vitals report', 'record vitals first'),
      handler: () => openReport('vitals', 'preview'),
    },
    {
      key: 'diagnosis-report', label: 'Diagnosis Report', icon: <FileOutput className="w-5 h-5" />,
      description: 'Diagnosis documentation report', category: 'Clinical', actionPrefix: 'View',
      statusInfo: getReportStatusInfo(moduleStatus.diagnoses.hasData, 'Diagnosis report', 'add diagnosis entries first'),
      handler: () => openReport('diagnoses', 'preview'),
    },
    {
      key: 'consultation-report', label: 'Consultation Report', icon: <FileOutput className="w-5 h-5" />,
      description: 'Consultation notes and recommendations', category: 'Clinical', actionPrefix: 'View',
      statusInfo: getReportStatusInfo(moduleStatus.consultations.hasData, 'Consultation report', 'capture consultation notes first'),
      handler: () => openReport('consultations', 'preview'),
    },
    {
      key: 'prescription-report', label: 'Prescription Report', icon: <FileOutput className="w-5 h-5" />,
      description: 'Printable prescription document', category: 'Treatment', actionPrefix: 'View',
      statusInfo: getReportStatusInfo(moduleStatus.prescriptions.hasData, 'Prescription report', 'enter prescription orders first'),
      handler: () => openReport('prescriptions', 'preview'),
    },
    {
      key: 'lab-request-report', label: 'Lab Request Report', icon: <FileOutput className="w-5 h-5" />,
      description: 'Laboratory request document', category: 'Diagnostics', actionPrefix: 'View',
      statusInfo: getReportStatusInfo(moduleStatus.labRequests.hasData, 'Lab request report', 'create a lab request first'),
      handler: () => openReport('lab-requests', 'preview'),
    },
    {
      key: 'lab-results-report', label: 'Lab Results Report', icon: <FileOutput className="w-5 h-5" />,
      description: 'Laboratory test results report', category: 'Diagnostics', actionPrefix: 'View',
      statusInfo: getReportStatusInfo(moduleStatus.labResults.hasData, 'Lab results report', 'enter lab results first'),
      handler: () => openReport('lab-results', 'preview'),
    },
    {
      key: 'discharge-report', label: 'Discharge Report', icon: <FileOutput className="w-5 h-5" />,
      description: 'Discharge summary document', category: 'Documentation', actionPrefix: 'View',
      statusInfo: getReportStatusInfo(moduleStatus.discharge.hasData, 'Discharge report', 'process discharge first'),
      handler: () => openReport('discharge', 'preview'),
    },
  ], [moduleStatus, openReport]);

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return reportOptions;
    const query = searchQuery.toLowerCase();
    return reportOptions.filter(
      (item) =>
        item.label.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query),
    );
  }, [reportOptions, searchQuery]);

  const clearSearch = useCallback(() => setSearchQuery(''), []);

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

  const colors = {
    text: {
      primary: isDark ? 'text-gray-100' : 'text-gray-900',
      secondary: isDark ? 'text-gray-300' : 'text-gray-600',
      tertiary: isDark ? 'text-gray-500' : 'text-gray-400',
    },
    bg: {
      primary: isDark ? 'bg-gray-900' : 'bg-gray-50',
      card: isDark ? 'bg-gray-800/60' : 'bg-white',
      hover: isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50',
      input: isDark ? 'bg-gray-800' : 'bg-white',
    },
    border: {
      primary: isDark ? 'border-gray-700' : 'border-gray-200',
      focus: isDark ? 'focus:border-blue-500' : 'focus:border-blue-500',
    },
  };

  return (
    <div className={`h-full w-full overflow-hidden p-4 sm:p-5 lg:p-6 ${colors.bg.primary}`}>
      {/* Header */}
      <div className="mb-4">
        <h2 className={cn('text-lg font-bold', colors.text.primary)}>Clinical Reports</h2>
        <p className={cn('text-sm', colors.text.secondary)}>View and print patient clinical documents</p>
      </div>

      {/* Search Bar */}
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
          {searchQuery && (
            <button onClick={clearSearch} aria-label="Clear search" title="Clear search" className={`absolute right-3 cursor-pointer rounded-full p-0.5 transition-colors ${colors.bg.hover}`}>
              <X className={`h-4 w-4 ${colors.text.tertiary}`} />
            </button>
          )}
        </div>
      </div>

      {/* Results count */}
      <div className="mb-3 flex items-center justify-between">
        <p className={`text-xs ${colors.text.tertiary}`}>
          {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'} found
        </p>
      </div>

      {/* Content Area */}
      <div className="h-[calc(100%-7rem)] overflow-y-auto pr-1">
        <AnimatePresence mode="wait">
          {filteredItems.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
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
                    <div className={`rounded-lg p-2 ${isDark ? 'bg-gray-700' : 'bg-gray-100'} group-hover:scale-105 transition-transform duration-200`}>
                      {option.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        {option.actionPrefix && (
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${getActionColor(option.actionPrefix)}`}>
                            {option.actionPrefix}:
                          </span>
                        )}
                        <h3 className={`font-semibold ${colors.text.primary}`}>{option.label}</h3>
                      </div>
                      {option.description && (
                        <p className={`text-sm ${colors.text.secondary}`}>{option.description}</p>
                      )}
                      {option.category && (
                        <span className={`mt-1 inline-block text-xs ${colors.text.tertiary}`}>{option.category}</span>
                      )}
                      {option.statusInfo && (
                        <div className="mt-2">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getStatusColor(option.statusInfo.hasData)}`}>
                            {option.statusInfo.message}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <ChevronRight className={`h-5 w-5 ${colors.text.tertiary} opacity-0 transition-opacity group-hover:opacity-100`} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Report Modals */}
      <AllergyReportLauncher isOpen={reportModal.isOpen && reportModal.module === 'allergies'} onClose={closeReport} initialAction={reportModal.action} theme={theme} />
      <ClinicalNoteReportLauncher isOpen={reportModal.isOpen && reportModal.module === 'clinical-notes'} onClose={closeReport} initialAction={reportModal.action} theme={theme} />
      <VitalsReportLauncher isOpen={reportModal.isOpen && reportModal.module === 'vitals'} onClose={closeReport} initialAction={reportModal.action} theme={theme} />
      <DiagnosisReportLauncher isOpen={reportModal.isOpen && reportModal.module === 'diagnoses'} onClose={closeReport} initialAction={reportModal.action} theme={theme} />
      <ConsultationReportLauncher isOpen={reportModal.isOpen && reportModal.module === 'consultations'} onClose={closeReport} initialAction={reportModal.action} theme={theme} />
      <PrescriptionReportLauncher isOpen={reportModal.isOpen && reportModal.module === 'prescriptions'} onClose={closeReport} initialAction={reportModal.action} theme={theme} />
      <LabRequestReportLauncher isOpen={reportModal.isOpen && reportModal.module === 'lab-requests'} onClose={closeReport} initialAction={reportModal.action} theme={theme} />
      <LabResultReportLauncher isOpen={reportModal.isOpen && reportModal.module === 'lab-results'} onClose={closeReport} initialAction={reportModal.action} theme={theme} />
      <DischargeReportLauncher isOpen={reportModal.isOpen && reportModal.module === 'discharge'} onClose={closeReport} initialAction={reportModal.action} theme={theme} />
    </div>
  );
};

export default ClinicalReportsView;
