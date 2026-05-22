/**
 * ============================================================================
 * PROFESSIONAL WORKSPACES COMPONENT
 * ============================================================================
 * Displays staff workspaces and facility dashboard access
 */

import React from 'react';
import { motion } from 'framer-motion';
import { useAppSelector } from '../../../../../../app/store/hooks/useApp';
import {
  Briefcase,
  UserCog,
  Inbox,
  Settings,
  FileText,
  Sparkles,
} from 'lucide-react';
import { cn } from '../../../../../../shared/types/cn';
import { WorkspaceCard } from './WorkspaceCard';
import { containerVariants } from '../../../../../../shared/components/animations/motionVariants';
import type { FacilityRole } from '../../../../../../app/store/slices/activeContextSlice';
import { 
  getRoleDisplayName,
  selectStaffFacilities,
} from '../../../../../../app/store/slices/activeContextSlice';

interface ProfessionalWorkspacesProps {
  isStaff: boolean;
  isStaffWithFacility: boolean;
  isStaffWithoutFacility: boolean;
  facilityRoles: FacilityRole[];
  theme: 'light' | 'dark';
  onWorkspaceSelect: (facilityRole: FacilityRole) => void;
  onStaffDashboard: () => void;
}

const DEFAULT_WORKSPACE_IMAGE = 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=400&h=300&fit=crop&q=80';

export const ProfessionalWorkspaces: React.FC<ProfessionalWorkspacesProps> = ({
  isStaff,
  isStaffWithFacility,
  isStaffWithoutFacility,
  facilityRoles,
  theme,
  onWorkspaceSelect,
  onStaffDashboard,
}) => {
  // Get staff facilities with full details including logo path
  const staffFacilities = useAppSelector(selectStaffFacilities);
  
  // Helper function to get facility logo URL by facility ID
  const getFacilityLogoUrl = (facilityId: number): string => {
    const facility = staffFacilities.find(f => f.facility_id === facilityId);
    return facility?.facility_logo_path || DEFAULT_WORKSPACE_IMAGE;
  };

  if (!isStaff) return null;

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="mb-8 sm:mb-12"
    >
      {/* Section Header */}
      <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
        <div
          className={cn(
            'w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center',
            'bg-blue-500/10'
          )}
        >
          <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <h2
          className={cn(
            'text-lg sm:text-xl font-bold',
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          )}
        >
          Professional Workspace{isStaffWithFacility ? 's' : ''}
        </h2>
      </div>

      {/* Staff Without Facility - Dashboard Access */}
      {isStaffWithoutFacility && (
        <WorkspaceCard
          id="staff-dashboard"
          title="Staff Dashboard"
          subtitle="Manage invitations & profile"
          description="Access your facility invitations, update your professional profile, and manage your healthcare credentials."
          icon={UserCog}
          iconGradient="bg-gradient-to-br from-blue-500 to-cyan-500"
          buttonText="Open Dashboard"
          buttonGradient="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
          features={[
            { icon: Inbox, label: 'Invitations' },
            { icon: Settings, label: 'Profile' },
            { icon: FileText, label: 'Credentials' },
          ]}
          theme={theme}
          onClick={onStaffDashboard}
        />
      )}

      {/* Staff With Facilities - Workspace Cards */}
      {isStaffWithFacility && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {facilityRoles.map((facilityRole) => {
            const badges = [
              { label: 'Active', variant: 'success' as const, animated: true },
            ];

            if (facilityRole.is_primary_facility) {
              badges.push({ label: 'Primary', variant: 'success' ,animated:true});
            }

            // Get the facility logo URL from the staff facilities array
            const facilityLogoUrl = getFacilityLogoUrl(facilityRole.facility_id);

            return (
              <WorkspaceCard
                key={`${facilityRole.facility_id}-${facilityRole.role_code}`}
                id={`${facilityRole.facility_id}-${facilityRole.role_code}`}
                title={facilityRole.facility_name || `Facility ${facilityRole.facility_id}`}
                subtitle={getRoleDisplayName(facilityRole.role_code)}
                description={`Access your ${getRoleDisplayName(facilityRole.role_code).toLowerCase()} dashboard.`}
                icon={Sparkles}
                iconGradient="bg-gradient-to-br from-blue-500 to-cyan-500"
                buttonText="Open Dashboard"
                buttonGradient="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                badges={badges}
                imageUrl={facilityLogoUrl}
                theme={theme}
                onClick={() => onWorkspaceSelect(facilityRole)}
              />
            );
          })}
        </div>
      )}
    </motion.div>
  );
};