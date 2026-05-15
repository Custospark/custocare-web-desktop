import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Truck, Wrench, Calendar, Gauge } from 'lucide-react';
import { useAmbulance, useDeleteAmbulance } from '../../../api/ambulances/useAmbulanceQueries';
import { AMBULANCE_ROUTES } from '../../../../../app/routes/routeConstants';
import VehicleStatusBadge from '../components/VehicleStatusBadge';
import VehicleTypeIcon from '../components/VehicleTypeIcon';
import { useToast } from '../../../../../app/store/contexts/toast/useToast';

interface VehicleDetailProps { theme: 'light' | 'dark'; }

const VehicleDetail = ({ theme }: VehicleDetailProps) => {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const isDark = theme === 'dark';
  const { showToast } = useToast();
  const { data, isLoading } = useAmbulance(uuid!);
  const deleteMutation = useDeleteAmbulance();
  const v = data?.data;

  if (isLoading) return <div className="flex justify-center p-12"><div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" /></div>;
  if (!v) return <div className={`p-12 text-center text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Ambulance not found</div>;

  const statCard = (icon: React.ReactNode, label: string, value: string) => (
    <div className={`rounded-lg border p-4 ${isDark ? 'border-gray-800 bg-gray-800/50' : 'border-gray-100 bg-gray-50'}`}>
      <div className="mb-1 flex items-center gap-2">
        <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>{icon}</span>
        <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{label}</span>
      </div>
      <p className="text-lg font-bold">{value}</p>
    </div>
  );

  return (
    <div className={`min-h-screen p-6 ${isDark ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      <div className="mx-auto max-w-3xl">
        <button onClick={() => navigate(AMBULANCE_ROUTES.VEHICLES_ALL)}
          className={`mb-6 inline-flex cursor-pointer items-center gap-2 text-sm font-medium ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900'}`}>
          <ArrowLeft className="h-4 w-4" /> Back to fleet
        </button>

        <div className={`rounded-xl border p-6 ${isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'}`}>
          <div className="mb-6 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`rounded-lg p-3 ${isDark ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
                <Truck className={`h-6 w-6 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{v.vehicle_identifier}</h1>
                <div className="mt-1 flex items-center gap-2">
                  <VehicleTypeIcon type={v.vehicle_type} isDark={isDark} />
                  <VehicleStatusBadge status={v.status} isDark={isDark} />
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => navigate(`/ambulance/admin/vehicles/${uuid}/edit`)}
                className="cursor-pointer rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700">Edit</button>
              <button onClick={async () => {
                if (confirm(`Delete ${v.vehicle_identifier}?`)) {
                  try { await deleteMutation.mutateAsync(uuid!); showToast('success', 'Deleted'); navigate(AMBULANCE_ROUTES.VEHICLES_ALL); }
                  catch { showToast('error', 'Delete failed'); }
                }
              }} className="cursor-pointer rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-100">Delete</button>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            {statCard(<Gauge className="h-4 w-4" />, 'Mileage', `${v.current_mileage?.toLocaleString() ?? 'N/A'} mi`)}
            {statCard(<Truck className="h-4 w-4" />, 'Capacity', `${v.capacity} patients`)}
            {statCard(<Calendar className="h-4 w-4" />, 'Last Service', v.last_service_date ? new Date(v.last_service_date).toLocaleDateString() : 'N/A')}
            {statCard(<Wrench className="h-4 w-4" />, 'Service Due', v.next_service_due_date ? new Date(v.next_service_due_date).toLocaleDateString() : 'N/A')}
          </div>

          <div className={`rounded-lg border p-4 ${isDark ? 'border-gray-800 bg-gray-800/30' : 'border-gray-100 bg-gray-50'}`}>
            <h3 className={`mb-3 text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Equipment & Features</h3>
            {v.equipment_level && (
              <p className={`mb-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                <span className="font-medium">Level:</span> {v.equipment_level}
              </p>
            )}
            {v.features && v.features.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {v.features.map((f, i) => (
                  <span key={i} className={`rounded-md border px-2 py-0.5 text-xs font-medium ${isDark ? 'border-gray-700 bg-gray-800 text-gray-300' : 'border-gray-200 bg-white text-gray-600'}`}>
                    {f}
                  </span>
                ))}
              </div>
            ) : <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>No features recorded</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleDetail;
