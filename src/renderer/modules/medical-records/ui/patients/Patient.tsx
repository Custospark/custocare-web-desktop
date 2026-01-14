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
  FileText,
  UserMinus,
  UserPlus,
  SearchCheckIcon,
} from 'lucide-react';

type Patients =
  | 'search_patient'
  | 'create_patient'
  | 'discharge_patient';

interface PatientsProps {
  theme: 'light' | 'dark';
}

const Prescriptions: React.FC<PatientsProps> = ({ theme }) => {
  const isDark = theme === 'dark';

  const [activeView, setActiveView] =
    useState<Patients>('search_patient');

  const actionButtons: {
    key: Patients;
    label: string;
    icon: React.ReactNode;
  }[] = [
    {
      key: 'search_patient',
      label: 'Search Patients',
      icon: <SearchCheckIcon className="w-4 h-4" />,
    },
    {
      key: 'create_patient',
      label: 'New Patient Record',
      icon: <UserPlus className="w-4 h-4" />,
    },
    {
      key: 'discharge_patient',
      label: 'Discharge Patient',
      icon: <UserMinus className="w-4 h-4" />,
    },
  ];

  const renderActivePanel = () => {
    switch (activeView) {
      case 'search_patient':
        return <PlaceholderPanel title="Search Patient" />;

      case 'create_patient':
        return <PlaceholderPanel title="Create New Patient Record." />;

      case 'discharge_patient':
        return <PlaceholderPanel title="Discharge Patient." />;
      default:
        return <PlaceholderPanel title="Search Patient" />;
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
          <FileText className="w-6 h-6" />
          Patients Records
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
