// MRClinicalCare.tsx
import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Activity, 
  Pill, 
  Microscope, 
  ClipboardList,
  FileOutput,
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

interface MRClinicalCareProps {
  theme?: 'light' | 'dark';
}

type ActiveTab = 'record-care' | 'reports';

interface ActionItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  handler: () => void;
  description?: string;
  category?: string;
  actionPrefix?: string;
}

export const MRClinicalCare: React.FC<MRClinicalCareProps> = ({ theme = 'light' }) => {
  const navigate = useNavigate();
  const isDark = theme === 'dark';
  const [activeTab, setActiveTab] = useState<ActiveTab>('record-care');
  const [searchQuery, setSearchQuery] = useState('');

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

  // Record Care Form Options with "Add:" prefix
// Record Care Form Options with "Add:" prefix
const formOptions: ActionItem[] = useMemo(() => [
  { 
    key: 'allergy', 
    label: 'Allergy', 
    icon: <AlertTriangle className="w-5 h-5" />, 
    description: 'Record patient allergies, reactions, and severity levels',
    category: 'Clinical',
    actionPrefix: 'Add',
    handler: () => navigate(FOCUS_MODE_ROUTES.ALLERGY_FOCUS)
  },
  { 
    key: 'clinical-notes', 
    label: 'Clinical Notes', 
    icon: <FileText className="w-5 h-5" />, 
    description: 'Record symptoms, observations, and examination findings',
    category: 'Documentation',
    actionPrefix: 'Add',
    handler: () => navigate(FOCUS_MODE_ROUTES.CLINICAL_NOTES_FOCUS)
  },
  { 
    key: 'clinical-templates', 
    label: 'Clinical Template', 
    icon: <FileText className="w-5 h-5" />, 
    description: 'Subjective, Objective, Assessment, and Plan documentation',
    category: 'Documentation',
    actionPrefix: 'Add',
    handler: () => navigate(FOCUS_MODE_ROUTES.CLINICAL_TEMPLATE_FOCUS)
  },
  { 
    key: 'diagnosis', 
    label: 'Diagnosis', 
    icon: <Activity className="w-5 h-5" />, 
    description: 'Record primary and secondary diagnoses',
    category: 'Clinical',
    actionPrefix: 'Add',
    handler: () => navigate(FOCUS_MODE_ROUTES.DIAGNOSIS_FOCUS)
  },
  { 
    key: 'vitals', 
    label: 'Vitals', 
    icon: <Heart className="w-5 h-5" />, 
    description: 'Record temperature, blood pressure, heart rate, and other vital signs',
    category: 'Clinical',
    actionPrefix: 'Add',
    handler: () => navigate(FOCUS_MODE_ROUTES.VITALS_FOCUS)
  },
  { 
    key: 'consultation', 
    label: 'Consultation', 
    icon: <Users className="w-5 h-5" />, 
    description: 'Record consultation notes, referrals, and specialist opinions',
    category: 'Clinical',
    actionPrefix: 'Add',
    handler: () => navigate(FOCUS_MODE_ROUTES.CONSULTATION_FOCUS)
  },
  { 
    key: 'prescription', 
    label: 'Prescription', 
    icon: <Pill className="w-5 h-5" />, 
    description: 'Prescribe medications with dosage and frequency',
    category: 'Treatment',
    actionPrefix: 'Add',
    handler: () => navigate(FOCUS_MODE_ROUTES.PRESCRIPTION_FOCUS)
  },
  { 
    key: 'lab-request', 
    label: 'Lab Request', 
    icon: <Microscope className="w-5 h-5" />, 
    description: 'Request laboratory tests and investigations',
    category: 'Diagnostics',
    actionPrefix: 'Add',
    handler: () => navigate(FOCUS_MODE_ROUTES.LAB_REQUEST_FOCUS)
  },
  { 
    key: 'lab-result', 
    label: 'Lab Result', 
    icon: <ClipboardList className="w-5 h-5" />, 
    description: 'Enter and review laboratory results',
    category: 'Diagnostics',
    actionPrefix: 'Add',
    handler: () => navigate(FOCUS_MODE_ROUTES.LAB_RESULT_FOCUS)
  },
], [navigate]);

  // Report Options with "View" prefix
  const reportOptions: ActionItem[] = useMemo(() => [
    { 
      key: 'visit-summary', 
      label: 'Visit Summary', 
      icon: <FileOutput className="w-5 h-5" />, 
      description: 'Complete summary of the patient visit',
      category: 'Clinical',
      actionPrefix: 'View',
      handler: () => navigate(FOCUS_MODE_ROUTES.VISIT_SUMMARY_FOCUS)
    },
    { 
      key: 'prescription-report', 
      label: 'Prescription Report', 
      icon: <FileOutput className="w-5 h-5" />, 
      description: 'Printable prescription document',
      category: 'Treatment',
      actionPrefix: 'View',
      handler: () => navigate(FOCUS_MODE_ROUTES.PRESCRIPTION_REPORT_FOCUS)
    },
    { 
      key: 'lab-report', 
      label: 'Lab Report', 
      icon: <FileOutput className="w-5 h-5" />, 
      description: 'Laboratory test results report',
      category: 'Diagnostics',
      actionPrefix: 'View',
      handler: () => navigate(FOCUS_MODE_ROUTES.LAB_REPORT_FOCUS)
    },
    { 
      key: 'full-medical-report', 
      label: 'Full Medical Report', 
      icon: <FileOutput className="w-5 h-5" />, 
      description: 'Complete medical history document',
      category: 'Clinical',
      actionPrefix: 'View',
      handler: () => navigate(FOCUS_MODE_ROUTES.FULL_MEDICAL_REPORT_FOCUS)
    },
  ], [navigate]);

  const currentItems = activeTab === 'record-care' ? formOptions : reportOptions;

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return currentItems;
    
    const query = searchQuery.toLowerCase();
    return currentItems.filter(
      (item) =>
        item.label.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query) ||
        item.category?.toLowerCase().includes(query)
    );
  }, [currentItems, searchQuery]);

  const handleTabChange = useCallback((tab: ActiveTab) => {
    setActiveTab(tab);
    setSearchQuery('');
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  // Helper to get action color based on type
  const getActionColor = (actionPrefix?: string) => {
    if (actionPrefix === 'Add') {
      return isDark ? 'text-green-400 bg-green-900/20' : 'text-green-600 bg-green-50';
    }
    return isDark ? 'text-blue-400 bg-blue-900/20' : 'text-blue-600 bg-blue-50';
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
            Reports ({reportOptions.length})
          </motion.button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <div className={`relative flex items-center rounded-xl border ${colors.border.primary} ${colors.bg.input}`}>
          <Search className={`absolute left-3 h-4 w-4 ${colors.text.tertiary}`} />
          <input
            type="text"
            placeholder={`Search ${activeTab === 'record-care' ? 'forms' : 'reports'}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full cursor-text rounded-xl py-2.5 pl-9 pr-10 text-sm outline-none transition-all ${colors.bg.input} ${colors.text.primary} ${colors.border.focus}`}
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
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

      {/* Content Area - Scrollable List */}
      <div className="h-[calc(100%-7rem)] overflow-y-auto pr-1">
        <AnimatePresence mode="wait">
          {filteredItems.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`flex flex-col items-center justify-center rounded-xl border p-12 text-center ${colors.border.primary} ${colors.bg.card}`}
            >
              {activeTab === 'record-care' ? (
                <Plus className={`mb-3 h-12 w-12 ${colors.text.tertiary}`} />
              ) : (
                <Eye className={`mb-3 h-12 w-12 ${colors.text.tertiary}`} />
              )}
              <h3 className={`mb-1 font-medium ${colors.text.primary}`}>
                No {activeTab === 'record-care' ? 'forms' : 'reports'} found
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
                    </div>
                  </div>
                  <ChevronRight className={`h-5 w-5 ${colors.text.tertiary} opacity-0 transition-opacity group-hover:opacity-100`} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MRClinicalCare;