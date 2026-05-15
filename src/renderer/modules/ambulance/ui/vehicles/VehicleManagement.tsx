import { useLocation } from 'react-router-dom';
import { AMBULANCE_ROUTES } from '../../../../app/routes/routeConstants';
import VehicleList from './views/VehicleList';
import VehicleCreate from './views/VehicleCreate';
import VehicleEdit from './views/VehicleEdit';
import VehicleDetail from './views/VehicleDetail';
import VehicleServiceSchedule from './views/VehicleServiceSchedule';

interface VehicleManagementProps {
  theme: 'light' | 'dark';
}

const VehicleManagement = ({ theme }: VehicleManagementProps) => {
  const location = useLocation();
  const path = location.pathname;

  if (
    path === AMBULANCE_ROUTES.FLEET_VEHICLES_ALL ||
    path === AMBULANCE_ROUTES.FLEET_VEHICLES
  ) {
    return <VehicleList theme={theme} />;
  }
  if (path === AMBULANCE_ROUTES.FLEET_VEHICLES_CREATE) return <VehicleCreate theme={theme} />;
  if (path === AMBULANCE_ROUTES.FLEET_VEHICLES_SERVICE_SCHEDULE) {
    return <VehicleServiceSchedule theme={theme} />;
  }
  if (path.match(/\/fleet\/vehicles\/[\w-]{8,}\/edit/)) return <VehicleEdit theme={theme} />;
  if (path.match(/\/fleet\/vehicles\/[\w-]{8,}$/)) return <VehicleDetail theme={theme} />;

  return <VehicleList theme={theme} />;
};

export default VehicleManagement;
