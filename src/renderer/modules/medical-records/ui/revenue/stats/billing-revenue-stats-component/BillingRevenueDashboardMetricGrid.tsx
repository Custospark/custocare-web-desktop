import React from 'react';
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
  grid: string;
};

const BillingRevenueDashboardMetricGrid: React.FC<
  BillingRevenueDashboardMetricGridProps
> = ({ metrics, isDark, cardClassName, text, textSecondary, textMuted, grid }) => {
  return (
    <div className={cardClassName}>
      <div className="mb-4">
        <h2 className={cx('text-base sm:text-lg font-semibold', text)}>Snapshot</h2>
        <p className={cx('text-sm mt-1', textSecondary)}>
          Revenue, collections, refunds, outstanding balances, and leakage summary
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {metrics.map(metric => {
          const Icon = metric.icon;
          const hasChange = metric.change !== undefined && metric.change !== null;
          const isPositive = (metric.change ?? 0) > 0;

          return (
            <div
              key={metric.label}
              className={cx(
                'rounded-xl border p-4 transition-shadow',
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
                      <span className={cx('text-xs', textMuted)}>vs prior period</span>
                    </div>
                  ) : null}

                  {metric.subtext ? (
                    <p className={cx('text-xs mt-2', textMuted)}>{metric.subtext}</p>
                  ) : null}
                </div>

                <div
                  className={cx(
                    'p-2 rounded-lg shrink-0 border',
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
