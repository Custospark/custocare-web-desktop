/**
 * Platform Administration Module Routes Configuration
 * 
 * This file defines all routes related to platform administration including:
 * - Facility management with financial stats, plans, and subscriptions
 * - User administration with permissions and user statistics
 * 
 * All routes are protected and accessible only to users with super_admin capability.
 */

import { Route, Navigate } from "react-router-dom"; // ← Added Navigate
import { 
  SuspenseWrapper, 
  WithAuthProp,
  ProtectedThemeOutlet,
  WithThemeProp
} from "./shared/routeUtils";
import { PLATFORM_ADMIN_ROUTES } from "../constants/platform-administration.paths";
import { ROUTES } from "../routeConstants";

// Lazy load components for better performance
import React from 'react';
import FacilityStats from "../../../modules/platform-administration/facility-managment/FacilityStats";

// ============================================================================
// LAZY IMPORTS
// All components are lazy-loaded for optimal performance
// ============================================================================

// Facility Management
const FacilityManagement = React.lazy(() => import("../../../modules/platform-administration/facility-managment/FacilityManagement"));
const FacilityGovernance = React.lazy(() => import("../../../modules/platform-administration/facility-managment/FacilityGovernance"));
const FacilityPlans = React.lazy(() => import("../../../modules/platform-administration/facility-managment/FacilityPlans"));
const FacilitySubscriptions = React.lazy(() => import("../../../modules/platform-administration/facility-managment/FacilitySubscriptions"));

// User Administration
const UserAdministration = React.lazy(() => import("../../../modules/platform-administration/user-management/UserAdministration"));
const UserPermissions = React.lazy(() => import("../../../modules/platform-administration/user-management/UserPermissions"));
const UserStats = React.lazy(() => import("../../../modules/platform-administration/user-management/UserStats"));

// ============================================================================
// PLATFORM ADMIN ROUTES CONFIGURATION
// All routes are nested under the main platform admin layout with theme protection
// ============================================================================
export const platformAdminRoutes = [
  <Route 
    key="platform-admin-base" 
    element={<ProtectedThemeOutlet />}
  >
    {/* Redirect from /platform-admin to /platform-admin/facilities */}
    <Route index element={<Navigate to={ROUTES.PLATFORM_ADMINISTRATION} replace />} />

    {/* ========================================================================
        FACILITIES SECTION
        Base Route: /platform-admin/facilities
        Purpose: Manage facilities with financial stats, plans, and subscriptions
        ======================================================================== */}
    <Route
      key="platform-admin-facilities"
      path={PLATFORM_ADMIN_ROUTES.FACILITIES}
      element={
        <SuspenseWrapper variant="table">
          <WithThemeProp Component={FacilityManagement} />
        </SuspenseWrapper>
      }
    >
      {/* Facility  Statistics */}
      <Route 
        path={PLATFORM_ADMIN_ROUTES.FACILITIES_STATS}
        element={
          <SuspenseWrapper variant="detail">
            <WithAuthProp Component={FacilityStats} />
          </SuspenseWrapper>
        }
      />
      {/* Financial Statistics */}
      <Route 
        path={PLATFORM_ADMIN_ROUTES.PLATFORM_FACILITY_GOVERNANCE}
        element={
          <SuspenseWrapper variant="detail">
            <WithAuthProp Component={FacilityGovernance} />
          </SuspenseWrapper>
        }
      />
      
      {/* Plans Management */}
      <Route 
        path={PLATFORM_ADMIN_ROUTES.FACILITIES_PLANS}
        element={
          <SuspenseWrapper variant="table">
            <WithThemeProp Component={FacilityPlans} />
          </SuspenseWrapper>
        }
      />
      
      {/* Subscriptions Management */}
      <Route 
        path={PLATFORM_ADMIN_ROUTES.FACILITIES_SUBSCRIPTIONS}
        element={
          <SuspenseWrapper variant="table">
            <WithAuthProp Component={FacilitySubscriptions} />
          </SuspenseWrapper>
        }
      />
    </Route>
    
    {/* ========================================================================
        USERS SECTION
        Base Route: /platform-admin/users
        Purpose: Manage users with permissions and user statistics
        ======================================================================== */}
    <Route
      key="platform-admin-users"
      path={PLATFORM_ADMIN_ROUTES.USERS}
      element={
        <SuspenseWrapper variant="table">
          <WithThemeProp Component={UserAdministration} />
        </SuspenseWrapper>
      }
    >
      {/* Permissions Management */}
      <Route 
        path={PLATFORM_ADMIN_ROUTES.USERS_PERMISSIONS}
        element={
          <SuspenseWrapper variant="detail">
            <WithAuthProp Component={UserPermissions} />
          </SuspenseWrapper>
        }
      />
      
      {/* User Statistics */}
      <Route 
        path={PLATFORM_ADMIN_ROUTES.USERS_USER_STATS}
        element={
          <SuspenseWrapper variant="detail">
            <WithAuthProp Component={UserStats} />
          </SuspenseWrapper>
        }
      />
    </Route>
  </Route>
];

// ============================================================================
// USAGE NOTES:
// 
// 1. All routes are protected by ProtectedThemeOutlet which ensures:
//    - User is authenticated with super_admin capability
//    - Theme context is properly provided
// 
// 2. SuspenseWrapper handles loading states with different variants:
//    - 'table' variant for list/table views (facility list, users list)
//    - 'detail' variant for detailed/single item views
// 
// 3. WithAuthProp injects authentication data to components for:
//    - Checking super_admin permissions
//    - Making authorized API calls
// 
// 4. All components are lazy-loaded for optimal performance
// 
// 5. Route paths are centralized in PLATFORM_ADMIN_ROUTES constant
// 
// 6. Structure mirrors accountRoutes pattern with:
//    - Main sections (FACILITIES, USERS) as parent routes
//    - Nested routes for specific functionality
//    - Index redirect ensures /platform-admin automatically navigates to facilities
// ============================================================================