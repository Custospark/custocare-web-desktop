import React, { useMemo, useState } from 'react';
import { Search, User, AlertCircle } from 'lucide-react';
import { useGetStaffForForwarding } from '../../../pharmacy/api/dispensing/visit-queue/useVisitQueries';
import type { ForwardingStaff } from '../../../pharmacy/api/dispensing/visit-queue/visitTypes';
import LoadingSkeleton from '../../../../shared/components/Loading/LoadingSkeletons';

interface FacilityStaffPickerProps {
  theme: 'light' | 'dark';
  selectedStaffId: number | null;
  onSelect: (staffId: number, staff: ForwardingStaff) => void;
  roleCode?: string;
}

const FacilityStaffPicker: React.FC<FacilityStaffPickerProps> = ({
  theme,
  selectedStaffId,
  onSelect,
  roleCode,
}) => {
  const isDark = theme === 'dark';
  const [search, setSearch] = useState('');

  const { data, isLoading, isError, refetch } = useGetStaffForForwarding({
    limit: 100,
    search: search.trim() || undefined,
    ...(roleCode ? { role_code: roleCode } : {}),
  });

  const staffMembers = useMemo(() => data?.data?.staff ?? [], [data]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return staffMembers;
    return staffMembers.filter((s) => {
      const hay = `${s.full_name} ${s.employee_id} ${s.role_code}`.toLowerCase();
      return hay.includes(q);
    });
  }, [staffMembers, search]);

  if (isLoading) {
    return <LoadingSkeleton variant="table" theme={theme} message="Loading facility staff…" />;
  }

  if (isError) {
    return (
      <div
        className={`flex flex-col items-center gap-2 rounded-lg border p-6 text-center ${
          isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-gray-50'
        }`}
      >
        <AlertCircle className="h-8 w-8 text-red-500" />
        <p className="text-sm">Could not load staff.</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search
          className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search staff by name or ID…"
          className={`w-full rounded-lg border py-2 pl-10 pr-4 text-sm outline-none ${
            isDark ? 'border-gray-700 bg-gray-800 text-gray-100' : 'border-gray-200 bg-white text-gray-900'
          }`}
        />
      </div>

      <div
        className={`max-h-72 overflow-y-auto rounded-lg border ${
          isDark ? 'border-gray-800' : 'border-gray-200'
        }`}
      >
        {filtered.length === 0 ? (
          <p className={`p-4 text-center text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            No staff found for this facility.
          </p>
        ) : (
          filtered.map((s) => {
            const selected = selectedStaffId === s.staff_id;
            return (
              <button
                key={s.staff_id}
                type="button"
                onClick={() => onSelect(s.staff_id, s)}
                className={`flex w-full cursor-pointer items-center gap-3 border-b px-3 py-2.5 text-left text-sm transition last:border-0 ${
                  selected
                    ? isDark
                      ? 'border-gray-800 bg-blue-900/20'
                      : 'border-gray-100 bg-blue-50'
                    : isDark
                      ? 'border-gray-800 hover:bg-gray-800/50'
                      : 'border-gray-100 hover:bg-gray-50'
                }`}
              >
                <User className={`h-4 w-4 shrink-0 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{s.full_name}</p>
                  <p className={`truncate text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    {s.role_code} · {s.employee_id}
                    {!s.is_available ? ' · Busy' : ''}
                  </p>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

export default FacilityStaffPicker;
