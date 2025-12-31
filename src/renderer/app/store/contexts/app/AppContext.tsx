import React, { useReducer, useCallback } from 'react';
import { appReducer, initialState } from '../../state/appReducer';
import {type AppState } from '../../state/appTypes';
import { AppContext } from './useApp';
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


