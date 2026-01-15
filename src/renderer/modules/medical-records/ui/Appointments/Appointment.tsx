/**
 * ============================================================================
 * INVENTORY MODULE (REWRITTEN)
 * ============================================================================
 */

import {
 Search,
  Calendar1,
  CalendarCheck2Icon,
  CalendarDays,
} from 'lucide-react';

import { BaseActionWorkspace } from '../../../../shared/components/workspace/BaseActionWorkspace';
type AppointmentAction =
   | 'search_appointments'
  | 'new_appointment'
  | 'scheduled_appointments';

interface AppointmentProps {
  theme: 'light' | 'dark';
}

const Appointments: React.FC<AppointmentProps> = ({ theme }) => {
  return (
    <BaseActionWorkspace<AppointmentAction>
      title="Appointments Records"
      icon={<CalendarDays className="w-6 h-6" />}
      theme={theme}
      defaultAction="search_appointments"
      moduleId="appointments"

      actions={[
      {
            key: 'search_appointments',
            label: 'Search Appointments',
            icon: <Search className="w-4 h-4" />,
          },
          {
            key: 'new_appointment',
            label: 'New Appointment',
            icon: <Calendar1 className="w-4 h-4" />,
          },
          {
            key: 'scheduled_appointments',
            label: 'Scheduled Appointments',
            icon: <CalendarCheck2Icon className="w-4 h-4" />,
          },
      ]}
      renderAction={(action) => {
        switch (action) {
        case 'search_appointments':
        return <PlaceholderPanel title="Search Appointmemts" />;

        case 'new_appointment':
            return <PlaceholderPanel title="New Appointment." />;

        case 'scheduled_appointments':
            return <PlaceholderPanel title="Scheduled Appointments." />;
        default:
        return <PlaceholderPanel title="Search Appointmemts" />;
        }
      }}
    />
  );
};

export default Appointments;

const PlaceholderPanel: React.FC<{ title: string }> = ({ title }) => (
  <div className="h-full flex flex-col items-center justify-center text-center">
    <h3 className="text-lg font-semibold mb-2">{title}</h3>
    <p className="text-sm text-gray-500">
      Temporary placeholder. Replace with real implementation.
    </p>
  </div>
);
