// NotFound.tsx
/**
 * ============================================================================
 * NOT FOUND / ERROR PAGE
 * ============================================================================
 * 
 * Universal error page for both web and desktop applications.
 * Handles 404 and navigation errors with context-aware messaging.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { AlertCircle, Home, ArrowLeft, Search } from 'lucide-react';
import { ROUTES } from '../../../app/routes/routeConstants';
import { getAccessibleModuleCodes, isInPatientMode } from '../../../app/store/utils/contextSelectors';
import { getDefaultDashboardRoute } from '../../../app/store/utils/useAutoDashboardRedirect';

/**
 * ============================================================================
 * TYPES
 * ============================================================================
 */
interface NotFoundProps {
  title?: string;
  message?: string;
  showBackButton?: boolean;
}

/**
 * ============================================================================
 * MAIN COMPONENT
 * ============================================================================
 */
const NotFound: React.FC<NotFoundProps> = ({
  title = 'Page Not Found',
  message = 'The page you are looking for does not exist, has been moved, or you may not have permission to access it.',
  showBackButton = true,
}) => {
  const navigate = useNavigate();
  const accessibleModuleCodes = useSelector(getAccessibleModuleCodes);
  const inPatientMode = useSelector(isInPatientMode);

  // Get context-aware default route
  const defaultRoute = getDefaultDashboardRoute(accessibleModuleCodes, inPatientMode);

  const handleGoHome = () => {
    navigate(defaultRoute, { replace: true });
  };

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      handleGoHome();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 dark:from-gray-950 dark:via-gray-900 dark:to-gray-800 p-4">
      <div className="text-center max-w-lg w-full">
        {/* Icon */}
        <div className="mb-8 animate-bounce">
          <AlertCircle className="w-24 h-24 text-amber-500 dark:text-amber-400 mx-auto drop-shadow-lg" />
        </div>

        {/* Error Code */}
        <h1 className="text-7xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight">
          404
        </h1>

        {/* Title */}
        <h2 className="text-3xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
          {title}
        </h2>

        {/* Message */}
        <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed px-4">
          {message}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center px-4">
          {/* Primary Action - Go Home */}
          <button
            onClick={handleGoHome}
            className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl font-semibold hover:from-blue-500 hover:to-cyan-400 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
          >
            <Home className="w-5 h-5" />
            Go to Dashboard
          </button>

          {/* Secondary Action - Go Back */}
          {showBackButton && (
            <button
              onClick={handleGoBack}
              className="w-full sm:w-auto px-8 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              Go Back
            </button>
          )}
        </div>

        {/* Help Text */}
        <div className="mt-12 pt-8 border-t border-gray-300 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-500 mb-3">
            Need assistance?
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center text-sm">
            <button
              onClick={() => navigate(ROUTES.HELP)}
              className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <Search className="w-4 h-4" />
              Search Help Center
            </button>
            <span className="hidden sm:inline text-gray-400">•</span>
            <a
              href="mailto:support@example.com"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Contact Support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
