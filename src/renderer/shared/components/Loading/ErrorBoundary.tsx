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
import { Frown, RefreshCw, Home } from 'lucide-react';
import { cn } from '../../utils/classNameUtils';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  theme?: 'light' | 'dark';
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

      const isDark = this.props.theme === 'dark';

      return (
        <div className={cn(
          "min-h-screen flex items-center justify-center p-4",
          isDark
            ? "bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800"
            : "bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"
        )}>
          <div className="text-center max-w-2xl w-full">
            {/* Icon */}
            <div className="mb-8">
              <Frown className={cn(
                "w-24 h-24 mx-auto",
                isDark ? "text-amber-300" : "text-amber-400"
              )} />
            </div>

            {/* Title */}
            <h1 className={cn(
              "text-4xl font-bold mb-4",
              isDark ? "text-white" : "text-gray-900"
            )}>
              Something Went Wrong
            </h1>

            {/* Message */}
            <p className={cn(
              "mb-8 leading-relaxed",
              isDark ? "text-gray-400" : "text-gray-600"
            )}>
              We encountered an unexpected error. This has been logged and our team 
              will investigate. Please try reloading the app or returning to the dashboard.
            </p>

            {/* Error Details (Development Only) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className={cn(
                "mb-8 p-4 rounded-lg text-left overflow-auto max-h-60",
                isDark ? "bg-gray-800" : "bg-gray-100"
              )}>
                <p className={cn(
                  "text-sm font-mono mb-2",
                  isDark ? "text-red-400" : "text-red-600"
                )}>
                  {this.state.error.toString()}
                </p>
                {this.state.errorInfo && (
                  <pre className={cn(
                    "text-xs whitespace-pre-wrap",
                    isDark ? "text-gray-400" : "text-gray-600"
                  )}>
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
                className={cn(
                  "w-full sm:w-auto px-8 py-3 rounded-xl font-semibold transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-2",
                  isDark
                    ? "bg-gray-700 text-gray-200 hover:bg-gray-600"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                )}
              >
                <Home className="w-5 h-5" />
                Go to Dashboard
              </button>
            </div>

            {/* Help Text */}
            <div className={cn(
              "mt-12 pt-8 border-t",
              isDark ? "border-gray-700" : "border-gray-300"
            )}>
              <p className="text-sm text-gray-500 mb-2">
                Problem persists?
              </p>
              <a
                href="mailto:custocare@custospark.com"
                className={cn(
                  "hover:underline text-sm",
                  isDark ? "text-blue-400" : "text-blue-600"
                )}
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
