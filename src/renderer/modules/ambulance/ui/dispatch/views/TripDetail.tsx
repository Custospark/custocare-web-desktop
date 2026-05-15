import { useNavigate, useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { MapPin, Clock, Calendar, Navigation, Activity, FileText, PlusCircle, Search, Users, ArrowRight, Truck } from 'lucide-react';
import { useTrip, useDispatchTrip, useMarkEnRoute, useMarkOnScene, useMarkPatientContact, useMarkDepartScene, useMarkAtDestination, useCompleteTrip, useCancelTrip } from '../../../api/ambulance-trips/useAmbulanceTripQueries';
import type { AmbulanceTrip } from '../../../api/ambulance-trips/ambulanceTripTypes';
import { AMBULANCE_ROUTES } from '../../../../../app/routes/routeConstants';
import { setActiveTrip, updateActiveTripStatus, selectActiveTrip, selectHasActiveTrip, clearActiveTrip } from '../../../../../app/store/slices/tripSlice';
import { BaseActionWorkspace } from '../../../../../shared/components/workspace/BaseActionWorkspace';
import TripStatusStepper from '../components/TripStatusStepper';
import TripPriorityBadge from '../components/TripPriorityBadge';
import TripTypeIcon from '../components/TripTypeIcon';
import { useToast } from '../../../../../app/store/contexts/toast/useToast';
import { useState, useEffect } from 'react';

interface TripDetailProps { theme: 'light' | 'dark'; }

const TripDetail = ({ theme }: TripDetailProps) => {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isDark = theme === 'dark';
  const { showToast } = useToast();
  const activeTrip = useSelector(selectActiveTrip);
  const hasActiveTrip = useSelector(selectHasActiveTrip);

  // If we have a URL param, fetch from API; otherwise read from slice
  const queryUuid = uuid ?? '';
  const { data, isLoading } = useTrip(queryUuid);
  const t = queryUuid ? (data?.data ?? null) : activeTrip;
  const [cancelReason, setCancelReason] = useState('');

  // If no active trip in slice but we have API data, set it
  useEffect(() => {
    if (data?.data && (!hasActiveTrip || data.data.trip_uuid !== activeTrip?.trip_uuid)) {
      dispatch(setActiveTrip({ trip: data.data }));
    }
  }, [data, activeTrip?.trip_uuid, hasActiveTrip, dispatch]);

  const dispatchMut = useDispatchTrip();
  const enRouteMut = useMarkEnRoute();
  const onSceneMut = useMarkOnScene();
  const patientContactMut = useMarkPatientContact();
  const departSceneMut = useMarkDepartScene();
  const atDestMut = useMarkAtDestination();
  const completeMut = useCompleteTrip();
  const cancelMut = useCancelTrip();

  if (isLoading) return <div className="flex justify-center p-12"><div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" /></div>;
  if (!t) return (
    <div className={`flex items-center justify-center p-8 ${isDark ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-2xl text-center">
        <div className={`mb-4 inline-flex rounded-full p-4 ${isDark ? 'bg-gray-800' : 'bg-white shadow-sm'}`}>
          <Truck className={`h-12 w-12 ${isDark ? 'text-blue-400' : 'text-blue-500'}`} />
        </div>
        <h2 className="mb-3 text-2xl font-bold">No active trip</h2>
        <p className={`mb-6 text-base ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Start from the active trips board, create a new dispatch, or search history to load a trip into this workspace.
        </p>
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <button type="button" onClick={() => navigate(AMBULANCE_ROUTES.DISPATCH_ACTIVE_BOARD)}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white transition-all hover:bg-blue-700">
            <Activity className="h-4 w-4" />
            Active trips board
          </button>
          <button type="button" onClick={() => navigate(AMBULANCE_ROUTES.DISPATCH_NEW_TRIP)}
            className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border px-5 py-2.5 font-semibold transition-all ${
              isDark ? 'border-gray-700 bg-gray-800 text-white hover:bg-gray-700' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            }`}>
            <PlusCircle className="h-4 w-4" />
            New trip request
          </button>
          <button type="button" onClick={() => navigate(AMBULANCE_ROUTES.DISPATCH_TRIP_HISTORY)}
            className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border px-5 py-2.5 font-semibold transition-all ${
              isDark ? 'border-gray-700 bg-gray-800 text-white hover:bg-gray-700' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            }`}>
            <Search className="h-4 w-4" />
            Trip history
          </button>
        </div>
      </div>
    </div>
  );

  const isTerminal = t.status === 'completed' || t.status === 'cancelled';

  const timelineSteps = [
    { key: 'dispatched', label: 'Dispatched', time: t.dispatched_at, action: () => dispatchMut.mutateAsync({ uuid: uuid! }) },
    { key: 'en_route', label: 'En Route', time: t.en_route_at, action: () => enRouteMut.mutateAsync(uuid!) },
    { key: 'on_scene', label: 'On Scene', time: t.on_scene_at, action: () => onSceneMut.mutateAsync(uuid!) },
    { key: 'patient_contact', label: 'Patient Contact', time: t.patient_contact_at, action: () => patientContactMut.mutateAsync(uuid!) },
    { key: 'depart_scene', label: 'Depart Scene', time: t.depart_scene_at, action: () => departSceneMut.mutateAsync(uuid!) },
    { key: 'at_destination', label: 'At Destination', time: t.at_destination_at, action: () => atDestMut.mutateAsync(uuid!) },
    { key: 'completed', label: 'Completed', time: t.completed_at, action: () => completeMut.mutateAsync(uuid!) },
  ];

  const currentIdx = timelineSteps.findIndex(s => s.key === t.status);
  const nextStep = currentIdx < timelineSteps.length - 1 ? timelineSteps[currentIdx + 1] : null;

  const handleStatusTransition = async (step: typeof timelineSteps[0]) => {
    try {
      await step.action();
      const statusMap: Record<string, Partial<AmbulanceTrip>> = {
        dispatched: { status: 'dispatched', dispatched_at: new Date().toISOString() },
        en_route: { status: 'en_route', en_route_at: new Date().toISOString() },
        on_scene: { status: 'on_scene', on_scene_at: new Date().toISOString() },
        patient_contact: { status: 'transporting', patient_contact_at: new Date().toISOString() },
        depart_scene: { depart_scene_at: new Date().toISOString() },
        at_destination: { status: 'at_destination', at_destination_at: new Date().toISOString() },
        completed: { status: 'completed', completed_at: new Date().toISOString() },
      };
      const update = statusMap[step.key];
      if (update) dispatch(updateActiveTripStatus(update));
      showToast('success', `Marked as ${step.label}`);
    } catch { showToast('error', 'Update failed'); }
  };

  const handleCancel = async () => {
    try {
      await cancelMut.mutateAsync({ uuid: uuid!, reason: cancelReason || undefined });
      dispatch(updateActiveTripStatus({ status: 'cancelled', cancelled_at: new Date().toISOString(), cancellation_reason: cancelReason || null }));
      showToast('success', 'Trip cancelled');
    } catch { showToast('error', 'Failed to cancel'); }
  };

  const handleWorkOnAnotherTrip = () => {
    dispatch(clearActiveTrip());
    navigate(AMBULANCE_ROUTES.DISPATCH_ACTIVE_BOARD);
  };

  const formatTime = (time: string | null) => time ? new Date(time).toLocaleString() : '—';

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="container mx-auto p-4 lg:p-6">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-6">
          {/* Trip Info Card — left sidebar */}
          <div className="lg:col-span-4 xl:col-span-3">
            <TripInfoCard
              theme={theme}
              trip={t}
              onWorkOnAnotherTrip={handleWorkOnAnotherTrip}
              cancelReason={cancelReason}
              setCancelReason={setCancelReason}
              onCancel={handleCancel}
              isTerminal={isTerminal}
              cancelPending={cancelMut.isPending}
            />
          </div>

          {/* Main workspace — right content */}
          <div className="lg:col-span-8 xl:col-span-9">
            <BaseActionWorkspace
              title="Trip management workflow"
              icon={<Navigation className="h-6 w-6" />}
              theme={theme}
              defaultActionTo={`/ambulance/trip-workspace`}
              actions={[
                {
                  key: 'overview',
                  label: 'Trip Overview',
                  icon: <Activity className="h-4 w-4" />,
                  to: `/ambulance/trip-workspace`,
                },
                {
                  key: 'timeline',
                  label: 'Timeline',
                  icon: <Clock className="h-4 w-4" />,
                  to: `/ambulance/trip-workspace/timeline`,
                  description: 'View the full status history and response times',
                },
                {
                  key: 'logs',
                  label: 'Trip Logs',
                  icon: <FileText className="h-4 w-4" />,
                  to: `/ambulance/trip-workspace/logs`,
                  description: 'Clinical notes and event log entries',
                },
              ]}
            />

            {/* Main content — status stepper + next action + route info */}
            <div className="mt-6 space-y-6">
              {/* Status stepper */}
              <div className={`rounded-xl border p-5 ${isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'}`}>
                <TripStatusStepper status={t.status} isDark={isDark} />

                {!isTerminal && nextStep && (
                  <div className="mt-4 flex justify-center">
                    <button onClick={() => handleStatusTransition(nextStep)}
                      className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-blue-700">
                      <ArrowRight className="h-4 w-4" />
                      Mark as {nextStep.label}
                    </button>
                  </div>
                )}
              </div>

              {/* Route info */}
              <div className={`rounded-xl border p-5 ${isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'}`}>
                <h3 className={`mb-4 text-sm font-semibold uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Route</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className={`rounded-lg p-2 ${isDark ? 'bg-green-900/20' : 'bg-green-50'}`}>
                      <MapPin className={`h-4 w-4 text-green-500`} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-green-500">Pickup</p>
                      <p className="text-sm">{t.pickup_location ?? 'Not specified'}</p>
                      {t.pickup_facility_id && <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Facility ID: {t.pickup_facility_id}</p>}
                    </div>
                  </div>
                  <div className="ml-4 h-4 w-0.5 border-l-2 border-dashed border-gray-300" />
                  <div className="flex items-start gap-3">
                    <div className={`rounded-lg p-2 ${isDark ? 'bg-red-900/20' : 'bg-red-50'}`}>
                      <MapPin className={`h-4 w-4 text-red-500`} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-red-500">Destination</p>
                      <p className="text-sm">{t.destination_location ?? 'Not specified'}</p>
                      {t.destination_facility_id && <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Facility ID: {t.destination_facility_id}</p>}
                    </div>
                  </div>
                </div>
                {t.dispatch_notes && (
                  <div className={`mt-4 rounded-lg border p-3 ${isDark ? 'border-gray-800 bg-gray-800/30' : 'border-gray-100 bg-gray-50'}`}>
                    <p className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Dispatch Notes</p>
                    <p className={`mt-1 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{t.dispatch_notes}</p>
                  </div>
                )}
              </div>

              {/* Timeline times */}
              <div className={`rounded-xl border p-5 ${isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'}`}>
                <h3 className={`mb-4 text-sm font-semibold uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Timeline</h3>
                <div className="space-y-3">
                  {timelineSteps.map(step => (
                    <div key={step.key} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${step.time ? 'bg-green-500' : isDark ? 'bg-gray-700' : 'bg-gray-200'}`} />
                        <span className={`text-sm ${step.key === t.status ? 'font-semibold text-blue-500' : isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {step.label}
                        </span>
                      </div>
                      <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{formatTime(step.time)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── Trip Info Card ──────────────────────────────────────────────────── */

interface TripInfoCardProps {
  theme: 'light' | 'dark';
  trip: AmbulanceTrip;
  onWorkOnAnotherTrip: () => void;
  cancelReason: string;
  setCancelReason: (v: string) => void;
  onCancel: () => void;
  isTerminal: boolean;
  cancelPending: boolean;
}

const TripInfoCard = ({ theme, trip, onWorkOnAnotherTrip, cancelReason, setCancelReason, onCancel, isTerminal, cancelPending }: TripInfoCardProps) => {
  const isDark = theme === 'dark';

  const statRow = (icon: React.ReactNode, label: string, value: string) => (
    <div className="flex items-start gap-2">
      <span className={`mt-0.5 shrink-0 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{icon}</span>
      <div className="min-w-0">
        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{label}</p>
        <p className="truncate text-xs font-medium">{value}</p>
      </div>
    </div>
  );

  return (
    <div className={`sticky top-6 overflow-hidden rounded-xl border ${isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'}`}>
      <div className={`border-b p-4 ${isDark ? 'border-gray-800 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
        <div className="flex items-center gap-3">
          <div className={`rounded-lg p-2 ${isDark ? 'bg-blue-600/20' : 'bg-blue-50'}`}>
            <Navigation className={`h-5 w-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-center text-sm font-semibold uppercase tracking-wide">Current Trip</h3>
          </div>
        </div>
      </div>

      <div className="space-y-3 p-4">
        <div className="flex items-center justify-between">
          <TripPriorityBadge priority={trip.priority} isDark={isDark} />
          <TripTypeIcon type={trip.trip_type} isDark={isDark} />
        </div>
        <TripStatusStepper status={trip.status} isDark={isDark} />

        <div className={`border-t ${isDark ? 'border-gray-800' : 'border-gray-200'}`} />

        <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
          {statRow(<Calendar className="h-3.5 w-3.5" />, 'Trip UUID', trip.trip_uuid.slice(0, 8) + '...')}
          {statRow(<Clock className="h-3.5 w-3.5" />, 'Created', trip.created_at ? new Date(trip.created_at).toLocaleDateString() : 'N/A')}
          {statRow(<MapPin className="h-3.5 w-3.5" />, 'Pickup', trip.pickup_location ?? 'N/A')}
          {statRow(<MapPin className="h-3.5 w-3.5" />, 'Destination', trip.destination_location ?? 'N/A')}
          {trip.mileage != null && statRow(<Navigation className="h-3.5 w-3.5" />, 'Mileage', `${trip.mileage} mi`)}
          {trip.estimated_duration_minutes != null && statRow(<Clock className="h-3.5 w-3.5" />, 'Est. Duration', `${trip.estimated_duration_minutes} min`)}
        </div>
      </div>

      <div className={`space-y-2 border-t p-4 ${isDark ? 'border-gray-800 bg-gray-800/30' : 'border-gray-200 bg-gray-50'}`}>
        {!isTerminal && (
          <div className="mb-3 space-y-2">
            <input className={`w-full rounded-lg border px-3 py-2 text-sm outline-none ${isDark ? 'border-gray-700 bg-gray-800 text-gray-100' : 'border-gray-200 text-gray-900'}`}
              placeholder="Cancellation reason (optional)" value={cancelReason} onChange={e => setCancelReason(e.target.value)} />
            <button onClick={onCancel} disabled={cancelPending}
              className="inline-flex w-full cursor-pointer items-center justify-center rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50">
              Cancel Trip
            </button>
          </div>
        )}
        <button onClick={onWorkOnAnotherTrip}
          className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-blue-700">
          <ArrowRight className="h-4 w-4" />
          Work on another trip
        </button>
      </div>
    </div>
  );
};

export default TripDetail;
