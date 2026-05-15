import { useState, useCallback, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { useCreateAmbulance } from '../../../api/ambulances/useAmbulanceQueries';
import { AMBULANCE_ROUTES } from '../../../../../app/routes/routeConstants';
import { useToast } from '../../../../../app/store/contexts/toast/useToast';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../../../app/store/rootReducer';
import { getActiveFacilityId } from '../../../../../app/store/utils/contextSelectors';

interface VehicleCreateProps {
  theme: 'light' | 'dark';
  onClose?: () => void;
  embedded?: boolean;
}

const INITIAL = {
  vehicle_identifier: '',
  vehicle_type: 'bls',
  equipment_level: '',
  status: 'available',
  current_mileage: 0,
  capacity: 1,
  last_service_date: '',
  next_service_due_date: '',
  features: '',
};

const VEHICLE_TYPES = [
  { value: 'bls', label: 'Basic Life Support (BLS)' },
  { value: 'als', label: 'Advanced Life Support (ALS)' },
  { value: 'critical_care', label: 'Critical Care (CC)' },
  { value: 'patient_transport', label: 'Patient Transport' },
  { value: 'type_i', label: 'Type I' },
  { value: 'type_ii', label: 'Type II' },
  { value: 'type_iii', label: 'Type III' },
  { value: 'medium_duty', label: 'Medium Duty' },
  { value: 'specialty', label: 'Specialty' },
  { value: 'other', label: 'Other' },
];

const STATUSES = [
  { value: 'available', label: 'Available' },
  { value: 'in_service', label: 'In Service' },
  { value: 'out_of_service', label: 'Out of Service' },
  { value: 'maintenance', label: 'Maintenance' },
];

const VehicleCreate = ({ theme, onClose, embedded = false }: VehicleCreateProps) => {
  const navigate = useNavigate();
  const isDark = theme === 'dark';
  const { showToast } = useToast();
  const createMutation = useCreateAmbulance();
  const activeFacilityId = useSelector((s: RootState) => getActiveFacilityId(s));

  const [form, setForm] = useState(INITIAL);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = useCallback(
    (field: string) => (e: FormEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setForm((p) => ({ ...p, [field]: (e.target as HTMLInputElement).value }));
      setErrors((p) => ({ ...p, [field]: '' }));
    },
    [],
  );

  const dismiss = () => {
    if (onClose) onClose();
    else navigate(AMBULANCE_ROUTES.FLEET_ASSETS);
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.vehicle_identifier.trim()) errs.vehicle_identifier = 'Required';
    if (!form.vehicle_type) errs.vehicle_type = 'Required';
    if (form.current_mileage < 0) errs.current_mileage = 'Must be >= 0';
    if (form.capacity < 1) errs.capacity = 'Must be >= 1';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await createMutation.mutateAsync({
        facility_id: activeFacilityId ?? 1,
        vehicle_identifier: form.vehicle_identifier.trim(),
        vehicle_type: form.vehicle_type,
        equipment_level: form.equipment_level || null,
        status: form.status,
        current_mileage: form.current_mileage,
        capacity: form.capacity,
        last_service_date: form.last_service_date || null,
        next_service_due_date: form.next_service_due_date || null,
        features: form.features ? form.features.split(',').map((s) => s.trim()).filter(Boolean) : null,
      });
      showToast('success', 'Vehicle registered successfully');
      dismiss();
    } catch {
      showToast('error', 'Failed to register vehicle');
    }
  };

  const inputClass = `w-full rounded-lg border px-3 py-2 text-sm outline-none transition-all ${
    isDark
      ? 'border-gray-700 bg-gray-800 text-gray-100 focus:border-blue-500'
      : 'border-gray-200 bg-white text-gray-900 focus:border-blue-500'
  }`;
  const labelClass = `mb-1 block text-xs font-semibold uppercase tracking-wider ${
    isDark ? 'text-gray-400' : 'text-gray-500'
  }`;

  const formEl = (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className={labelClass}>Vehicle Identifier *</label>
          <input
            className={`${inputClass} ${errors.vehicle_identifier ? 'border-red-500' : ''}`}
            placeholder="e.g. AMB-001"
            value={form.vehicle_identifier}
            onChange={set('vehicle_identifier')}
          />
          {errors.vehicle_identifier && (
            <p className="mt-1 text-xs text-red-500">{errors.vehicle_identifier}</p>
          )}
        </div>

        <div>
          <label className={labelClass}>Vehicle Type *</label>
          <select className={inputClass} value={form.vehicle_type} onChange={set('vehicle_type')}>
            {VEHICLE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Status</label>
          <select className={inputClass} value={form.status} onChange={set('status')}>
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Equipment Level</label>
          <input
            className={inputClass}
            placeholder="e.g. basic, advanced, critical"
            value={form.equipment_level}
            onChange={set('equipment_level')}
          />
        </div>

        <div>
          <label className={labelClass}>Capacity</label>
          <input
            type="number"
            min={1}
            max={255}
            className={inputClass}
            value={form.capacity}
            onChange={set('capacity')}
          />
        </div>

        <div>
          <label className={labelClass}>Current Mileage</label>
          <input
            type="number"
            min={0}
            className={inputClass}
            value={form.current_mileage}
            onChange={set('current_mileage')}
          />
        </div>

        <div>
          <label className={labelClass}>Last Service Date</label>
          <input
            type="date"
            className={inputClass}
            value={form.last_service_date}
            onChange={set('last_service_date')}
          />
        </div>

        <div>
          <label className={labelClass}>Next Service Due</label>
          <input
            type="date"
            className={inputClass}
            value={form.next_service_due_date}
            onChange={set('next_service_due_date')}
          />
        </div>

        <div className="col-span-2">
          <label className={labelClass}>Features (comma-separated)</label>
          <input
            className={inputClass}
            placeholder="e.g. stretcher, defibrillator, oxygen"
            value={form.features}
            onChange={set('features')}
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={dismiss}
          className={`cursor-pointer rounded-lg border px-4 py-2 text-sm font-medium ${
            isDark ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={createMutation.isPending}
          className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {createMutation.isPending ? 'Saving…' : 'Register ambulance'}
        </button>
      </div>
    </form>
  );

  if (embedded) {
    return <div className="p-5">{formEl}</div>;
  }

  return (
    <div className={`min-h-screen p-6 ${isDark ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      <div className="mx-auto max-w-2xl">
        <button
          type="button"
          onClick={dismiss}
          className={`mb-6 inline-flex cursor-pointer items-center gap-2 text-sm font-medium ${
            isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <ArrowLeft className="h-4 w-4" /> Back to fleet
        </button>
        <div className={`rounded-xl border p-6 ${isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'}`}>
          <h2 className="mb-6 text-xl font-bold">Register new ambulance</h2>
          {formEl}
        </div>
      </div>
    </div>
  );
};

export default VehicleCreate;
