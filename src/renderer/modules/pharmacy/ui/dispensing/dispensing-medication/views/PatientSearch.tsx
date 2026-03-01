import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, Search, X, ArrowRightCircle, UserPlus, Calendar, Phone, Hash, Filter, ChevronDown, ChevronUp, User, Activity } from 'lucide-react';
import type { AxiosError } from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

import LoadingSkeleton from '../../../../../../shared/components/Loading/LoadingSkeletons';
import { useConfirm } from '../../../../../../shared/components/Feedback/ConfirmDialog/ConfirmContext';
import { cn } from '../../../../../../shared/utils/classNameUtils';

import type {
  ApiErrorResponse,
  BiologicalSex,
  PatientSearchRequest,
  PatientSearchResult,
} from '../../../../api/dispensing/patient-search/usePatientTypes';
import {
  PatientStatus,
  calculateAge,
  formatPatientName,
  getBiologicalSexDisplayText,
  getPatientInitials,
  getStatusDisplayText,
} from '../../../../api/dispensing/patient-search/usePatientTypes';
import { usePatientSearch } from '../../../../api/dispensing/patient-search/usePatientQueries';

type Theme = 'light' | 'dark';

type ProcessAction = {
  label: string;
  icon?: React.ReactNode;
  onProcess: (patient: PatientSearchResult) => void | Promise<void>;
  onlyWhenSelected?: boolean;
};

type TakeAction = {
  label?: string;
  onTakeAction: (patient: PatientSearchResult) => void | Promise<void>;
};

export interface PatientSearchProps {
  theme: Theme;
  title?: string;
  subtitle?: string;
  placeholder?: string;
  autoFocus?: boolean;
  filters?: {
    status?: PatientStatus;
    biologicalSex?: BiologicalSex;
  };
  limit?: number;
  onPatientSelect?: (patient: PatientSearchResult) => void;
  onSearchSubmitted?: (searchText: string) => void;
  onNotFound?: (searchText: string) => void;
  onCreateNewPatient?: (searchText: string) => void | Promise<void>;
  processAction?: ProcessAction;
  takeAction?: TakeAction;
  initialSearchText?: string;
  className?: string;
}

function getAxiosErrorMessage(error: unknown): string {
  const axiosErr = error as AxiosError<ApiErrorResponse>;
  const apiMsg = axiosErr?.response?.data?.message;
  if (typeof apiMsg === 'string' && apiMsg.trim().length > 0) return apiMsg;
  if (error instanceof Error && error.message.trim().length > 0) return error.message;
  return 'Failed to search patients. Please try again.';
}

function statusBadgeClasses(theme: Theme, status: PatientStatus): string {
  const isDark = theme === 'dark';
  switch (status) {
    case PatientStatus.ACTIVE:
      return isDark 
        ? 'bg-gradient-to-r from-green-500/20 to-green-600/10 text-green-300 border border-green-500/30' 
        : 'bg-gradient-to-r from-green-100 to-green-50 text-green-700 border border-green-200';
    case PatientStatus.INACTIVE:
      return isDark 
        ? 'bg-gradient-to-r from-yellow-500/20 to-yellow-600/10 text-yellow-300 border border-yellow-500/30' 
        : 'bg-gradient-to-r from-yellow-100 to-yellow-50 text-yellow-700 border border-yellow-200';
    case PatientStatus.DECEASED:
      return isDark 
        ? 'bg-gradient-to-r from-red-500/20 to-red-600/10 text-red-300 border border-red-500/30' 
        : 'bg-gradient-to-r from-red-100 to-red-50 text-red-700 border border-red-200';
    case PatientStatus.MERGED:
      return isDark 
        ? 'bg-gradient-to-r from-blue-500/20 to-blue-600/10 text-blue-300 border border-blue-500/30' 
        : 'bg-gradient-to-r from-blue-100 to-blue-50 text-blue-700 border border-blue-200';
    case PatientStatus.TEST_PATIENT:
    case PatientStatus.SYSTEM_PATIENT:
      return isDark 
        ? 'bg-gradient-to-r from-gray-600/20 to-gray-700/10 text-gray-300 border border-gray-600/30' 
        : 'bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 border border-gray-200';
    default:
      return isDark 
        ? 'bg-gradient-to-r from-gray-700/20 to-gray-800/10 text-gray-300 border border-gray-700/30' 
        : 'bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 border border-gray-200';
  }
}

