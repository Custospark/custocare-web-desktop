import React, { useCallback, useMemo } from 'react';
import {
  X,
  AlertCircle,
  User,
  Calendar,
  Clock,
  Activity,
  Shield,
  Droplet,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Plus,
  ChevronRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

import type { RootState } from '../../../app/store/rootReducer';
import { cn } from '../../utils/classNameUtils';
import DecorativeBackground from './DecorativeBackground';
import type { ThemeMode } from './layout-components/LayoutTypes';
import {
  selectActivePatient,
  selectActiveVisitInfo,
  selectActiveVisitPatientId,
  selectActiveVisitPhase,
} from '../../../app/store/slices/visitSlice';
import { formatText } from '../../../modules/medical-records/ui/revenue/stats/billing-revenue-stats-component/revenueDashboardUtils';
import LogoImage from '../../assets/LogoImage';
import { BrandName } from '../../utils/BrandName';
import LoadingSkeleton from '../Loading/LoadingSkeletons';
import { useGetAllergies } from '../../../modules/medical-records/api/allergies/AllergyQueries';
import {
  AllergySeverity,
  type Allergy,
} from '../../../modules/medical-records/api/allergies/AllergyTypes';
import { FOCUS_MODE_ROUTES } from '../../../modules/administration/onboarding/routes/focusModeRouteConstants';

interface FocusedModeLayoutProps {
  title?: string;
  onClose?: string;
  children?: React.ReactNode;
}

interface NormalizedAllergyPayload {
  allergies: Allergy[];
  meta: {
    total: number;
    active_count: number;
    severe_count: number;
  };
}

const normalizeAllergyResponse = (response: unknown): NormalizedAllergyPayload => {
  const payload = response as
    | {
        data?: Allergy[] | { data?: Allergy[]; meta?: Record<string, unknown> };
        meta?: Record<string, unknown>;
      }
    | undefined;

  const nestedData =
    payload?.data && !Array.isArray(payload.data) ? payload.data.data : undefined;

  const allergies = Array.isArray(nestedData)
    ? nestedData
    : Array.isArray(payload?.data)
    ? payload.data
    : [];

  const nestedMeta =
    payload?.data && !Array.isArray(payload.data) ? payload.data.meta : undefined;

  const total =
    Number((nestedMeta as { total?: number } | undefined)?.total) ||
    Number((payload?.meta as { total?: number } | undefined)?.total) ||
    allergies.length;

  const active_count =
    Number((nestedMeta as { active_count?: number } | undefined)?.active_count) ||
    Number((payload?.meta as { active_count?: number } | undefined)?.active_count) ||
    allergies.filter((item) => item.is_active).length;

  const severe_count =
    Number((nestedMeta as { severe_count?: number } | undefined)?.severe_count) ||
    Number((payload?.meta as { severe_count?: number } | undefined)?.severe_count) ||
    allergies.filter(
      (item) => item.is_severe || item.severity === AllergySeverity.SEVERE
    ).length;

  return {
    allergies,
    meta: {
      total,
      active_count,
      severe_count,
    },
  };
};

export const FocusedModeLayout: React.FC<FocusedModeLayoutProps> = ({
  title = 'Clinical Focus Mode',
  onClose,
  children,
}) => {
  const navigate = useNavigate();

  const { theme, patient, visitInfo, visitPhase, patientId } = useSelector(
    (state: RootState) => ({
      theme: state.ui.theme as ThemeMode,
      patient: selectActivePatient(state),
      visitInfo: selectActiveVisitInfo(state),
      visitPhase: selectActiveVisitPhase(state),
      patientId: selectActiveVisitPatientId(state),
    })
  );

  const allergyQuery = useGetAllergies(patientId ?? '', {}, { enabled: !!patientId });

  const normalizedAllergies = useMemo(
    () => normalizeAllergyResponse(allergyQuery.data),
    [allergyQuery.data]
  );

  const sortedAllergies = useMemo(() => {
    return [...normalizedAllergies.allergies].sort((a, b) => {
      const aSevere = a.is_severe || a.severity === AllergySeverity.SEVERE ? 1 : 0;
      const bSevere = b.is_severe || b.severity === AllergySeverity.SEVERE ? 1 : 0;

      if (aSevere !== bSevere) return bSevere - aSevere;
      if (a.is_active !== b.is_active) return Number(b.is_active) - Number(a.is_active);

      const aUpdated = a.updated_at ? new Date(a.updated_at).getTime() : 0;
      const bUpdated = b.updated_at ? new Date(b.updated_at).getTime() : 0;

      return bUpdated - aUpdated;
    });
  }, [normalizedAllergies.allergies]);

  const previewAllergies = useMemo(() => sortedAllergies.slice(0, 4), [sortedAllergies]);
  const remainingAllergyCount = Math.max(sortedAllergies.length - previewAllergies.length, 0);

  const handleClose = useCallback(() => {
    if (onClose) {
      navigate(onClose);
    } else {
      navigate(-1);
    }
  }, [onClose, navigate]);

  const handleOpenAllergyFocus = useCallback(() => {
    navigate(FOCUS_MODE_ROUTES.ALLERGY_FOCUS);
  }, [navigate]);

  const isDark = theme === 'dark';

  const text = {
    primary: isDark ? 'text-gray-100' : 'text-gray-900',
    secondary: isDark ? 'text-gray-300' : 'text-gray-600',
    muted: isDark ? 'text-gray-400' : 'text-gray-500',
    brand: isDark ? 'text-blue-400' : 'text-blue-600',
  };

  const bg = {
    card: isDark ? 'bg-gray-900/90' : 'bg-white',
    header: isDark ? 'bg-gray-800/70' : 'bg-gray-50',
    icon: isDark ? 'bg-gray-800' : 'bg-gray-100',
    iconAccent: isDark ? 'bg-blue-900/30' : 'bg-blue-50',
    subtle: isDark ? 'bg-gray-800/60' : 'bg-gray-50',
  };

  const border = {
    card: isDark ? 'border-gray-700' : 'border-gray-200',
    subtle: isDark ? 'border-gray-800' : 'border-gray-100',
  };

  const hasPatientData = patient && patient.name;
  const hasVisitData = visitInfo && visitInfo.uuid;

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case AllergySeverity.SEVERE:
        return isDark
          ? 'text-red-300 bg-red-900/30 border-red-800/50'
          : 'text-red-800 bg-red-100 border-red-200';
      case AllergySeverity.MODERATE:
        return isDark
          ? 'text-yellow-300 bg-yellow-900/30 border-yellow-800/50'
          : 'text-yellow-800 bg-yellow-100 border-yellow-200';
      case AllergySeverity.MILD:
      default:
        return isDark
          ? 'text-blue-300 bg-blue-900/30 border-blue-800/50'
          : 'text-blue-800 bg-blue-100 border-blue-200';
    }
  };

  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return 'N/A';
    }
  };

  const calculateWaitTime = (arrivedAt: string | null | undefined): string => {
    if (!arrivedAt) return 'N/A';
    try {
      const arrivalTime = new Date(arrivedAt).getTime();
      const now = Date.now();
      const diffMinutes = Math.floor((now - arrivalTime) / (1000 * 60));

      if (diffMinutes < 60) {
        return `${diffMinutes} min`;
      }

      const hours = Math.floor(diffMinutes / 60);
      const minutes = diffMinutes % 60;
      return `${hours}h ${minutes}m`;
    } catch {
      return 'N/A';
    }
  };

  const getPhaseDisplayName = (phase: string): string =>
    phase?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || 'Active Visit';

  return (
    <div
      className={cn(
        'min-h-screen transition-colors duration-500 ease-in-out',
        isDark
          ? 'bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950'
          : 'bg-gradient-to-br from-gray-50 via-white to-gray-50'
      )}
    >
      <div className="container mx-auto p-4 lg:p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex shrink-0 items-center gap-2">
            <LogoImage />
            <div className="hidden sm:block">
              <div className="flex items-center gap-2">
                <BrandName />
                <span
                  className={cn(
                    'rounded-full border px-2 py-0.5 text-xs font-bold',
                    isDark
                      ? 'border-cyan-500/30 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-cyan-300'
                      : 'border-blue-300 bg-gradient-to-r from-blue-100 to-cyan-50 text-blue-700'
                  )}
                >
                  Focus Mode
                </span>
              </div>
              <p className={cn('mt-0.5 text-xs font-semibold', text.brand)}>
                Clinical Documentation
              </p>
            </div>
          </div>

          <h1
            className={cn(
              'absolute left-1/2 hidden -translate-x-1/2 transform text-xl font-bold tracking-tight md:block lg:text-2xl',
              text.primary
            )}
          >
            {title}
          </h1>

          <button
            onClick={handleClose}
            className={cn(
              'flex shrink-0 cursor-pointer items-center justify-center rounded-lg p-2 transition-all duration-200 shadow-sm',
              isDark
                ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            )}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4 md:hidden">
          <h1 className={cn('text-xl font-bold tracking-tight', text.primary)}>{title}</h1>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
          {/* Left Sidebar */}
          <div className="lg:col-span-4 xl:col-span-3">
            <div
              className={cn(
                'sticky top-6 overflow-hidden rounded-xl border shadow-sm',
                border.card,
                bg.card
              )}
            >
              {/* Patient Card Header */}
              <div className={cn('border-b px-5 py-4', border.subtle, bg.header)}>
                <div className="flex items-center gap-3">
                  <div className={cn('rounded-lg p-2', bg.iconAccent)}>
                    <User className={cn('h-5 w-5', text.brand)} />
                  </div>
                  <div>
                    <h3 className={cn('text-sm font-semibold uppercase tracking-wide', text.muted)}>
                      Current Patient
                    </h3>
                  </div>
                </div>
              </div>

              {!hasPatientData || !hasVisitData ? (
                <div className="p-6 text-center">
                  <div className={cn('mb-4 inline-flex rounded-lg p-4', bg.icon)}>
                    <User className={cn('h-8 w-8', text.muted)} />
                  </div>
                  <h3 className={cn('mb-2 text-base font-semibold', text.primary)}>
                    No Active Patient
                  </h3>
                  <p className={cn('text-sm', text.muted)}>
                    Please select a patient from the queue
                  </p>
                </div>
              ) : (
                <div className="space-y-4 p-5">
                  {/* Patient Name */}
                  <div className="flex items-start gap-2">
                    <User className={cn('mt-0.5 h-4 w-4', text.muted)} />
                    <div className="flex-1">
                      <p className={cn('mb-1 text-xs font-medium uppercase tracking-wide', text.muted)}>
                        Patient Name
                      </p>
                      <p className={cn('text-xl font-bold', text.primary)}>{patient.name}</p>
                    </div>
                  </div>

                  {/* Patient Number */}
                  <div className="flex items-start gap-2">
                    <Activity className={cn('mt-0.5 h-4 w-4', text.muted)} />
                    <div className="flex-1">
                      <p className={cn('mb-1 text-xs font-medium uppercase tracking-wide', text.muted)}>
                        Patient No.
                      </p>
                      <p className={cn('font-mono text-sm font-semibold', text.primary)}>
                        {patient.patient_number || 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className={cn('border-t', border.subtle)} />

                  {/* Demographics */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-start gap-2">
                      <Calendar className={cn('mt-0.5 h-3.5 w-3.5', text.muted)} />
                      <div>
                        <p className={cn('text-xs', text.muted)}>DOB</p>
                        <p className={cn('text-sm font-medium', text.primary)}>
                          {formatDate(patient.date_of_birth)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <User className={cn('mt-0.5 h-3.5 w-3.5', text.muted)} />
                      <div>
                        <p className={cn('text-xs', text.muted)}>Sex</p>
                        <p className={cn('text-sm font-medium', text.primary)}>
                          {formatText(patient.biological_sex || 'N/A')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Droplet className={cn('mt-0.5 h-3.5 w-3.5', text.muted)} />
                      <div>
                        <p className={cn('text-xs', text.muted)}>Blood Type</p>
                        <p className={cn('text-sm font-medium', text.primary)}>
                          {patient.blood_type || 'Unknown'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Clock className={cn('mt-0.5 h-3.5 w-3.5', text.muted)} />
                      <div>
                        <p className={cn('text-xs', text.muted)}>Wait Time</p>
                        <p className={cn('text-sm font-semibold', text.primary)}>
                          {calculateWaitTime(visitInfo.arrivedAt)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className={cn('border-t', border.subtle)} />

                  {/* Status Badges */}
                  {(patient.requires_isolation || visitInfo.acuity) && (
                    <div className="space-y-2">
                      {patient.requires_isolation && (
                        <div
                          className={cn(
                            'flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium',
                            isDark
                              ? 'border-yellow-800/50 bg-yellow-900/20 text-yellow-300'
                              : 'border-yellow-200 bg-yellow-100 text-yellow-800'
                          )}
                        >
                          <Shield className="h-3.5 w-3.5" />
                          <span>Isolation Required</span>
                        </div>
                      )}

                      {visitInfo.acuity && (
                        <div
                          className={cn(
                            'flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium',
                            isDark
                              ? 'border-orange-800/50 bg-orange-900/20 text-orange-300'
                              : 'border-orange-200 bg-orange-100 text-orange-800'
                          )}
                        >
                          <Activity className="h-3.5 w-3.5" />
                          <span>Acuity: {visitInfo.acuity}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className={cn('border-t', border.subtle)} />

                  {/* Allergies */}
                  <div>
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className={cn('h-3.5 w-3.5', text.muted)} />
                        <p className={cn('text-xs font-medium uppercase tracking-wide', text.muted)}>
                          Allergies
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => allergyQuery.refetch()}
                          className={cn(
                            'inline-flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors',
                            isDark
                              ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          )}
                        >
                          <RefreshCw
                            className={cn(
                              'h-3 w-3',
                              allergyQuery.isFetching && 'animate-spin'
                            )}
                          />
                          Refresh
                        </button>

                        {sortedAllergies.length > 0 && (
                          <button
                            type="button"
                            onClick={handleOpenAllergyFocus}
                            className={cn(
                              'inline-flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors',
                              isDark
                                ? 'bg-blue-900/30 text-blue-300 hover:bg-blue-900/50'
                                : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                            )}
                          >
                            Manage
                          </button>
                        )}
                      </div>
                    </div>

                    {!allergyQuery.isLoading && !allergyQuery.isError && (
                      <div className="mb-3 grid grid-cols-3 gap-2">
                        <div
                          className={cn(
                            'rounded-lg border px-2 py-2 text-center',
                            border.card,
                            bg.subtle
                          )}
                        >
                          <p className={cn('text-[10px] uppercase tracking-wide', text.muted)}>
                            Total
                          </p>
                          <p className={cn('text-sm font-bold', text.primary)}>
                            {normalizedAllergies.meta.total}
                          </p>
                        </div>

                        <div
                          className={cn(
                            'rounded-lg border px-2 py-2 text-center',
                            border.card,
                            bg.subtle
                          )}
                        >
                          <p className={cn('text-[10px] uppercase tracking-wide', text.muted)}>
                            Active
                          </p>
                          <p className={cn('text-sm font-bold', text.primary)}>
                            {normalizedAllergies.meta.active_count}
                          </p>
                        </div>

                        <div
                          className={cn(
                            'rounded-lg border px-2 py-2 text-center',
                            border.card,
                            bg.subtle
                          )}
                        >
                          <p className={cn('text-[10px] uppercase tracking-wide', text.muted)}>
                            Severe
                          </p>
                          <p
                            className={cn(
                              'text-sm font-bold',
                              normalizedAllergies.meta.severe_count > 0
                                ? isDark
                                  ? 'text-red-300'
                                  : 'text-red-700'
                                : text.primary
                            )}
                          >
                            {normalizedAllergies.meta.severe_count}
                          </p>
                        </div>
                      </div>
                    )}

                    {allergyQuery.isLoading ? (
                      <LoadingSkeleton
                        variant="list"
                        theme={isDark ? 'dark' : 'light'}
                        message="Loading patient allergies..."
                        className="p-0"
                      />
                    ) : allergyQuery.isError ? (
                      <div
                        className={cn(
                          'rounded-lg border p-3 text-sm',
                          isDark
                            ? 'border-red-800/50 bg-red-900/20 text-red-300'
                            : 'border-red-200 bg-red-50 text-red-700'
                        )}
                      >
                        <div className="flex items-start gap-2">
                          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                          <div>
                            <p className="font-medium">Unable to load allergies</p>
                            <p className="mt-1 text-xs opacity-90">
                              Please try refreshing the allergy list.
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : sortedAllergies.length === 0 ? (
                      <div
                        className={cn(
                          'rounded-xl border border-dashed p-4',
                          border.card,
                          bg.subtle
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <CheckCircle2
                            className={cn(
                              'mt-0.5 h-5 w-5 shrink-0',
                              isDark ? 'text-green-400' : 'text-green-600'
                            )}
                          />

                          <div className="min-w-0 flex-1">
                            <p className={cn('font-semibold', text.primary)}>
                              No recorded allergies
                            </p>
                            <p className={cn('mt-1 text-sm', text.secondary)}>
                              No allergy information has been documented for this patient yet.
                            </p>

                            <button
                              type="button"
                              onClick={handleOpenAllergyFocus}
                              className={cn(
                                'mt-3 inline-flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all',
                                isDark
                                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                                  : 'bg-blue-600 text-white hover:bg-blue-700'
                              )}
                            >
                              <Plus className="h-4 w-4" />
                              Record Allergy
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {previewAllergies.map((allergy) => (
                          <div
                            key={allergy.id}
                            className={cn(
                              'rounded-lg border p-2.5 text-sm',
                              getSeverityColor(allergy.severity)
                            )}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                  <span className="truncate font-semibold">
                                    {allergy.allergen}
                                  </span>
                                </div>

                                {allergy.reaction && (
                                  <p
                                    className={cn(
                                      'mt-1 line-clamp-2 text-xs',
                                      isDark ? 'text-gray-300' : 'text-gray-700'
                                    )}
                                  >
                                    {allergy.reaction}
                                  </p>
                                )}

                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                  <span className="rounded bg-black/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase">
                                    {allergy.severity}
                                  </span>

                                  {!allergy.is_active && (
                                    <span className="rounded bg-black/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase">
                                      inactive
                                    </span>
                                  )}

                                  {allergy.is_severe && (
                                    <span className="rounded bg-black/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase">
                                      high risk
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}

                        {remainingAllergyCount > 0 && (
                          <button
                            type="button"
                            onClick={handleOpenAllergyFocus}
                            className={cn(
                              'mt-1 flex w-full cursor-pointer items-center justify-between rounded-lg border px-3 py-2 text-sm font-medium transition-all',
                              border.card,
                              isDark
                                ? 'bg-gray-800/70 text-gray-200 hover:bg-gray-800'
                                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                            )}
                          >
                            <span>
                              View all allergies
                              <span className={cn('ml-2 text-xs', text.muted)}>
                                +{remainingAllergyCount} more
                              </span>
                            </span>
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    )}

                    {allergyQuery.isFetching && !allergyQuery.isLoading && (
                      <div className="mt-3">
                        <LoadingSkeleton
                          variant="minimal"
                          theme={isDark ? 'dark' : 'light'}
                          message="Refreshing allergies..."
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Content */}
          <div className="lg:col-span-8 xl:col-span-9">
            <div
              className={cn(
                'overflow-hidden rounded-xl border shadow-sm',
                border.card,
                bg.card
              )}
            >
              {children}
            </div>
          </div>
        </div>
      </div>

      <DecorativeBackground theme={theme} sidebarPosition="left" />
    </div>
  );
};

export default FocusedModeLayout;
