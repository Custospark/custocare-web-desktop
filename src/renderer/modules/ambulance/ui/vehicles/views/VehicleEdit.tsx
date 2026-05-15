import { useState, useCallback, useEffect, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { useAmbulance, useUpdateAmbulance } from '../../../api/ambulances/useAmbulanceQueries';
import { AMBULANCE_ROUTES } from '../../../../../app/routes/routeConstants';
import { useToast } from '../../../../../app/store/contexts/toast/useToast';
import type { UpdateAmbulanceRequest } from '../../../api/ambulances/ambulanceTypes';

interface VehicleEditProps { theme: 'light' | 'dark'; }

const VEHICLE_TYPES = [
  { value: 'bls', label: 'BLS' }, { value: 'als', label: 'ALS' },
  { value: 'critical_care', label: 'Critical Care' }, { value: 'patient_transport', label: 'Patient Transport' },
  { value: 'type_i', label: 'Type I' }, { value: 'type_ii', label: 'Type II' },
  { value: 'type_iii', label: 'Type III' }, { value: 'specialty', label: 'Specialty' },
  { value: 'other', label: 'Other' },
];

const STATUSES = [
  { value: 'available', label: 'Available' }, { value: 'in_service', label: 'In Service' },
  { value: 'out_of_service', label: 'Out of Service' }, { value: 'maintenance', label: 'Maintenance' },
  { value: 'decommissioned', label: 'Decommissioned' },
];

const VehicleEdit = ({ theme }: VehicleEditProps) => {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const isDark = theme === 'dark';
  const { showToast } = useToast();
  const { data, isLoading } = useAmbulance(uuid!);
  const updateMutation = useUpdateAmbulance(uuid!);
  const vehicle = data?.data;

  const [form, setForm] = useState({
    vehicle_identifier: '', vehicle_type: '', equipment_level: '',
    status: '', current_mileage: 0, capacity: 1,
    last_service_date: '', next_service_due_date: '', features: '',
  });

  useEffect(() => {
    if (vehicle) setForm({
      vehicle_identifier: vehicle.vehicle_identifier,
      vehicle_type: vehicle.vehicle_type,
      equipment_level: vehicle.equipment_level ?? '',
      status: vehicle.status,
      current_mileage: vehicle.current_mileage,
      capacity: vehicle.capacity,
      last_service_date: vehicle.last_service_date ?? '',
      next_service_due_date: vehicle.next_service_due_date ?? '',
      features: vehicle.features?.join(', ') ?? '',
    });
  }, [vehicle]);

  const set = useCallback((field: string) => (e: FormEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(p => ({ ...p, [field]: (e.target as HTMLInputElement).value }));
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const payload: UpdateAmbulanceRequest = {
        vehicle_identifier: form.vehicle_identifier,
        vehicle_type: form.vehicle_type,
        equipment_level: form.equipment_level || null,
        status: form.status,
        current_mileage: form.current_mileage,
        capacity: form.capacity,
        last_service_date: form.last_service_date || null,
        next_service_due_date: form.next_service_due_date || null,
        features: form.features ? form.features.split(',').map(s => s.trim()).filter(Boolean) : null,
      };
      await updateMutation.mutateAsync(payload);
      showToast('success', 'Vehicle updated');
      navigate(AMBULANCE_ROUTES.FLEET_ASSETS);
    } catch { showToast('error', 'Update failed'); }
  };

  if (isLoading) return <div className="flex justify-center p-12"><div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" /></div>;
  if (!vehicle) return <div className="p-12 text-center text-sm text-gray-500">Vehicle not found</div>;

  const inputClass = `w-full rounded-lg border px-3 py-2 text-sm outline-none ${isDark ? 'border-gray-700 bg-gray-800 text-gray-100' : 'border-gray-200 text-gray-900'}`;
  const labelClass = `mb-1 block text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`;

  return (
    <div className={`min-h-screen p-6 ${isDark ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      <div className="mx-auto max-w-2xl">
        <button onClick={() => navigate(AMBULANCE_ROUTES.FLEET_ASSETS)}
          className={`mb-6 inline-flex cursor-pointer items-center gap-2 text-sm font-medium ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900'}`}>
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <div className={`rounded-xl border p-6 ${isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'}`}>
          <h2 className="mb-6 text-xl font-bold">Edit Ambulance {vehicle.vehicle_identifier}</h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className={labelClass}>Vehicle Identifier</label>
                <input className={inputClass} value={form.vehicle_identifier} onChange={set('vehicle_identifier')} />
              </div>
              <div>
                <label className={labelClass}>Type</label>
                <select className={inputClass} value={form.vehicle_type} onChange={set('vehicle_type')}>
                  {VEHICLE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Status</label>
                <select className={inputClass} value={form.status} onChange={set('status')}>
                  {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Equipment</label>
                <input className={inputClass} value={form.equipment_level} onChange={set('equipment_level')} />
              </div>
              <div>
                <label className={labelClass}>Capacity</label>
                <input type="number" min={1} className={inputClass} value={form.capacity} onChange={set('capacity')} />
              </div>
              <div>
                <label className={labelClass}>Mileage</label>
                <input type="number" min={0} className={inputClass} value={form.current_mileage} onChange={set('current_mileage')} />
              </div>
              <div>
                <label className={labelClass}>Last Service</label>
                <input type="date" className={inputClass} value={form.last_service_date} onChange={set('last_service_date')} />
              </div>
              <div>
                <label className={labelClass}>Service Due</label>
                <input type="date" className={inputClass} value={form.next_service_due_date} onChange={set('next_service_due_date')} />
              </div>
              <div className="col-span-2">
                <label className={labelClass}>Features</label>
                <input className={inputClass} value={form.features} onChange={set('features')} />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button type="button" onClick={() => navigate(AMBULANCE_ROUTES.FLEET_ASSETS)}
                className={`cursor-pointer rounded-lg border px-4 py-2 text-sm font-medium ${isDark ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}>Cancel</button>
              <button type="submit" disabled={updateMutation.isPending}
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
                <Save className="h-4 w-4" /> {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default VehicleEdit;
