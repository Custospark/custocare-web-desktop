// CurrentVisit.tsx
import React, { useState, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import {
  ChevronLeft,
  X,
  Clock,
  Search,
  ChevronRight,
  Stethoscope,
  FileSpreadsheet,
} from 'lucide-react';
import { selectActiveVisitId, selectActiveVisitPatientId } from '../../../../../app/store/slices/visitSlice';
import AllergyForm from '../clinical-forms/AllergyForm';
import ClinicalNotesForm from '../clinical-forms/ClinicalNotesForm';
import VitalsForm from '../clinical-forms/VitalsForm';
import DiagnosisForm from '../clinical-forms/DiagnosisForm';
import ConsultationsForm from '../clinical-forms/ConsultationsForm';
import PrescriptionForm from '../clinical-forms/PrescriptionForm';
import LabRequestForm from '../clinical-forms/LabRequestForm';
import LabResultForm from '../clinical-forms/LabResultForm';
import ClinicalTemplateForm from '../clinical-forms/ClinicalTemplateForm';
import { CLINICAL_FORM_GRID_DEFINITIONS, type ClinicalFormModuleId } from './clinicalFormGridDefinitions';
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
import { normalizeAllergyResponse } from '../clinical-forms/allergies-form-components';
import { pickPrimaryClinicalNote } from '../clinical-forms/clinical-notes-form-components/clinicalNotesForm.utils';
import { pickPrimaryVitals } from '../clinical-forms/vitals-form-components/vitalsForm.utils';
import { pickPrimaryDiagnosis } from '../clinical-forms/diagnoses-form-components/diagnosesForm.utils';
import { pickPrimaryConsultation } from '../clinical-forms/consultations-form-components/consultationsForm.utils';

interface CurrentVisitProps {
  theme?: 'light' | 'dark';
}

type FormModule = ClinicalFormModuleId | null;

interface FormOption {
  id: FormModule;
  label: string;
  icon: React.ReactNode;
  description: string;
  category: string;
  component:
    | typeof AllergyForm
    | typeof ClinicalNotesForm
    | typeof VitalsForm
    | typeof DiagnosisForm
    | typeof ConsultationsForm
    | typeof PrescriptionForm
    | typeof LabRequestForm
    | typeof LabResultForm
    | typeof ClinicalTemplateForm
    | null;
  isAvailable: boolean;
  statusInfo?: {
    hasData: boolean;
    message: string;
  };
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

const FORM_COMPONENT_BY_ID: Record<
  ClinicalFormModuleId,
  FormOption['component']
> = {
  allergies: AllergyForm,
  'clinical-notes': ClinicalNotesForm,
  vitals: VitalsForm,
  diagnoses: DiagnosisForm,
  consultations: ConsultationsForm,
  prescriptions: PrescriptionForm,
  'lab-requests': LabRequestForm,
  'lab-results': LabResultForm,
  'clinical-template': ClinicalTemplateForm,
};

/** Staff encounter forms — metadata shared with Patient Portal read-only grid via {@link CLINICAL_FORM_GRID_DEFINITIONS}. */
const FORM_REGISTRY: FormOption[] = CLINICAL_FORM_GRID_DEFINITIONS.map((def) => ({
  ...def,
  component: FORM_COMPONENT_BY_ID[def.id],
  isAvailable: true,
}));

export const CurrentVisit: React.FC<CurrentVisitProps> = ({ theme = 'light' }) => {
  const isDark = theme === 'dark';
  const activeVisitId = useSelector(selectActiveVisitId);
  const activePatientId = useSelector(selectActiveVisitPatientId);

  // State for selected form
  const [selectedForm, setSelectedForm] = useState<FormModule>(null);
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
      clinicalTemplate: getStatusInfo(hasClinicalNote, 'Clinical template', 'complete template notes'),
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

  const formsWithStatus = useMemo(
    () =>
      FORM_REGISTRY.map((form) => {
        switch (form.id) {
          case 'allergies':
            return { ...form, statusInfo: moduleStatus.allergies };
          case 'clinical-notes':
            return { ...form, statusInfo: moduleStatus.clinicalNotes };
          case 'vitals':
            return { ...form, statusInfo: moduleStatus.vitals };
          case 'diagnoses':
            return { ...form, statusInfo: moduleStatus.diagnoses };
          case 'consultations':
            return { ...form, statusInfo: moduleStatus.consultations };
          case 'prescriptions':
            return { ...form, statusInfo: moduleStatus.prescriptions };
          case 'lab-requests':
            return { ...form, statusInfo: moduleStatus.labRequests };
          case 'lab-results':
            return { ...form, statusInfo: moduleStatus.labResults };
          case 'clinical-template':
            return { ...form, statusInfo: moduleStatus.clinicalTemplate };
          default:
            return form;
        }
      }),
    [moduleStatus]
  );

  // Filter available forms
  const availableForms = useMemo(() => 
    formsWithStatus.filter((form) => form.isAvailable),
    [formsWithStatus]
  );

  // Filter forms by search
  const filteredForms = useMemo(() => {
    if (!searchQuery.trim()) return availableForms;
    const query = searchQuery.toLowerCase();
    return availableForms.filter(
      (form) =>
        form.label.toLowerCase().includes(query) ||
        form.description.toLowerCase().includes(query) ||
        form.category.toLowerCase().includes(query)
    );
  }, [availableForms, searchQuery]);

  // Get the selected form component
  const SelectedFormComponent = useMemo(() => {
    if (!selectedForm) return null;
    const form = formsWithStatus.find((f) => f.id === selectedForm);
    return form?.component;
  }, [formsWithStatus, selectedForm]);

  const handleSelectForm = useCallback((formId: FormModule) => {
    setSelectedForm(formId);
  }, []);

  const handleBack = useCallback(() => {
    setSelectedForm(null);
    setSearchQuery('');
  }, []);

  const handleFormCancel = useCallback(() => {
    setSelectedForm(null);
  }, []);

  const handleFormSuccess = useCallback(() => {
    // Optionally refresh data or show success message
    setSelectedForm(null);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  // Colors for theming with improved contrast
  const colors = {
    bg: {
      primary: isDark ? 'bg-gray-950' : 'bg-gray-100',
      card: isDark ? 'bg-gray-900' : 'bg-white',
      hover: isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100',
      input: isDark ? 'bg-gray-900' : 'bg-white',
      selected: isDark ? 'bg-blue-900/30' : 'bg-blue-100',
    },
    text: {
      primary: isDark ? 'text-gray-100' : 'text-gray-900',
      secondary: isDark ? 'text-gray-300' : 'text-gray-700',
      tertiary: isDark ? 'text-gray-400' : 'text-gray-600',
    },
    border: {
      primary: isDark ? 'border-gray-800' : 'border-gray-300',
    },
  };

  const getStatusColor = (hasData: boolean) => {
    if (hasData) {
      return isDark ? 'text-emerald-300 bg-emerald-950/40' : 'text-emerald-800 bg-emerald-100';
    }
    return isDark ? 'text-amber-300 bg-amber-950/40' : 'text-amber-800 bg-amber-100';
  };

  // Check if visit is active
  if (!activeVisitId) {
    return (
      <div className={`h-full w-full p-6 ${colors.bg.primary}`}>
        <div className={`rounded-xl border p-12 text-center ${colors.border.primary} ${colors.bg.card}`}>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950/40">
            <Clock className="h-8 w-8 text-amber-700 dark:text-amber-400" />
          </div>
          <h3 className={`mb-2 text-lg font-semibold ${colors.text.primary}`}>
            No Active Visit Selected
          </h3>
          <p className={`text-sm ${colors.text.secondary}`}>
            Please select an active patient visit from the queue to begin clinical documentation.
          </p>
        </div>
      </div>
    );
  }

  // Form Selection View
  if (!selectedForm) {
    return (
      <div className={`h-full w-full overflow-hidden p-4 sm:p-5 lg:p-6 ${colors.bg.primary}`}>
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Stethoscope className={`h-6 w-6 ${isDark ? 'text-blue-400' : 'text-blue-700'}`} />
            <h2 className={`text-xl font-bold ${colors.text.primary}`}>
              Latest Patient Visit
            </h2>
          </div>
          <p className={`text-sm ${colors.text.secondary}`}>
            Explore and document clinical data for the patient&apos;s most recent encounter
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-4">
          <div className={`relative flex items-center rounded-xl border ${colors.border.primary} ${colors.bg.input}`}>
            <Search className={`absolute left-3 h-4 w-4 ${colors.text.tertiary}`} />
            <input
              type="text"
              placeholder="Search clinical documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full rounded-xl py-2.5 pl-9 pr-10 text-sm outline-none transition-all focus:ring-2 focus:ring-blue-500 ${colors.bg.input} ${colors.text.primary}`}
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
          <p className={`text-xs font-medium ${colors.text.tertiary}`}>
            {filteredForms.length} clinical {filteredForms.length === 1 ? 'document' : 'documents'} available
          </p>
          <div className="flex items-center gap-1.5">
            <div className={`h-1.5 w-1.5 rounded-full ${isDark ? 'bg-emerald-400' : 'bg-emerald-600'}`} />
            <span className={`text-xs font-medium ${colors.text.tertiary}`}>Ready for documentation</span>
          </div>
        </div>

        {/* Forms Grid */}
        <div className="h-[calc(100%-8rem)] overflow-y-auto">
          {filteredForms.length === 0 ? (
            <div className={`flex flex-col items-center justify-center rounded-xl border p-12 text-center ${colors.border.primary} ${colors.bg.card}`}>
              <FileSpreadsheet className={`mb-3 h-12 w-12 ${colors.text.tertiary}`} />
              <h3 className={`mb-1 font-semibold ${colors.text.primary}`}>
                No matching documents found
              </h3>
              <p className={`text-sm ${colors.text.secondary}`}>
                Try adjusting your search term or select from the available options
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredForms.map((form, index) => (
                <motion.div
                  key={form.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  onClick={() => handleSelectForm(form.id)}
                  className={`group cursor-pointer rounded-xl border p-5 transition-all duration-200 ${colors.border.primary} ${colors.bg.card} ${colors.bg.hover} hover:shadow-lg hover:scale-[1.02]`}
                >
                  <div className="mb-3 flex items-start justify-between">
                    <div className={`rounded-lg p-2 ${isDark ? 'bg-gray-800' : 'bg-gray-100'} group-hover:scale-105 transition-transform duration-200`}>
                      {form.icon}
                    </div>
                    <ChevronRight className={`h-5 w-5 ${colors.text.tertiary} opacity-0 transition-opacity group-hover:opacity-100`} />
                  </div>
                  
                  <h3 className={`mb-1 font-semibold text-base ${colors.text.primary}`}>
                    {form.label}
                  </h3>
                  
                  <p className={`mb-2 text-sm ${colors.text.secondary}`}>
                    {form.description}
                  </p>
                  
                  <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-200 text-gray-700'}`}>
                    {form.category}
                  </span>
                  {form.statusInfo && (
                    <div className="mt-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${getStatusColor(form.statusInfo.hasData)}`}
                      >
                        {form.statusInfo.message}
                      </span>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Coming Soon Section */}
        {formsWithStatus.filter((f) => !f.isAvailable).length > 0 && (
          <div className={`mt-6 rounded-lg border border-dashed p-4 ${colors.border.primary} ${colors.bg.card}`}>
            <p className={`text-xs font-medium ${colors.text.tertiary}`}>
              📋 Additional clinical documents (Diagnosis, Vitals, Prescriptions, Lab Results) coming soon
            </p>
          </div>
        )}
      </div>
    );
  }

  // Form View - Render the selected form
  return (
    <div className={`h-full w-full overflow-hidden ${colors.bg.primary}`}>
      {/* Form Header with Back Button */}
      <div className={`border-b p-4 ${colors.border.primary} ${colors.bg.card}`}>
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            className={`flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all ${colors.bg.hover} ${colors.text.secondary} hover:${colors.text.primary}`}
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </button>
          <div className="h-6 w-px bg-gray-300 dark:bg-gray-700" />
          <div className="flex items-center gap-2">
            <div className={`rounded-lg p-1.5 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
              {formsWithStatus.find((f) => f.id === selectedForm)?.icon}
            </div>
            <h2 className={`text-lg font-semibold ${colors.text.primary}`}>
              {formsWithStatus.find((f) => f.id === selectedForm)?.label}
            </h2>
            <span className={`ml-2 text-xs px-2 py-0.5 rounded-full font-semibold ${isDark ? 'bg-blue-900/40 text-blue-300' : 'bg-blue-100 text-blue-800'}`}>
              Current Visit
            </span>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="h-[calc(100%-4rem)] overflow-y-auto p-4 sm:p-6">
        {SelectedFormComponent && (
          <SelectedFormComponent
            theme={theme}
            onCancel={handleFormCancel}
            onSaved={handleFormSuccess}
          />
        )}
      </div>
    </div>
  );
};

export default CurrentVisit;