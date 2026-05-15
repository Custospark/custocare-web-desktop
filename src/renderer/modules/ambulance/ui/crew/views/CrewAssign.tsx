import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { useCreateCrewMember } from '../../../api/ambulance-crew/useAmbulanceCrewMemberQueries';
import { useAmbulances } from '../../../api/ambulances/useAmbulanceQueries';
import { AMBULANCE_ROUTES } from '../../../../../app/routes/routeConstants';
import { useToast } from '../../../../../app/store/contexts/toast/useToast';
import FacilityStaffPicker from '../../fleet/FacilityStaffPicker';
import type { ForwardingStaff } from '../../../../pharmacy/api/dispensing/visit-queue/visitTypes';

interface CrewAssignProps {
  theme: 'light' | 'dark';
  onClose?: () => void;
  embedded?: boolean;
}

const ROLES = [
  { value: 'driver', label: 'Driver' },
  { value: 'paramedic', label: 'Paramedic' },
  { value: 'emt', label: 'EMT' },
  { value: 'attendant', label: 'Attendant' },
  { value: 'nurse', label: 'Nurse' },
  { value: 'doctor', label: 'Doctor' },
  { value: 'crew_lead', label: 'Crew Lead' },
];

const CrewAssign = ({ theme, onClose, embedded = false }: CrewAssignProps) => {
  const navigate = useNavigate();
  const isDark = theme === 'dark';
  const { showToast } = useToast();
  const createMut = useCreateCrewMember();
  const { data: ambData } = useAmbulances({ per_page: 100 });
  const ambulances = ambData?.data ?? [];

  const [form, setForm] = useState({
    ambulance_id: '',
    staff_id: null as number | null,
    role: 'driver',
    is_primary_driver: false,
    certification_expiry: '',
  });
  const [selectedStaffLabel, setSelectedStaffLabel] = useState('');

  const set = (f: string) => (e: FormEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((p) => ({ ...p, [f]: (e.target as HTMLInputElement).value }));

  const dismiss = () => {
    if (onClose) onClose();
    else navigate(AMBULANCE_ROUTES.FLEET_ASSETS);
  };

  const handleStaffSelect = (staffId: number, staff: ForwardingStaff) => {
    setForm((p) => ({ ...p, staff_id: staffId }));
    setSelectedStaffLabel(staff.full_name);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.ambulance_id || form.staff_id == null) {
      showToast('error', 'Vehicle and staff are required');
      return;
    }
    try {
      await createMut.mutateAsync({
        ambulance_id: parseInt(form.ambulance_id, 10),
        staff_id: form.staff_id,
        role: form.role,
        is_primary_driver: form.is_primary_driver,
        certification_expiry: form.certification_expiry || null,
      });
      showToast('success', 'Crew member assigned');
      dismiss();
    } catch {
      showToast('error', 'Assignment failed');
    }
  };

  const iCls = `w-full rounded-lg border px-3 py-2 text-sm outline-none ${
    isDark ? 'border-gray-700 bg-gray-800 text-gray-100' : 'border-gray-200 text-gray-900'
  }`;
  const lCls = `mb-1 block text-xs font-semibold uppercase tracking-wider ${
    isDark ? 'text-gray-400' : 'text-gray-500'
  }`;

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className={lCls}>Vehicle *</label>
        <select className={iCls} value={form.ambulance_id} onChange={set('ambulance_id')}>
          <option value="">Select vehicle</option>
          {ambulances.map((a) => (
            <option key={a.id} value={a.id}>
              {a.vehicle_identifier}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={lCls}>Staff member *</label>
        {selectedStaffLabel && (
          <p className={`mb-2 text-sm font-medium ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
            Selected: {selectedStaffLabel}
          </p>
        )}
        <FacilityStaffPicker
          theme={theme}
          selectedStaffId={form.staff_id}
          onSelect={handleStaffSelect}
        />
      </div>

      <div>
        <label className={lCls}>Role</label>
        <select className={iCls} value={form.role} onChange={set('role')}>
          {ROLES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </div>

      <label className="flex cursor-pointer items-center gap-2">
        <input
          type="checkbox"
          checked={form.is_primary_driver}
          onChange={(e) => setForm((p) => ({ ...p, is_primary_driver: e.target.checked }))}
          className="rounded border-gray-300 text-blue-600"
        />
        <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Primary driver</span>
      </label>

      <div>
        <label className={lCls}>Certification expiry</label>
        <input type="date" className={iCls} value={form.certification_expiry} onChange={set('certification_expiry')} />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={dismiss}
          className={`cursor-pointer rounded-lg px-4 py-2 text-sm font-medium ${
            isDark ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={createMut.isPending}
          className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {createMut.isPending ? 'Assigning…' : 'Assign crew'}
        </button>
      </div>
    </form>
  );

  if (embedded) {
    return <div className="p-5">{formContent}</div>;
  }

  return (
    <div className={`min-h-screen p-6 ${isDark ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      <div className="mx-auto max-w-lg">
        <button
          type="button"
          onClick={dismiss}
          className={`mb-6 inline-flex cursor-pointer items-center gap-2 text-sm font-medium ${
            isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <div className={`rounded-xl border p-6 ${isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'}`}>
          <h2 className="mb-6 text-xl font-bold">Assign crew member</h2>
          {formContent}
        </div>
      </div>
    </div>
  );
};

export default CrewAssign;
