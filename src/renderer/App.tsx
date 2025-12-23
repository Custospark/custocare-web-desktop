import { Provider } from 'react-redux';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { BrowserRouter as Router } from 'react-router-dom';
import { store } from './store/store';
import { queryClient } from './api/configs/axiosConfig';
import AppRoutes from './routes';
import ErrorBoundary from './components/Loading/ErrorBoundary';
import { AppProvider } from './store/state/AppContext';
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
    <ErrorBoundary>
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <AppProvider>
            <Router>
              <AppRoutes />
            </Router>
          </AppProvider>

          {process.env.NODE_ENV === 'development' && (
            <ReactQueryDevtools 
              initialIsOpen={false}
              buttonPosition="bottom-right"
            />
          )}
        </QueryClientProvider>
      </Provider>
    </ErrorBoundary>
  );
}

export default App;