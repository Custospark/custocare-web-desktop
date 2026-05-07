import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useNursingDashboard } from '../../api/intelligence/useNursingDashboardQueries';
import { NursingOverviewStats } from './NursingOverviewStats';
import { NursingDoseActivityChart } from './NursingDoseActivityChart';
import { NursingCareVolumeTrendsChart } from './NursingCareVolumeTrendsChart';
import { NursingRecentActivityFeed } from './NursingRecentActivityFeed';
import { NursingPerformanceMetrics } from './NursingPerformanceMetrics';

interface NursingOverviewProps {
  theme: 'light' | 'dark';
}

export const NursingOverview: React.FC<NursingOverviewProps> = ({ theme }) => {
  const isDark = theme === 'dark';
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const { data, isLoading, isFetching, isError, error, refetch } = useNursingDashboard(refreshKey);

  const handleRefresh = (): void => {
    setRefreshKey((prev) => prev + 1);
    setLastRefreshed(new Date());
    void refetch();
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Nursing intelligence</h1>
          <p className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Tasks, medications, treatments, and shift signals for this facility
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
            Last updated: {lastRefreshed.toLocaleTimeString()}
          </span>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isFetching}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isDark
                ? 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            } ${isFetching ? 'opacity-60 cursor-not-allowed' : ''}`}
            aria-label="Refresh dashboard data"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {isError && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            isDark ? 'border-red-900 bg-red-950/40 text-red-200' : 'border-red-200 bg-red-50 text-red-800'
          }`}
        >
          {error instanceof Error ? error.message : 'Could not load nursing dashboard.'}
        </div>
      )}

      <NursingOverviewStats
        theme={theme}
        refreshKey={refreshKey}
        summary={data?.summary}
        isLoading={isLoading}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <NursingDoseActivityChart
          theme={theme}
          refreshKey={refreshKey}
          activity={data?.dose_activity}
          isLoading={isLoading}
        />
        <NursingCareVolumeTrendsChart
          theme={theme}
          refreshKey={refreshKey}
          trends={data?.care_volume_trends}
          isLoading={isLoading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <NursingRecentActivityFeed
            theme={theme}
            refreshKey={refreshKey}
            items={data?.recent_activity}
            isLoading={isLoading}
          />
        </div>
        <div>
          <NursingPerformanceMetrics
            theme={theme}
            refreshKey={refreshKey}
            performance={data?.performance}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
};

export default NursingOverview;
