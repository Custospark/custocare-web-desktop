import React from 'react';
import type { FieldErrors } from 'react-hook-form';
import {
  Activity,
  AlertCircle,
  Building,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  DoorClosed,
  Loader2,
  User,
  Users,
} from 'lucide-react';

import { formatText as formatRole } from '../../../revenue/stats/billing-revenue-stats-component/revenueDashboardUtils';

import type {
  ForwardingStaff,
  StaffPresenceStatus,
} from '../../../../../pharmacy/api/dispensing/visit-queue/visitTypes';

import type { ForwardPatientColors } from './constants';
import type { ForwardPatientFormData } from './schema';

type PaginationItem = number | 'ellipsis';

const buildPaginationItems = (
  currentPage: number,
  totalPages: number
): PaginationItem[] => {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pageSet = new Set<number>([
    1,
    totalPages,
    currentPage - 1,
    currentPage,
    currentPage + 1,
  ]);

  const sortedPages = Array.from(pageSet)
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b);

  const result: PaginationItem[] = [];

  sortedPages.forEach((page, index) => {
    const previousPage = sortedPages[index - 1];
    if (index > 0 && previousPage && page - previousPage > 1) {
      result.push('ellipsis');
    }
    result.push(page);
  });

  return result;
};

export interface StaffSelectionSectionProps {
  isLoadingStaff: boolean;
  isStaffError: boolean;
  filteredStaff: ForwardingStaff[];
  paginatedStaff: ForwardingStaff[];
  searchTerm: string;
  hasLoadedInitialData: boolean;
  clearSearch: () => void;
  onRefresh: () => void | Promise<unknown>;
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
  currentPage: number;
  totalPages: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions: number[];
}

export const StaffSelectionSection: React.FC<StaffSelectionSectionProps> = ({
  isLoadingStaff,
  isStaffError,
  filteredStaff,
  paginatedStaff,
  searchTerm,
  hasLoadedInitialData,
  clearSearch,
  onRefresh,
  selectedStaffId,
  handleStaffSelect,
  colors,
  isDark,
  getStatusInfo,
  errors,
  summaryData,
  clientSideSearchTerm,
  currentPage,
  totalPages,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions,
}) => {
  const hasSearch = Boolean(searchTerm || clientSideSearchTerm);
  const totalFiltered = filteredStaff.length;
  const startRecord = totalFiltered === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(currentPage * pageSize, totalFiltered);
  const paginationItems = buildPaginationItems(currentPage, totalPages);

  return (
    <div>
      <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
        <label
          className={`block text-sm font-medium ${colors.text.secondary} cursor-default`}
        >
          Select Staff Member to Forward To <span className="text-red-500">*</span>
          <span className={`block text-xs mt-1 ${colors.text.tertiary} cursor-default`}>
            Staff must be available to receive patients (On Duty or Busy with capacity)
          </span>
        </label>
      </div>

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
            onClick={() => void onRefresh()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      ) : totalFiltered === 0 ? (
        <div className={`py-12 text-center rounded-lg border ${colors.border.primary}`}>
          <Users className={`w-12 h-12 mx-auto mb-4 ${colors.text.tertiary}`} />
          <h3 className={`text-lg font-medium mb-2 ${colors.text.primary}`}>
            {hasSearch ? 'No Matching Staff Found' : 'No Staff Available'}
          </h3>
          <p className={colors.text.secondary}>
            {hasSearch
              ? 'No loaded staff match your search criteria'
              : 'No staff are available to receive patients'}
          </p>

          <div className="mt-4 flex items-center justify-center gap-3 flex-wrap">
            {hasSearch && hasLoadedInitialData && (
              <button
                type="button"
                onClick={clearSearch}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
              >
                Clear Search
              </button>
            )}

            <button
              type="button"
              onClick={() => void onRefresh()}
              className={`px-4 py-2 rounded-lg border transition-colors cursor-pointer ${colors.border.primary} ${colors.bg.hover} ${colors.text.secondary}`}
            >
              Refresh Staff
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="grid gap-3 max-h-96 overflow-y-auto pr-2">
            {paginatedStaff.map((staff) => {
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
                              Current Workload: {staff.current_patient_count}/
                              {staff.max_concurrent_patients}
                            </span>
                          </div>
                          <div className={colors.text.secondary}>
                            Current Capacity: {staff.workload_percentage}%
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

          <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3 flex-wrap">
              <span className={`text-sm ${colors.text.secondary}`}>
                Showing {startRecord}-{endRecord} of {totalFiltered}
              </span>

              <div className="flex items-center gap-2">
                <label
                  htmlFor="staff-page-size"
                  className={`text-sm ${colors.text.secondary}`}
                >
                  Records per page:
                </label>
                <select
                  id="staff-page-size"
                  value={pageSize}
                  onChange={(e) => onPageSizeChange(Number(e.target.value))}
                  className={`px-3 py-2 rounded-lg border ${colors.border.primary} ${colors.bg.primary} ${colors.text.primary} focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer`}
                >
                  {pageSizeOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`inline-flex items-center gap-1 px-3 py-2 rounded-lg border transition-colors ${
                  currentPage === 1
                    ? 'opacity-50 cursor-not-allowed'
                    : 'cursor-pointer'
                } ${colors.border.primary} ${colors.bg.hover} ${colors.text.secondary}`}
              >
                <ChevronLeft className="w-4 h-4" />
                Prev
              </button>

              {paginationItems.map((item, index) =>
                item === 'ellipsis' ? (
                  <span
                    key={`ellipsis-${index}`}
                    className={`px-2 ${colors.text.tertiary}`}
                  >
                    ...
                  </span>
                ) : (
                  <button
                    key={item}
                    type="button"
                    onClick={() => onPageChange(item)}
                    className={`min-w-[40px] px-3 py-2 rounded-lg border transition-colors ${
                      item === currentPage
                        ? 'bg-blue-600 text-white border-blue-600'
                        : `${colors.border.primary} ${colors.bg.hover} ${colors.text.secondary}`
                    } cursor-pointer`}
                  >
                    {item}
                  </button>
                )
              )}

              <button
                type="button"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`inline-flex items-center gap-1 px-3 py-2 rounded-lg border transition-colors ${
                  currentPage === totalPages
                    ? 'opacity-50 cursor-not-allowed'
                    : 'cursor-pointer'
                } ${colors.border.primary} ${colors.bg.hover} ${colors.text.secondary}`}
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
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
