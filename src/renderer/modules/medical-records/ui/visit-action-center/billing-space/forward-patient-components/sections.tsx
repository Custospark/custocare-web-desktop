import React from 'react';
import type { FieldErrors } from 'react-hook-form';
import {
  Activity,
  AlertCircle,
  Building,
  CheckCircle2,
  DoorClosed,
  Loader2,
  RefreshCw,
  Search,
  User,
  UserPlus,
  Users,
  X,
} from 'lucide-react';

import { formatText as formatRole } from '../../../revenue/stats/billing-revenue-stats-component/revenueDashboardUtils';

import type {
  ForwardingStaff,
  StaffPresenceStatus,
} from '../../../../../pharmacy/api/dispensing/visit-queue/visitTypes';

import {
  filterOptions,
  getFilterIcon,
  type ForwardPatientColors,
} from './constants';
import type {
  ForwardPatientFormData,
  StaffFilterStatus,
} from './schema';

interface HeaderProps {
  isDark: boolean;
  colors: ForwardPatientColors;
  hasLoadedInitialData: boolean;
  staffCount: number;
}

export const ForwardPatientHeader: React.FC<HeaderProps> = ({
  isDark,
  colors,
  hasLoadedInitialData,
  staffCount,
}) => {
  return (
    <div className={`p-6 border-b ${colors.border.primary}`}>
      <div className="flex items-center gap-3 mb-4">
        <UserPlus className={`w-6 h-6 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />

        <div className="flex-1">
          <h2 className={`text-xl font-bold ${colors.text.primary}`}>
            Forward Patient
          </h2>
          <p className={colors.text.secondary}>
            Assign patient to another staff member
          </p>
        </div>

        {hasLoadedInitialData && (
          <div
            className={`text-xs px-2 py-1 rounded cursor-default ${
              isDark ? 'bg-green-900/50 text-green-400' : 'bg-green-100 text-green-800'
            }`}
          >
            ✓ Staff directory updated • {staffCount} active members
          </div>
        )}
      </div>
    </div>
  );
};

interface SearchFiltersProps {
  searchTerm: string;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  clientSideSearchTerm: string;
  filteredCount: number;
  colors: ForwardPatientColors;
  filterStatus: StaffFilterStatus;
  onFilterChange: (status: StaffFilterStatus) => void;
  clearSearch: () => void;
  hasLoadedInitialData: boolean;
  isDark: boolean;
}

export const StaffSearchFilters: React.FC<SearchFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  clientSideSearchTerm,
  filteredCount,
  colors,
  filterStatus,
  onFilterChange,
  clearSearch,
  hasLoadedInitialData,
  isDark,
}) => {
  return (
    <div className="space-y-4">
      <div className="relative">
        <Search
          className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${colors.text.tertiary}`}
        />

        <input
          type="text"
          placeholder="Search staff by name, staff number, or role..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={`w-full pl-10 pr-10 py-3 rounded-lg border ${colors.border.primary} ${colors.bg.primary} ${colors.text.primary} focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-text`}
        />

        {hasLoadedInitialData && clientSideSearchTerm && (
          <>
            <div
              className={`absolute right-12 top-1/2 -translate-y-1/2 text-xs ${colors.text.tertiary} cursor-default`}
            >
              {filteredCount} results
            </div>

            <button
              type="button"
              onClick={clearSearch}
              className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full ${colors.bg.hover} transition-colors cursor-pointer`}
              title="Clear search"
              aria-label="Clear search results"
            >
              <X className={`w-4 h-4 ${colors.text.tertiary}`} />
            </button>
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        <span className={`text-sm ${colors.text.secondary} cursor-default`}>
          Filter by status:
        </span>

        <div className="flex flex-wrap gap-2">
          {filterOptions.map(({ value, label }) => {
            const isActive = filterStatus === value;

            return (
              <button
                key={value}
                type="button"
                onClick={() => onFilterChange(value)}
                disabled={!hasLoadedInitialData}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  isActive
                    ? `${
                        value === 'available'
                          ? 'bg-green-500/10 text-green-600'
                          : value === 'on_duty'
                            ? 'bg-green-500/10 text-green-600'
                            : value === 'busy'
                              ? 'bg-yellow-500/10 text-yellow-600'
                              : 'bg-gray-500/10 text-gray-600'
                      } border ${isDark ? 'border-gray-600' : 'border-gray-300'}`
                    : `${colors.bg.hover} ${colors.text.secondary} border ${colors.border.primary}`
                } ${!hasLoadedInitialData ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                {value !== 'all' && getFilterIcon(value)}
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

interface StaffSelectionSectionProps {
  isLoadingStaff: boolean;
  isStaffError: boolean;
  filteredStaff: ForwardingStaff[];
  searchTerm: string;
  hasLoadedInitialData: boolean;
  clearSearch: () => void;
  refetchStaff: () => void | Promise<unknown>;
  selectedStaffId: number;
  handleStaffSelect: (staffId: number, canReceive: boolean) => void;
  colors: ForwardPatientColors;
  isDark: boolean;
  getStatusInfo: (status: StaffPresenceStatus) => {
    bg: string;
    text: string;
    label: string;
    icon: React.ReactNode;
  };
  errors: FieldErrors<ForwardPatientFormData>;
  summaryData: { available: number; busy: number; total: number } | null;
  clientSideSearchTerm: string;
}

export const StaffSelectionSection: React.FC<StaffSelectionSectionProps> = ({
  isLoadingStaff,
  isStaffError,
  filteredStaff,
  searchTerm,
  hasLoadedInitialData,
  clearSearch,
  refetchStaff,
  selectedStaffId,
  handleStaffSelect,
  colors,
  isDark,
  getStatusInfo,
  errors,
  summaryData,
  clientSideSearchTerm,
}) => {
  return (
    <div>
      <label
        className={`block text-sm font-medium mb-3 ${colors.text.secondary} cursor-default`}
      >
        Select Staff Member to Forward To <span className="text-red-500">*</span>
        <span className={`block text-xs mt-1 ${colors.text.tertiary} cursor-default`}>
          Staff must be available to receive patients (On Duty or Busy with capacity)
        </span>
      </label>

      {isLoadingStaff ? (
        <div className="flex items-center justify-center py-12">
          <Loader2
            className={`w-8 h-8 animate-spin ${isDark ? 'text-blue-400' : 'text-blue-600'}`}
          />
          <span className="ml-3 text-gray-500">Loading staff...</span>
        </div>
      ) : isStaffError ? (
        <div className={`py-8 text-center rounded-lg border ${colors.border.primary}`}>
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <h3 className={`text-lg font-medium mb-2 ${colors.text.primary}`}>
            Failed to Load Staff
          </h3>
          <p className={colors.text.secondary}>
            Unable to load staff list. Please try again.
          </p>

          <button
            type="button"
            onClick={() => refetchStaff()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      ) : filteredStaff.length === 0 ? (
        <div className={`py-12 text-center rounded-lg border ${colors.border.primary}`}>
          <Users className={`w-12 h-12 mx-auto mb-4 ${colors.text.tertiary}`} />
          <h3 className={`text-lg font-medium mb-2 ${colors.text.primary}`}>
            {searchTerm ? 'No Matching Staff Found' : 'No Staff Available'}
          </h3>
          <p className={colors.text.secondary}>
            {searchTerm
              ? 'No loaded staff match your search criteria'
              : 'No staff are available to receive patients'}
          </p>

          {searchTerm && hasLoadedInitialData && (
            <button
              type="button"
              onClick={clearSearch}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
            >
              Clear Search
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-3 max-h-96 overflow-y-auto pr-2">
          {filteredStaff.map((staff) => {
            const statusInfo = getStatusInfo(staff.presence_status);
            const isSelected = selectedStaffId === staff.staff_id;
            const canReceive = staff.is_available;

            return (
              <div
                key={staff.staff_id}
                className={`p-4 rounded-lg border transition-all ${
                  isSelected
                    ? `${isDark ? 'border-blue-500 bg-blue-500/10' : 'border-blue-500 bg-blue-50'}`
                    : `${colors.border.primary} ${colors.bg.hover}`
                } ${!canReceive ? 'opacity-50' : 'cursor-pointer'}`}
                onClick={() => handleStaffSelect(staff.staff_id, canReceive)}
                role="button"
                tabIndex={canReceive ? 0 : -1}
                onKeyDown={(e) => {
                  if (!canReceive) return;
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleStaffSelect(staff.staff_id, canReceive);
                  }
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <User className={`w-4 h-4 ${colors.text.tertiary}`} />
                      <h4 className={`font-semibold truncate ${colors.text.primary}`}>
                        {staff.full_name}
                      </h4>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${statusInfo.bg} ${statusInfo.text}`}
                      >
                        {statusInfo.label}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-4 text-sm flex-wrap">
                        <span className={colors.text.secondary}>
                          Staff Number: {staff.staff_uuid}
                        </span>
                        <span className={colors.text.secondary}>
                          Role: {formatRole(staff.role_code)}
                        </span>
                      </div>

                      {staff.current_space && (
                        <div className="flex items-center gap-3 text-sm flex-wrap">
                          <div className="flex items-center gap-1">
                            <DoorClosed className={`w-4 h-4 ${colors.text.tertiary}`} />
                            <span className={colors.text.secondary}>
                              {staff.current_space.name}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            <Building className={`w-4 h-4 ${colors.text.tertiary}`} />
                            <span className={colors.text.secondary}>
                              {staff.current_space.type}
                              {staff.current_space.floor
                                ? `, Floor ${staff.current_space.floor}`
                                : ''}
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-sm flex-wrap">
                        <div className="flex items-center gap-1">
                          <Activity className={`w-4 h-4 ${colors.text.tertiary}`} />
                          <span className={colors.text.secondary}>
                            Workload: {staff.current_patient_count}/
                            {staff.max_concurrent_patients}
                          </span>
                        </div>
                        <div className={colors.text.secondary}>
                          Capacity: {staff.workload_percentage}%
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex-shrink-0">
                    {isSelected ? (
                      <CheckCircle2
                        className={`w-6 h-6 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}
                      />
                    ) : (
                      <div
                        className={`w-6 h-6 rounded-full border ${colors.border.primary}`}
                      />
                    )}
                  </div>
                </div>

                {!canReceive && (
                  <div className="mt-3 p-2 rounded bg-amber-500/10 border border-amber-500/20">
                    <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {staff.availability_reason}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {summaryData && (
        <div className="mt-4 flex gap-3 text-sm flex-wrap">
          <span className="px-2 py-1 bg-green-100 text-green-800 rounded">
            Available: {summaryData.available}
          </span>
          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded">
            Busy: {summaryData.busy}
          </span>
          <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded">
            Total: {summaryData.total}
          </span>
          {clientSideSearchTerm && filteredStaff.length !== summaryData.total && (
            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
              Filtered: {filteredStaff.length}
            </span>
          )}
        </div>
      )}

      {errors.assigned_staff_id && (
        <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
          <AlertCircle className="w-4 h-4" />
          {errors.assigned_staff_id.message}
        </p>
      )}
    </div>
  );
};

interface SelectedStaffSummaryProps {
  selectedStaff: ForwardingStaff;
  colors: ForwardPatientColors;
  getStatusInfo: (status: StaffPresenceStatus) => {
    bg: string;
    text: string;
    label: string;
    icon: React.ReactNode;
  };
}

export const SelectedStaffSummary: React.FC<SelectedStaffSummaryProps> = ({
  selectedStaff,
  colors,
  getStatusInfo,
}) => {
  return (
    <div
      className={`p-4 rounded-lg border ${colors.border.primary} ${colors.bg.secondary}`}
    >
      <h4 className={`text-sm font-medium mb-3 ${colors.text.secondary}`}>
        Forwarding to:
      </h4>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p className={`text-xs ${colors.text.tertiary}`}>Staff Member</p>
          <p className={`font-medium ${colors.text.primary}`}>
            {selectedStaff.full_name}
          </p>
        </div>

        <div>
          <p className={`text-xs ${colors.text.tertiary}`}>Status</p>
          <div className="flex items-center gap-2">
            {getStatusInfo(selectedStaff.presence_status).icon}
            <span className={`font-medium ${colors.text.primary}`}>
              {getStatusInfo(selectedStaff.presence_status).label}
            </span>
          </div>
        </div>

        <div>
          <p className={`text-xs ${colors.text.tertiary}`}>Location</p>
          <p className={`font-medium ${colors.text.primary}`}>
            {selectedStaff.current_space?.name || 'No room assigned'}
          </p>
        </div>

        <div>
          <p className={`text-xs ${colors.text.tertiary}`}>Workload</p>
          <p className={`font-medium ${colors.text.primary}`}>
            {selectedStaff.current_patient_count}/
            {selectedStaff.max_concurrent_patients} patients
          </p>
        </div>
      </div>
    </div>
  );
};

interface ServicesDecisionSectionProps {
  shouldHideServicesQuestion: boolean;
  hasProvidedServices: boolean | null;
  handleServicesChoice: (value: boolean) => void;
  colors: ForwardPatientColors;
  isFetchingBillableItems: boolean;
  servicesDecisionError: string | null;
}

export const ServicesDecisionSection: React.FC<ServicesDecisionSectionProps> = ({
  shouldHideServicesQuestion,
  hasProvidedServices,
  handleServicesChoice,
  colors,
  isFetchingBillableItems,
  servicesDecisionError,
}) => {
  if (shouldHideServicesQuestion) {
    return (
      <div
        className={`p-4 rounded-lg border ${colors.border.primary} ${colors.bg.secondary}`}
      >
        <p className={`text-sm ${colors.text.secondary}`}>
          Charges were already indicated for this patient. Continue to billing to add
          services/items before forwarding.
        </p>
      </div>
    );
  }

  return (
    <div
      className={`p-4 rounded-lg border ${colors.border.primary} ${colors.bg.secondary}`}
    >
      <label className={`block text-sm font-medium mb-3 ${colors.text.secondary}`}>
        Did you provide any services or items to this patient?{' '}
        <span className="text-red-500">*</span>
      </label>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => handleServicesChoice(true)}
          className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors cursor-pointer ${
            hasProvidedServices === true
              ? 'bg-blue-600 text-white border-blue-600'
              : `${colors.bg.primary} ${colors.border.primary} ${colors.text.secondary}`
          }`}
        >
          Yes, add charges before forwarding
        </button>

        <button
          type="button"
          onClick={() => handleServicesChoice(false)}
          className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors cursor-pointer ${
            hasProvidedServices === false
              ? 'bg-green-600 text-white border-green-600'
              : `${colors.bg.primary} ${colors.border.primary} ${colors.text.secondary}`
          }`}
        >
          No, just forward patient
        </button>
      </div>

      <p className={`mt-3 text-xs ${colors.text.tertiary}`}>
        If you provided services or dispensed items, we will open charge entry and keep
        the forwarding details for completion after billing.
      </p>

      {hasProvidedServices === true && (
        <div className="mt-3 flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
          {isFetchingBillableItems ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Preparing billing items...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Billing handoff is ready.</span>
            </>
          )}
        </div>
      )}

      {servicesDecisionError && (
        <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
          <AlertCircle className="w-4 h-4" />
          {servicesDecisionError}
        </p>
      )}
    </div>
  );
};
