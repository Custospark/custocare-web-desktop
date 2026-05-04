// CurrentVisit.tsx
import React, { useState, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import {
  FileText,
  Activity,
  Pill,
  Microscope,
  ClipboardList,
  AlertTriangle,
  Heart,
  Users,
  ChevronLeft,
  X,
  Clock,
  Search,
  ChevronRight,
  Stethoscope,
  FileSpreadsheet,
} from 'lucide-react';
// import { selectActiveVisitId, selectActiveVisitPatientId } from '../../../../../app/store/slices/visitSlice';
import { selectActiveVisitId } from '../../../../../app/store/slices/visitSlice';
import AllergyForm from '../clinical-forms/AllergyForm';
import ClinicalNotesForm from '../clinical-forms/ClinicalNotesForm';
import VitalsForm from '../clinical-forms/VitalsForm';
import DiagnosisForm from '../clinical-forms/DiagnosisForm';
import ConsultationsForm from '../clinical-forms/ConsultationsForm';
import PrescriptionForm from '../clinical-forms/PrescriptionForm';
import LabRequestForm from '../clinical-forms/LabRequestForm';
import LabResultForm from '../clinical-forms/LabResultForm';
import ClinicalTemplateForm from '../clinical-forms/ClinicalTemplateForm';

interface CurrentVisitProps {
  theme?: 'light' | 'dark';
}

type FormModule = 
  | 'allergies'
  | 'clinical-notes'
  | 'vitals'
  | 'diagnoses'
  | 'consultations'
  | 'prescriptions'
  | 'lab-requests'
  | 'lab-results'
  | 'clinical-template'
  | null;

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
}

// Form Registry - Single source of truth for all forms
const FORM_REGISTRY: FormOption[] = [
  {
    id: 'allergies',
    label: 'Allergy',
    icon: <AlertTriangle className="h-5 w-5" />,
    description: 'Document patient allergies, reactions, and severity levels for this visit',
    category: 'Clinical Assessment',
    component: AllergyForm,
    isAvailable: true,
  },
  {
    id: 'clinical-notes',
    label: 'Clinical Notes',
    icon: <FileText className="h-5 w-5" />,
    description: 'Document symptoms, examination findings, and clinical observations',
    category: 'Documentation',
    component: ClinicalNotesForm,
    isAvailable: true,
  },
  {
    id: 'vitals',
    label: 'Vitals',
    icon: <Heart className="h-5 w-5" />,
    description: 'Record temperature, blood pressure, heart rate, and vital signs',
    category: 'Clinical Assessment',
    component: VitalsForm,
    isAvailable: true,
  },
  {
    id: 'diagnoses',
    label: 'Diagnosis',
    icon: <Activity className="h-5 w-5" />,
    description: 'Record primary and secondary diagnoses for this visit',
    category: 'Clinical Assessment',
    component: DiagnosisForm,
    isAvailable: true,
  },
  {
    id: 'consultations',
    label: 'Consultation',
    icon: <Users className="h-5 w-5" />,
    description: 'Document consultation notes, referrals, and specialist opinions',
    category: 'Referrals',
    component: ConsultationsForm,
    isAvailable: true,
  },
  {
    id: 'prescriptions',
    label: 'Prescription',
    icon: <Pill className="h-5 w-5" />,
    description: 'Prescribe medications with dosage, frequency, and duration',
    category: 'Treatment',
    component: PrescriptionForm,
    isAvailable: true,
  },
  {
    id: 'lab-requests',
    label: 'Lab Request',
    icon: <Microscope className="h-5 w-5" />,
    description: 'Request laboratory tests and diagnostic investigations',
    category: 'Diagnostics',
    component: LabRequestForm,
    isAvailable: true,
  },
  {
    id: 'lab-results',
    label: 'Lab Result',
    icon: <ClipboardList className="h-5 w-5" />,
    description: 'Review and document laboratory test results',
    category: 'Diagnostics',
    component: LabResultForm,
    isAvailable: true,
  },
  {
    id: 'clinical-template',
    label: 'Clinical Template',
    icon: <FileText className="h-5 w-5" />,
    description: 'Fill out a predefined clinical template for quick patient documentation',
    category: 'Documentation',
    component: ClinicalTemplateForm,
    isAvailable: true,
  },
];

