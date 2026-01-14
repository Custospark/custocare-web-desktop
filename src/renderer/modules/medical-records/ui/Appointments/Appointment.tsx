/**
 * ============================================================================
 * PRESCRIPTIONS WORKSPACE COMPONENT
 * ============================================================================
 *
 * Internal, state-driven prescription management workspace.
 * No routing. No navigation. Conditional rendering only.
 *
 * This is a logic prototype — panels are placeholders.
 */

import React, { useState } from 'react';
import {
  Search,
  Calendar1,
  CalendarCheck2Icon,
  CalendarDays,
} from 'lucide-react';

type Appointments =
  | 'search_appointments'
  | 'new_appointment'
  | 'scheduled_appointments';

interface AppointmentProps {
  theme: 'light' | 'dark';
}

const Prescriptions: React.FC<AppointmentProps> = ({ theme }) => {
  const isDark = theme === 'dark';

  const [activeView, setActiveView] =
    useState<Appointments>('search_appointments');

  const actionButtons: {
    key: Appointments;
    label: string;
    icon: React.ReactNode;
  }[] = [
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
  ];

  const renderActivePanel = () => {
    switch (activeView) {
      case 'search_appointments':
        return <PlaceholderPanel title="Search Patient" />;

      case 'new_appointment':
        return <PlaceholderPanel title="New Appointment." />;

      case 'scheduled_appointments':
        return <PlaceholderPanel title="Scheduled Appointments." />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div
        className={`rounded-xl p-6 border ${
          isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
        }`}
      >
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <CalendarDays className="w-6 h-6" />
          Appointments Records
        </h2>

        {/* Action Tabs */}
        <div className="flex flex-wrap gap-2 mt-4">
          {actionButtons.map((action) => {
            const isActive = activeView === action.key;

            return (
              <button
                key={action.key}
                onClick={() => setActiveView(action.key)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
                  ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : isDark
                      ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
              >
                {action.icon}
                {action.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Panel */}
      <div
        className={`rounded-xl p-6 border min-h-[300px] ${
          isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
        }`}
      >
        {renderActivePanel()}
      </div>
    </div>
  );
};

export default Prescriptions;

/**
 * ============================================================================
 * PLACEHOLDER PANEL (TEMPORARY)
 * ============================================================================
 */

const PlaceholderPanel: React.FC<{ title: string }> = ({ title }) => {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center">
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-gray-500">
        This is a temporary placeholder.
        <br />
        Replace with the actual component when ready.
      </p>
    </div>
  );
};
