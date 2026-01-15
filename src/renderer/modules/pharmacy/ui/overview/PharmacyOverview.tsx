// PharmacyOverview.tsx
import React, { useState } from 'react';
import { OverviewStats } from './OverviewStats';
import { InventoryTrendsChart } from './InventoryTrendsChart';
import { PrescriptionActivityChart } from './PrescriptionActivityChart';
import { RecentActivityFeed } from './RecentActivityFeed';
import { PerformanceMetrics } from './PerformanceMetrics';
import { RefreshCw } from 'lucide-react';
interface PharmacyOverviewProps {
  theme: 'light' | 'dark';
}

export const PharmacyOverview: React.FC<PharmacyOverviewProps> = ({ theme }) => {
  const isDark = theme === 'dark';
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const handleRefresh = (): void => {
    setRefreshKey(prev => prev + 1);
    setLastRefreshed(new Date());
  };


  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Pharmacy Overview</h1>
          <p className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Real-time operational dashboard and command center
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
            Last updated: {lastRefreshed.toLocaleTimeString()}
          </span>
          <button
            onClick={handleRefresh}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isDark
                ? 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
            aria-label="Refresh dashboard data"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* High-Level Metrics */}
      <OverviewStats theme={theme} refreshKey={refreshKey} />

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PrescriptionActivityChart theme={theme} refreshKey={refreshKey} />
        <InventoryTrendsChart theme={theme} refreshKey={refreshKey} />
      </div>
     

      {/* Performance & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentActivityFeed theme={theme} refreshKey={refreshKey} />
        </div>
        <div>
          <PerformanceMetrics theme={theme} refreshKey={refreshKey} />
        </div>
      </div>
    </div>
  );
};

export default PharmacyOverview;
