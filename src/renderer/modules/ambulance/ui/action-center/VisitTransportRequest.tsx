import { type FormEvent, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { MapPin, Save } from 'lucide-react';
import { useCreateTrip } from '../../api/ambulance-trips/useAmbulanceTripQueries';
import { useAmbulances } from '../../api/ambulances/useAmbulanceQueries';
import { AMBULANCE_ROUTES } from '../../../../app/routes/routeConstants';
import { useToast } from '../../../../app/store/contexts/toast/useToast';
import type { RootState } from '../../../../app/store/rootReducer';
import { getActiveFacilityId } from '../../../../app/store/utils/contextSelectors';
import {
  selectActivePatient,
  selectActiveVisitId,
  selectActiveVisitPatientId,
} from '../../../../app/store/slices/visitSlice';

interface VisitTransportRequestProps {
  theme: 'light' | 'dark';
}

const TRIP_TYPES = [
  { value: 'emergency', label: 'Emergency' },
  { value: 'non_emergency', label: 'Non-Emergency' },
  { value: 'inter_facility_transfer', label: 'Inter-Facility Transfer' },
  { value: 'standby', label: 'Standby' },
  { value: 'special_event', label: 'Special Event' },
];
const PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

const VisitTransportRequest: React.FC<VisitTransportRequestProps> = ({ theme }) => {
  const navigate = useNavigate();
  const isDark = theme === 'dark';
  const { showToast } = useToast();
  const createMutation = useCreateTrip();
  const activeFacilityId = useSelector((s: RootState) => getActiveFacilityId(s));
  const patient = useSelector((s: RootState) => selectActivePatient(s));
  const visitId = useSelector((s: RootState) => selectActiveVisitId(s));
  const patientId = useSelector((s: RootState) => selectActiveVisitPatientId(s));
  const { data: ambData } = useAmbulances({ status: 'available', per_page: 100 });
  const ambulances = ambData?.data ?? [];

  const [form, setForm] = useState({
    trip_type: 'non_emergency',
    priority: 'medium',
    ambulance_id: '',
    pickup_location: '',
    destination_location: '',
    dispatch_notes: '',
    estimated_duration_minutes: '',
  });

  const set = useCallback(
    (f: string) =>
      (e: FormEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setForm((p) => ({ ...p, [f]: (e.target as HTMLInputElement).value }));
      },
    []
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!patientId) {
      showToast('error', 'No patient loaded for this visit');
      return;
    }
    try {
      await createMutation.mutateAsync({
        facility_id: activeFacilityId ?? 1,
        patient_id: patientId,
        visit_id: visitId ?? undefined,
        trip_type: form.trip_type,
        priority: form.priority,
        ambulance_id: form.ambulance_id ? parseInt(form.ambulance_id, 10) : undefined,
        pickup_location: form.pickup_location || null,
        destination_location: form.destination_location || null,
        dispatch_notes: form.dispatch_notes || null,
        estimated_duration_minutes: form.estimated_duration_minutes
          ? parseInt(form.estimated_duration_minutes, 10)
          : undefined,
      });
      showToast('success', 'Transport request created');
      navigate(AMBULANCE_ROUTES.ACTION_CENTER_TRANSPORT);
    } catch {
      showToast('error', 'Failed to create transport request');
    }
  };

  const labelClass = `block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`;
  const inputClass = `w-full rounded-lg border px-3 py-2 text-sm outline-none transition-all ${
    isDark ? 'border-gray-700 bg-gray-800 text-gray-100 focus:border-blue-500' : 'border-gray-300 bg-white text-gray-900 focus:border-blue-500'
  }`;
  const sectionCard = isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200';

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-5">
      <div className={`rounded-xl border p-4 ${sectionCard}`}>
        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Creating transport for{' '}
          <span className="font-semibold text-inherit">{patient?.name ?? 'current patient'}</span>
          {visitId ? ` (visit #${visitId})` : ''}.
        </p>
      </div>

      <div className={`rounded-xl border p-4 space-y-4 ${sectionCard}`}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Trip type</label>
            <select className={inputClass} value={form.trip_type} onChange={set('trip_type')}>
              {TRIP_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Priority</label>
            <select className={inputClass} value={form.priority} onChange={set('priority')}>
              {PRIORITIES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Ambulance (optional)</label>
            <select className={inputClass} value={form.ambulance_id} onChange={set('ambulance_id')}>
              <option value="">Auto-assign nearest available</option>
              {ambulances.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.vehicle_identifier} ({a.vehicle_type})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Est. duration (min)</label>
            <input
              type="number"
              min={1}
              className={inputClass}
              value={form.estimated_duration_minutes}
              onChange={set('estimated_duration_minutes')}
            />
          </div>
        </div>
      </div>

      <div className={`rounded-xl border p-4 space-y-4 ${sectionCard}`}>
        <div>
          <label className={labelClass}>
            <MapPin className="mr-1 inline h-3.5 w-3.5 text-green-500" />
            Pickup
          </label>
          <input className={inputClass} value={form.pickup_location} onChange={set('pickup_location')} />
        </div>
        <div>
          <label className={labelClass}>
            <MapPin className="mr-1 inline h-3.5 w-3.5 text-red-500" />
            Destination
          </label>
          <input
            className={inputClass}
            value={form.destination_location}
            onChange={set('destination_location')}
          />
        </div>
        <div>
          <label className={labelClass}>Dispatch notes</label>
          <textarea
            rows={3}
            className={inputClass}
            value={form.dispatch_notes}
            onChange={set('dispatch_notes')}
          />
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => navigate(AMBULANCE_ROUTES.ACTION_CENTER_TRANSPORT)}
          className={`cursor-pointer rounded-lg border px-4 py-2 text-sm font-medium ${
            isDark ? 'border-gray-700 text-gray-300' : 'border-gray-200 text-gray-700'
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
          {createMutation.isPending ? 'Submitting…' : 'Submit request'}
        </button>
      </div>
    </form>
  );
};

export default VisitTransportRequest;
