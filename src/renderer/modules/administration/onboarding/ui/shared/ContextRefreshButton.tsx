import React from 'react';
import { useUserContext } from '../../app/store/hooks/useUserContext';

export const ContextRefreshButton: React.FC = () => {
  const { refresh, isLoading } = useUserContext();

  return (
    <button
      onClick={() => refresh()}
      disabled={isLoading}
      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Refreshing...
        </span>
      ) : (
        'Refresh Context'
      )}
    </button>
  );
};