import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { BrowserRouter as Router } from 'react-router-dom';
import { store } from './store/index';
import { queryClient } from './api/configs/axiosConfig';
import AppRoutes from './routes';
import ErrorBoundary from './components/Loading/ErrorBoundary';
import { useAppDispatch } from './store/hooks/useApp';
import { setInitialized } from './store/slices/uiSlice';
import { AppProvider } from './store/state/AppContext';
import './App.css';

function AppInitializer() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 3000));
        dispatch(setInitialized(true));
      } catch (error) {
        console.error('App initialization failed:', error);
        dispatch(setInitialized(true));
      }
    };

    initializeApp();
  }, [dispatch]);

  return <AppRoutes />;
}

function App() {
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <AppProvider>  {/* <-- Wrap here */}
            <Router>
              <AppInitializer />
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
