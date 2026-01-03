// components/routing/ProtectedRoute.tsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAppSelector } from '../../app/store/hooks/useApp';
import { AlertTriangle } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredModule?: string; // e.g., 'pharmacy', 'lab', 'billing'
  requiredPermission?: string; // e.g., 'pharmacy:write', 'lab:read'
  requiredRole?: string; // e.g., 'pharmacist', 'physician'
  fallbackPath?: string;
}

/**
 * Route protection based on active role's permissions
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredModule,
  requiredPermission,
  requiredRole,
  fallbackPath = '/unauthorized',
}) => {
  const { isAuthenticated } = useAppSelector(state => state.auth);
  const { activeRole } = useAppSelector(state => state.activeContext);

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // No active role - redirect to role selection
  if (!activeRole) {
    return <Navigate to="/role-selection" replace />;
  }

  // Check module access
  if (requiredModule && !activeRole.modules.includes(requiredModule)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="max-w-md p-8 bg-white rounded-xl shadow-lg text-center">
          <AlertTriangle className="w-16 h-16 mx-auto text-orange-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Module Not Accessible
          </h2>
          <p className="text-gray-600 mb-6">
            Your current role ({activeRole.roleName}) at {activeRole.facilityName} 
            does not have access to the <strong>{requiredModule}</strong> module.
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Available modules: {activeRole.modules.join(', ')}
          </p>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Check specific permission
  if (requiredPermission && !activeRole.permissions.includes(requiredPermission)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="max-w-md p-8 bg-white rounded-xl shadow-lg text-center">
          <AlertTriangle className="w-16 h-16 mx-auto text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Insufficient Permissions
          </h2>
          <p className="text-gray-600 mb-6">
            Your current role does not have the required permission: 
            <strong className="block mt-2">{requiredPermission}</strong>
          </p>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Check role code
  if (requiredRole && activeRole.roleCode !== requiredRole) {
    return <Navigate to={fallbackPath} replace />;
  }

  // All checks passed
  return <>{children}</>;
};

export default ProtectedRoute;