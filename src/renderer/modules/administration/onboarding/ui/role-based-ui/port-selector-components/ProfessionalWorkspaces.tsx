/**
 * ============================================================================
 * PROFESSIONAL WORKSPACES COMPONENT
 * ============================================================================
 * Displays staff workspaces and facility dashboard access
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAppSelector } from '../../../../../../app/store/hooks/useApp';
import {
  Briefcase,
  UserCog,
  Inbox,
  Settings,
  FileText,
  Sparkles,
  AlertTriangle,
  CreditCard,
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

const subscriptionStatusLabel = (status?: string | null): string => {
  if (!status) return 'No active subscription';
  switch (status) {
    case 'trial':
      return 'Trial ended';
    case 'past_due':
      return 'Payment past due';
    case 'suspended':
      return 'Subscription suspended';
    case 'cancelled':
      return 'Subscription cancelled';
    default:
      return 'Subscription inactive';
  }
};

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

  const facilityMetaById = useMemo(() => {
    const map = new Map<number, FacilityRole>();
    for (const role of facilityRoles) {
      map.set(role.facility_id, role);
    }
    for (const facility of staffFacilities) {
      const existing = map.get(facility.facility_id);
      map.set(facility.facility_id, {
        facility_id: facility.facility_id,
        facility_name: facility.facility_name ?? existing?.facility_name ?? null,
        role_code: facility.role_code ?? existing?.role_code ?? '',
        is_primary_facility: existing?.is_primary_facility ?? false,
        is_facility_owner: facility.is_facility_owner ?? existing?.is_facility_owner,
        has_subscription_access:
          facility.has_subscription_access ?? existing?.has_subscription_access,
        subscription_status: facility.subscription_status ?? existing?.subscription_status,
        is_restricted: facility.is_restricted ?? existing?.is_restricted,
      });
    }
    return map;
  }, [facilityRoles, staffFacilities]);

  const getFacilityLogoUrl = (facilityId: number): string => {
    const facility = staffFacilities.find((f) => f.facility_id === facilityId);
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
      <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
        <div
          className={cn(
            'w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center',
            'bg-blue-500/10',
          )}
        >
          <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <h2
          className={cn(
            'text-lg sm:text-xl font-bold',
            theme === 'dark' ? 'text-white' : 'text-gray-900',
          )}
        >
          Your Workspaces
        </h2>
      </div>

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

      {isStaffWithFacility && (
        <div className="space-y-3 sm:space-y-4">
          {facilityRoles.map((facilityRole) => {
            const meta = facilityMetaById.get(facilityRole.facility_id) ?? facilityRole;
            const hasAccess = meta.has_subscription_access ?? true;
            const isOwner = meta.is_facility_owner ?? false;
            const isRestricted = meta.is_restricted ?? false;

            const badges: Array<{
              label: string;
              variant: 'success' | 'primary' | 'warning';
              animated?: boolean;
            }> = [];

            if (isRestricted) {
              badges.push({ label: 'Facility suspended', variant: 'warning' });
            } else if (!hasAccess) {
              badges.push({
                label: isOwner ? 'Renew subscription' : subscriptionStatusLabel(meta.subscription_status),
                variant: 'warning',
              });
            } else {
              badges.push({ label: 'Active', variant: 'success', animated: true });
            }

            if (facilityRole.is_primary_facility) {
              badges.push({ label: 'Primary', variant: 'primary' });
            }

            if (isOwner) {
              badges.push({ label: 'Owner', variant: 'primary' });
            }

            const description = isRestricted
              ? 'This facility is suspended or banned. Contact platform support for assistance.'
              : !hasAccess && isOwner
                ? 'Your subscription is inactive. Open this workspace to manage plans, billing, and restore full access for your team.'
                : !hasAccess
                  ? 'This facility does not have an active subscription. You can open limited access (account & support) until your administrator renews the plan.'
                  : `Your ${getRoleDisplayName(facilityRole.role_code).toLowerCase()} workspace. See what needs you — patients, orders, results — all in one place.`;

            const buttonText = isRestricted
              ? 'View status'
              : !hasAccess && isOwner
                ? 'Manage subscription'
                : !hasAccess
                  ? 'Limited access'
                  : 'Open workspace';

            const facilityLogoUrl = getFacilityLogoUrl(facilityRole.facility_id);

            return (
              <WorkspaceCard
                key={`${facilityRole.facility_id}-${facilityRole.role_code}`}
                id={`${facilityRole.facility_id}-${facilityRole.role_code}`}
                title={facilityRole.facility_name || `Facility ${facilityRole.facility_id}`}
                subtitle={getRoleDisplayName(facilityRole.role_code)}
                description={description}
                icon={!hasAccess && isOwner ? CreditCard : Sparkles}
                iconGradient={
                  !hasAccess
                    ? 'bg-gradient-to-br from-amber-500 to-orange-500'
                    : 'bg-gradient-to-br from-blue-500 to-cyan-500'
                }
                buttonText={buttonText}
                buttonGradient={
                  !hasAccess
                    ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700'
                    : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'
                }
                badges={badges}
                imageUrl={facilityLogoUrl}
                features={
                  !hasAccess
                    ? [{ icon: AlertTriangle, label: isOwner ? 'Billing' : 'Limited' }]
                    : undefined
                }
                theme={theme}
                onClick={() => onWorkspaceSelect({ ...facilityRole, ...meta })}
              />
            );
          })}
        </div>
      )}
    </motion.div>
  );
};
