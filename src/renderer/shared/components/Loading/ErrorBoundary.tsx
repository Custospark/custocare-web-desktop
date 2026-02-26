// ErrorBoundary.tsx
/**
 * ============================================================================
 * ERROR BOUNDARY COMPONENT
 * ============================================================================
 * 
 * Catches React errors and displays user-friendly error page.
 * Works for both web and desktop applications.
 */

import  { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    window.location.href = '/#/dashboard'; // Force reload to dashboard
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-800 p-4">
          <div className="text-center max-w-2xl w-full">
            {/* Icon */}
            <div className="mb-8">
              <AlertTriangle className="w-24 h-24 text-red-500 dark:text-red-400 mx-auto animate-pulse" />
            </div>

            {/* Title */}
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Something Went Wrong
            </h1>

            {/* Message */}
            <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
              We encountered an unexpected error. This has been logged and our team 
              will investigate. Please try refreshing the page or returning to the dashboard.
            </p>

            {/* Error Details (Development Only) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-left overflow-auto max-h-60">
                <p className="text-sm font-mono text-red-600 dark:text-red-400 mb-2">
                  {this.state.error.toString()}
                </p>
                {this.state.errorInfo && (
                  <pre className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={this.handleReload}
                className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl font-semibold hover:from-blue-500 hover:to-cyan-400 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-5 h-5" />
                Reload App
              </button>

              <button
                onClick={this.handleReset}
                className="w-full sm:w-auto px-8 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
              >
                <Home className="w-5 h-5" />
                Go to Dashboard
              </button>
            </div>

            {/* Help Text */}
            <div className="mt-12 pt-8 border-t border-gray-300 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-500 mb-2">
                Problem persists?
              </p>
              <a
                href="mailto:support@example.com"
                className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
              >
                Contact our support team
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
