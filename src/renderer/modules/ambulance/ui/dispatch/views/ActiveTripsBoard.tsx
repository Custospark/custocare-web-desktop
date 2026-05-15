import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Activity, Clock, MapPin, ArrowRight, PlusCircle } from 'lucide-react';
import { useActiveTrips } from '../../../api/ambulance-trips/useAmbulanceTripQueries';
import { setActiveTrip } from '../../../../../app/store/slices/tripSlice';
import TripStatusStepper from '../components/TripStatusStepper';
import TripPriorityBadge from '../components/TripPriorityBadge';
import type { AmbulanceTrip } from '../../../api/ambulance-trips/ambulanceTripTypes';

interface ActiveTripsBoardProps { theme: 'light' | 'dark'; }

const ActiveTripsBoard = ({ theme }: ActiveTripsBoardProps) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isDark = theme === 'dark';
  const { data, isLoading } = useActiveTrips();
  const trips = data?.data ?? [];

  const handleTakeAction = (trip: AmbulanceTrip) => {
    dispatch(setActiveTrip({ trip }));
    navigate(`/ambulance/trip-workspace`);
  };

  if (isLoading) return <div className="flex justify-center p-12"><Clock className="h-6 w-6 animate-spin" /></div>;
  if (trips.length === 0) return (
    <div className="flex flex-col items-center p-12">
      <Activity className={`mb-3 h-10 w-10 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
      <p className={`mb-6 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>No active trips</p>
      <button onClick={() => navigate('/ambulance/dispatch/new-trip')}
        className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-blue-700">
        <PlusCircle className="h-4 w-4" /> Create New Trip
      </button>
    </div>
  );

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {trips.map((t: AmbulanceTrip) => (
        <div key={t.id}
          className={`rounded-xl border p-4 ${isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'}`}>
          <div className="mb-2 flex items-start justify-between">
            <TripPriorityBadge priority={t.priority} isDark={isDark} />
            <span className={`text-xs font-medium capitalize ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t.trip_type.replace(/_/g, ' ')}</span>
          </div>
          <TripStatusStepper status={t.status} isDark={isDark} />
          <div className="mt-3 space-y-1 text-sm">
            <div className="flex items-start gap-2"><MapPin className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} /><span className="line-clamp-1">{t.pickup_location ?? 'N/A'}</span></div>
            <div className="flex items-start gap-2"><MapPin className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} /><span className="line-clamp-1">{t.destination_location ?? 'N/A'}</span></div>
          </div>
          <button onClick={() => handleTakeAction(t)}
            className="mt-3 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-all hover:bg-blue-700">
            <ArrowRight className="h-4 w-4" /> Take Action
          </button>
        </div>
      ))}
    </div>
  );
};

export default ActiveTripsBoard;
