import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UsersRound, Calendar, Clock, ArrowLeft } from 'lucide-react';
import { useCrewByStaff } from '../../../api/ambulance-crew/useAmbulanceCrewMemberQueries';
import CrewRoleBadge from '../components/CrewRoleBadge';
import { AMBULANCE_ROUTES } from '../../../../../app/routes/routeConstants';

interface CrewScheduleProps { theme: 'light' | 'dark'; }

const CrewSchedule = ({ theme }: CrewScheduleProps) => {
  const navigate = useNavigate();
  const isDark = theme === 'dark';
  const [staffId, setStaffId] = useState('');
  const { data, isLoading } = useCrewByStaff(staffId ? parseInt(staffId) : 0);
  const assignments = data?.data ?? [];

  return (
    <div className={`min-h-screen p-6 ${isDark ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      <div className="mx-auto max-w-2xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Crew Schedule</h1>
          <p className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            View vehicle assignments by staff member
          </p>
        </div>

        <div className="mb-6">
          <label className={`mb-1 block text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Staff ID
          </label>
          <input
            type="number"
            placeholder="Enter staff ID to see their assignments"
            value={staffId}
            onChange={e => setStaffId(e.target.value)}
            className={`w-full rounded-lg border px-3 py-2 text-sm outline-none ${isDark ? 'border-gray-700 bg-gray-800 text-gray-100' : 'border-gray-200 text-gray-900'}`}
          />
        </div>

        <div className={`rounded-xl border ${isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'}`}>
          {!staffId ? (
            <div className="flex flex-col items-center p-12">
              <UsersRound className={`mb-3 h-10 w-10 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Enter a staff ID to view their schedule</p>
            </div>
          ) : isLoading ? (
            <div className="flex justify-center p-12"><Clock className={`h-6 w-6 animate-spin ${isDark ? 'text-gray-400' : 'text-gray-500'}`} /></div>
          ) : assignments.length === 0 ? (
            <div className="flex flex-col items-center p-12">
              <UsersRound className={`mb-3 h-10 w-10 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>No active assignments for this staff member</p>
            </div>
          ) : (
            <div className="divide-y {isDark ? 'divide-gray-800' : 'divide-gray-100'}">
              {assignments.map(a => (
                <div key={a.id} className={`flex items-center gap-4 p-4 ${isDark ? 'hover:bg-gray-800/30' : 'hover:bg-gray-50'}`}>
                  <div className={`rounded-lg p-2 ${isDark ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
                    <UsersRound className={`h-5 w-5 ${isDark ? 'text-blue-400' : 'text-blue-500'}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {a.ambulance?.vehicle_identifier ?? 'Unknown vehicle'}
                      </span>
                      <CrewRoleBadge role={a.role} isDark={isDark} />
                      {a.is_primary_driver && (
                        <span className="rounded bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-700">Driver</span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {a.assigned_at ? new Date(a.assigned_at).toLocaleDateString() : 'N/A'}
                      </span>
                      {!a.active && (
                        <span className="flex items-center gap-1 text-red-400">
                          Ended {a.unassigned_at ? new Date(a.unassigned_at).toLocaleDateString() : ''}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className={`text-xs font-medium ${a.active ? 'text-green-500' : 'text-gray-400'}`}>
                    {a.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CrewSchedule;