const PatientSearch: React.FC<PatientSearchProps> = ({
  theme,
  title = 'Search Patient',
  subtitle = 'Search by patient number, name, DOB, phone number, etc.',
  placeholder = 'Search by patient Number, name, DOB, or phone',
  autoFocus = true,
  filters,
  limit = 10,
  onPatientSelect,
  onSearchSubmitted,
  onNotFound,
  onCreateNewPatient,
  processAction,
  takeAction,
  initialSearchText = '',
  className,
}) => {
  const isDark = theme === 'dark';
  const { confirm } = useConfirm();
  const [isFocused, setIsFocused] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const [searchText, setSearchText] = useState<string>(initialSearchText);
  const [submittedText, setSubmittedText] = useState<string>('');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState<boolean>(false);

  const lastNotFoundRef = useRef<string>('');

  useEffect(() => {
    setSearchText(initialSearchText);
  }, [initialSearchText]);

  const searchParams: PatientSearchRequest = useMemo(() => {
    const trimmed = submittedText.trim();
    return {
      q: trimmed.length > 0 ? trimmed : undefined,
      status: filters?.status,
      biological_sex: filters?.biologicalSex,
      limit,
    };
  }, [filters?.biologicalSex, filters?.status, limit, submittedText]);

  const queryEnabled = useMemo(() => submittedText.trim().length > 0, [submittedText]);

  const queryOptions = useMemo(() => ({ enabled: queryEnabled }), [queryEnabled]);

  const { data, isLoading, isFetching, error, refetch } = usePatientSearch(searchParams, queryOptions);

  const results = data?.data ?? [];

  const notFound = useMemo(() => {
    if (!queryEnabled) return false;
    if (isLoading || isFetching) return false;
    if (error) return false;
    return results.length === 0;
  }, [error, isFetching, isLoading, queryEnabled, results.length]);

  useEffect(() => {
    if (!notFound) return;
    const key = submittedText.trim();
    if (!key) return;
    if (lastNotFoundRef.current === key) return;
    lastNotFoundRef.current = key;
    onNotFound?.(key);
  }, [notFound, onNotFound, submittedText]);

  const clearResults = useCallback(() => {
    setSearchText('');
    setSubmittedText('');
    setSelectedPatientId(null);
    setHasSearched(false);
    lastNotFoundRef.current = '';
  }, []);

  const submitSearch = useCallback(async () => {
    const trimmed = searchText.trim();
    if (!trimmed) return;

    setSubmittedText(trimmed);
    setSelectedPatientId(null);
    setHasSearched(true);
    lastNotFoundRef.current = '';

    onSearchSubmitted?.(trimmed);
    await refetch();
  }, [onSearchSubmitted, refetch, searchText]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') void submitSearch();
    },
    [submitSearch]
  );

  const handleSelect = useCallback(
    (patient: PatientSearchResult) => {
      setSelectedPatientId(patient.patient_number);
      onPatientSelect?.(patient);
    },
    [onPatientSelect]
  );

  const handleProcess = useCallback(
    async (patient: PatientSearchResult) => {
      if (!processAction) return;
      await processAction.onProcess(patient);
    },
    [processAction]
  );

  const handleTakeAction = useCallback(
    async (patient: PatientSearchResult) => {
      if (!takeAction) return;
      await takeAction.onTakeAction(patient);
    },
    [takeAction]
  );

  const handleCreateFromNotFound = useCallback(async () => {
    if (!onCreateNewPatient) return;

    const ok = await confirm({
      title: 'Create New Patient',
      message: `No patient was found for "${submittedText || searchText}". Do you want to create a new patient record?`,
      confirmText: 'Yes, Create',
      cancelText: 'Cancel',
      variant: 'info',
      theme,
    });

    if (!ok) return;
    await onCreateNewPatient(submittedText || searchText);
  }, [confirm, onCreateNewPatient, searchText, submittedText, theme]);

  const colors = useMemo(
    () => ({
      textPrimary: isDark ? 'text-white' : 'text-gray-900',
      textSecondary: isDark ? 'text-gray-400' : 'text-gray-600',
      cardBg: isDark ? 'bg-gray-800' : 'bg-white',
      cardBorder: isDark ? 'border-gray-700' : 'border-gray-200',
      inputBg: isDark ? 'bg-gray-800' : 'bg-white',
      inputBorder: isDark ? 'border-gray-700' : 'border-gray-300',
      inputText: isDark ? 'text-white' : 'text-gray-900',
      placeholder: isDark ? 'placeholder-gray-500' : 'placeholder-gray-400',
    }),
    [isDark]
  );

  return (
    <div className={cn('p-6', className)}>
      <div className="max-w-4xl mx-auto">
        {/* Header with Gradient */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            'relative overflow-hidden rounded-xl border-2 transition-all duration-300 mb-6',
            isDark 
              ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-blue-500/30 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/20' 
              : 'bg-gradient-to-br from-white to-blue-50/50 border-blue-200 hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-500/20',
            'group'
          )}
        >
          {/* Background decoration */}
          <div className={cn(
            'absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl transition-opacity',
            isDark ? 'bg-blue-500/10 group-hover:opacity-100' : 'bg-blue-500/5 group-hover:opacity-100',
            'opacity-0'
          )} />

          <div className="relative p-6">
            <div className="flex items-center gap-3">
              <div className={cn(
                'p-3 rounded-xl transition-all duration-300',
                isDark 
                  ? 'bg-blue-500/20 group-hover:bg-blue-500/30 group-hover:scale-110' 
                  : 'bg-blue-100 group-hover:bg-blue-200 group-hover:scale-110'
              )}>
                <User className={cn(
                  'w-6 h-6',
                  isDark ? 'text-blue-400' : 'text-blue-600'
                )} />
              </div>
              <div>
                <h1 className={cn('text-2xl font-bold', colors.textPrimary)}>{title}</h1>
                <p className={colors.textSecondary}>{subtitle}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Search Controls with Premium Animation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={cn(
            'relative overflow-hidden rounded-xl border-2 transition-all duration-300 mb-4',
            isDark 
              ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700/50 hover:border-gray-600' 
              : 'bg-gradient-to-br from-white to-gray-50/50 border-gray-200 hover:border-gray-300'
          )}
        >
          <div className="p-4">
            <div className="flex flex-col gap-4">
              {/* Search Bar with Animated Gradient Border */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <motion.div
                    className="absolute inset-0 rounded-lg z-0"
                    style={{
                      background: 'linear-gradient(90deg, #3b82f6, #10b981, #6366f1, #3b82f6)',
                      backgroundSize: '300% 100%',
                    }}
                    animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
                    transition={{
                      duration: isFocused ? 2 : 6,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                  />
                  <div className="relative z-10 m-[2px] rounded-[6px] overflow-hidden">
                    <Search
                      className={cn(
                        'absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-200',
                        isFocused 
                          ? 'text-blue-500' 
                          : isDark 
                            ? 'text-gray-500' 
                            : 'text-gray-400'
                      )}
                    />
                    <input
                      type="text"
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      onKeyDown={onKeyDown}
                      onFocus={() => setIsFocused(true)}
                      onBlur={() => setIsFocused(false)}
                      placeholder={placeholder}
                      autoFocus={autoFocus}
                      className={cn(
                        'w-full pl-10 pr-10 py-3 text-sm border-transparent',
                        'focus:outline-none focus:ring-0',
                        'transition-colors placeholder:text-sm',
                        colors.inputBg,
                        colors.inputText,
                        colors.placeholder
                      )}
                    />
                    {searchText.trim().length > 0 && (
                      <motion.button
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        type="button"
                        onClick={clearResults}
                        className={cn(
                          'absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full',
                          'transition-colors cursor-pointer',
                          isDark
                            ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                            : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                        )}
                        aria-label="Clear search and results"
                      >
                        <X className="w-4 h-4" />
                      </motion.button>
                    )}
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={() => void submitSearch()}
                  disabled={!searchText.trim() || isLoading}
                  className={cn(
                    'px-6 py-3 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2',
                    'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl hover:shadow-blue-500/30',
                    'transform hover:-translate-y-0.5 cursor-pointer border border-blue-400/30'
                  )}
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Searching...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-5 h-5" />
                      <span>Search</span>
                    </>
                  )}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowFilters(!showFilters)}
                  className={cn(
                    'px-4 py-3 rounded-lg font-medium transition-all flex items-center gap-2',
                    'border-2',
                    showFilters
                      ? isDark
                        ? 'bg-blue-900/30 border-blue-700 text-blue-300'
                        : 'bg-blue-50 border-blue-300 text-blue-700'
                      : isDark
                        ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100',
                    'cursor-pointer'
                  )}
                >
                  <Filter className="w-4 h-4" />
                  <span className="hidden sm:inline">Filters</span>
                  {showFilters ? (
                    <ChevronUp className="w-3 h-3" />
                  ) : (
                    <ChevronDown className="w-3 h-3" />
                  )}
                </motion.button>
              </div>

              {/* Filter Options */}
              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t-2 overflow-hidden"
                    style={{
                      borderColor: isDark ? 'rgb(31, 41, 55)' : 'rgb(229, 231, 235)'
                    }}
                  >
                    <div>
                      <label className={cn(
                        'block text-sm font-medium mb-2',
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      )}>
                        Status Filter
                      </label>
                      <select
                        className={cn(
                          'w-full px-3 py-2 rounded-lg border-2 text-sm appearance-none',
                          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                          'transition-all cursor-pointer',
                          isDark 
                            ? 'bg-gray-800 border-gray-700 text-white hover:bg-gray-700' 
                            : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50'
                        )}
                      >
                        <option value="">All Statuses</option>
                        <option value="ACTIVE">Active</option>
                        <option value="INACTIVE">Inactive</option>
                        <option value="DECEASED">Deceased</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className={cn(
                        'block text-sm font-medium mb-2',
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      )}>
                        Biological Sex
                      </label>
                      <select
                        className={cn(
                          'w-full px-3 py-2 rounded-lg border-2 text-sm appearance-none',
                          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                          'transition-all cursor-pointer',
                          isDark 
                            ? 'bg-gray-800 border-gray-700 text-white hover:bg-gray-700' 
                            : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50'
                        )}
                      >
                        <option value="">All</option>
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* Clear results button */}
        {hasSearched && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-end mb-6"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={clearResults}
              className={cn(
                'text-sm font-medium cursor-pointer px-4 py-2 rounded-lg transition-all',
                'border-2',
                isDark 
                  ? 'border-gray-700 text-gray-400 hover:border-gray-600 hover:text-gray-200 hover:bg-gray-800' 
                  : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-900 hover:bg-gray-50'
              )}
            >
              Clear results
            </motion.button>
          </motion.div>
        )}

        {/* Initial State - Premium Blank Canvas */}
        {!hasSearched && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={cn(
              'relative overflow-hidden rounded-xl border-2 p-12 text-center mt-6',
              colors.cardBg,
              colors.cardBorder
            )}
          >
            {/* Background decoration */}
            <div className={cn(
              'absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-30',
              isDark ? 'bg-blue-500/10' : 'bg-blue-500/5'
            )} />

            <div className="relative">
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ 
                  duration: 4,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
                className={cn(
                  'inline-flex items-center justify-center w-24 h-24 rounded-full mb-6 mx-auto',
                  isDark ? 'bg-gradient-to-br from-blue-500/20 to-blue-600/10' : 'bg-gradient-to-br from-blue-100 to-blue-50'
                )}
              >
                <Search className={cn(
                  'w-12 h-12',
                  isDark ? 'text-blue-400' : 'text-blue-600'
                )} />
              </motion.div>

              <h3 className={cn('text-2xl font-bold mb-3', colors.textPrimary)}>Search for a Patient</h3>
              <p className={cn('mb-8 max-w-md mx-auto text-lg', colors.textSecondary)}>
                Enter patient details to find and manage their records
              </p>
              
              {/* Quick Tips Grid */}
              <div className={cn('mt-8 pt-8 border-t', isDark ? 'border-gray-700' : 'border-gray-200')}>
                <h4 className={cn('text-sm font-semibold mb-4', colors.textPrimary)}>Search Tips:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                  {[
                    { icon: Hash, label: 'Patient Number', tip: 'PT-12GD4...' },
                    { icon: User, label: 'Name', tip: 'Full or partial name' },
                    { icon: Calendar, label: 'Date of Birth', tip: 'YYYY-MM-DD' },
                    { icon: Phone, label: 'Phone Number', tip: '+256756666...' }
                  ].map((item, index) => (
                    <motion.div
                      key={index}
                      whileHover={{ scale: 1.02, y: -2 }}
                      className={cn(
                        'p-4 rounded-xl border-2 transition-all',
                        isDark 
                          ? 'bg-gray-800/50 border-gray-700 hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/10' 
                          : 'bg-gray-50/50 border-gray-200 hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/10'
                      )}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <item.icon className={cn(
                          'w-5 h-5',
                          isDark ? 'text-blue-400' : 'text-blue-600'
                        )} />
                        <span className={cn('font-medium', colors.textPrimary)}>{item.label}</span>
                      </div>
                      <p className={cn('text-sm', colors.textSecondary)}>{item.tip}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Loading State */}
        {hasSearched && (isLoading || isFetching) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6"
          >
            <LoadingSkeleton variant="default" theme={theme} message="Searching patients..." />
          </motion.div>
        )}

        {/* Error State */}
        {hasSearched && error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
              'relative overflow-hidden rounded-xl border-2 p-8 mb-6',
              isDark ? 'bg-gradient-to-br from-red-900/20 to-red-900/5 border-red-500/30' : 'bg-gradient-to-br from-red-50 to-red-50/50 border-red-200'
            )}
          >
            <div className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl bg-red-500/10" />
            <div className="relative flex items-center gap-4">
              <div className={cn(
                'p-3 rounded-xl',
                isDark ? 'bg-red-500/20' : 'bg-red-100'
              )}>
                <AlertCircle className={cn(
                  'w-6 h-6',
                  isDark ? 'text-red-400' : 'text-red-600'
                )} />
              </div>
              <div>
                <h3 className={cn('text-lg font-semibold mb-1', colors.textPrimary)}>Search Error</h3>
                <p className={colors.textSecondary}>{getAxiosErrorMessage(error)}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Results State */}
        {hasSearched && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {results.map((patient, index) => {
              const isSelected = selectedPatientId === patient.patient_number;
              const initials = getPatientInitials(patient);
              const age = calculateAge(patient.date_of_birth);
              const sexText = patient.biological_sex ? getBiologicalSexDisplayText(patient.biological_sex) : null;

              return (
                <motion.div
                  key={patient.patient_number}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.01, y: -2 }}
                  onClick={() => handleSelect(patient)}
                  className={cn(
                    'relative overflow-hidden rounded-xl border-2 p-5 transition-all cursor-pointer',
                    colors.cardBg,
                    colors.cardBorder,
                    isSelected
                      ? isDark
                        ? 'ring-2 ring-blue-500 border-blue-500 shadow-lg shadow-blue-500/20'
                        : 'ring-2 ring-blue-500 border-blue-500 bg-blue-50/50 shadow-lg shadow-blue-500/20'
                      : isDark
                        ? 'hover:bg-gray-700/50 hover:border-gray-600 hover:shadow-xl'
                        : 'hover:bg-gray-50/80 hover:border-gray-300 hover:shadow-xl'
                  )}
                >
                  {/* Selected indicator */}
                  {isSelected && (
                    <motion.div
                      layoutId="selectedIndicator"
                      className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-blue-600"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    />
                  )}

                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    {/* Avatar with gradient */}
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      className={cn(
                        'w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0',
                        isDark 
                          ? 'bg-gradient-to-br from-blue-500/20 to-purple-500/20' 
                          : 'bg-gradient-to-br from-blue-100 to-purple-100'
                      )}
                    >
                      <span className={cn(
                        'text-xl font-bold',
                        isDark ? 'text-blue-300' : 'text-blue-700'
                      )}>
                        {initials}
                      </span>
                    </motion.div>

                    {/* Patient Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className={cn('text-xl font-bold', colors.textPrimary)}>
                          {formatPatientName(patient)}
                        </h3>
                        <span className={cn(
                          'px-3 py-1 rounded-full text-xs font-medium',
                          statusBadgeClasses(theme, patient.status)
                        )}>
                          {getStatusDisplayText(patient.status)}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="flex items-center gap-2">
                          <Hash className={cn('w-4 h-4', isDark ? 'text-gray-500' : 'text-gray-400')} />
                          <span className={cn('text-sm', colors.textSecondary)}>
                            {patient.patient_number}
                          </span>
                        </div>

                        {patient.date_of_birth && (
                          <div className="flex items-center gap-2">
                            <Calendar className={cn('w-4 h-4', isDark ? 'text-gray-500' : 'text-gray-400')} />
                            <span className={cn('text-sm', colors.textSecondary)}>
                              {new Date(patient.date_of_birth).toLocaleDateString()}
                              {age !== null && ` (${age} years)`}
                            </span>
                          </div>
                        )}

                        {sexText && (
                          <div className="flex items-center gap-2">
                            <Activity className={cn('w-4 h-4', isDark ? 'text-gray-500' : 'text-gray-400')} />
                            <span className={cn('text-sm', colors.textSecondary)}>
                              {sexText}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <User className={cn('w-4 h-4', isDark ? 'text-gray-500' : 'text-gray-400')} />
                          <span className={cn('text-sm', colors.textSecondary)}>
                            Account: {patient.global_user_uuid ? 'Linked' : 'Unlinked'}
                          </span>
                        </div>
                      </div>

                      {patient.requires_isolation && (
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={cn(
                            'mt-3 text-sm rounded-lg border-2 p-3 flex items-center gap-2',
                            isDark 
                              ? 'bg-gradient-to-r from-yellow-900/20 to-yellow-900/5 border-yellow-500/30 text-yellow-200' 
                              : 'bg-gradient-to-r from-yellow-50 to-yellow-50/50 border-yellow-200 text-yellow-800'
                          )}
                        >
                          <AlertCircle className="w-4 h-4" />
                          <span className="font-medium">Isolation required</span>
                        </motion.div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                      {processAction && (processAction.onlyWhenSelected ?? true ? isSelected : true) && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            void handleProcess(patient);
                          }}
                          className={cn(
                            'px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2',
                            'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl hover:shadow-blue-500/30',
                            'transform hover:-translate-y-0.5 cursor-pointer border border-blue-400/30'
                          )}
                        >
                          {processAction.icon}
                          {processAction.label}
                        </motion.button>
                      )}
                      
                      {takeAction && (
                       <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            void handleTakeAction(patient);
                          }}
                          className={cn(
                            'px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2',
                            'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl hover:shadow-blue-500/30',
                            'transform hover:-translate-y-0.5 cursor-pointer border border-blue-400/30'
                          )}
                        >
                          <ArrowRightCircle className="w-4 h-4" />
                          {takeAction.label ?? 'Take Action'}
                        </motion.button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* Not Found State */}
        {hasSearched && notFound && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
              'relative overflow-hidden rounded-xl border-2 p-12 text-center mt-6',
              colors.cardBg,
              colors.cardBorder
            )}
          >
            {/* Background decoration */}
            <div className={cn(
              'absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-30',
              isDark ? 'bg-orange-500/10' : 'bg-orange-500/5'
            )} />

            <div className="relative">
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ 
                  duration: 4,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
                className={cn(
                  'inline-flex items-center justify-center w-24 h-24 rounded-full mb-6 mx-auto',
                  isDark ? 'bg-gradient-to-br from-orange-500/20 to-orange-600/10' : 'bg-gradient-to-br from-orange-100 to-orange-50'
                )}
              >
                <Search className={cn(
                  'w-12 h-12',
                  isDark ? 'text-orange-400' : 'text-orange-600'
                )} />
              </motion.div>

              <h3 className={cn('text-2xl font-bold mb-3', colors.textPrimary)}>Patient Not Found</h3>
              <p className={cn('mb-8 text-lg', colors.textSecondary)}>
                No patient found for: <span className="font-bold text-blue-500">{submittedText}</span>
              </p>

              {onCreateNewPatient && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={() => void handleCreateFromNotFound()}
                  className={cn(
                    'inline-flex items-center gap-3 px-8 py-4 rounded-xl font-medium transition-all',
                    'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-xl hover:shadow-2xl hover:shadow-blue-500/30',
                    'transform hover:-translate-y-1 cursor-pointer border border-blue-400/30 text-lg'
                  )}
                >
                  <UserPlus className="w-5 h-5" />
                  Create New Patient
                </motion.button>
              )}
            </div>
          </motion.div>
        )}

        {/* Results Summary */}
        {hasSearched && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className={cn(
              'mt-4 text-sm text-center p-4 rounded-lg border-2',
              isDark 
                ? 'bg-gray-800/30 border-gray-700 text-gray-400' 
                : 'bg-gray-50/50 border-gray-200 text-gray-600'
            )}
          >
            Found {results.length} patient{results.length !== 1 ? 's' : ''}
          </motion.div>
        )}
      </div>
    </div>
  );
};

PatientSearch.displayName = 'PatientSearch';
export default PatientSearch;