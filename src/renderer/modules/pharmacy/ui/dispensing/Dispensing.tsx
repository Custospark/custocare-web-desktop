/**
 * ============================================================================
 * DISPENSING WORKSPACE COMPONENT
 * ============================================================================
 *
 * Internal, state-driven dispensing workflow for pharmacy operations.
 * No routing. No navigation. Conditional rendering only.
 *
 * This is a logic prototype — panels are placeholders and can be replaced later.
 */

import React, { useState } from 'react';
import {
  Pill,
  ClipboardCheck,
  Search,
  History,
  AlertCircle,
} from 'lucide-react';

type DispensingView =
  | 'dispense_medication'
  | 'validate_prescription'
  | 'search_prescription'
  | 'dispensing_history'
  | 'issues_queue';

interface DispensingProps {
  theme: 'light' | 'dark';
}

const Dispensing: React.FC<DispensingProps> = ({ theme }) => {
  const isDark = theme === 'dark';

  const [activeView, setActiveView] =
    useState<DispensingView>('dispense_medication');

  const actionButtons: {
    key: DispensingView;
    label: string;
    icon: React.ReactNode;
  }[] = [
    {
      key: 'dispense_medication',
      label: 'Dispense',
      icon: <Pill className="w-4 h-4" />,
    },
    {
      key: 'validate_prescription',
      label: 'Validate Rx',
      icon: <ClipboardCheck className="w-4 h-4" />,
    },
    {
      key: 'search_prescription',
      label: 'Search Rx',
      icon: <Search className="w-4 h-4" />,
    },
    {
      key: 'dispensing_history',
      label: 'History',
      icon: <History className="w-4 h-4" />,
    },
    {
      key: 'issues_queue',
      label: 'Issues',
      icon: <AlertCircle className="w-4 h-4" />,
    },
  ];

  const renderActivePanel = () => {
    switch (activeView) {
      case 'validate_prescription':
        return <PlaceholderPanel title="Validate Prescription" />;

      case 'search_prescription':
        return <PlaceholderPanel title="Search Prescriptions" />;

      case 'dispensing_history':
        return <PlaceholderPanel title="Dispensing History" />;

      case 'issues_queue':
        return <PlaceholderPanel title="Dispensing Issues / Exceptions" />;

      case 'dispense_medication':
      default:
        return <PlaceholderPanel title="Dispense Medication Workflow" />;
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
          <Pill className="w-6 h-6" />
          Dispensing
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

export default Dispensing;

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
