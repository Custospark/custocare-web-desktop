import React from 'react';
import { Plus, RefreshCw } from 'lucide-react';

interface FacilitySpacePageHeaderProps {
  theme: 'light' | 'dark';
  isRefreshing: boolean;
  onRefresh: () => void | Promise<void>;
  onCreate: () => void;
}

export const FacilitySpacePageHeader: React.FC<FacilitySpacePageHeaderProps> = ({
  theme,
  isRefreshing,
  onRefresh,
  onCreate,
}) => {
  const isDark = theme === 'dark';

  return (
    <div
      className={`rounded-xl p-6 border ${
        isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
      }`}
    >
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <h1 className={`text-2xl font-bold mb-2 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
            Clinical Space Management
          </h1>
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
            Manage consultation rooms, labs, theatres, and other facility spaces.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => void onRefresh()}
            disabled={isRefreshing}
            className={`p-2 rounded-lg border transition-colors ${
              isDark
                ? 'border-gray-800 bg-gray-900 hover:bg-gray-800 text-gray-400'
                : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-600'
            } ${isRefreshing ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
            title="Refresh"
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={onCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-5 h-5" />
            <span>Add Space</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default FacilitySpacePageHeader;
