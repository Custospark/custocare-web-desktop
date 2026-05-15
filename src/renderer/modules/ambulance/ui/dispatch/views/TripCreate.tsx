import { useState, useCallback, useRef, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, MapPin, Save, Search, Users } from 'lucide-react';
import { useCreateTrip } from '../../../api/ambulance-trips/useAmbulanceTripQueries';
import { useAmbulances } from '../../../api/ambulances/useAmbulanceQueries';
import { usePatientSearch } from '../../../../pharmacy/api/dispensing/patient-search/usePatientQueries';
import { AMBULANCE_ROUTES } from '../../../../../app/routes/routeConstants';
import { useToast } from '../../../../../app/store/contexts/toast/useToast';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../../../app/store/rootReducer';
import type { PatientSearchResult } from '../../../../pharmacy/api/dispensing/patient-search/usePatientTypes';

interface TripCreateProps { theme: 'light' | 'dark'; onClose?: () => void; }

const TRIP_TYPES = [
  { value: 'emergency', label: 'Emergency' }, { value: 'non_emergency', label: 'Non-Emergency' },
  { value: 'inter_facility_transfer', label: 'Inter-Facility Transfer' },
  { value: 'standby', label: 'Standby' }, { value: 'special_event', label: 'Special Event' },
];
const PRIORITIES = [
  { value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' }, { value: 'urgent', label: 'Urgent' },
];

const TripCreate = ({ theme, onClose }: TripCreateProps) => {
  const navigate = useNavigate();
  const isDark = theme === 'dark';
  const { showToast } = useToast();
  const createMutation = useCreateTrip();
  const activeFacilityId = useSelector((s: RootState) => s.facility?.activeFacilityId);
  const { data: ambData } = useAmbulances({ status: 'available', per_page: 100 });
  const ambulances = ambData?.data ?? [];

  const [form, setForm] = useState({
    patient_id: '', trip_type: 'non_emergency', priority: 'medium',
    ambulance_id: '', pickup_location: '', destination_location: '',
    dispatch_notes: '', estimated_duration_minutes: '',
  });
  const [selectedPatient, setSelectedPatient] = useState<PatientSearchResult | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showPatientSearch, setShowPatientSearch] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const { data: searchData, isLoading: searching } = usePatientSearch({ q: searchQuery });
  const searchResults = searchData?.data ?? [];

  const closeDrawer = () => { if (onClose) onClose(); else navigate(AMBULANCE_ROUTES.DISPATCH); };

  const set = useCallback((f: string) => (e: FormEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(p => ({ ...p, [f]: (e.target as HTMLInputElement).value }));
  }, []);

  const handleSelectPatient = (patient: PatientSearchResult) => {
    setSelectedPatient(patient);
    setForm(p => ({ ...p, patient_id: String(patient.id) }));
    setShowPatientSearch(false);
    setSearchQuery('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.patient_id) { showToast('error', 'Please select a patient'); return; }
    try {
      await createMutation.mutateAsync({
        facility_id: activeFacilityId ?? 1,
        patient_id: parseInt(form.patient_id),
        trip_type: form.trip_type,
        priority: form.priority,
        ambulance_id: form.ambulance_id ? parseInt(form.ambulance_id) : undefined,
        pickup_location: form.pickup_location || null,
        destination_location: form.destination_location || null,
        dispatch_notes: form.dispatch_notes || null,
        estimated_duration_minutes: form.estimated_duration_minutes ? parseInt(form.estimated_duration_minutes) : undefined,
      });
      showToast('success', 'Trip created successfully');
      closeDrawer();
    } catch { showToast('error', 'Failed to create trip'); }
  };

  const labelClass = `block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`;
  const inputClass = `w-full rounded-lg border px-3 py-2 text-sm outline-none transition-all ${
    isDark ? 'border-gray-700 bg-gray-800 text-gray-100 focus:border-blue-500' : 'border-gray-300 bg-white text-gray-900 focus:border-blue-500'
  }`;
  const sectionCard = isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200';
  const subtleDivider = isDark ? 'border-gray-800' : 'border-gray-200';

  return (
    <div className="fixed inset-0 z-50">
      <button aria-label="Close" onClick={closeDrawer} className="absolute inset-0 bg-black/50 cursor-pointer" />

      <div className={`absolute right-0 top-0 h-full w-full sm:w-160 overflow-y-auto border-l ${
        isDark ? 'bg-gray-950 border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900'
      }`} role="dialog" aria-modal="true" aria-label="New Trip Request">

        <div className={`p-5 border-b ${subtleDivider} flex items-start justify-between gap-4`}>
          <div className="min-w-0">
            <h3 className="text-lg font-semibold leading-6">New Trip Request</h3>
            <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Dispatch an ambulance for a patient transport
            </p>
          </div>
          <button onClick={closeDrawer}
            className={`p-2 rounded-lg border transition cursor-pointer ${
              isDark ? 'border-gray-800 hover:bg-gray-900' : 'border-gray-200 hover:bg-gray-100'
            }`} aria-label="Close panel">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div className={`rounded-xl border ${sectionCard}`}>
            <div className={`px-4 py-3 border-b ${subtleDivider}`}>
              <h4 className="text-sm font-semibold">Patient</h4>
              <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Search and select the patient for this trip.</p>
            </div>
            <div className="p-4">
              {selectedPatient ? (
                <div className={`flex items-center justify-between rounded-lg border p-3 ${isDark ? 'border-blue-800/30 bg-blue-900/10' : 'border-blue-200 bg-blue-50'}`}>
                  <div className="flex items-center gap-3">
                    <Users className={`h-5 w-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                    <div>
                      <p className="text-sm font-medium">{selectedPatient.name ?? `Patient #${selectedPatient.id}`}</p>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        ID: {selectedPatient.patient_number} | DOB: {selectedPatient.date_of_birth ?? 'N/A'}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => { setSelectedPatient(null); setForm(p => ({ ...p, patient_id: '' })); }}
                    className="cursor-pointer text-sm font-medium text-red-500 hover:text-red-600">Change</button>
                </div>
              ) : (
                <div>
                  <button onClick={() => { setShowPatientSearch(true); setTimeout(() => searchRef.current?.focus(), 100); }}
                    className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-all ${
                      isDark ? 'border-gray-700 bg-gray-800 text-gray-200 hover:bg-gray-700' : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                    }`}>
                    <Search className="h-4 w-4" /> Search Patient
                  </button>

                  {showPatientSearch && (
                    <div className="mt-3">
                      <input ref={searchRef} type="text" placeholder="Search by name, patient number, or phone..."
                        value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                        className={inputClass} autoFocus />
                      {searching && <p className={`mt-2 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Searching...</p>}
                      {searchResults.length > 0 && (
                        <div className={`mt-2 max-h-48 overflow-y-auto rounded-lg border ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
                          {searchResults.map((p) => (
                            <button key={p.id} type="button" onClick={() => handleSelectPatient(p)}
                              className={`flex w-full cursor-pointer items-center gap-3 px-3 py-2.5 text-left text-sm transition-all ${
                                isDark ? 'hover:bg-gray-800 border-b border-gray-800 last:border-0' : 'hover:bg-gray-50 border-b border-gray-100 last:border-0'
                              }`}>
                              <Users className={`h-4 w-4 shrink-0 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                              <div className="min-w-0 flex-1">
                                <p className="truncate font-medium">{p.name ?? `Patient #${p.id}`}</p>
                                <p className={`truncate text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                  {p.patient_number} | {p.date_of_birth ?? 'N/A'} | {p.biological_sex ?? 'N/A'}
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                      {searchQuery && !searching && searchResults.length === 0 && (
                        <p className={`mt-2 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>No patients found</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className={`rounded-xl border ${sectionCard}`}>
            <div className={`px-4 py-3 border-b ${subtleDivider}`}>
              <h4 className="text-sm font-semibold">Trip Details</h4>
              <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Type, priority, and vehicle assignment.</p>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Trip Type <span className="text-red-500">*</span></label>
                  <select className={inputClass} value={form.trip_type} onChange={set('trip_type')}>
                    {TRIP_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Priority</label>
                  <select className={inputClass} value={form.priority} onChange={set('priority')}>
                    {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass}>Ambulance (optional)</label>
                  <select className={inputClass} value={form.ambulance_id} onChange={set('ambulance_id')}>
                    <option value="">Auto-assign nearest available</option>
                    {ambulances.map(a => <option key={a.id} value={a.id}>{a.vehicle_identifier} ({a.vehicle_type})</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Est. Duration (min)</label>
                  <input type="number" min={1} className={inputClass} placeholder="e.g. 30" value={form.estimated_duration_minutes} onChange={set('estimated_duration_minutes')} />
                </div>
              </div>
            </div>
          </div>

          <div className={`rounded-xl border ${sectionCard}`}>
            <div className={`px-4 py-3 border-b ${subtleDivider}`}>
              <h4 className="text-sm font-semibold">Route</h4>
              <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Pickup and destination locations.</p>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className={labelClass}><MapPin className="inline h-3.5 w-3.5 mr-1 text-green-500" />Pickup Location</label>
                <input className={inputClass} placeholder="Address or facility name" value={form.pickup_location} onChange={set('pickup_location')} />
              </div>
              <div>
                <label className={labelClass}><MapPin className="inline h-3.5 w-3.5 mr-1 text-red-500" />Destination</label>
                <input className={inputClass} placeholder="Address or facility name" value={form.destination_location} onChange={set('destination_location')} />
              </div>
            </div>
          </div>

          <div className={`rounded-xl border ${sectionCard}`}>
            <div className={`px-4 py-3 border-b ${subtleDivider}`}>
              <h4 className="text-sm font-semibold">Dispatch Notes</h4>
              <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Additional instructions for the crew.</p>
            </div>
            <div className="p-4">
              <textarea rows={3} className={inputClass} placeholder="Any special instructions or patient notes..." value={form.dispatch_notes} onChange={set('dispatch_notes')} />
            </div>
          </div>
        </div>

        <div className={`sticky bottom-0 border-t p-4 flex justify-end gap-3 ${isDark ? 'border-gray-800 bg-gray-950' : 'border-gray-200 bg-white'}`}>
          <button onClick={closeDrawer}
            className={`cursor-pointer rounded-lg border px-4 py-2 text-sm font-medium transition-all ${
              isDark ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}>Cancel</button>
          <button onClick={handleSubmit} disabled={createMutation.isPending || !form.patient_id}
            className={`inline-flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-all ${
              !form.patient_id ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            }`}>
            <Save className="h-4 w-4" />
            {createMutation.isPending ? 'Creating...' : 'Create Trip'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TripCreate;
