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

const FALLBACK_IMAGE = '/assets/hospital.jpg';

export const ProfessionalWorkspaces: React.FC<ProfessionalWorkspacesProps> = ({
  isStaff,
  isStaffWithFacility,
  isStaffWithoutFacility,
  facilityRoles,
  theme,
  onWorkspaceSelect,
  onStaffDashboard,
}) => {
  const staffFacilities = useAppSelector(selectStaffFacilities);
  
  const getFacilityLogoUrl = (facilityId: number): string => {
    const facility = staffFacilities.find(f => f.facility_id === facilityId);
    return facility?.facility_logo_path || FALLBACK_IMAGE;
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
          Your Workspaces
        </h2>
      </div>

      {/* Staff Without Facility - Dashboard Access */}
      {isStaffWithoutFacility && (
        <WorkspaceCard
          id="staff-dashboard"
          title="Your Hub"
          subtitle="Invitations & Profile"
          description="See where you're needed. Accept facility invitations, keep your profile current, and get ready to deliver care."
          icon={UserCog}
          iconGradient="bg-gradient-to-br from-blue-500 to-cyan-500"
          buttonText="Go to Hub"
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
        <div className="space-y-3 sm:space-y-4">
          {facilityRoles.map((facilityRole) => {
            const badges = [
              { label: 'Active', variant: 'success' as const, animated: true },
            ];

            if (facilityRole.is_primary_facility) {
              badges.push({ label: 'Primary', variant: 'success', animated: true });
            }

            const facilityLogoUrl = getFacilityLogoUrl(facilityRole.facility_id);

            return (
              <WorkspaceCard
                key={`${facilityRole.facility_id}-${facilityRole.role_code}`}
                id={`${facilityRole.facility_id}-${facilityRole.role_code}`}
                title={facilityRole.facility_name || `Facility ${facilityRole.facility_id}`}
                subtitle={getRoleDisplayName(facilityRole.role_code)}
                description={`Your ${getRoleDisplayName(facilityRole.role_code).toLowerCase()} workspace. See what needs you — patients, orders, results — all in one place.`}
                icon={Sparkles}
                iconGradient="bg-gradient-to-br from-blue-500 to-cyan-500"
                buttonText="Open Workspace"
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