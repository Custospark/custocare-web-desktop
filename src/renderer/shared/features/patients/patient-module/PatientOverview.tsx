import React from 'react';
import { User, Activity, AlertCircle, UserMinus } from 'lucide-react';
import { cn } from '../../../utils/classNameUtils';
import { MOCK_PATIENTS, STATUS_CONFIG } from './types';

/**
 * ============================================================================
 * PATIENT OVERVIEW COMPONENT
 * ============================================================================
 * 
 * Displays patient statistics, quick metrics, and recent activity feed.
 * 
 * Features:
 * - Patient count statistics with gradient cards
 * - Status breakdown (Active, Critical, Discharged)
 * - Recent activity feed with patient details
 * - Responsive grid layout
 * - Theme-aware styling
 */

interface PatientOverviewProps {
  theme: 'light' | 'dark';
}

export const PatientOverview: React.FC<PatientOverviewProps> = ({ theme }) => {
  // Calculate statistics from mock data
  const stats = {
    total: MOCK_PATIENTS.length,
    active: MOCK_PATIENTS.filter(p => p.status === 'Active').length,
    critical: MOCK_PATIENTS.filter(p => p.status === 'Critical').length,
    discharged: MOCK_PATIENTS.filter(p => p.status === 'Discharged').length,
  };

  // Statistics card configuration
  const statCards = [
    {
      label: 'Total Patients',
      value: stats.total.toString(),
      icon: <User className="w-5 h-5" />,
      color: 'from-blue-500 to-cyan-500',
      textColor: 'text-blue-400',
    },
    {
      label: 'Active',
      value: stats.active.toString(),
      icon: <Activity className="w-5 h-5" />,
      color: 'from-emerald-500 to-green-500',
      textColor: 'text-emerald-400',
    },
    {
      label: 'Critical',
      value: stats.critical.toString(),
      icon: <AlertCircle className="w-5 h-5" />,
      color: 'from-red-500 to-rose-500',
      textColor: 'text-red-400',
    },
    {
      label: 'Discharged Today',
      value: stats.discharged.toString(),
      icon: <UserMinus className="w-5 h-5" />,
      color: 'from-purple-500 to-pink-500',
      textColor: 'text-purple-400',
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Page header */}
      <div>
        <h1 className={cn(
          'text-3xl font-bold mb-2',
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        )}>
          Patient Management Overview
        </h1>
        <p className={cn(
          'text-sm',
          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
        )}>
          Quick insights and statistics for patient care management
        </p>
      </div>

      {/* Statistics cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className={cn(
              'relative p-5 rounded-2xl border backdrop-blur-sm',
              'transition-all duration-300 hover:scale-[1.02]',
              theme === 'dark'
                ? 'bg-gradient-to-br from-gray-900/50 to-gray-800/50 border-gray-800/50'
                : 'bg-gradient-to-br from-white/50 to-gray-50/50 border-gray-200/60'
            )}
          >
            <div className={cn(
              'absolute inset-0 rounded-2xl opacity-10',
              `bg-gradient-to-br ${stat.color}`
            )} />
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className={cn(
                  'p-2.5 rounded-xl',
                  theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-100'
                )}>
                  <div className={stat.textColor}>
                    {stat.icon}
                  </div>
                </div>
              </div>
              
              <p className={cn(
                'text-sm mb-1',
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              )}>
                {stat.label}
              </p>
              
              <h3 className={cn(
                'text-3xl font-bold',
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              )}>
                {stat.value}
              </h3>
            </div>
          </div>
        ))}
      </div>

      {/* Recent activity */}
      <div className={cn(
        'rounded-2xl border p-6',
        theme === 'dark'
          ? 'bg-gradient-to-br from-gray-900/50 to-gray-800/50 border-gray-800/50'
          : 'bg-gradient-to-br from-white/50 to-gray-50/50 border-gray-200/60'
      )}>
        <h3 className={cn(
          'text-lg font-semibold mb-4',
          theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
        )}>
          Recent Activity
        </h3>
        
        <div className="space-y-3">
          {MOCK_PATIENTS.slice(0, 3).map((patient) => (
            <div
              key={patient.id}
              className={cn(
                'flex items-center justify-between p-4 rounded-xl transition-colors',
                theme === 'dark'
                  ? 'bg-gray-800/50 hover:bg-gray-800'
                  : 'bg-gray-50 hover:bg-gray-100'
              )}
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm',
                  theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                )}>
                  {patient.name.split(' ').map(n => n[0]).join('')}
                </div>
                
                <div>
                  <p className={cn(
                    'font-medium',
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  )}>
                    {patient.name}
                  </p>
                  <p className={cn(
                    'text-sm',
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  )}>
                    Last visit: {patient.lastVisit}
                  </p>
                </div>
              </div>
              
              <span className={cn(
                'px-3 py-1 text-xs font-bold rounded-full border',
                theme === 'dark'
                  ? STATUS_CONFIG[patient.status].darkClasses
                  : STATUS_CONFIG[patient.status].lightClasses
              )}>
                {patient.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

PatientOverview.displayName = 'PatientOverview';