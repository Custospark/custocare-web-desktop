import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, Search, UserPlus, X } from 'lucide-react';
import type { AxiosError } from 'axios';

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

type CreateAction = {
  label?: string;
  onCreate: (prefill?: { searchText?: string }) => void | Promise<void>;
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
  processAction?: ProcessAction;
  createAction?: CreateAction;
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
      return isDark ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-700';
    case PatientStatus.INACTIVE:
      return isDark ? 'bg-yellow-900/30 text-yellow-300' : 'bg-yellow-100 text-yellow-700';
    case PatientStatus.DECEASED:
      return isDark ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-700';
    case PatientStatus.MERGED:
      return isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-700';
    case PatientStatus.TEST_PATIENT:
    case PatientStatus.SYSTEM_PATIENT:
      return isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-200 text-gray-800';
    default:
      return isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700';
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
  processAction,
  createAction,
  initialSearchText = '',
  className,
}) => {
  const isDark = theme === 'dark';
  const { confirm } = useConfirm();

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

  const handleCreateFromNotFound = useCallback(async () => {
    if (!createAction) return;

    const ok = await confirm({
      title: 'Create New Patient',
      message: `No patient was found for "${submittedText || searchText}". Do you want to create a new patient record?`,
      confirmText: 'Yes, Create',
      cancelText: 'Cancel',
      variant: 'info',
      theme,
    });

    if (!ok) return;
    await createAction.onCreate({ searchText: submittedText || searchText });
  }, [confirm, createAction, searchText, submittedText, theme]);

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
        <div className="mb-6">
          <h2 className={cn('text-2xl font-bold mb-2', colors.textPrimary)}>{title}</h2>
          <p className={colors.textSecondary}>{subtitle}</p>
        </div>

        {/* Search Controls */}
        <div className="flex gap-3 mb-4">
          <div className="flex-1 relative">
            <Search
              className={cn('absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5', isDark ? 'text-gray-400' : 'text-gray-500')}
            />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={placeholder}
              autoFocus={autoFocus}
              className={cn(
                'w-full pl-10 pr-10 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all',
                colors.inputBg,
                colors.inputBorder,
                colors.inputText,
                colors.placeholder
              )}
            />
            {searchText.trim().length > 0 && (
              <button
                type="button"
                onClick={clearResults}
                className={cn(
                  'absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded',
                  isDark ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                )}
                aria-label="Clear search and results"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => void submitSearch()}
            disabled={!searchText.trim() || isLoading}
            className={cn(
              'px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2',
              'bg-blue-600 hover:bg-blue-700 text-white'
            )}
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                Search
              </>
            )}
          </button>
        </div>

        {/* Clear results button - Only show when search has been performed */}
        {hasSearched && (
          <div className="flex justify-end mb-6">
            <button
              type="button"
              onClick={clearResults}
              className={cn('text-sm font-medium', isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900')}
            >
              Clear results
            </button>
          </div>
        )}

        {/* Initial State - Blank canvas before search */}
        {!hasSearched && (
          <div className={cn('rounded-xl border p-12 text-center mt-6', colors.cardBg, colors.cardBorder)}>
            <div className={cn('inline-flex items-center justify-center w-20 h-20 rounded-full mb-4', isDark ? 'bg-gray-700' : 'bg-gray-100')}>
              <Search className={cn('w-10 h-10', isDark ? 'text-gray-400' : 'text-gray-500')} />
            </div>

            <h3 className={cn('text-xl font-semibold mb-2', colors.textPrimary)}>Search for a Patient</h3>
            <p className={cn('mb-4 max-w-md mx-auto', colors.textSecondary)}>
              Enter a patient number, name, date of birth, or phone number to search for a patient record.
            </p>
            
            {/* Quick tips */}
            <div className={cn('mt-8 pt-6 border-t', isDark ? 'border-gray-700' : 'border-gray-200')}>
              <h4 className={cn('text-sm font-semibold mb-3', colors.textPrimary)}>Search Tips:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-left max-w-2xl mx-auto">
                <div className={cn('p-3 rounded-lg', isDark ? 'bg-gray-700/30' : 'bg-gray-50')}>
                  <div className={cn('text-sm font-medium mb-1', isDark ? 'text-gray-300' : 'text-gray-700')}>Patient Number</div>
                  <div className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-600')}>Use the exact patient number eg PT-12GD4...</div>
                </div>
                <div className={cn('p-3 rounded-lg', isDark ? 'bg-gray-700/30' : 'bg-gray-50')}>
                  <div className={cn('text-sm font-medium mb-1', isDark ? 'text-gray-300' : 'text-gray-700')}>Name</div>
                  <div className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-600')}>Full name or partial name matches</div>
                </div>
                <div className={cn('p-3 rounded-lg', isDark ? 'bg-gray-700/30' : 'bg-gray-50')}>
                  <div className={cn('text-sm font-medium mb-1', isDark ? 'text-gray-300' : 'text-gray-700')}>Date of Birth</div>
                  <div className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-600')}>YYYY-MM-DD format</div>
                </div>
                <div className={cn('p-3 rounded-lg', isDark ? 'bg-gray-700/30' : 'bg-gray-50')}>
                  <div className={cn('text-sm font-medium mb-1', isDark ? 'text-gray-300' : 'text-gray-700')}>Phone Number</div>
                  <div className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-600')}>Any format with digits</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {hasSearched && (isLoading || isFetching) && (
          <div className="mb-6">
            <LoadingSkeleton variant="list" theme={theme} message="Searching patients..." />
          </div>
        )}

        {/* Error State */}
        {hasSearched && error && (
          <div className={cn('rounded-xl border p-6 mb-6', isDark ? 'bg-red-900/10 border-red-800' : 'bg-red-50 border-red-200')}>
            <div className="flex items-center gap-3">
              <AlertCircle className={cn('w-5 h-5', isDark ? 'text-red-400' : 'text-red-600')} />
              <div>
                <h3 className={cn('font-semibold mb-1', colors.textPrimary)}>Search Error</h3>
                <p className={colors.textSecondary}>{getAxiosErrorMessage(error)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Results State */}
        {hasSearched && results.length > 0 && (
          <div className="space-y-3">
            {results.map((patient) => {
              const isSelected = selectedPatientId === patient.patient_number;
              const initials = getPatientInitials(patient);
              const age = calculateAge(patient.date_of_birth);
              const sexText = patient.biological_sex ? getBiologicalSexDisplayText(patient.biological_sex) : null;

              return (
                <div
                  key={patient.patient_number}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleSelect(patient)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') handleSelect(patient);
                  }}
                  className={cn(
                    'rounded-xl border p-4 transition-all cursor-pointer',
                    colors.cardBg,
                    colors.cardBorder,
                    isSelected
                      ? isDark
                        ? 'ring-2 ring-blue-500'
                        : 'ring-2 ring-blue-500 bg-blue-50'
                      : isDark
                        ? 'hover:bg-gray-700'
                        : 'hover:bg-gray-50'
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={cn('w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0', isDark ? 'bg-blue-900/30' : 'bg-blue-100')}>
                        <span className={cn('font-semibold', isDark ? 'text-blue-300' : 'text-blue-700')}>{initials}</span>
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className={cn('text-lg font-semibold truncate', colors.textPrimary)}>{formatPatientName(patient)}</div>
                          <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', statusBadgeClasses(theme, patient.status))}>
                            {getStatusDisplayText(patient.status)}
                          </span>
                        </div>

                        <div className={cn('text-sm space-y-1 mt-1', colors.textSecondary)}>
                          <div>Patient Number: {patient.patient_number}</div>
                          {patient.date_of_birth ? (
                            <div>
                              DOB: {new Date(patient.date_of_birth).toLocaleDateString()}
                              {age !== null ? ` • Age: ${age}` : null}
                            </div>
                          ) : null}
                          {sexText ? <div>Sex: {sexText}</div> : null}
                          <div>Account: {patient.global_user_uuid ? 'Linked' : 'Unlinked'}</div>
                        </div>
                      </div>
                    </div>

                    {processAction && (processAction.onlyWhenSelected ?? true ? isSelected : true) ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          void handleProcess(patient);
                        }}
                        className={cn('px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 flex-shrink-0', 'bg-blue-600 hover:bg-blue-700 text-white')}
                      >
                        {processAction.icon}
                        {processAction.label}
                      </button>
                    ) : null}
                  </div>

                  {patient.requires_isolation ? (
                    <div
                      className={cn(
                        'mt-3 text-sm rounded-lg border p-3',
                        isDark ? 'bg-yellow-900/20 border-yellow-800/50 text-yellow-200' : 'bg-yellow-50 border-yellow-100 text-yellow-800'
                      )}
                    >
                      Isolation required
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}

        {/* Not Found State */}
        {hasSearched && notFound && (
          <div className={cn('rounded-xl border p-8 text-center mt-6', colors.cardBg, colors.cardBorder)}>
            <div className={cn('inline-flex items-center justify-center w-16 h-16 rounded-full mb-4', isDark ? 'bg-red-900/30' : 'bg-red-100')}>
              <Search className={cn('w-8 h-8', isDark ? 'text-red-400' : 'text-red-600')} />
            </div>

            <h3 className={cn('text-lg font-semibold mb-2', colors.textPrimary)}>Patient Not Found</h3>
            <p className={cn('mb-6', colors.textSecondary)}>
              No patient found for: <strong>{submittedText}</strong>
            </p>

            {createAction ? (
              <button
                type="button"
                onClick={() => void handleCreateFromNotFound()}
                className={cn('inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors', 'bg-blue-600 hover:bg-blue-700 text-white')}
              >
                <UserPlus className="w-5 h-5" />
                {createAction.label ?? 'Create New Patient'}
              </button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};

PatientSearch.displayName = 'PatientSearch';
export default PatientSearch;