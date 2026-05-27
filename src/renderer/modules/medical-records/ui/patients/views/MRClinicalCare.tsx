import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';
import { 
  FileText, 
  Activity, 
  Pill, 
  Microscope, 
  ClipboardList,
  Search,
  X,
  ChevronRight,
  Plus,
  Eye,
  Heart,
  AlertTriangle,
  Users
} from 'lucide-react';
import { FOCUS_MODE_ROUTES } from '../../../../administration/onboarding/routes/focusModeRouteConstants';
import { selectActiveVisitId, selectActiveVisitPatientId } from '../../../../../app/store/slices/visitSlice';
import { ClinicalReportsView } from './ClinicalReportsView';
import { useGetAllergies } from '../../../api/allergies/AllergyQueries';
import { useGetActiveVisitClinicalNotes } from '../../../api/clinical-notes/clinicalNoteQueries';
import { useGetActiveVisitVitals } from '../../../api/vitals/vitalQueries';
import { useGetActiveVisitDiagnoses } from '../../../api/diagnosis/diagnosisQueries';
import { useGetActiveVisitConsultations } from '../../../api/consultations/consultationQueries';
import { useGetPatientPrescriptions, useGetPrescriptionById } from '../../../api/prescription/PrescriptionQueries';
import { PrescriptionStatus, type Prescription } from '../../../api/prescription/PrescriptionTypes';
import { useGetPrescriptionItems } from '../../../api/prescription-items/PrescriptionItemsQueries';
import { useGetRequestWithItems, useGetRequestsByVisit } from '../../../api/lab/LabQueries';
import { LabRequestStatus, type LabRequest } from '../../../api/lab/LabTypes';
import { normalizeAllergyResponse } from '../../visit-action-center/clinical-forms/allergies-form-components';
import { pickPrimaryClinicalNote } from '../../visit-action-center/clinical-forms/clinical-notes-form-components/clinicalNotesForm.utils';
import { pickPrimaryVitals } from '../../visit-action-center/clinical-forms/vitals-form-components/vitalsForm.utils';
import { pickPrimaryDiagnosis } from '../../visit-action-center/clinical-forms/diagnoses-form-components/diagnosesForm.utils';
import { pickPrimaryConsultation } from '../../visit-action-center/clinical-forms/consultations-form-components/consultationsForm.utils';

interface MRClinicalCareProps {
  theme?: 'light' | 'dark';
}

type ActiveTab = 'record-care' | 'reports';

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

const getStatusInfo = (hasData: boolean, documentedNoun: string, ctaVerb: string) => ({
  hasData,
  message: hasData
    ? `${documentedNoun} documented - review/update`
    : `Not documented - ${ctaVerb}`,
});

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

