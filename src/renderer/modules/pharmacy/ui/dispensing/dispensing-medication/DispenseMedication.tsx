// DispenseMedication.tsx
/**
 * ============================================================================
 * DISPENSE MEDICATION - MAIN COMPONENT
 * ============================================================================
 * Four entry points: Customer Walk-in, Patient Search, Quick Create, Queue
 */

import React from 'react';
import { UserPlus, Search, Zap, Users } from 'lucide-react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { PHARMACY_ROUTES } from '../../../../../app/routes/routeConstants';

interface DispenseMedicationProps {
  theme: 'light' | 'dark';
}

type EntryPoint = 'walk-in' | 'patient-search' | 'quick-create' | 'queue';

interface EntryPointConfig {
  key: EntryPoint;
  label: string;
  icon: React.ReactNode;
  to: string;
  description: string;
}

const DispenseMedication: React.FC<DispenseMedicationProps> = ({ theme }) => {
  const isDark = theme === 'dark';
  const navigate = useNavigate();
  const location = useLocation();

  const entryPoints: EntryPointConfig[] = [
    {
      key: 'walk-in',
      label: 'Customer Walk-in',
      icon: <UserPlus className="w-5 h-5" />,
      to: PHARMACY_ROUTES.WALKIN_PATIENT,
      description: 'Create system-generated user & visit',
    },
    {
      key: 'patient-search',
      label: 'Patient Search',
      icon: <Search className="w-5 h-5" />,
      to: PHARMACY_ROUTES.PATIENTS_SEARCH,
      description: 'Search by patient number',
    },
    {
      key: 'quick-create',
      label: 'Quick Patient Create',
      icon: <Zap className="w-5 h-5" />,
      to: PHARMACY_ROUTES.PATIENTS_REGISTER,
      description: 'Fast patient registration',
    },
    {
      key: 'queue',
      label: 'Queue',
      icon: <Users className="w-5 h-5" />,
      to: PHARMACY_ROUTES.PATIENT_QUEUE,
      description: 'View pending dispensing queue',
    },
  ];

  const activeEntryPoint = entryPoints.find(
    (ep) => location.pathname === ep.to || location.pathname.startsWith(ep.to + '/')
  )?.key;

  const handleEntryPointClick = (to: string) => {
    navigate(to);
  };

  return (
    <div className="flex gap-4 h-full">
      {/* Left Side Panel - Entry Points */}
      <div
        className={`w-72 flex-shrink-0 rounded-xl border ${
          isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
        }`}
      >
        <div className="p-4 border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}">
          <h3 className="font-semibold text-lg">Start Dispensing</h3>
          <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Choose how to begin
          </p>
        </div>

        <div className="p-3 space-y-2">
          {entryPoints.map((entry) => {
            const isActive = activeEntryPoint === entry.key;

            return (
              <button
                key={entry.key}
                onClick={() => handleEntryPointClick(entry.to)}
                className={`w-full text-left p-4 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg'
                    : isDark
                    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">{entry.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm mb-1">{entry.label}</div>
                    <div
                      className={`text-xs ${
                        isActive
                          ? 'text-blue-100'
                          : isDark
                          ? 'text-gray-500'
                          : 'text-gray-600'
                      }`}
                    >
                      {entry.description}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Help Section */}
        <div className={`p-4 m-3 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-blue-50'}`}>
          <h4 className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
            Quick Guide
          </h4>
          <ul className={`text-xs space-y-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            <li>• Walk-in for unknown customers</li>
            <li>• Search for existing patients</li>
            <li>• Quick create for new patients</li>
            <li>• Queue for pending prescriptions</li>
          </ul>
        </div>
      </div>

      {/* Right Content Area */}
      <div
        className={`flex-1 rounded-xl border overflow-auto ${
          isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
        }`}
      >
        <Outlet context={{ theme }} />
      </div>
    </div>
  );
};

export default DispenseMedication;
