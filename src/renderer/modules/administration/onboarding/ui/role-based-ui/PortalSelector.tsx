/**
 * ============================================================================
 * PORTAL SELECTOR - ENTRY POINT
 * ============================================================================
 * 
 * Fully integrated with activeContextSlice
 * ✅ Refactored into 5 functional components
 * ✅ Responsive design for all devices
 * ✅ Type-safe without 'any'
 * ✅ Proper Redux integration
 * ✅ Maintains all functionality
 */

import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../../../app/routes/routeConstants';
import { ROUTES as ONBOARDING_ROUTES } from '../../routes/onboardingRouteConstants';
import { cn } from '../../../../../shared/types/cn';
import { useAppDispatch, useAppSelector } from '../../../../../app/store/hooks/useApp';
import { toggleTheme } from '../../../../../app/store/slices/uiSlice';
import { useToast } from '../../../../../app/store/contexts/toast/useToast';
import { logout } from '../../../../../app/store/slices/authSlice';
import {
  switchCapability,
  switchFacility,
  getRoleDisplayName,
  type FacilityRole,
} from '../../../../../app/store/slices/activeContextSlice';

// Import child components
import { PortalHeader } from './port-selector-components/PortalHeader';
import { FooterActions } from './port-selector-components/FooterActions';
import { WelcomeSection } from './port-selector-components/WelcomeSection';
import { ProfessionalWorkspaces } from './port-selector-components/ProfessionalWorkspaces';
import { PersonalAccessSection } from './port-selector-components/PersonalAccessSection';

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&q=80';

export const PortalSelector: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const theme = useAppSelector((state) => state.ui.theme);
  const activeContext = useAppSelector((state) => state.activeContext);

  const {
    user,
    capabilities,
    facilityRoles,
    isPatient,
    isStaff,
    isStaffWithFacility,
    isStaffWithoutFacility,
    isPatientOnly,
  } = activeContext;

  /**
   * Handle workspace selection for staff with facility
   */
  const handleWorkspaceSelect = useCallback(
    (facilityRole: FacilityRole): void => {
      dispatch(switchCapability('staff'));
      dispatch(switchFacility(facilityRole.facility_id));

      navigate(ROUTES.DASHBOARD, {
        state: {
          user,
          facilityRole,
          timestamp: new Date().toISOString(),
        },
      });

      showToast(
        'success',
        `Switched to ${facilityRole.facility_name || 'facility'} - ${getRoleDisplayName(
          facilityRole.role_code
        )}`,
        3000
      );
    },
    [dispatch, navigate, showToast, user]
  );

  /**
   * Handle staff without facility dashboard access
   */
  const handleStaffWithoutFacilityDashboard = useCallback((): void => {
    dispatch(switchCapability('staff'));

    navigate(ROUTES.DASHBOARD, {
      state: {
        user,
        staffWithoutFacility: true,
        timestamp: new Date().toISOString(),
      },
    });

    showToast('info', 'Access your invitations and profile in the staff dashboard', 3000);
  }, [dispatch, navigate, showToast, user]);

  /**
   * Handle patient portal access
   */
  const handlePatientPortal = useCallback((): void => {
    dispatch(switchCapability('patient'));

    navigate(ROUTES.DASHBOARD, {
      state: {
        user,
        timestamp: new Date().toISOString(),
      },
    });

    showToast('success', 'Welcome to your patient portal', 3000);
  }, [dispatch, navigate, showToast, user]);

  /**
   * Handle facility registration
   */
  const handleRegisterFacility = useCallback((): void => {
    navigate(ONBOARDING_ROUTES.HEALTHCARE_ONBOARDING);
  }, [navigate]);

  /**
   * Handle patient portal activation
   */
  const handleActivatePatientPortal = useCallback((): void => {
    navigate(ONBOARDING_ROUTES.PATIENT_ONBOARDING);
  }, [navigate]);

  /**
   * Handle medical staff registration
   */
  const handleRegisterAsMedicalStaff = useCallback((): void => {
    navigate(ONBOARDING_ROUTES.STAFF_ONBOARDING);
  }, [navigate]);

  /**
   * Handle theme toggle
   */
  const handleToggleTheme = useCallback((): void => {
    dispatch(toggleTheme());
  }, [dispatch]);

  /**
   * Handle logout
   */
  const handleLogout = useCallback((): void => {
    dispatch(logout());
    showToast(
      'info',
      "You've been logged out successfully. Thank you for using Custocare AI — see you again soon!",
      5000
    );
    navigate(ROUTES.LANDING);
  }, [dispatch, navigate, showToast]);

  return (
    <div
      className={cn(
        'min-h-screen',
        theme === 'dark' ? 'bg-gray-950' : 'bg-gray-50'
      )}
    >
      {/* Header */}
      <PortalHeader
        theme={theme}
        userName={user?.full_name}
        avatarUrl={DEFAULT_AVATAR}
        onToggleTheme={handleToggleTheme}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-8">
        {/* Welcome Section */}
        <WelcomeSection
          userName={user?.first_name || user?.full_name}
          isStaffWithFacility={isStaffWithFacility}
          isStaffWithoutFacility={isStaffWithoutFacility}
          isPatient={isPatient}
          isPatientOnly={isPatientOnly}
          theme={theme}
        />

        {/* Professional Workspaces */}
        <ProfessionalWorkspaces
          isStaff={isStaff}
          isStaffWithFacility={isStaffWithFacility}
          isStaffWithoutFacility={isStaffWithoutFacility}
          facilityRoles={facilityRoles}
          theme={theme}
          onWorkspaceSelect={handleWorkspaceSelect}
          onStaffDashboard={handleStaffWithoutFacilityDashboard}
        />

        {/* Personal Access Section */}
        <PersonalAccessSection
          isPatient={isPatient}
          isStaff={isStaff}
          patientUuid={capabilities.patient?.patient_uuid}
          theme={theme}
          onPatientPortal={handlePatientPortal}
          onActivatePatientPortal={handleActivatePatientPortal}
          onRegisterMedicalStaff={handleRegisterAsMedicalStaff}
        />

        {/* Footer Actions */}
        <FooterActions
          isPatient={isPatient}
          isStaff={isStaff}
          theme={theme}
          onRegisterFacility={handleRegisterFacility}
          onActivatePatientPortal={handleActivatePatientPortal}
          onRegisterMedicalStaff={handleRegisterAsMedicalStaff}
        />
      </main>
    </div>
  );
};

export default PortalSelector;
