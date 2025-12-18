import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { appReducer, initialState } from './appReducer';
import { AppState } from './appTypes';

interface AppContextType {
  state: AppState;
  toggleSidebar: () => void;
  toggleTheme: () => void;
  setSystemStatus: (status: AppState['systemStatus']) => void;
  setSearchQuery: (query: string) => void;
  setCurrentPage: (page: AppState['currentPage']) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const toggleSidebar = useCallback(
    () => dispatch({ type: 'TOGGLE_SIDEBAR' }),
    []
  );

  const toggleTheme = useCallback(
    () => dispatch({ type: 'TOGGLE_THEME' }),
    []
  );

  const setSystemStatus = useCallback(
    (status: AppState['systemStatus']) =>
      dispatch({ type: 'SET_SYSTEM_STATUS', payload: status }),
    []
  );

  const setSearchQuery = useCallback(
    (query: string) =>
      dispatch({ type: 'SET_SEARCH_QUERY', payload: query }),
    []
  );

  const setCurrentPage = useCallback(
    (page: AppState['currentPage']) =>
      dispatch({ type: 'SET_CURRENT_PAGE', payload: page }),
    []
  );

  return (
    <AppContext.Provider
      value={{
        state,
        toggleSidebar,
        toggleTheme,
        setSystemStatus,
        setSearchQuery,
        setCurrentPage,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
}
