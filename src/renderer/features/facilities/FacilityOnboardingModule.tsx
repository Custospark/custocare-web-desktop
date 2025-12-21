import React, { useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../../store/index';
import { ContentLayout } from '../../components/content/ContentLayout';
import {
  Building2,
  Users,
  GitBranch,
  Building,
  Clock,
  ChevronRight
} from 'lucide-react';
import { cn } from '../../utils/classNameUtils';
// import { setActiveAction } from '../../store/slices/facilitySlice';
import { FACILITY_OPERATIONS } from './constants/operations';
import { FacilityActionId } from './types/onboarding';
import FacilityRegistrationWizard from './components/FacilityRegistrationWizard';
import DepartmentConfigurationWizard from './components/DepartmentConfigurationWizard';
import StaffOnboardingWizard from './components/StaffOnboardingWizard';
import WorkflowCustomizationWizard from './components/WorkflowCustomizationWizard';

export const FacilityOnboardingModule: React.FC = () => {
  const dispatch = useDispatch();
  const theme = useSelector((state: RootState) => state.ui.theme);
  const { facilities } = useSelector((state: RootState) => state.facility);
  
  const [activeAction, setActiveAction] = useState<FacilityActionId>('overview');
  
  const handleOperationChange = useCallback((operationId: string) => {
    setActiveAction(operationId as FacilityActionId);
    // dispatch(setActiveAction(operationId));
  }, [dispatch]);
  
  const renderOverview = () => (
    <div className="p-6 space-y-6">
      {/* Page header */}
      <div>
        <h1 className={cn(
          'text-3xl font-bold mb-2',
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        )}>
          Facility Onboarding & Configuration Hub
        </h1>
        <p className={cn(
          'text-sm',
          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
        )}>
          Enterprise facility management with multi-branch support, dynamic staff allocation, and role-based access control
        </p>
      </div>

      {/* Statistics cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Facilities',
            value: facilities.length.toString(),
            icon: <Building2 className="w-5 h-5" />,
            color: 'from-blue-500 to-cyan-500',
            description: 'Across all organizations'
          },
          {
            label: 'Active Staff',
            value: '24',
            icon: <Users className="w-5 h-5" />,
            color: 'from-emerald-500 to-green-500',
            description: 'Currently assigned'
          },
          {
            label: 'Departments',
            value: '12',
            icon: <Building className="w-5 h-5" />,
            color: 'from-purple-500 to-pink-500',
            description: 'Configured across facilities'
          },
          {
            label: 'Pending Actions',
            value: '3',
            icon: <Clock className="w-5 h-5" />,
            color: 'from-orange-500 to-amber-500',
            description: 'Require attention'
          },
        ].map((stat, index) => (
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
                  <div className={cn(
                    stat.color.includes('blue') ? 'text-blue-400' :
                    stat.color.includes('emerald') ? 'text-emerald-400' :
                    stat.color.includes('purple') ? 'text-purple-400' : 'text-orange-400'
                  )}>
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
              
              <p className={cn(
                'text-xs mt-1',
                theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
              )}>
                {stat.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            Quick Setup Guide
          </h3>
          
          <div className="space-y-4">
            {[
              { step: 1, title: 'Register Facility', description: 'Complete basic registration and license verification', action: 'registration' },
              { step: 2, title: 'Configure Departments', description: 'Set up departments and patient routing', action: 'departments' },
              { step: 3, title: 'Onboard Staff', description: 'Add staff and assign roles/permissions', action: 'staff' },
              { step: 4, title: 'Customize Workflows', description: 'Define patient journeys and approval processes', action: 'workflows' },
            ].map((guide) => (
              <div
                key={guide.step}
                className={cn(
                  'flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all',
                  theme === 'dark'
                    ? 'bg-gray-800/30 hover:bg-gray-800/50'
                    : 'bg-gray-50 hover:bg-gray-100'
                )}
                onClick={() => handleOperationChange(guide.action)}
              >
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm',
                  theme === 'dark' ? 'bg-cyan-500/20 text-cyan-300' : 'bg-blue-100 text-blue-700'
                )}>
                  {guide.step}
                </div>
                <div className="flex-1">
                  <h4 className={cn(
                    'font-medium',
                    theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
                  )}>
                    {guide.title}
                  </h4>
                  <p className={cn(
                    'text-xs mt-1',
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  )}>
                    {guide.description}
                  </p>
                </div>
                <ChevronRight className={cn(
                  'w-4 h-4',
                  theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                )} />
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
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
            Recent Facility Activity
          </h3>
          
          <div className="space-y-4">
            {[
              { facility: 'Metropolitan General', action: 'Department configuration updated', time: '2 hours ago', status: 'completed' },
              { facility: 'City Clinic', action: 'New staff onboarded', time: '1 day ago', status: 'completed' },
              { facility: 'Regional Hospital', action: 'Workflow customization in progress', time: '2 days ago', status: 'in-progress' },
              { facility: 'Community Pharmacy', action: 'Facility registration pending verification', time: '3 days ago', status: 'pending' },
            ].map((activity, index) => (
              <div
                key={index}
                className={cn(
                  'p-4 rounded-xl border',
                  theme === 'dark' ? 'bg-gray-800/30 border-gray-800' : 'bg-gray-50 border-gray-200'
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className={cn(
                    'font-medium',
                    theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
                  )}>
                    {activity.facility}
                  </h4>
                  <span className={cn(
                    'px-2 py-0.5 text-xs rounded',
                    activity.status === 'completed' 
                      ? theme === 'dark' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-700'
                      : activity.status === 'in-progress'
                      ? theme === 'dark' ? 'bg-cyan-500/20 text-cyan-300' : 'bg-blue-100 text-blue-700'
                      : theme === 'dark' ? 'bg-yellow-500/20 text-yellow-300' : 'bg-yellow-100 text-yellow-700'
                  )}>
                    {activity.status}
                  </span>
                </div>
                <p className={cn(
                  'text-sm',
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                )}>
                  {activity.action}
                </p>
                <p className={cn(
                  'text-xs mt-2',
                  theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
                )}>
                  {activity.time}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Multi-Branch Support */}
      <div className={cn(
        'rounded-2xl border p-6',
        theme === 'dark'
          ? 'bg-gradient-to-br from-gray-900/50 to-gray-800/50 border-gray-800/50'
          : 'bg-gradient-to-br from-white/50 to-gray-50/50 border-gray-200/60'
      )}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className={cn(
              'text-lg font-semibold',
              theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
            )}>
              Multi-Branch Organization Support
            </h3>
            <p className={cn(
              'text-sm mt-1',
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            )}>
              Manage multiple facilities under a single organization with shared configuration
            </p>
          </div>
          <div className={cn(
            'px-3 py-1 rounded-lg text-sm font-bold',
            theme === 'dark' ? 'bg-cyan-500/20 text-cyan-300' : 'bg-blue-50 text-blue-700'
          )}>
            Enterprise Feature
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={cn(
            'p-4 rounded-xl',
            theme === 'dark' ? 'bg-gray-800/30' : 'bg-gray-100'
          )}>
            <h4 className={cn(
              'font-medium mb-2 flex items-center gap-2',
              theme === 'dark' ? 'text-cyan-300' : 'text-blue-600'
            )}>
              <Building2 className="w-4 h-4" />
              Shared Configuration
            </h4>
            <p className={cn(
              'text-xs',
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            )}>
              Standardized roles, departments, and workflows across all facilities
            </p>
          </div>
          
          <div className={cn(
            'p-4 rounded-xl',
            theme === 'dark' ? 'bg-gray-800/30' : 'bg-gray-100'
          )}>
            <h4 className={cn(
              'font-medium mb-2 flex items-center gap-2',
              theme === 'dark' ? 'text-cyan-300' : 'text-blue-600'
            )}>
              <GitBranch className="w-4 h-4" />
              Facility-Specific Customization
            </h4>
            <p className={cn(
              'text-xs',
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            )}>
              Override configurations for individual facility needs
            </p>
          </div>
          
          <div className={cn(
            'p-4 rounded-xl',
            theme === 'dark' ? 'bg-gray-800/30' : 'bg-gray-100'
          )}>
            <h4 className={cn(
              'font-medium mb-2 flex items-center gap-2',
              theme === 'dark' ? 'text-cyan-300' : 'text-blue-600'
            )}>
              <Users className="w-4 h-4" />
              Centralized Management
            </h4>
            <p className={cn(
              'text-xs',
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            )}>
              Manage all facilities from a single dashboard with unified reporting
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderWorkspaceContent = () => {
    switch (activeAction) {
      case 'overview':
        return renderOverview();
      case 'registration':
        return <FacilityRegistrationWizard />;
      case 'departments':
        return <DepartmentConfigurationWizard />;
      case 'staff':
        return <StaffOnboardingWizard />;
      case 'workflows':
        return <WorkflowCustomizationWizard />;
      default:
        return renderOverview();
    }
  };

  return (
    <ContentLayout
      operations={FACILITY_OPERATIONS}
      activeOperation={activeAction}
      onOperationChange={handleOperationChange}
      defaultOperation="overview"
      headerTitle="Facility Management"
    >
      {renderWorkspaceContent()}
    </ContentLayout>
  );
};

FacilityOnboardingModule.displayName = 'FacilityOnboardingModule';

export default FacilityOnboardingModule;