/**
 * ============================================================================
 * ADMIN TEAM MANAGEMENT - MAIN COMPONENT
 * ============================================================================
 * 
 * Central hub for managing medical staff operations within healthcare facilities.
 * Orchestrates six modular components for comprehensive team management.
 * 
 * @component AdminTeam
 * @description Enterprise-grade staff management with real-time updates
 */

import React, { useState } from 'react';
import { 
  Users, 
  Mail, 
  Settings,
  Search,
  Download,
  RefreshCw
} from 'lucide-react';

// Import modular components
import { StaffSearchPanel } from './StaffSearchPanel';
// import { StaffCreationForm } from './StaffCreationForm';
import { InvitationManager } from './InvitationManager';
// import StaffListView from './StaffDetailView';
import { RoleAccessManager } from './RoleAccessManager';
import StaffDetailView from './StaffDetailView';
// Import hooks and types
import { useAppSelector } from '../../../../../app/store/hooks/useApp';
import StaffListView from './StaffListView';

interface AdminTeamProps {
  theme: 'light' | 'dark';
}

type ViewMode = 'list' | 'search' |'create'| 'invitations' | 'roles' | 'detail';

export const AdminTeam: React.FC<AdminTeamProps> = ({ theme }) => {
  const isDark = theme === 'dark';
  
  // Get active facility from context
  const activeContext = useAppSelector(state => state.activeContext);
  const activeFacilityId = activeContext.activeFacilityId;
  
  // View state management
  const [activeView, setActiveView] = useState<ViewMode>('list');
  const [selectedStaffId, setSelectedStaffId] = useState<number>(0);
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Handle view navigation
  const handleViewChange = (view: ViewMode) => {
    setActiveView(view);
    if (view !== 'detail') {
      setSelectedStaffId(0);
    }
  };
  
  // Handle staff selection for detail view
  const handleStaffSelect = (staffId: number) => {
    setSelectedStaffId(staffId);
    setActiveView('detail');
  };
  
  // Handle successful staff creation
  // const handleStaffCreated = (staffId: number) => {
  //   setRefreshKey(prev => prev + 1);
  //   setSelectedStaffId(staffId);
  //   setActiveView('detail');
  // };
  
  // Handle successful invitation
  const handleInvitationSent = () => {
    setRefreshKey(prev => prev + 1);
    setActiveView('invitations');
  };
  
  // Refresh all data
  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };
  
  // Facility check
  if (!activeFacilityId) {
    return (
      <div className="space-y-6">
        <div className={`rounded-xl p-12 text-center border ${
          isDark ? 'bg-gray-900/50 border-gray-800' : 'bg-gray-50 border-gray-200'
        }`}>
          <Users className={`w-16 h-16 mx-auto mb-4 ${
            isDark ? 'text-gray-600' : 'text-gray-400'
          }`} />
          <h3 className="text-xl font-semibold mb-2">No Facility Selected</h3>
          <p className={`max-w-md mx-auto ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Please select a facility from the sidebar to manage your team members and staff invitations.
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Users className="w-7 h-7" />
            Team Management
          </h1>
          <p className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Manage staff accounts, invitations, and access permissions for your facility
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              isDark 
                ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
            title="Refresh data"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          
          <button
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              isDark 
                ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
            title="Export data"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>
      
      {/* Navigation Tabs */}
      <div className={`rounded-xl border ${
        isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
      }`}>
        <div className="flex flex-wrap items-center gap-2 p-2">
          <button
            onClick={() => handleViewChange('list')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeView === 'list'
                ? (isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-700')
                : (isDark ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100')
            }`}
          >
            <Users className="w-4 h-4" />
            Staff List
          </button>
          
          <button
            onClick={() => handleViewChange('search')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeView === 'search'
                ? (isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-700')
                : (isDark ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100')
            }`}
          >
            <Search className="w-4 h-4" />
            Search Staff
          </button>
          
          {/* <button
            onClick={() => handleViewChange('create')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeView === 'create'
                ? (isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-700')
                : (isDark ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100')
            }`}
          >
            <UserPlus className="w-4 h-4" />
            Create Staff
          </button> */}
          
          <button
            onClick={() => handleViewChange('invitations')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeView === 'invitations'
                ? (isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-700')
                : (isDark ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100')
            }`}
          >
            <Mail className="w-4 h-4" />
            Staff Invitations
          </button>
          
          <button
            onClick={() => handleViewChange('roles')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeView === 'roles'
                ? (isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-700')
                : (isDark ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100')
            }`}
          >
            <Settings className="w-4 h-4" />
            Roles & Access
          </button>
        </div>
      </div>
      
      {/* Dynamic Content Area */}
      <div className="min-h-[600px]">
        {activeView === 'list' && (
          <StaffListView
            theme={theme}
            facilityId={activeFacilityId}
            refreshKey={refreshKey}
            staffId={selectedStaffId}
            onStaffSelect={handleStaffSelect}
            onCreateNew={() => handleViewChange('create')}
          />
        )}
        
        {activeView === 'search' && (
          <StaffSearchPanel
            theme={theme}
            facilityId={activeFacilityId}
            onStaffSelect={handleStaffSelect}
            onCreateNew={() => handleViewChange('create')}
          />
        )}
        
        {/* {activeView === 'create' && (
          <StaffCreationForm
            theme={theme}
            facilityId={activeFacilityId}
            onSuccess={handleStaffCreated}
            onCancel={() => handleViewChange('list')}
          />
        )} */}
        
        {activeView === 'invitations' && (
          <InvitationManager
            theme={theme}
            facilityId={activeFacilityId}
            refreshKey={refreshKey}
            onInvitationSent={handleInvitationSent}
          />
        )}
        
        {activeView === 'roles' && (
          <RoleAccessManager
            theme={theme}
            facilityId={activeFacilityId}
            refreshKey={refreshKey}
          />
        )}
        
        {activeView === 'detail' && selectedStaffId && (
          <StaffDetailView
            theme={theme}
            staffId={selectedStaffId}
            facilityId={activeFacilityId}
            onBack={() => handleViewChange('list')}
            onEdit={() => {
              // Could open edit modal or navigate to edit view
              console.log('Edit staff:', selectedStaffId);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default AdminTeam;