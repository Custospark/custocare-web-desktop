// components/ProtectedRoute.tsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useActiveContext } from '../store/hooks/useActiveContext';
import type { RoleCode } from '../store/slices/activeContextSlice';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: RoleCode;
  requiredModule?: string;
  fallbackPath?: string;
  allowPatient?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  requiredModule,
  fallbackPath = '/unauthorized',
  allowPatient = false,
}) => {
  const { hasRole, canAccess, activeRoleCode, isPatientMode } = useActiveContext();

  // Allow patient access if specified
  if (allowPatient && isPatientMode) {
    return <>{children}</>;
  }

  // Check role requirement
  if (requiredRole && !hasRole(requiredRole)) {
    console.warn(`Access denied: User has role ${activeRoleCode}, requires ${requiredRole}`);
    return <Navigate to={fallbackPath} replace />;
  }

  // Check module access requirement
  if (requiredModule && !canAccess(requiredModule)) {
    console.warn(`Access denied: User cannot access module ${requiredModule}`);
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
};

// components/ConditionalRender.tsx
interface ConditionalRenderProps {
  children: React.ReactNode;
  roles?: RoleCode[];
  modules?: string[];
  fallback?: React.ReactNode;
  requirePatient?: boolean;
}

export const ConditionalRender: React.FC<ConditionalRenderProps> = ({
  children,
  roles,
  modules,
  fallback = null,
  requirePatient = false,
}) => {
  const { hasRole, canAccess, isPatientMode } = useActiveContext();

  // Check patient requirement
  if (requirePatient && !isPatientMode) {
    return <>{fallback}</>;
  }

  // Check if user has required role
  const hasRequiredRole = !roles || roles.some(role => hasRole(role));
  
  // Check if user can access required modules
  const hasRequiredModule = !modules || modules.some(module => canAccess(module));

  if (hasRequiredRole && hasRequiredModule) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
};
