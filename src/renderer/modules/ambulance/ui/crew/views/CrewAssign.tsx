import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { useCreateCrewMember } from '../../../api/ambulance-crew/useAmbulanceCrewMemberQueries';
import { useAmbulances } from '../../../api/ambulances/useAmbulanceQueries';
import { AMBULANCE_ROUTES } from '../../../../../app/routes/routeConstants';
import { useToast } from '../../../../../app/store/contexts/toast/useToast';
import { useStaff } from '../../../api/staff/useStaffQueries';
// Note: staff search needed — using text input for staff_id for now

interface CrewAssignProps { theme: 'light' | 'dark'; }

const ROLES = [
  { value: 'driver', label: 'Driver' }, { value: 'paramedic', label: 'Paramedic' },
  { value: 'emt', label: 'EMT' }, { value: 'attendant', label: 'Attendant' },
  { value: 'nurse', label: 'Nurse' }, { value: 'doctor', label: 'Doctor' },
  { value: 'crew_lead', label: 'Crew Lead' },
];

const CrewAssign = ({ theme }: CrewAssignProps) => {
  const navigate = useNavigate();
  const isDark = theme === 'dark';
  const { showToast } = useToast();
  const createMut = useCreateCrewMember();
  const { data: ambData } = useAmbulances({ per_page: 100 });
  const ambulances = ambData?.data ?? [];

  const [form, setForm] = useState({ ambulance_id: '', staff_id: '', role: 'driver', is_primary_driver: false, certification_expiry: '' });

  const set = (f: string) => (e: FormEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [f]: (e.target as HTMLInputElement).value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.ambulance_id || !form.staff_id) { showToast('error', 'Vehicle and staff are required'); return; }
    try {
      await createMut.mutateAsync({
        ambulance_id: parseInt(form.ambulance_id),
        staff_id: parseInt(form.staff_id),
        role: form.role,
        is_primary_driver: form.is_primary_driver,
        certification_expiry: form.certification_expiry || null,
      });
      showToast('success', 'Crew member assigned');
      navigate(AMBULANCE_ROUTES.CREW_BY_VEHICLE);
    } catch { showToast('error', 'Assignment failed'); }
  };

  const iCls = `w-full rounded-lg border px-3 py-2 text-sm outline-none ${isDark ? 'border-gray-700 bg-gray-800 text-gray-100' : 'border-gray-200 text-gray-900'}`;
  const lCls = `mb-1 block text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`;

  return (
    <div className={`min-h-screen p-6 ${isDark ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      <div className="mx-auto max-w-lg">
        <button onClick={() => navigate(AMBULANCE_ROUTES.CREW_BY_VEHICLE)}
          className={`mb-6 inline-flex cursor-pointer items-center gap-2 text-sm font-medium ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900'}`}>
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <div className={`rounded-xl border p-6 ${isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'}`}>
          <h2 className="mb-6 text-xl font-bold">Assign Crew Member</h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className={lCls}>Vehicle *</label>
              <select className={iCls} value={form.ambulance_id} onChange={set('ambulance_id')}>
                <option value="">Select vehicle</option>
                {ambulances.map(a => <option key={a.id} value={a.id}>{a.vehicle_identifier}</option>)}
              </select>
            </div>
            <div>
              <label className={lCls}>Staff ID *</label>
              <input type="number" className={iCls} placeholder="Enter staff ID" value={form.staff_id} onChange={set('staff_id')} />
            </div>
            <div>
              <label className={lCls}>Role</label>
              <select className={iCls} value={form.role} onChange={set('role')}>
                {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_primary_driver} onChange={e => setForm(p => ({ ...p, is_primary_driver: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600" />
                <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Primary Driver</span>
              </label>
            </div>
            <div>
              <label className={lCls}>Certification Expiry</label>
              <input type="date" className={iCls} value={form.certification_expiry} onChange={set('certification_expiry')} />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button type="button" onClick={() => navigate(AMBULANCE_ROUTES.CREW_BY_VEHICLE)}
                className={`cursor-pointer rounded-lg border px-4 py-2 text-sm font-medium ${isDark ? 'border-gray-700 text-gray-300' : 'border-gray-200 text-gray-700'}`}>Cancel</button>
              <button type="submit" disabled={createMut.isPending}
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
                <Save className="h-4 w-4" /> Assign
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CrewAssign;
