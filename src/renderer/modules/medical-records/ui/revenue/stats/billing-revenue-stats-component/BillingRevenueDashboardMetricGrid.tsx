import React, { useMemo, useState } from 'react';
import { TrendingUp } from 'lucide-react';
import { cx, type DashboardMetricCard } from './revenueDashboardUtils';

type BillingRevenueDashboardMetricGridProps = {
  title?: string;
  subtitle?: string;
  metrics: DashboardMetricCard[];
  isDark: boolean;
  cardClassName: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  grid: string;
};

const ITEMS_PER_PAGE = 6;

const BillingRevenueDashboardMetricGrid: React.FC<
  BillingRevenueDashboardMetricGridProps
> = ({
  title = 'Metrics',
  subtitle,
  metrics,
  isDark,
  cardClassName,
  text,
  textSecondary,
  textMuted,
  grid,
}) => {
  const [currentPage, setCurrentPage] = useState(0);

  const totalPages = Math.max(1, Math.ceil(metrics.length / ITEMS_PER_PAGE));

  const displayedMetrics = useMemo(() => {
    const startIndex = currentPage * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return metrics.slice(startIndex, endIndex);
  }, [currentPage, metrics]);

  const paginationDots = useMemo(() => {
    return Array.from({ length: totalPages }, (_, i) => i);
  }, [totalPages]);

  const handlePageClick = (pageIndex: number) => {
    setCurrentPage(pageIndex);
  };

  return (
    <div className={cardClassName}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className={cx('text-base sm:text-lg font-semibold', text)}>{title}</h2>
          {subtitle ? (
            <p className={cx('text-sm mt-1', textSecondary)}>{subtitle}</p>
          ) : null}
        </div>

        {totalPages > 1 ? (
          <div className="flex items-center gap-2">
            {paginationDots.map((pageIdx) => (
              <button
                key={pageIdx}
                type="button"
                onClick={() => handlePageClick(pageIdx)}
                className={cx(
                  'w-2.5 h-2.5 rounded-full transition-all duration-200',
                  currentPage === pageIdx
                    ? isDark
                      ? 'bg-blue-500 scale-125'
                      : 'bg-blue-600 scale-125'
                    : isDark
                      ? 'bg-gray-600 hover:bg-gray-500'
                      : 'bg-gray-300 hover:bg-gray-400'
                )}
                aria-label={`Go to page ${pageIdx + 1}`}
                aria-current={currentPage === pageIdx ? 'page' : undefined}
              />
            ))}
          </div>
        ) : null}
      </div>

      {displayedMetrics.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {displayedMetrics.map((metric) => {
            const Icon = metric.icon;
            const hasChange = metric.change !== undefined && metric.change !== null;
            const isPositive = (metric.change ?? 0) > 0;

            return (
              <div
                key={metric.label}
                className={cx(
                  'rounded-xl border p-4 transition-all duration-200',
                  metric.accentClassName,
                  isDark
                    ? 'bg-gray-900 border-gray-700 hover:shadow-[0_12px_28px_rgba(0,0,0,0.45)]'
                    : 'bg-white border-gray-200 hover:shadow-lg'
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className={cx('text-xs font-medium tracking-wide', textSecondary)}>
                      {metric.label}
                    </p>

                    <p className={cx('text-2xl font-bold mt-1 break-words', text)}>
                      {metric.value}
                    </p>

                    {hasChange ? (
                      <div className="flex items-center gap-1 mt-2">
                        <TrendingUp
                          className={cx(
                            'w-3.5 h-3.5',
                            isPositive ? 'text-green-500' : 'text-red-500'
                          )}
                        />
                        <span
                          className={cx(
                            'text-xs font-medium',
                            isPositive ? 'text-green-500' : 'text-red-500'
                          )}
                        >
                          {isPositive ? '+' : ''}
                          {metric.change}%
                        </span>
                        <span className={cx('text-xs', textMuted)}>change</span>
                      </div>
                    ) : null}

                    {metric.subtext ? (
                      <p className={cx('text-xs mt-2', textMuted)}>{metric.subtext}</p>
                    ) : null}
                  </div>

                  <div
                    className={cx(
                      'p-2 rounded-lg shrink-0 border transition-colors',
                      isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
                    )}
                  >
                    <Icon className={cx('w-5 h-5', metric.iconClassName)} />
                  </div>
                </div>

                <div className="mt-4">
                  <div className="h-px" style={{ backgroundColor: grid }} />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div
          className={cx(
            'rounded-xl border p-6 text-sm',
            isDark ? 'bg-gray-900 border-gray-700 text-gray-400' : 'bg-white border-gray-200 text-gray-500'
          )}
        >
          No metric data available.
        </div>
      )}
    </div>
  );
};

export default BillingRevenueDashboardMetricGrid;
