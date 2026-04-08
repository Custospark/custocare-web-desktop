import React, { useState, useMemo } from 'react';
import { TrendingUp } from 'lucide-react';
import { cx } from './revenueDashboardUtils';
import { DashboardMetricCard } from './revenueDashboardUtils';

type BillingRevenueDashboardMetricGridProps = {
  metrics: DashboardMetricCard[];
  isDark: boolean;
  cardClassName: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  grid: string; // used for separator line (optional)
};

const ITEMS_PER_PAGE = 3;

const BillingRevenueDashboardMetricGrid: React.FC<
  BillingRevenueDashboardMetricGridProps
> = ({ metrics, isDark, cardClassName, text, textSecondary, textMuted, grid }) => {
  const [currentPage, setCurrentPage] = useState(0);

  const totalPages = Math.ceil(metrics.length / ITEMS_PER_PAGE);
  const startIndex = currentPage * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, metrics.length);
  const displayedMetrics = metrics.slice(startIndex, endIndex);

  const handlePageClick = (pageIndex: number) => {
    setCurrentPage(pageIndex);
  };

  // Generate pagination dots (no ellipsis, just dots for each page)
  const paginationDots = useMemo(() => {
    return Array.from({ length: totalPages }, (_, i) => i);
  }, [totalPages]);

  return (
    <div className={cardClassName}>
      {/* Header with title and dots on the right */}
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className={cx('text-base sm:text-lg font-semibold', text)}>Snapshot</h2>
          <p className={cx('text-sm mt-1', textSecondary)}>
            Revenue, collections, refunds, outstanding balances, and leakage summary
          </p>
        </div>

        {/* Dots pagination */}
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            {paginationDots.map((pageIdx) => (
              <button
                key={pageIdx}
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
        )}
      </div>

      {/* Cards grid – only 3 cards shown */}
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
                  ? 'bg-gray-900 border-gray-700 hover:shadow-[0_12px_28px_rgba(0,0,0,0.45)] hover:scale-[1.02]'
                  : 'bg-white border-gray-200 hover:shadow-lg hover:scale-[1.02]'
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
                      <span className={cx('text-xs', textMuted)}>vs prior period</span>
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

  
    </div>
  );
};

export default BillingRevenueDashboardMetricGrid;