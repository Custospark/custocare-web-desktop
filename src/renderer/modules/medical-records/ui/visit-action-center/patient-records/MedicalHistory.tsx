import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Search, AlertTriangle } from 'lucide-react';
import LoadingSkeleton from '../../../../../shared/components/Loading/LoadingSkeletons';
import { selectActiveVisitPatientId } from '../../../../../app/store/slices/visitSlice';
import { useGetAllergies } from '../../../api/allergies/AllergyQueries';

interface MedicalHistoryProps {
  theme?: 'light' | 'dark';
}

export const MedicalHistory: React.FC<MedicalHistoryProps> = ({ theme = 'light' }) => {
  const patientId = useSelector(selectActiveVisitPatientId);
  const [searchQuery, setSearchQuery] = useState('');
  const [timeRange, setTimeRange] = useState<'all' | 'year' | '6months' | 'month'>('all');

  const allergiesQuery = useGetAllergies(patientId ?? '', {}, { enabled: !!patientId });
  const isLoading = allergiesQuery.isLoading;
  const allergiesPayload = allergiesQuery.data as
    | { data?: { data?: unknown } | unknown }
    | undefined;
  const nestedAllergies = allergiesPayload?.data as { data?: unknown } | unknown;
  const allergiesCandidate =
    typeof nestedAllergies === 'object' && nestedAllergies !== null && 'data' in nestedAllergies
      ? (nestedAllergies as { data?: unknown }).data
      : nestedAllergies;
  const allergies = Array.isArray(allergiesCandidate) ? allergiesCandidate : [];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold">Medical History</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Complete patient clinical history across all visits
        </p>
      </div>

      <div className="mb-6 flex gap-2 border-b pb-4">
        <button
          type="button"
          onClick={() => setTimeRange('all')}
          className={`rounded-lg px-3 py-1 text-sm transition-colors ${
            timeRange === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
          }`}
        >
          All Time
        </button>
        <button
          type="button"
          onClick={() => setTimeRange('year')}
          className={`rounded-lg px-3 py-1 text-sm transition-colors ${
            timeRange === 'year'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
          }`}
        >
          Last Year
        </button>
        <button
          type="button"
          onClick={() => setTimeRange('6months')}
          className={`rounded-lg px-3 py-1 text-sm transition-colors ${
            timeRange === '6months'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
          }`}
        >
          6 Months
        </button>
        <button
          type="button"
          onClick={() => setTimeRange('month')}
          className={`rounded-lg px-3 py-1 text-sm transition-colors ${
            timeRange === 'month'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
          }`}
        >
          Last Month
        </button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search medical history..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800"
          />
        </div>
      </div>

      {isLoading ? (
        <LoadingSkeleton variant="list" theme={theme} message="Loading medical history..." />
      ) : (
        <div className="space-y-6">
          <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
            <div className="mb-3 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <h3 className="font-semibold">Allergy History</h3>
            </div>
            {allergies.length === 0 ? (
              <p className="text-sm text-gray-500">No allergies recorded</p>
            ) : (
              <div className="space-y-2">
                {allergies.map((allergy) => (
                  <div key={allergy.id} className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{allergy.allergen}</span>
                      <span
                        className={`rounded px-2 py-1 text-xs ${
                          allergy.severity === 'severe'
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                            : allergy.severity === 'moderate'
                              ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                              : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                        }`}
                      >
                        {allergy.severity}
                      </span>
                    </div>
                    {allergy.reaction && (
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{allergy.reaction}</p>
                    )}
                    <p className="mt-2 text-xs text-gray-400">
                      Recorded: {new Date(allergy.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicalHistory;