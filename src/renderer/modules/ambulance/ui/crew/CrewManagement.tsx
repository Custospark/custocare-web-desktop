import { useLocation } from 'react-router-dom';
import { AMBULANCE_ROUTES } from '../../../../app/routes/routeConstants';
import CrewList from './views/CrewList';
import CrewAssign from './views/CrewAssign';
import CrewSchedule from './views/CrewSchedule';

interface CrewManagementProps { theme: 'light' | 'dark'; }

const CrewManagement = ({ theme }: CrewManagementProps) => {
  const location = useLocation();
  const path = location.pathname;

  if (path === AMBULANCE_ROUTES.FLEET_CREW_ASSIGN) return <CrewAssign theme={theme} />;
  if (path === AMBULANCE_ROUTES.FLEET_CREW_BY_STAFF) return <CrewSchedule theme={theme} />;

  return <CrewList theme={theme} />;
};

export default CrewManagement;
