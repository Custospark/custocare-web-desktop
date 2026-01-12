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
  PlusCircle,
  Search,
  ClipboardList,
  ShieldAlert,
} from 'lucide-react';

type PrescriptionView =
  | 'create_prescription'
  | 'review_prescription'
  | 'search_prescription'
  | 'prescription_queue'
  | 'flagged_prescriptions';

interface PrescriptionsProps {
  theme: 'light' | 'dark';
}

const Prescriptions: React.FC<PrescriptionsProps> = ({ theme }) => {
  const isDark = theme === 'dark';

  const [activeView, setActiveView] =
    useState<PrescriptionView>('prescription_queue');

  const actionButtons: {
    key: PrescriptionView;
    label: string;
    icon: React.ReactNode;
  }[] = [
    {
      key: 'prescription_queue',
      label: 'Prescription Queue',
      icon: <ClipboardList className="w-4 h-4" />,
    },
    {
      key: 'create_prescription',
      label: 'New Prescription',
      icon: <PlusCircle className="w-4 h-4" />,
    },
    {
      key: 'review_prescription',
      label: 'Review Rx',
      icon: <FileText className="w-4 h-4" />,
    },
    {
      key: 'search_prescription',
      label: 'Search Rx',
      icon: <Search className="w-4 h-4" />,
    },
    {
      key: 'flagged_prescriptions',
      label: 'Flagged',
      icon: <ShieldAlert className="w-4 h-4" />,
    },
  ];

  const renderActivePanel = () => {
    switch (activeView) {
      case 'create_prescription':
        return <PlaceholderPanel title="Create New Prescription" />;

      case 'review_prescription':
        return <PlaceholderPanel title="Review Prescription Details" />;

      case 'search_prescription':
        return <PlaceholderPanel title="Search Prescriptions" />;

      case 'flagged_prescriptions':
        return <PlaceholderPanel title="Flagged / Problematic Prescriptions" />;

      case 'prescription_queue':
      default:
        return <PlaceholderPanel title="Prescription Processing Queue" />;
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
          Prescriptions
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
