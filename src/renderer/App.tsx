// src/renderer/app/App.tsx

import { Provider } from 'react-redux';
import { QueryClientProvider } from '@tanstack/react-query';
// import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { BrowserRouter as Router } from 'react-router-dom';

import { store } from './app/store/store';
import { queryClient } from './app/api/axiosConfig';

import AppRoutes from './app/routes';
import AppInitializer from './AppInitializer';

import { AppProvider } from './app/store/contexts/app/AppContext';
import { ConfirmProvider } from './shared/components/Feedback/ConfirmDialog/ConfirmProvider';
import { ToastProvider } from './app/store/contexts/toast/ToastContext';
import { NavigationBridge } from './app/routes/navigation/NavigationBridge';
import { UpdateNotification } from './shared/components/Feedback/UpdateNotification';
import { ScrollToTop } from './shared/components/ScrollToTop/ScrollToTop'; // ← Import ScrollToTop

import './App.css';
import { BillingTray } from './modules/medical-records/ui/visit-action-center/billing-space';
import { useReverbListener } from './app/hooks/useReverbListener';

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
function ReverbInit() {
  useReverbListener();
  return null;
}

function App() {
  return (
    <ToastProvider>
      <ConfirmProvider>
        {/* Error boundaries are applied per-route inside SuspenseWrapper */}
        <Provider store={store}>
            <QueryClientProvider client={queryClient}>
              <ReverbInit />
              <Router>
                <ScrollToTop /> {/* ← Add ScrollToTop here - MUST be inside Router */}
                <NavigationBridge /> {/* ← registers imperativeNavigate.tS, must be inside <Router> */}
                <AppProvider>
                  {/* One-time initialization layer */}
                  <AppInitializer>
                    <AppRoutes />
                  </AppInitializer>
                  <BillingTray/>

                  {/* ---- System-Level UI (Non-blocking) ---- */}
                  <UpdateNotification />
                </AppProvider>
              </Router>

              {/* Dev-only tooling */}
              {/* {process.env.NODE_ENV === 'development' && (
                <ReactQueryDevtools
                  initialIsOpen={false}
                  buttonPosition="bottom-right"
                />
              )} */}
            </QueryClientProvider>
          </Provider>
      </ConfirmProvider>
    </ToastProvider>
  );
}

export default App;