export const CurrentVisit: React.FC<CurrentVisitProps> = ({ theme = 'light' }) => {
  const isDark = theme === 'dark';
  const activeVisitId = useSelector(selectActiveVisitId);
//   const activePatientId = useSelector(selectActiveVisitPatientId);

  // State for selected form
  const [selectedForm, setSelectedForm] = useState<FormModule>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter available forms
  const availableForms = useMemo(() => 
    FORM_REGISTRY.filter(form => form.isAvailable),
    []
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
    const form = FORM_REGISTRY.find(f => f.id === selectedForm);
    return form?.component;
  }, [selectedForm]);

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

  // Colors for theming
  const colors = {
    bg: {
      primary: isDark ? 'bg-gray-900' : 'bg-gray-50',
      card: isDark ? 'bg-gray-800/50' : 'bg-white',
      hover: isDark ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50',
      input: isDark ? 'bg-gray-800' : 'bg-white',
      selected: isDark ? 'bg-blue-900/20' : 'bg-blue-50',
    },
    text: {
      primary: isDark ? 'text-gray-100' : 'text-gray-900',
      secondary: isDark ? 'text-gray-400' : 'text-gray-600',
      tertiary: isDark ? 'text-gray-500' : 'text-gray-400',
    },
    border: {
      primary: isDark ? 'border-gray-700' : 'border-gray-200',
    },
  };

  // Check if visit is active
  if (!activeVisitId) {
    return (
      <div className={`h-full w-full p-6 ${colors.bg.primary}`}>
        <div className={`rounded-xl border p-12 text-center ${colors.border.primary} ${colors.bg.card}`}>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/20">
            <Clock className="h-8 w-8 text-amber-600 dark:text-amber-400" />
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
        {/* Header - No close button, wrapper handles it */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Stethoscope className={`h-6 w-6 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
            <h2 className={`text-xl font-semibold ${colors.text.primary}`}>
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
              className={`w-full rounded-xl py-2.5 pl-9 pr-10 text-sm outline-none transition-all ${colors.bg.input} ${colors.text.primary}`}
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className={`absolute right-3 rounded-full p-0.5 transition-colors ${colors.bg.hover}`}
              >
                <X className={`h-4 w-4 ${colors.text.tertiary}`} />
              </button>
            )}
          </div>
        </div>

        {/* Results count */}
        <div className="mb-3 flex items-center justify-between">
          <p className={`text-xs ${colors.text.tertiary}`}>
            {filteredForms.length} clinical {filteredForms.length === 1 ? 'document' : 'documents'} available
          </p>
          <div className="flex items-center gap-1.5">
            <div className={`h-1.5 w-1.5 rounded-full ${isDark ? 'bg-green-400' : 'bg-green-500'}`} />
            <span className={`text-xs ${colors.text.tertiary}`}>Ready for documentation</span>
          </div>
        </div>

        {/* Forms Grid */}
        <div className="h-[calc(100%-8rem)] overflow-y-auto">
          {filteredForms.length === 0 ? (
            <div className={`flex flex-col items-center justify-center rounded-xl border p-12 text-center ${colors.border.primary} ${colors.bg.card}`}>
              <FileSpreadsheet className={`mb-3 h-12 w-12 ${colors.text.tertiary}`} />
              <h3 className={`mb-1 font-medium ${colors.text.primary}`}>
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
                    <div className={`rounded-lg p-2 ${isDark ? 'bg-gray-700/50' : 'bg-gray-100'} group-hover:scale-105 transition-transform duration-200`}>
                      {form.icon}
                    </div>
                    <ChevronRight className={`h-5 w-5 ${colors.text.tertiary} opacity-0 transition-opacity group-hover:opacity-100`} />
                  </div>
                  
                  <h3 className={`mb-1 font-semibold ${colors.text.primary}`}>
                    {form.label}
                  </h3>
                  
                  <p className={`mb-2 text-sm ${colors.text.secondary}`}>
                    {form.description}
                  </p>
                  
                  <span className={`inline-block text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                    {form.category}
                  </span>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Coming Soon Section - Only show if there are unavailable forms */}
        {FORM_REGISTRY.filter(f => !f.isAvailable).length > 0 && (
          <div className={`mt-6 rounded-lg border border-dashed p-4 ${colors.border.primary} ${colors.bg.card}`}>
            <p className={`text-xs ${colors.text.tertiary}`}>
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
            className={`flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all ${colors.bg.hover} ${colors.text.secondary}`}
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </button>
          <div className="h-6 w-px bg-gray-300 dark:bg-gray-700" />
          <div className="flex items-center gap-2">
            <div className={`rounded-lg p-1.5 ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
              {FORM_REGISTRY.find(f => f.id === selectedForm)?.icon}
            </div>
            <h2 className={`text-lg font-semibold ${colors.text.primary}`}>
              {FORM_REGISTRY.find(f => f.id === selectedForm)?.label}
            </h2>
            <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
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