import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ArrowLeft, Plus, FileText, Trash2, Clock } from 'lucide-react';
import { useTripLogs, useCreateTripLog, useDeleteTripLog } from '../../../api/ambulance-trip-logs/useAmbulanceTripLogQueries';
import { selectActiveTrip } from '../../../../../app/store/slices/tripSlice';
import { useToast } from '../../../../../app/store/contexts/toast/useToast';
import { AMBULANCE_ROUTES } from '../../../../../app/routes/routeConstants';

interface TripLogListProps { theme: 'light' | 'dark'; }

const EVENT_TYPES = ['status_change', 'location_update', 'patient_condition', 'note', 'handoff', 'delay'];

const TripLogList = ({ theme }: TripLogListProps) => {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const isDark = theme === 'dark';
  const { showToast } = useToast();
  const activeTrip = useSelector(selectActiveTrip);

  // Get the trip UUID: from URL param or from slice
  const tripUuid = uuid ?? activeTrip?.trip_uuid ?? '';

  const { data, isLoading } = useTripLogs(tripUuid);
  const createMut = useCreateTripLog(tripUuid);
  const deleteMut = useDeleteTripLog(tripUuid);
  const logs = data?.data ?? [];
  const [showForm, setShowForm] = useState(false);
  const [eventType, setEventType] = useState('note');
  const [description, setDescription] = useState('');

  const handleCreate = async () => {
    if (!description.trim()) return;
    try {
      await createMut.mutateAsync({ event_type: eventType, description: description.trim() });
      setDescription(''); setShowForm(false);
      showToast('success', 'Log entry added');
    } catch { showToast('error', 'Failed to add log'); }
  };

  if (!tripUuid) return (
    <div className={`flex flex-col items-center justify-center p-12 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
      <p className="mb-4 text-sm">No active trip selected</p>
      <button onClick={() => navigate(AMBULANCE_ROUTES.DISPATCH_ACTIVE_BOARD)}
        className="text-sm font-medium text-blue-600 hover:text-blue-700">Go to active trips board</button>
    </div>
  );

  const eventBadge = (type: string) => {
    const colors: Record<string, string> = {
      status_change: 'bg-blue-100 text-blue-700', location_update: 'bg-green-100 text-green-700',
      patient_condition: 'bg-red-100 text-red-700', note: 'bg-gray-100 text-gray-700',
      handoff: 'bg-purple-100 text-purple-700', delay: 'bg-amber-100 text-amber-700',
    };
    const darkColors: Record<string, string> = {
      status_change: 'bg-blue-900/30 text-blue-300', location_update: 'bg-green-900/30 text-green-300',
      patient_condition: 'bg-red-900/30 text-red-300', note: 'bg-gray-800 text-gray-300',
      handoff: 'bg-purple-900/30 text-purple-300', delay: 'bg-amber-900/30 text-amber-300',
    };
    const c = isDark ? darkColors : colors;
    return c[type] ?? (isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700');
  };

  return (
    <div className={`min-h-screen p-6 ${isDark ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      <div className="mx-auto max-w-3xl">
        <button onClick={() => navigate(`/ambulance/trip-workspace`)}
          className={`mb-6 inline-flex cursor-pointer items-center gap-2 text-sm font-medium ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900'}`}>
          <ArrowLeft className="h-4 w-4" /> Back to trip overview
        </button>

        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Trip Logs</h1>
          <button onClick={() => setShowForm(!showForm)}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700">
            <Plus className="h-4 w-4" /> Add Entry
          </button>
        </div>

        {showForm && (
          <div className={`mb-6 rounded-xl border p-4 ${isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'}`}>
            <div className="mb-3 flex gap-3">
              <select value={eventType} onChange={e => setEventType(e.target.value)}
                className={`rounded-lg border px-3 py-2 text-sm outline-none ${isDark ? 'border-gray-700 bg-gray-800 text-gray-100' : 'border-gray-200 text-gray-900'}`}>
                {EVENT_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
              </select>
              <input className={`flex-1 rounded-lg border px-3 py-2 text-sm outline-none ${isDark ? 'border-gray-700 bg-gray-800 text-gray-100' : 'border-gray-200 text-gray-900'}`}
                placeholder="Description..." value={description} onChange={e => setDescription(e.target.value)} />
              <button onClick={handleCreate} disabled={createMut.isPending || !description.trim()}
                className="cursor-pointer rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">Save</button>
            </div>
          </div>
        )}

        <div className={`rounded-xl border ${isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'}`}>
          {isLoading ? (
            <div className="flex justify-center p-12"><Clock className={`h-6 w-6 animate-spin ${isDark ? 'text-gray-400' : 'text-gray-500'}`} /></div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center p-12">
              <FileText className={`mb-3 h-10 w-10 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>No log entries yet</p>
              <button onClick={() => setShowForm(true)}
                className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-700">Add the first entry</button>
            </div>
          ) : (
            <div className="divide-y {isDark ? 'divide-gray-800' : 'divide-gray-100'}">
              {logs.map(log => (
                <div key={log.id} className={`flex items-start gap-4 p-4 ${isDark ? 'hover:bg-gray-800/30' : 'hover:bg-gray-50'}`}>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${eventBadge(log.event_type)}`}>
                    {log.event_type.replace(/_/g, ' ')}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm">{log.description}</p>
                    <div className="mt-1 flex items-center gap-2 text-xs text-gray-400">
                      <Clock className="h-3 w-3" />
                      {log.recorded_at ? new Date(log.recorded_at).toLocaleString() : ''}
                      {log.recorded_by && <span>by {log.recorded_by.first_name} {log.recorded_by.last_name}</span>}
                    </div>
                  </div>
                  <button onClick={async () => { try { await deleteMut.mutateAsync(log.id); } catch {} }}
                    className={`cursor-pointer rounded-lg p-1.5 ${isDark ? 'text-gray-500 hover:bg-red-900/30 hover:text-red-300' : 'text-gray-400 hover:bg-red-50 hover:text-red-500'}`}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TripLogList;
