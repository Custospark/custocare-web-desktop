import React from 'react';
import { Plus, RefreshCw } from 'lucide-react';

interface DepartmentPageHeaderProps {
  theme: 'light' | 'dark';
  isRefreshing: boolean;
  onRefresh: () => void | Promise<void>;
  onCreate: () => void;
}

export const DepartmentPageHeader: React.FC<DepartmentPageHeaderProps> = ({
  theme,
  isRefreshing,
  onRefresh,
  onCreate,
}) => {
  const isDark = theme === 'dark';

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Clinical Departments</h1>
        <p className={`mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Configure the internal structure of your healthcare facility.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => void onRefresh()}
          disabled={isRefreshing}
          className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            isDark
              ? 'bg-gray-800 hover:bg-gray-700 text-gray-300 disabled:bg-gray-800 disabled:text-gray-500'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700 disabled:bg-gray-100 disabled:text-gray-400'
          } ${isRefreshing ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </button>

        <button
          onClick={onCreate}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          New Department
        </button>
      </div>
    </div>
  );
};

export default DepartmentPageHeader;
