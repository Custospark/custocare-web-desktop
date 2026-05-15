import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, CheckCircle2, Circle } from 'lucide-react';
import { useActiveVisitTrip } from '../../../api/ambulance-trips/useAmbulanceTripQueries';
import { AMBULANCE_ROUTES } from '../../../../../app/routes/routeConstants';

interface TripTimelineProps {
  theme: 'light' | 'dark';
}

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
  dispatched: 'dispatched_at',
  en_route: 'en_route_at',
  on_scene: 'on_scene_at',
  patient_contact: 'patient_contact_at',
  depart_scene: 'depart_scene_at',
  at_destination: 'at_destination_at',
  completed: 'completed_at',
};

const TripTimeline = ({ theme }: TripTimelineProps) => {
  const navigate = useNavigate();
  const isDark = theme === 'dark';
  const { trip, isLoading } = useActiveVisitTrip();

  if (isLoading) {
    return <div className="flex justify-center p-12"><Clock className="h-6 w-6 animate-spin" /></div>;
  }

  if (!trip) {
    return (
      <div className={`flex flex-col items-center justify-center p-12 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
        <p className="mb-4 text-sm">No transport linked to this visit</p>
        <button
          type="button"
          onClick={() => navigate(AMBULANCE_ROUTES.ACTION_CENTER_TRANSPORT)}
          className="text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          Back to transport status
        </button>
      </div>
    );
  }

  const t = trip;

  return (
    <div className={`p-2 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
      <button
        type="button"
        onClick={() => navigate(AMBULANCE_ROUTES.ACTION_CENTER_TRANSPORT)}
        className={`mb-6 inline-flex cursor-pointer items-center gap-2 text-sm font-medium ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900'}`}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to transport status
      </button>

      <div className={`rounded-xl border p-6 ${isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'}`}>
        <h2 className="mb-6 text-xl font-bold">Trip timeline</h2>
        <div className="relative">
          {STEPS.map((step, i) => {
            const field = FIELD_MAP[step.key] ?? null;
            const time = field ? (t as unknown as Record<string, string | null>)[field] : null;
            const idx = STEPS.findIndex((s) => s.key === t.status);
            const isActive = idx >= i;
            const isCurrent = step.key === t.status;

            return (
              <div key={step.key} className="flex gap-4 pb-8 last:pb-0">
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full ${
                      isCurrent
                        ? 'bg-blue-500 ring-4 ring-blue-500/20'
                        : isActive
                          ? 'bg-green-500'
                          : isDark
                            ? 'bg-gray-800'
                            : 'bg-gray-100'
                    }`}
                  >
                    {isActive && !isCurrent ? (
                      <CheckCircle2 className="h-4 w-4 text-white" />
                    ) : isCurrent ? (
                      <Clock className="h-4 w-4 text-white" />
                    ) : (
                      <Circle className={`h-4 w-4 ${isDark ? 'text-gray-500' : 'text-gray-300'}`} />
                    )}
                  </div>
                  {i < STEPS.length - 1 && (
                    <div
                      className={`h-full w-0.5 ${isActive && !isCurrent ? 'bg-green-500' : isDark ? 'bg-gray-800' : 'bg-gray-200'}`}
                    />
                  )}
                </div>
                <div className="flex-1 pb-4">
                  <p
                    className={`font-medium ${
                      isCurrent ? 'text-blue-500' : isActive ? 'text-green-500' : isDark ? 'text-gray-400' : 'text-gray-500'
                    }`}
                  >
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
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <p className="font-medium">Cancelled</p>
            <p className="mt-1 text-xs">{new Date(t.cancelled_at).toLocaleString()}</p>
            {t.cancellation_reason && <p className="mt-1 text-xs">Reason: {t.cancellation_reason}</p>}
          </div>
        )}
      </div>
    </div>
  );
};

export default TripTimeline;
