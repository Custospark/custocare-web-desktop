import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from './userPermissions.utils';


import LoadingSkeleton from '../../../../shared/components/Loading/LoadingSkeletons';

interface EmptyStateProps {
  isDark: boolean;
  title: string;
  subtitle: string;
  icon: React.ElementType;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  isDark,
  title,
  subtitle,
  icon: Icon,
}) => {
  return (
    <div
      className={cn(
        'rounded-3xl border border-dashed p-10 text-center',
        isDark
          ? 'border-white/10 bg-white/[0.03]'
          : 'border-slate-200 bg-white'
      )}
    >
      <div
        className={cn(
          'mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl',
          isDark ? 'bg-white/5 text-slate-300' : 'bg-slate-100 text-slate-700'
        )}
      >
        <Icon className="h-6 w-6" />
      </div>

      <h3 className={cn('text-lg font-semibold', isDark ? 'text-white' : 'text-slate-950')}>
        {title}
      </h3>

      <p className={cn('mx-auto mt-2 max-w-xl text-sm', isDark ? 'text-slate-400' : 'text-slate-600')}>
        {subtitle}
      </p>
    </div>
  );
};

interface InfoPillProps {
  isDark: boolean;
  label: string;
  value: string | number;
}

export const InfoPill: React.FC<InfoPillProps> = ({ isDark, label, value }) => {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm',
        isDark
          ? 'border-white/10 bg-white/[0.03] text-slate-200'
          : 'border-slate-200 bg-white text-slate-700'
      )}
    >
      <span className={cn('text-xs font-semibold uppercase tracking-[0.14em]', isDark ? 'text-slate-400' : 'text-slate-500')}>
        {label}
      </span>
      <span className="font-semibold">{value}</span>
    </div>
  );
};

interface PaginationControlsProps {
  isDark: boolean;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export const PaginationControls: React.FC<PaginationControlsProps> = ({
  isDark,
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}) => {
  const start = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);

  const getVisiblePages = () => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    if (currentPage <= 3) {
      return [1, 2, 3, 4, 5];
    }

    if (currentPage >= totalPages - 2) {
      return Array.from({ length: 5 }, (_, index) => totalPages - 4 + index);
    }

    return [
      currentPage - 2,
      currentPage - 1,
      currentPage,
      currentPage + 1,
      currentPage + 2,
    ];
  };

  const visiblePages = getVisiblePages();

  return (
    <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <p className={cn('text-sm', isDark ? 'text-slate-400' : 'text-slate-600')}>
        Showing <span className="font-semibold">{start}</span> to{' '}
        <span className="font-semibold">{end}</span> of{' '}
        <span className="font-semibold">{totalItems}</span> records
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className={cn(
            'inline-flex h-10 w-10 items-center justify-center rounded-xl border transition-all',
            isDark
              ? 'border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/10'
              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100',
            currentPage === 1 && 'cursor-not-allowed opacity-50'
          )}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {visiblePages.map((page) => {
          const active = page === currentPage;

          return (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              className={cn(
                'inline-flex h-10 min-w-10 items-center justify-center rounded-xl px-3 text-sm font-semibold transition-all',
                active
                  ? 'bg-blue-600 text-white'
                  : isDark
                  ? 'border border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/10'
                  : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
              )}
            >
              {page}
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className={cn(
            'inline-flex h-10 w-10 items-center justify-center rounded-xl border transition-all',
            isDark
              ? 'border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/10'
              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100',
            currentPage === totalPages && 'cursor-not-allowed opacity-50'
          )}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

interface UserPermissionsTableSkeletonProps {
  isDark: boolean;
}

export const UserPermissionsTableSkeleton: React.FC<UserPermissionsTableSkeletonProps> = ({
  isDark,
}) => {
  return (
    <LoadingSkeleton
      variant="table"
      theme={isDark ? 'dark' : 'light'}
      message="Loading platform users..."
      className="rounded-3xl"
    />
  );
};
