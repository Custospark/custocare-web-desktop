import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ArrowLeft, Clock, CheckCircle2, Circle } from 'lucide-react';
import { useTrip } from '../../../api/ambulance-trips/useAmbulanceTripQueries';
import { selectActiveTrip } from '../../../../../app/store/slices/tripSlice';
import { AMBULANCE_ROUTES } from '../../../../../app/routes/routeConstants';

interface TripTimelineProps { theme: 'light' | 'dark'; }

const STEPS = [
  { key: 'requested', label: 'Requested' },
  { key: 'dispatched', label: 'Dispatched' },
  { key: 'en_route', label: 'En Route' },
  { key: 'on_scene', label: 'On Scene' },
  { key: 'patient_contact', label: 'Patient Contact' },
  { key: 'depart_scene', label: 'Depart Scene' },
  { key: 'at_destination', label: 'At Destination' },
  { key: 'completed', label: 'Completed' },
];

const FIELD_MAP: Record<string, string> = {
  dispatched: 'dispatched_at', en_route: 'en_route_at', on_scene: 'on_scene_at',
  patient_contact: 'patient_contact_at', depart_scene: 'depart_scene_at',
  at_destination: 'at_destination_at', completed: 'completed_at',
};

const TripTimeline = ({ theme }: TripTimelineProps) => {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const isDark = theme === 'dark';
  const activeTrip = useSelector(selectActiveTrip);

  // If we have a URL param, fetch from API; otherwise read from slice
  const queryUuid = uuid ?? '';
  const { data, isLoading } = useTrip(queryUuid);
  const t = queryUuid ? (data?.data ?? null) : activeTrip;

  if (isLoading) return <div className="flex justify-center p-12"><div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" /></div>;
  if (!t) return (
    <div className={`flex flex-col items-center justify-center p-12 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
      <p className="mb-4 text-sm">No active trip selected</p>
      <button onClick={() => navigate(AMBULANCE_ROUTES.DISPATCH_ACTIVE_BOARD)}
        className="text-sm font-medium text-blue-600 hover:text-blue-700">Go to active trips board</button>
    </div>
  );

  return (
    <div className={`min-h-screen p-6 ${isDark ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      <div className="mx-auto max-w-2xl">
        <button onClick={() => navigate(`/ambulance/trip-workspace`)}
          className={`mb-6 inline-flex cursor-pointer items-center gap-2 text-sm font-medium ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900'}`}>
          <ArrowLeft className="h-4 w-4" /> Back to trip overview
        </button>

        <div className={`rounded-xl border p-6 ${isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'}`}>
          <h2 className="mb-6 text-xl font-bold">Trip Timeline</h2>

          <div className="relative">
            {STEPS.map((step, i) => {
              const field = FIELD_MAP[step.key] ?? null;
              const time = field ? (t as any)[field] : null;
              const idx = STEPS.findIndex(s => s.key === t.status);
              const isActive = idx >= i;
              const isCurrent = step.key === t.status;

              return (
                <div key={step.key} className="flex gap-4 pb-8 last:pb-0">
                  <div className="flex flex-col items-center">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                      isCurrent ? 'bg-blue-500 ring-4 ring-blue-500/20' :
                      isActive ? 'bg-green-500' : (isDark ? 'bg-gray-800' : 'bg-gray-100')
                    }`}>
                      {isActive && !isCurrent ? <CheckCircle2 className="h-4 w-4 text-white" /> :
                       isCurrent ? <Clock className="h-4 w-4 text-white" /> :
                       <Circle className={`h-4 w-4 ${isDark ? 'text-gray-500' : 'text-gray-300'}`} />}
                    </div>
                    {i < STEPS.length - 1 && (
                      <div className={`h-full w-0.5 ${isActive && !isCurrent ? 'bg-green-500' : (isDark ? 'bg-gray-800' : 'bg-gray-200')}`} />
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <p className={`font-medium ${isCurrent ? 'text-blue-500' : isActive ? 'text-green-500' : (isDark ? 'text-gray-400' : 'text-gray-500')}`}>
                      {step.label}
                    </p>
                    {time && (
                      <p className={`mt-0.5 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        {new Date(time).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {t.cancelled_at && (
            <div className={`mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700`}>
              <p className="font-medium">Cancelled</p>
              <p className="mt-1 text-xs">{new Date(t.cancelled_at).toLocaleString()}</p>
              {t.cancellation_reason && <p className="mt-1 text-xs">Reason: {t.cancellation_reason}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TripTimeline;
