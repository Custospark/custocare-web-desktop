import React from 'react';
import { CalendarDays, CalendarPlus, Search, CalendarCheck, Clock, Calendar } from 'lucide-react';
import { BaseActionWorkspace } from '../../../../shared/components/workspace/BaseActionWorkspace';
import { CLINICAL_ROUTES } from '../../../../app/routes/routeConstants';

interface AppointmentProps {
  theme: 'light' | 'dark';
}

const Appointments: React.FC<AppointmentProps> = ({ theme }) => {
  return (
    <BaseActionWorkspace
      title="Appointments"
      icon={<CalendarDays className="w-6 h-6" />}
      theme={theme}
      defaultActionTo={CLINICAL_ROUTES.APPOINTMENTS_SCHEDULE}
      actions={[
        { 
          key: 'schedule', 
          label: 'Schedule Appointment', 
          icon: <CalendarPlus className="w-4 h-4" />, 
          to: CLINICAL_ROUTES.APPOINTMENTS_SCHEDULE 
        },
        { 
          key: 'today', 
          label: "Today's Appointments", 
          icon: <CalendarCheck className="w-4 h-4" />, 
          to: CLINICAL_ROUTES.APPOINTMENTS_TODAY 
        },
        { 
          key: 'upcoming', 
          label: 'Upcoming Appointments', 
          icon: <Clock className="w-4 h-4" />, 
          to: CLINICAL_ROUTES.APPOINTMENTS_UPCOMING 
        },
        { 
          key: 'past', 
          label: 'Past Appointments', 
          icon: <CalendarDays className="w-4 h-4" />, 
          to: CLINICAL_ROUTES.APPOINTMENTS_PAST 
        },
        { 
          key: 'calendar', 
          label: 'Calendar View', 
          icon: <Calendar className="w-4 h-4" />, 
          to: CLINICAL_ROUTES.APPOINTMENTS_CALENDAR 
        },
        { 
          key: 'search', 
          label: 'Search Appointments', 
          icon: <Search className="w-4 h-4" />, 
          to: `${CLINICAL_ROUTES.APPOINTMENTS}/search` 
        },
      ]}
    />
  );
};

export default Appointments;