export const MRClinicalCare: React.FC<MRClinicalCareProps> = ({ theme = 'light' }) => {
  const navigate = useNavigate();
  const isDark = theme === 'dark';
  const activeVisitId = useSelector(selectActiveVisitId);
  const activePatientId = useSelector(selectActiveVisitPatientId);

  // Read initial tab from URL search params (e.g. ?tab=reports)
  const [searchParams] = useSearchParams();
  const urlTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<ActiveTab>(
    urlTab === 'reports' ? 'reports' : 'record-care'
  );
  const [searchQuery, setSearchQuery] = useState('');

  const notesQuery = useGetActiveVisitClinicalNotes({
    enabled: !!activeVisitId,
  });
  const vitalsQuery = useGetActiveVisitVitals({
    enabled: !!activeVisitId,
  });
  const diagnosesQuery = useGetActiveVisitDiagnoses({
    enabled: !!activeVisitId,
  });
  const consultationsQuery = useGetActiveVisitConsultations({
    enabled: !!activeVisitId,
  });
  const allergiesQuery = useGetAllergies(activePatientId ?? '', {}, {
    enabled: !!activePatientId,
  });
  const prescriptionsQuery = useGetPatientPrescriptions(Number(activePatientId ?? 0), [], {
    enabled: !!activePatientId,
  });
  const labRequestsQuery = useGetRequestsByVisit(Number(activeVisitId ?? 0), {
    enabled: !!activeVisitId,
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
  const labResultRequestQuery = useGetRequestWithItems(
    activeLabRequestForResults?.request_uuid ?? '',
    {
      enabled: !!activeLabRequestForResults?.request_uuid,
      refetchOnMount: 'always',
      refetchOnWindowFocus: false,
      staleTime: 0,
    }
  );

  const resolvedExistingPrescription = useMemo<Prescription | null>(() => {
    const prescriptions = prescriptionsQuery.data?.data ?? [];
    if (!prescriptions.length) return null;
    const drafts = prescriptions.filter((item) => item.status === PrescriptionStatus.DRAFT);
    const candidatePool = drafts.length ? drafts : prescriptions;
    return [...candidatePool].sort((a, b) => {
      const aTime = new Date(a.updated_at || a.created_at).getTime();
      const bTime = new Date(b.updated_at || b.created_at).getTime();
      return bTime - aTime;
    })[0] ?? null;
  }, [prescriptionsQuery.data]);
  const selectedPrescriptionId = resolvedExistingPrescription?.id ?? 0;
  const selectedPrescriptionQuery = useGetPrescriptionById(selectedPrescriptionId, {
    enabled: !!selectedPrescriptionId,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    staleTime: 0,
  });
  const selectedPrescriptionItemsQuery = useGetPrescriptionItems(selectedPrescriptionId, {
    enabled: !!selectedPrescriptionId,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  const colors = {
    bg: {
      primary: isDark ? 'bg-gray-900' : 'bg-gray-50',
      secondary: isDark ? 'bg-gray-800' : 'bg-white',
      elevated: isDark ? 'bg-gray-800' : 'bg-white',
      hover: isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50',
      selected: isDark ? 'bg-gray-700' : 'bg-blue-50',
      card: isDark ? 'bg-gray-800/50' : 'bg-white',
      input: isDark ? 'bg-gray-800' : 'bg-white',
    },
    text: {
      primary: isDark ? 'text-gray-100' : 'text-gray-900',
      secondary: isDark ? 'text-gray-400' : 'text-gray-600',
      tertiary: isDark ? 'text-gray-500' : 'text-gray-400',
      placeholder: isDark ? 'text-gray-500' : 'text-gray-400',
    },
    border: {
      primary: isDark ? 'border-gray-700' : 'border-gray-200',
      focus: isDark ? 'focus:border-blue-500' : 'focus:border-blue-500',
    },
    active: {
      bg: isDark ? 'bg-blue-600' : 'bg-blue-600',
      text: 'text-white',
    },
    inactive: {
      bg: isDark ? 'bg-gray-800' : 'bg-gray-100',
      text: isDark ? 'text-gray-300' : 'text-gray-700',
    },
  };

  const moduleStatus = useMemo(() => {
    const normalizedAllergies = normalizeAllergyResponse(allergiesQuery.data);
    const notesList = notesQuery.data?.data ?? [];
    const vitalsList = vitalsQuery.data?.data ?? [];
    const diagnosesList = diagnosesQuery.data?.data ?? [];
    const consultationsList = consultationsQuery.data?.data ?? [];
    const currentPrescription =
      selectedPrescriptionQuery.data?.data ?? resolvedExistingPrescription;
    const prescriptionItems = selectedPrescriptionItemsQuery.data?.data ?? [];
    const labResultRequest =
      resolveRequestFromApiPayload(labResultRequestQuery.data) ?? activeLabRequestForResults;
    const labResultCount =
      labResultRequest?.items?.reduce((sum, item) => {
        const currentCount = Array.isArray(item.results) ? item.results.length : 0;
        return sum + currentCount;
      }, 0) ?? 0;

    const hasClinicalNote = !!pickPrimaryClinicalNote(notesList);
    const hasVitals = !!pickPrimaryVitals(vitalsList);
    const hasDiagnosis = !!pickPrimaryDiagnosis(diagnosesList);
    const hasConsultation = !!pickPrimaryConsultation(consultationsList);
    const hasPrescription = !!currentPrescription || prescriptionItems.length > 0;

    return {
      allergies: getStatusInfo(normalizedAllergies.allergies.length > 0, 'Allergy profile', 'capture allergy history'),
      clinicalNotes: getStatusInfo(hasClinicalNote, 'Clinical note', 'document SOAP notes'),
      vitals: getStatusInfo(hasVitals, 'Vital signs', 'record vitals'),
      diagnoses: getStatusInfo(hasDiagnosis, 'Diagnosis', 'add a diagnosis'),
      consultations: getStatusInfo(hasConsultation, 'Consultation', 'add consultation notes'),
      prescriptions: getStatusInfo(hasPrescription, 'Prescription', 'enter prescription orders'),
      labRequests: getStatusInfo(!!activeLabRequestForOrders, 'Lab request', 'order lab tests'),
      labResults: getStatusInfo(labResultCount > 0, 'Lab result', 'enter lab results'),
      clinicalTemplates: getStatusInfo(hasClinicalNote, 'Clinical template', 'complete template notes'),
    };
  }, [
    activeLabRequestForOrders,
    activeLabRequestForResults,
    allergiesQuery.data,
    consultationsQuery.data,
    diagnosesQuery.data,
    labResultRequestQuery.data,
    notesQuery.data,
    resolvedExistingPrescription,
    selectedPrescriptionItemsQuery.data?.data,
    selectedPrescriptionQuery.data?.data,
    vitalsQuery.data,
  ]);

  // Record Care Form Options
  const formOptions: ActionItem[] = useMemo(() => [
    { 
      key: 'allergy', 
      label: 'Allergy', 
      icon: <AlertTriangle className="w-5 h-5" />, 
      description: 'Record patient allergies, reactions, and severity levels',
      category: 'Clinical',
      actionPrefix: 'Add',
      statusInfo: moduleStatus.allergies,
      handler: () => navigate(FOCUS_MODE_ROUTES.ALLERGY_FOCUS)
    },
    { 
      key: 'clinical-notes', 
      label: 'Clinical Notes', 
      icon: <FileText className="w-5 h-5" />, 
      description: 'Record symptoms, observations, and examination findings',
      category: 'Documentation',
      actionPrefix: 'Add',
      statusInfo: moduleStatus.clinicalNotes,
      handler: () => navigate(FOCUS_MODE_ROUTES.CLINICAL_NOTES_FOCUS)
    },
    { 
      key: 'clinical-templates', 
      label: 'Clinical Template', 
      icon: <FileText className="w-5 h-5" />, 
      description: 'Subjective, Objective, Assessment, and Plan documentation',
      category: 'Documentation',
      actionPrefix: 'Add',
      statusInfo: moduleStatus.clinicalTemplates,
      handler: () => navigate(FOCUS_MODE_ROUTES.CLINICAL_TEMPLATE_FOCUS)
    },
    { 
      key: 'diagnosis', 
      label: 'Diagnosis', 
      icon: <Activity className="w-5 h-5" />, 
      description: 'Record primary and secondary diagnoses',
      category: 'Clinical',
      actionPrefix: 'Add',
      statusInfo: moduleStatus.diagnoses,
      handler: () => navigate(FOCUS_MODE_ROUTES.DIAGNOSIS_FOCUS)
    },
    { 
      key: 'vitals', 
      label: 'Vitals', 
      icon: <Heart className="w-5 h-5" />, 
      description: 'Record temperature, blood pressure, heart rate, and other vital signs',
      category: 'Clinical',
      actionPrefix: 'Add',
      statusInfo: moduleStatus.vitals,
      handler: () => navigate(FOCUS_MODE_ROUTES.VITALS_FOCUS)
    },
    { 
      key: 'consultation', 
      label: 'Consultation', 
      icon: <Users className="w-5 h-5" />, 
      description: 'Record consultation notes, referrals, and specialist opinions',
      category: 'Clinical',
      actionPrefix: 'Add',
      statusInfo: moduleStatus.consultations,
      handler: () => navigate(FOCUS_MODE_ROUTES.CONSULTATION_FOCUS)
    },
    { 
      key: 'prescription', 
      label: 'Prescription', 
      icon: <Pill className="w-5 h-5" />, 
      description: 'Prescribe medications with dosage and frequency',
      category: 'Treatment',
      actionPrefix: 'Add',
      statusInfo: moduleStatus.prescriptions,
      handler: () => navigate(FOCUS_MODE_ROUTES.PRESCRIPTION_FOCUS)
    },
    { 
      key: 'lab-request', 
      label: 'Lab Request', 
      icon: <Microscope className="w-5 h-5" />, 
      description: 'Request laboratory tests and investigations',
      category: 'Diagnostics',
      actionPrefix: 'Add',
      statusInfo: moduleStatus.labRequests,
      handler: () => navigate(FOCUS_MODE_ROUTES.LAB_REQUEST_FOCUS)
    },
    { 
      key: 'lab-result', 
      label: 'Lab Result', 
      icon: <ClipboardList className="w-5 h-5" />, 
      description: 'Enter and review laboratory results',
      category: 'Diagnostics',
      actionPrefix: 'Add',
      statusInfo: moduleStatus.labResults,
      handler: () => navigate(FOCUS_MODE_ROUTES.LAB_RESULT_FOCUS)
    },
  ], [moduleStatus, navigate]);

  const currentItems = formOptions;

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return currentItems;
    
    const query = searchQuery.toLowerCase();
    return currentItems.filter(
      (item) =>
        item.label.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query)
    );
  }, [currentItems, searchQuery]);

  const handleTabChange = useCallback((tab: ActiveTab) => {
    setActiveTab(tab);
    setSearchQuery('');
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

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

  return (
    <div className={`h-full w-full overflow-hidden p-4 sm:p-5 lg:p-6 ${colors.bg.primary}`}>
      {/* Tabs */}
      <div className="no-print mb-6">
        <div className={`flex items-center gap-2 rounded-xl border p-1 ${colors.border.primary} ${colors.bg.elevated}`}>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => handleTabChange('record-care')}
            className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition-all duration-200 ${
              activeTab === 'record-care'
                ? `${colors.active.bg} ${colors.active.text} shadow-sm`
                : `${colors.inactive.bg} ${colors.inactive.text} cursor-pointer`
            }`}
          >
            <Plus className="h-4 w-4" />
            Record Care ({formOptions.length})
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => handleTabChange('reports')}
            className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition-all duration-200 ${
              activeTab === 'reports'
                ? `${colors.active.bg} ${colors.active.text} shadow-sm`
                : `${colors.inactive.bg} ${colors.inactive.text} cursor-pointer`
            }`}
          >
            <Eye className="h-4 w-4" />
            Reports
          </motion.button>
        </div>
      </div>

      {/* Content Area */}
      {activeTab === 'reports' ? (
        <ClinicalReportsView theme={theme} />
      ) : (
        <>
          {/* Search Bar */}
          <div className="mb-4">
            <div className={`relative flex items-center rounded-xl border ${colors.border.primary} ${colors.bg.input}`}>
              <Search className={`absolute left-3 h-4 w-4 ${colors.text.tertiary}`} />
              <input
                type="text"
                placeholder="Search forms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full cursor-text rounded-xl py-2.5 pl-9 pr-10 text-sm outline-none transition-all ${colors.bg.input} ${colors.text.primary} ${colors.border.focus}`}
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  aria-label="Clear search"
                  title="Clear search"
                  className={`absolute right-3 cursor-pointer rounded-full p-0.5 transition-colors ${colors.bg.hover}`}
                >
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

          {/* Scrollable List */}
          <div className="h-[calc(100%-7rem)] overflow-y-auto pr-1">
            <AnimatePresence mode="wait">
              {filteredItems.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={`flex flex-col items-center justify-center rounded-xl border p-12 text-center ${colors.border.primary} ${colors.bg.card}`}
                >
                  <Plus className={`mb-3 h-12 w-12 ${colors.text.tertiary}`} />
                  <h3 className={`mb-1 font-medium ${colors.text.primary}`}>
                    No forms found
                  </h3>
                  <p className={`text-sm ${colors.text.tertiary}`}>
                    Try adjusting your search term
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-2"
                >
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
                            <h3 className={`font-semibold ${colors.text.primary}`}>
                              {option.label}
                            </h3>
                          </div>
                          {option.description && (
                            <p className={`text-sm ${colors.text.secondary}`}>
                              {option.description}
                            </p>
                          )}
                          {option.category && (
                            <span className={`mt-1 inline-block text-xs ${colors.text.tertiary}`}>
                              {option.category}
                            </span>
                          )}
                          {option.statusInfo && (
                            <div className="mt-2">
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getStatusColor(option.statusInfo.hasData)}`}
                              >
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

          {/* Form Modals would render here */}
        </>
      )}
    </div>
  );
};

export default MRClinicalCare;