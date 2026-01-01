import { Provider } from 'react-redux';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { HashRouter as Router } from 'react-router-dom';
import { store } from './app/store/store';
import { queryClient } from './app/api/axiosConfig';
import AppRoutes from './app/routes';
import ErrorBoundary from './shared/components/Loading/ErrorBoundary';
import { AppProvider } from './app/store/contexts/app/AppContext';
import { ToastProvider } from './app/store/contexts/toast/ToastContext';
import AppInitializer from './AppInitializer';
import './App.css';

/**
 * Root Application Component
 * 
 * Enterprise-Grade Architecture:
 * - Redux for global state management
 * - React Query for server state & caching
 * - React Router for client-side routing
 * - Error boundaries for fault tolerance
 * - Context API for shared app state
 * 
 * Key Features:
 * - No app reinitialization on route changes
 * - Persistent state across navigation
 * - Optimized re-rendering
 * - Proper error handling and recovery
 */
function App() {
  return (
    <ToastProvider>
      <ErrorBoundary>
        <Provider store={store}>
          <QueryClientProvider client={queryClient}>
            <Router>
              <AppProvider>
                {/* Wrap AppRoutes with AppInitializer */}
                <AppInitializer>
                  <AppRoutes />
                </AppInitializer>
              </AppProvider>
            </Router>
            {process.env.NODE_ENV === 'development' && (
              <ReactQueryDevtools 
                initialIsOpen={false}
                buttonPosition="bottom-right"
              />
            )}
          </QueryClientProvider>
        </Provider>
      </ErrorBoundary>
    </ToastProvider>
  );
}

export default App;