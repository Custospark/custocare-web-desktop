import { Provider } from 'react-redux';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { HashRouter as Router } from 'react-router-dom';

import { store } from './app/store/store';
import { queryClient } from './app/api/axiosConfig';

import AppRoutes from './app/routes';
import AppInitializer from './AppInitializer';

import ErrorBoundary from './shared/components/Loading/ErrorBoundary';
import { AppProvider } from './app/store/contexts/app/AppContext';
import { ConfirmProvider } from './shared/components/Feedback/ConfirmDialog/ConfirmProvider';
import { ToastProvider } from './app/store/contexts/toast/ToastContext';

// System / Shell components
import { UpdateNotification } from './shared/components/Feedback/UpdateNotification';
// import { CheckUpdateButton } from './shared/components/Feedback/CheckUpdateButton';
// import { FullscreenToggle } from './shared/components/Feedback/FullscreenToggle';

import './App.css';

/**
 * Root Application Component
 *
 * Architecture Overview:
 * - Redux: global client-side state
 * - React Query: server state, caching, background sync
 * - React Router: client-side routing (HashRouter for Electron)
 * - Context API: cross-cutting concerns (app, toast, confirm)
 * - Error Boundary: fault tolerance & graceful recovery
 *
 * Electron-Specific Considerations:
 * - HashRouter avoids deep-link issues
 * - Auto-update UI components are mounted once
 * - No app reinitialization on route changes
 */
function App() {
  return (
    <ToastProvider>
      <ConfirmProvider>
        <ErrorBoundary>
          <Provider store={store}>
            <QueryClientProvider client={queryClient}>
              <Router>
                <AppProvider>
                  {/* One-time initialization layer */}
                  <AppInitializer>
                    <AppRoutes />
                  </AppInitializer>

                  {/* ---- System-Level UI (Non-blocking) ---- */}
                  <UpdateNotification />

                  {/* Optional shell controls (settings / menu / footer) */}
                  {/* <div className="fixed bottom-4 right-4 flex items-center gap-3 z-50">
                    <CheckUpdateButton />
                    <FullscreenToggle />
                  </div> */}
                </AppProvider>
              </Router>

              {/* Dev-only tooling */}
              {process.env.NODE_ENV === 'development' && (
                <ReactQueryDevtools
                  initialIsOpen={false}
                  buttonPosition="bottom-right"
                />
              )}
            </QueryClientProvider>
          </Provider>
        </ErrorBoundary>
      </ConfirmProvider>
    </ToastProvider>
  );
}

export default App;
