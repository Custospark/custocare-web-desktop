import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, ArrowRight, PlusCircle, Clock, FileText, Loader2 } from 'lucide-react';
import {
  useDispatchTrip,
  useMarkEnRoute,
  useMarkOnScene,
  useMarkPatientContact,
  useMarkDepartScene,
  useMarkAtDestination,
  useCompleteTrip,
  useCancelTrip,
  useActiveVisitTrip,
} from '../../api/ambulance-trips/useAmbulanceTripQueries';
import { AMBULANCE_ROUTES } from '../../../../app/routes/routeConstants';
import TripStatusStepper from '../dispatch/components/TripStatusStepper';
import { useToast } from '../../../../app/store/contexts/toast/useToast';

interface VisitTransportStatusProps {
  theme: 'light' | 'dark';
}

const VisitTransportStatus: React.FC<VisitTransportStatusProps> = ({ theme }) => {
  const navigate = useNavigate();
  const isDark = theme === 'dark';
  const { showToast } = useToast();
  const { trip, isLoading, refetch } = useActiveVisitTrip();
  const [cancelReason, setCancelReason] = useState('');

  const dispatchMut = useDispatchTrip();
  const enRouteMut = useMarkEnRoute();
  const onSceneMut = useMarkOnScene();
  const patientContactMut = useMarkPatientContact();
  const departSceneMut = useMarkDepartScene();
  const atDestMut = useMarkAtDestination();
  const completeMut = useCompleteTrip();
  const cancelMut = useCancelTrip();

  if (isLoading) {
    return (
      <div className={`flex justify-center py-12 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className={`rounded-xl border p-8 text-center ${isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'}`}>
        <p className={`mb-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          No transport request is linked to this visit yet.
        </p>
        <button
          type="button"
          onClick={() => navigate(AMBULANCE_ROUTES.ACTION_CENTER_TRANSPORT_REQUEST)}
          className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <PlusCircle className="h-4 w-4" />
          Request transport
        </button>
      </div>
    );
  }

  const uuid = trip.trip_uuid;
  const isTerminal = trip.status === 'completed' || trip.status === 'cancelled';

  const timelineSteps = [
    { key: 'dispatched', label: 'Dispatched', time: trip.dispatched_at, action: () => dispatchMut.mutateAsync({ uuid }) },
    { key: 'en_route', label: 'En Route', time: trip.en_route_at, action: () => enRouteMut.mutateAsync(uuid) },
    { key: 'on_scene', label: 'On Scene', time: trip.on_scene_at, action: () => onSceneMut.mutateAsync(uuid) },
    { key: 'patient_contact', label: 'Patient Contact', time: trip.patient_contact_at, action: () => patientContactMut.mutateAsync(uuid) },
    { key: 'depart_scene', label: 'Depart Scene', time: trip.depart_scene_at, action: () => departSceneMut.mutateAsync(uuid) },
    { key: 'at_destination', label: 'At Destination', time: trip.at_destination_at, action: () => atDestMut.mutateAsync(uuid) },
    { key: 'completed', label: 'Completed', time: trip.completed_at, action: () => completeMut.mutateAsync(uuid) },
  ];

  const currentIdx = timelineSteps.findIndex((s) => s.key === trip.status);
  const nextStep = currentIdx < timelineSteps.length - 1 ? timelineSteps[currentIdx + 1] : null;

  const handleStatusTransition = async (step: (typeof timelineSteps)[0]) => {
    try {
      await step.action();
      await refetch();
      showToast('success', `Marked as ${step.label}`);
    } catch {
      showToast('error', 'Update failed');
    }
  };

  const handleCancel = async () => {
    try {
      await cancelMut.mutateAsync({ uuid, reason: cancelReason || undefined });
      await refetch();
      showToast('success', 'Trip cancelled');
    } catch {
      showToast('error', 'Failed to cancel');
    }
  };

  const formatTime = (time: string | null) => (time ? new Date(time).toLocaleString() : '—');

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => navigate(AMBULANCE_ROUTES.ACTION_CENTER_TRANSPORT_TIMELINE)}
          className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium ${isDark ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
          <Clock className="h-3.5 w-3.5" /> Full timeline
        </button>
        <button type="button" onClick={() => navigate(AMBULANCE_ROUTES.ACTION_CENTER_TRANSPORT_LOGS)}
          className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium ${isDark ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
          <FileText className="h-3.5 w-3.5" /> Trip logs
        </button>
      </div>

      <div className={`rounded-xl border p-5 ${isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'}`}>
        <TripStatusStepper status={trip.status} isDark={isDark} />
        {!isTerminal && nextStep && (
          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={() => handleStatusTransition(nextStep)}
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <ArrowRight className="h-4 w-4" />
              Mark as {nextStep.label}
            </button>
          </div>
        )}
      </div>

      <div className={`rounded-xl border p-5 ${isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'}`}>
        <h3 className={`mb-4 text-sm font-semibold uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Route</h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-green-500">Pickup</p>
              <p className="text-sm">{trip.pickup_location ?? 'Not specified'}</p>
            </div>
          </div>
          <div className="ml-2 h-4 border-l-2 border-dashed border-gray-300" />
          <div className="flex items-start gap-3">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-red-500">Destination</p>
              <p className="text-sm">{trip.destination_location ?? 'Not specified'}</p>
            </div>
          </div>
        </div>
        {trip.dispatch_notes && (
          <div className={`mt-4 rounded-lg border p-3 ${isDark ? 'border-gray-800 bg-gray-800/30' : 'border-gray-100 bg-gray-50'}`}>
            <p className={`text-xs font-semibold uppercase ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Dispatch notes</p>
            <p className={`mt-1 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{trip.dispatch_notes}</p>
          </div>
        )}
      </div>

      <div className={`rounded-xl border p-5 ${isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'}`}>
        <h3 className={`mb-4 text-sm font-semibold uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Timeline</h3>
        <div className="space-y-3">
          {timelineSteps.map((step) => (
            <div key={step.key} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div
                  className={`h-2 w-2 rounded-full ${
                    step.time ? 'bg-green-500' : isDark ? 'bg-gray-700' : 'bg-gray-200'
                  }`}
                />
                <span
                  className={`text-sm ${
                    step.key === trip.status
                      ? 'font-semibold text-blue-500'
                      : isDark
                        ? 'text-gray-400'
                        : 'text-gray-500'
                  }`}
                >
                  {step.label}
                </span>
              </div>
              <span className={`shrink-0 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                {formatTime(step.time)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {!isTerminal && (
        <div className={`rounded-xl border p-4 ${isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'}`}>
          <input
            className={`mb-2 w-full rounded-lg border px-3 py-2 text-sm outline-none ${isDark ? 'border-gray-700 bg-gray-800 text-gray-100' : 'border-gray-200'}`}
            placeholder="Cancellation reason (optional)"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
          />
          <button type="button" onClick={handleCancel} disabled={cancelMut.isPending}
            className="w-full cursor-pointer rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50">
            Cancel transport
          </button>
        </div>
      )}
    </div>
  );
};

export default VisitTransportStatus;
