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
    AmbulanceIcon,
  HouseHeart,
} from 'lucide-react';
import { FaBed } from 'react-icons/fa';
import { IoBed, IoExit } from 'react-icons/io5';

type WardView =
  | 'admit'
  | 'admitted'
  | 'discharged'
  | 'referred'

interface WardProps {
  theme: 'light' | 'dark';
}

const Message: React.FC<WardProps> = ({ theme }) => {
  const isDark = theme === 'dark';

  const [activeView, setActiveView] =
    useState<WardView>('admitted');

  const actionButtons: {
    key: WardView;
    label: string;
    icon: React.ReactNode;
  }[] = [
    {
      key: 'admit',
      label: 'Admit',
      icon: <FaBed className="w-4 h-4" />,
    },
    {
      key: 'admitted',
      label: 'Admitted',
      icon: <IoBed className="w-4 h-4" />,
    },
    {
      key: 'discharged',
      label: 'Discharged',
      icon: <IoExit className="w-4 h-4" />,
    },
    {
      key: 'referred',
      label: 'Referred',
      icon: <AmbulanceIcon className="w-4 h-4" />,
    },
   
  ];

  const renderActivePanel = () => {
    switch (activeView) {
      case 'admit':
        return <PlaceholderPanel title="Admitted A Patient." />;

      case 'admitted':
        return <PlaceholderPanel title="Admiited Patients." />;

      case 'discharged':
        return <PlaceholderPanel title="Discharged Patients." />;

      case 'referred':
        return <PlaceholderPanel title="Patients Referred to other Facilities." />;
      default:
        return <PlaceholderPanel title="Admitted A Patient." />;
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
          <HouseHeart className="w-6 h-6" />
        Manage Patients in the ward.
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

export default Message;

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
