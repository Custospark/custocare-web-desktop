import React from 'react';
import { Shield } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('App error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 to-gray-900 p-4">
          <div className="max-w-md text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-red-500/30">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-3">System Error</h2>
            <p className="text-gray-400 mb-8 leading-relaxed">
              We encountered an unexpected error. Our team has been notified and is
              working on a fix.
            </p>
            {process.env.NODE_ENV === 'development' && (
              <div className="mb-6 p-4 bg-gray-800 rounded-lg text-left text-xs text-gray-300 overflow-auto max-h-32">
                <p className="font-mono text-red-400">
                  {this.state.error?.message}
                </p>
              </div>
            )}
            <button
              onClick={this.handleReload}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl font-semibold hover:from-blue-500 hover:to-cyan-400 transition-all duration-300 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:scale-105"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;